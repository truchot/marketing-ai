"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CompanyProfile } from "@/types";
import { useOnboardingFlow, STEPS, FINAL_MESSAGE } from "@/hooks/use-onboarding-flow";
import { useChatMessages } from "@/hooks/use-chat-messages";
import MessageBubble from "@/components/chat/message-bubble";
import TypingIndicator from "@/components/chat/typing-indicator";
import ChatHeader from "@/components/chat/chat-header";
import ChatInput from "@/components/chat/chat-input";

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

  const onboarding = useOnboardingFlow();
  const chat = useChatMessages();

  // Auto-scroll on message changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages, chat.isTyping]);

  // Load history for chat mode
  useEffect(() => {
    if (initialMode === "chat") {
      chat.loadHistory().then(() => {
        setHistoryLoaded(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }).catch(() => setHistoryLoaded(true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMode]);

  // Send initial onboarding message
  useEffect(() => {
    if (initialMode !== "onboarding" || initRef.current) return;
    initRef.current = true;

    chat.setIsTyping(true);
    const delay = 600 + Math.random() * 200;
    const timer = setTimeout(() => {
      chat.addLocalMessage("lia-0", "assistant", STEPS[0].question([]));
      chat.setIsTyping(false);
      inputRef.current?.focus();
    }, delay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMode]);

  const completeOnboarding = useCallback(
    async (newAnswers: string[]) => {
      // Build the full message history for saving
      const allMsgs: { role: "user" | "assistant"; content: string }[] = [
        { role: "assistant", content: STEPS[0].question([]) },
      ];
      for (let i = 0; i < newAnswers.length; i++) {
        allMsgs.push({ role: "user", content: newAnswers[i] });
        if (i + 1 < STEPS.length) {
          allMsgs.push({
            role: "assistant",
            content: STEPS[i + 1].question(newAnswers),
          });
        }
      }
      allMsgs.push({ role: "assistant", content: FINAL_MESSAGE });

      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: {
            name: newAnswers[0],
            sector: newAnswers[1],
            description: newAnswers[2],
            target: newAnswers[3],
            brandTone: newAnswers[4],
          },
          messages: allMsgs,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to complete onboarding");
      }
    },
    []
  );

  function handleOnboardingSend(content: string) {
    const newAnswers = onboarding.addAnswer(content);

    chat.addLocalMessage(`user-${onboarding.currentStep}`, "user", content);

    const nextQuestion = onboarding.getNextQuestion(newAnswers);

    if (nextQuestion) {
      // More questions remaining
      chat.setIsTyping(true);
      const delay = 600 + Math.random() * 200;
      setTimeout(() => {
        chat.addLocalMessage(`lia-${newAnswers.length}`, "assistant", nextQuestion);
        chat.setIsTyping(false);
        inputRef.current?.focus();
      }, delay);
    } else {
      // All questions answered -- show final message then save
      chat.setIsTyping(true);
      const delay = 600 + Math.random() * 200;
      setTimeout(async () => {
        chat.addLocalMessage("lia-final", "assistant", FINAL_MESSAGE);
        chat.setIsTyping(false);
        setSaving(true);

        try {
          await completeOnboarding(newAnswers);
          setSaving(false);
          setMode("chat");
          if (onComplete) onComplete();
          inputRef.current?.focus();
        } catch {
          setSaving(false);
        }
      }, delay);
    }
  }

  async function handleChatSend(content: string) {
    await chat.sendMessage(content);
    inputRef.current?.focus();
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content || chat.isTyping || saving) return;
    setInput("");

    if (mode === "onboarding") {
      handleOnboardingSend(content);
    } else {
      handleChatSend(content);
    }
  }

  const completedSteps =
    mode === "onboarding" ? onboarding.completedSteps : STEPS.length;

  const showProgress = mode === "onboarding" && completedSteps < STEPS.length;

  // Loading state for chat mode
  if (initialMode === "chat" && !historyLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  const placeholder = saving
    ? "Sauvegarde en cours..."
    : mode === "onboarding"
    ? "Votre réponse..."
    : "Posez votre question à Lia...";

  return (
    <div className="flex h-screen flex-col bg-zinc-950">
      <ChatHeader
        companyName={profile?.name}
        showProgress={showProgress}
        completedSteps={completedSteps}
        totalSteps={STEPS.length}
        saving={saving}
      />

      <ScrollArea className="flex-1 overflow-hidden">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <div className="space-y-6">
            {chat.messages.map((message) => (
              <div key={message.id}>
                <MessageBubble role={message.role} content={message.content} />
              </div>
            ))}
            {chat.isTyping && <TypingIndicator />}
          </div>
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <Separator className="bg-zinc-800" />

      <ChatInput
        ref={inputRef}
        value={input}
        onChange={setInput}
        onSubmit={handleSend}
        placeholder={placeholder}
        disabled={chat.isTyping || saving}
      />
    </div>
  );
}
