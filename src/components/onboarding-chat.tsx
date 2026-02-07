"use client";

import { useEffect, useRef, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import LoadingSpinner from "@/components/ui/loading-spinner";
import type { CompanyProfile } from "@/types";
import { logError } from "@/lib/error-handler";
import { useDiscoveryChat } from "@/hooks/use-discovery-chat";
import { useChatMessages } from "@/hooks/use-chat-messages";
import MessageBubble from "@/components/chat/message-bubble";
import TypingIndicator from "@/components/chat/typing-indicator";
import ChatHeader from "@/components/chat/chat-header";
import ChatInput from "@/components/chat/chat-input";
import DiscoveryChoiceCard from "@/components/chat/discovery-choice-card";

interface OnboardingChatProps {
  mode: "onboarding" | "chat";
  profile?: CompanyProfile | null;
  onComplete?: () => void;
}

export default function OnboardingChat({
  mode: initialMode,
  profile,
  onComplete,
}: OnboardingChatProps) {
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState(initialMode);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initRef = useRef(false);
  const finalizingRef = useRef(false);

  const discovery = useDiscoveryChat();
  const chat = useChatMessages();

  // Pick the right message source based on mode
  const displayMessages =
    mode === "onboarding" ? discovery.messages : chat.messages;
  const isTyping =
    mode === "onboarding" ? discovery.isTyping : chat.isTyping;

  // Auto-scroll on message changes or choices
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages, isTyping, discovery.pendingChoices]);

  // Load history for chat mode
  useEffect(() => {
    if (initialMode === "chat") {
      chat
        .loadHistory()
        .then(() => {
          setHistoryLoaded(true);
          setTimeout(() => inputRef.current?.focus(), 100);
        })
        .catch((error: unknown) => {
          logError("onboarding:history", error);
          setHistoryLoaded(true);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMode]);

  // Start interview on mount (onboarding mode)
  useEffect(() => {
    if (initialMode !== "onboarding" || initRef.current) return;
    initRef.current = true;

    discovery.startInterview().then(() => {
      inputRef.current?.focus();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMode]);

  // Auto-finalize when interview completes
  useEffect(() => {
    if (!discovery.isComplete || finalizingRef.current) return;
    finalizingRef.current = true;

    (async () => {
      setSaving(true);
      try {
        const discoveryData = await discovery.finalizeDiscovery();

        // Build messages array for saving
        const allMsgs = discovery.messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch("/api/onboarding/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            discovery: discoveryData,
            messages: allMsgs,
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to complete onboarding");
        }

        setSaving(false);
        setMode("chat");
        if (onComplete) onComplete();
        inputRef.current?.focus();
      } catch (error) {
        logError("onboarding:complete", error);
        setSaving(false);
        finalizingRef.current = false;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discovery.isComplete]);

  async function handleOnboardingSend(content: string) {
    await discovery.sendMessage(content);
    inputRef.current?.focus();
  }

  async function handleChatSend(content: string) {
    await chat.sendMessage(content);
    inputRef.current?.focus();
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content || isTyping || saving) return;
    setInput("");

    if (mode === "onboarding") {
      handleOnboardingSend(content);
    } else {
      handleChatSend(content);
    }
  }

  // Loading state for chat mode
  if (initialMode === "chat" && !historyLoaded) {
    return <LoadingSpinner />;
  }

  const placeholder = saving
    ? "Analyse en cours..."
    : mode === "onboarding"
    ? "Votre réponse..."
    : "Posez votre question à Lia...";

  return (
    <div className="flex h-screen flex-col bg-zinc-950">
      <ChatHeader
        companyName={profile?.name}
        showProgress={mode === "onboarding" && !discovery.isComplete}
        saving={saving}
      />

      <ScrollArea className="flex-1 overflow-hidden">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <div className="space-y-6">
            {displayMessages.map((message) => (
              <div key={message.id}>
                <MessageBubble role={message.role} content={message.content} />
              </div>
            ))}
            {mode === "onboarding" &&
              discovery.pendingChoices &&
              !isTyping && (
                <DiscoveryChoiceCard
                  choices={discovery.pendingChoices}
                  onSelect={discovery.selectChoice}
                  disabled={isTyping || saving}
                />
              )}
            {isTyping && <TypingIndicator />}
          </div>
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {!(mode === "onboarding" && discovery.pendingChoices) && (
        <>
          <Separator className="bg-zinc-800" />
          <ChatInput
            ref={inputRef}
            value={input}
            onChange={setInput}
            onSubmit={handleSend}
            placeholder={placeholder}
            disabled={isTyping || saving}
          />
        </>
      )}
    </div>
  );
}
