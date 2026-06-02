"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/loading-spinner";
import StrategyWorkspace from "@/components/strategy/strategy-workspace";
import { Project } from "@/types";
import { logError } from "@/lib/error-handler";

export default function ConversationPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [discoveryJson, setDiscoveryJson] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${projectId}`).then((r) => r.json()),
      fetch(`/api/onboarding/discovery`).then((r) => r.json()),
    ])
      .then(([projectData, discoveryData]) => {
        setProject(projectData.project);
        setDiscoveryJson(
          discoveryData.discovery
            ? JSON.stringify(discoveryData.discovery)
            : null
        );
        setLoading(false);
      })
      .catch((error: unknown) => {
        logError("project:load", error);
        setLoading(false);
      });
  }, [projectId]);

  if (loading) {
    return <LoadingSpinner message="Chargement..." />;
  }

  if (!project) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <div className="text-center">
          <p className="mb-4 text-zinc-400">Projet introuvable</p>
          <Link href="/">
            <Button variant="outline" className="border-zinc-700 text-zinc-300">
              Retour
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const backButton = (
    <Link
      href="/"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
      aria-label="Retour"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m15 18-6-6 6-6" />
      </svg>
    </Link>
  );

  return (
    <StrategyWorkspace
      title={`${project.icon} ${project.name}`}
      subtitle={project.description}
      discoveryJson={discoveryJson}
      headerLeft={backButton}
      autoStart
    />
  );
}
