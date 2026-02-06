"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CompanyProfile, ConversationMessage } from "@/types";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const STEPS = [
  {
    question: (_answers: string[]) =>
      "Bonjour ! Je suis Lia, votre assistante marketing. Avant de commencer, j'aimerais mieux connaître votre entreprise. Quel est le nom de votre entreprise ?",
    field: "name",
  },
  {
    question: (answers: string[]) =>
      `${answers[0]}, c'est noté ! Dans quel secteur d'activité évoluez-vous ?`,
    field: "sector",
  },
  {
    question: (answers: string[]) =>
      `Le secteur ${answers[1]}, très bien. Décrivez en quelques mots ce que fait votre entreprise ?`,
    field: "description",
  },
  {
    question: (_answers: string[]) =>
      "Parfait ! Quelle est votre cible principale ? (ex : PME françaises, jeunes 18-25 ans, professionnels RH...)",
    field: "target",
  },
  {
    question: (_answers: string[]) =>
      "Dernière question : quel ton souhaitez-vous adopter pour votre communication ? (ex : professionnel, décontracté, inspirant, audacieux...)",
    field: "brandTone",
  },
];

const FINAL_MESSAGE =
  "Merci ! Je connais maintenant votre entreprise. Je suis prête à vous accompagner dans vos projets marketing. Vous pouvez me poser toutes vos questions ici !";

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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState(initialMode);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Load history for chat mode
  useEffect(() => {
    if (initialMode === "chat") {
      fetch("/api/conversations/messages")
        .then((res) => res.json())
        .then((data) => {
          if (data.messages && data.messages.length > 0) {
            setMessages(
              data.messages.map((m: ConversationMessage) => ({
                id: m.id,
                role: m.role,
                content: m.content,
              }))
            );
          }
          setHistoryLoaded(true);
          setTimeout(() => inputRef.current?.focus(), 100);
        })
        .catch(() => setHistoryLoaded(true));
    }
  }, [initialMode]);

  // Send initial message for onboarding
  useEffect(() => {
    if (initialMode !== "onboarding" || initRef.current) return;
    initRef.current = true;

    setIsTyping(true);
    const delay = 600 + Math.random() * 200;
    const timer = setTimeout(() => {
      setMessages([
        {
          id: "lia-0",
          role: "assistant",
          content: STEPS[0].question([]),
        },
      ]);
      setIsTyping(false);
      inputRef.current?.focus();
    }, delay);
    return () => clearTimeout(timer);
  }, [initialMode]);

  const saveMessagesToServer = useCallback(
    async (msgs: { role: "user" | "assistant"; content: string }[]) => {
      for (const msg of msgs) {
        if (msg.role === "user") {
          // POST each user message to save + get response, but we handle onboarding responses ourselves
          await fetch("/api/conversations/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: msg.content }),
          });
        }
      }
    },
    []
  );

  const feedOnboardingToMemory = useCallback(
    async (allAnswers: string[]) => {
      const memoryEntries = [
        {
          action: "addFact",
          params: {
            category: "company",
            fact: `Nom: ${allAnswers[0]}`,
            source: "onboarding",
          },
        },
        {
          action: "addFact",
          params: {
            category: "market",
            fact: `Secteur: ${allAnswers[1]}`,
            source: "onboarding",
          },
        },
        {
          action: "addFact",
          params: {
            category: "company",
            fact: `Description: ${allAnswers[2]}`,
            source: "onboarding",
          },
        },
        {
          action: "addFact",
          params: {
            category: "audience",
            fact: `Cible: ${allAnswers[3]}`,
            source: "onboarding",
          },
        },
        {
          action: "addPreference",
          params: {
            category: "tone",
            key: "Ton de marque",
            value: allAnswers[4],
            confidence: "strong",
          },
        },
      ];

      for (const entry of memoryEntries) {
        await fetch("/api/memory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(entry),
        });
      }
    },
    []
  );

  async function handleOnboardingSend(content: string) {
    const newAnswers = [...answers, content];
    setAnswers(newAnswers);

    const userMsg: ChatMessage = {
      id: `user-${currentStep}`,
      role: "user",
      content,
    };
    setMessages((prev) => [...prev, userMsg]);

    const nextStep = currentStep + 1;

    if (nextStep < STEPS.length) {
      setIsTyping(true);
      const delay = 600 + Math.random() * 200;
      setTimeout(() => {
        const liaMsg: ChatMessage = {
          id: `lia-${nextStep}`,
          role: "assistant",
          content: STEPS[nextStep].question(newAnswers),
        };
        setMessages((prev) => [...prev, liaMsg]);
        setIsTyping(false);
        setCurrentStep(nextStep);
        inputRef.current?.focus();
      }, delay);
    } else {
      // All questions answered
      setIsTyping(true);
      const delay = 600 + Math.random() * 200;
      setTimeout(async () => {
        const finalMsg: ChatMessage = {
          id: "lia-final",
          role: "assistant",
          content: FINAL_MESSAGE,
        };
        setMessages((prev) => [...prev, finalMsg]);
        setIsTyping(false);
        setSaving(true);

        try {
          // Save company profile
          await fetch("/api/company-profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: newAnswers[0],
              sector: newAnswers[1],
              description: newAnswers[2],
              target: newAnswers[3],
              brandTone: newAnswers[4],
            }),
          });

          // Feed onboarding data to semantic memory
          await feedOnboardingToMemory(newAnswers);

          // Save all messages to conversation history
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
          await saveMessagesToServer(allMsgs);

          setSaving(false);
          // Transition to chat mode
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
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const res = await fetch("/api/conversations/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();

      if (data.messages && data.messages.length >= 2) {
        const assistantMsg: ChatMessage = {
          id: data.messages[1].id,
          role: "assistant",
          content: data.messages[1].content,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch {
      // Silently handle error
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  }

  async function handleSend(e: React.FormEvent) {
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

  const completedSteps =
    mode === "onboarding"
      ? currentStep + (answers.length > currentStep ? 1 : 0)
      : STEPS.length;

  const showProgress = mode === "onboarding" && completedSteps < STEPS.length;

  // Loading state for chat mode
  if (initialMode === "chat" && !historyLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-zinc-950">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600 text-white text-sm font-bold">
            L
          </div>
          <h1 className="text-sm font-semibold text-zinc-100">Marketing AI</h1>
        </div>
        <div className="flex items-center gap-3">
          {showProgress && (
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 w-2 rounded-full transition-colors duration-300 ${
                    i < completedSteps
                      ? "bg-violet-500"
                      : i === completedSteps && !saving
                      ? "bg-violet-500/40"
                      : "bg-zinc-700"
                  }`}
                />
              ))}
            </div>
          )}
          {profile && (
            <span className="text-sm font-medium text-zinc-400">
              {profile.name}
            </span>
          )}
        </div>
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1 overflow-hidden">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <div className="space-y-6">
            {messages.map((message) => (
              <div key={message.id}>
                {message.role === "assistant" ? (
                  <div className="flex gap-3">
                    <Avatar className="mt-0.5 shrink-0">
                      <AvatarFallback className="bg-violet-600 text-white text-xs font-semibold">
                        L
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-violet-400">
                          Lia
                        </span>
                      </div>
                      <div className="rounded-2xl rounded-tl-sm bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <div className="max-w-[80%]">
                      <div className="flex items-center justify-end gap-2 mb-1">
                        <span className="text-sm font-medium text-zinc-400">
                          Vous
                        </span>
                      </div>
                      <div className="rounded-2xl rounded-tr-sm bg-violet-600 px-4 py-3 text-sm text-white leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3">
                <Avatar className="mt-0.5 shrink-0">
                  <AvatarFallback className="bg-violet-600 text-white text-xs font-semibold">
                    L
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-zinc-900 border border-zinc-800 px-4 py-3">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400 [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400 [animation-delay:300ms]" />
                </div>
              </div>
            )}
          </div>

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <Separator className="bg-zinc-800" />

      {/* Input bar */}
      <div className="px-4 py-4">
        <form
          onSubmit={handleSend}
          className="mx-auto flex max-w-3xl items-center gap-2"
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              saving
                ? "Sauvegarde en cours..."
                : mode === "onboarding"
                ? "Votre réponse..."
                : "Posez votre question à Lia..."
            }
            disabled={isTyping || saving}
            className="flex-1 border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600 focus-visible:border-violet-500 focus-visible:ring-violet-500/20"
          />
          <Button
            type="submit"
            disabled={isTyping || saving || !input.trim()}
            className="bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Button>
        </form>
      </div>
    </div>
  );
}
