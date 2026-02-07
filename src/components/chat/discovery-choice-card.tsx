"use client";

import { useState } from "react";
import type { PendingChoices } from "@/hooks/use-discovery-chat";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface DiscoveryChoiceCardProps {
  choices: PendingChoices;
  onSelect: (value: string) => void;
  disabled?: boolean;
}

export default function DiscoveryChoiceCard({
  choices,
  onSelect,
  disabled,
}: DiscoveryChoiceCardProps) {
  const [selected, setSelected] = useState<string | null>(null);

  function handleSelect(value: string) {
    if (disabled) return;
    setSelected(value);
    onSelect(value);
  }

  return (
    <div className="flex gap-3">
      <Avatar className="mt-0.5 shrink-0">
        <AvatarFallback className="bg-violet-600 text-white text-xs font-semibold">
          L
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl rounded-tl-sm border border-zinc-800 bg-zinc-900 px-4 py-4">
          <p className="mb-3 text-sm font-medium text-zinc-200">
            {choices.question}
          </p>
          <div className="space-y-2">
            {choices.choices.map((choice) => {
              const isSelected = selected === choice.value;
              return (
                <button
                  key={choice.value}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleSelect(choice.value)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                    isSelected
                      ? "border-violet-500 bg-violet-500/10"
                      : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600 hover:bg-zinc-800"
                  } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                >
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      isSelected
                        ? "border-violet-500 bg-violet-500"
                        : "border-zinc-600"
                    }`}
                  >
                    {isSelected && (
                      <div className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium text-zinc-100">
                      {choice.label}
                    </span>
                    {choice.description && (
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {choice.description}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
