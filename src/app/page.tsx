"use client";

import { useEffect, useState } from "react";
import OnboardingChat from "@/components/onboarding-chat";
import type { CompanyProfile } from "@/types";

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
      .catch(() => setProfileChecked(true));
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (!profileChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
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
