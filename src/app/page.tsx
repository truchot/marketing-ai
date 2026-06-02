"use client";

import { useEffect, useState } from "react";
import OnboardingChat from "@/components/onboarding-chat";
import StrategyWorkspace from "@/components/strategy/strategy-workspace";
import LoadingSpinner from "@/components/ui/loading-spinner";
import type { CompanyProfile } from "@/types";
import { logError } from "@/lib/error-handler";

export default function HomePage() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [profileChecked, setProfileChecked] = useState(false);
  const [discoveryJson, setDiscoveryJson] = useState<string | null>(null);
  const [discoveryLoaded, setDiscoveryLoaded] = useState(false);

  const fetchProfile = () => {
    fetch("/api/company-profile")
      .then((res) => res.json())
      .then((data) => {
        setProfile(data.profile);
        setProfileChecked(true);
      })
      .catch((error: unknown) => {
        logError("page:load", error);
        setProfileChecked(true);
      });
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Once onboarded, load the BusinessDiscovery JSON so the strategy session can
  // seed its diagnostic with real context.
  useEffect(() => {
    if (!profile) return;
    fetch("/api/onboarding/discovery")
      .then((res) => res.json())
      .then((data) => {
        setDiscoveryJson(
          data.discovery ? JSON.stringify(data.discovery) : null
        );
      })
      .catch((error: unknown) => logError("page:discovery", error))
      .finally(() => setDiscoveryLoaded(true));
  }, [profile]);

  if (!profileChecked) {
    return <LoadingSpinner />;
  }

  // Not onboarded yet — run the discovery interview.
  if (!profile) {
    return <OnboardingChat mode="onboarding" onComplete={fetchProfile} />;
  }

  // Wait for the discovery fetch so the session starts with full context.
  if (!discoveryLoaded) {
    return <LoadingSpinner message="Préparation de la stratégie..." />;
  }

  return (
    <StrategyWorkspace
      title={profile.name}
      subtitle="Marketing strategy"
      discoveryJson={discoveryJson}
      autoStart
    />
  );
}
