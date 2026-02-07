"use client";

import { useEffect, useState } from "react";
import OnboardingChat from "@/components/onboarding-chat";
import LoadingSpinner from "@/components/ui/loading-spinner";
import type { CompanyProfile } from "@/types";
import { logError } from "@/lib/error-handler";

export default function HomePage() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [profileChecked, setProfileChecked] = useState(false);

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

  if (!profileChecked) {
    return <LoadingSpinner />;
  }

  if (!profile) {
    return (
      <OnboardingChat
        mode="onboarding"
        onComplete={fetchProfile}
      />
    );
  }

  return (
    <OnboardingChat
      mode="chat"
      profile={profile}
    />
  );
}
