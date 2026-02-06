import { NextResponse } from "next/server";
import { projects, messages } from "@/data/projects";

const assistantResponses = [
  "Très bonne question ! J'ai analysé les données et voici mes recommandations pour optimiser votre stratégie marketing. Je suggère de concentrer vos efforts sur les canaux qui génèrent le meilleur ROI.",
  "J'ai travaillé sur votre demande. Voici une approche structurée en 3 étapes qui devrait vous permettre d'atteindre vos objectifs dans les délais prévus.",
  "Excellente idée ! D'après mon analyse du marché, cette direction est prometteuse. Je vous propose un plan d'action concret avec des KPIs mesurables pour suivre les résultats.",
  "J'ai étudié les tendances actuelles et je pense qu'on peut aller encore plus loin. Voici quelques pistes d'amélioration qui pourraient faire la différence par rapport à la concurrence.",
  "Bien noté ! Je vais intégrer ces éléments dans notre stratégie. En parallèle, je recommande de mettre en place un A/B test pour valider nos hypothèses avant le déploiement à grande échelle.",
];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = projects.find((p) => p.id === id);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const projectMessages = messages.filter((m) => m.projectId === id);
  return NextResponse.json({ messages: projectMessages });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = projects.find((p) => p.id === id);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const body = await request.json();
  const { content } = body;

  if (!content || typeof content !== "string") {
    return NextResponse.json(
      { error: "Content is required" },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();

  const userMessage = {
    id: `m${Date.now()}`,
    projectId: id,
    role: "user" as const,
    content,
    createdAt: now,
  };

  const assistantMessage = {
    id: `m${Date.now() + 1}`,
    projectId: id,
    role: "assistant" as const,
    content:
      assistantResponses[Math.floor(Math.random() * assistantResponses.length)],
    createdAt: new Date(Date.now() + 1000).toISOString(),
  };

  messages.push(userMessage, assistantMessage);

  project.lastMessage = assistantMessage.content;
  project.lastMessageAt = assistantMessage.createdAt;
  project.messagesCount += 2;

  return NextResponse.json({ messages: [userMessage, assistantMessage] }, { status: 201 });
}
