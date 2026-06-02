"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import MessageBubble from "@/components/chat/message-bubble";
import TypingIndicator from "@/components/chat/typing-indicator";
import ChatInput from "@/components/chat/chat-input";
import DiscoveryChoiceCard from "@/components/chat/discovery-choice-card";
import type { ChatMessage } from "@/types";
import type { PendingChoices } from "@/hooks/use-strategy-session";

interface StrategySessionChatProps {
  messages: ChatMessage[];
  isThinking: boolean;
  pendingChoices: PendingChoices | null;
  starting: boolean;
  title: string;
  subtitle?: string;
  headerLeft?: ReactNode;
  rightSlot?: ReactNode;
  onSend: (content: string) => void;
  onSelect: (value: string) => void;
}

export default function StrategySessionChat({
  messages,
  isThinking,
  pendingChoices,
  starting,
  title,
  subtitle,
  headerLeft,
  rightSlot,
  onSend,
  onSelect,
}: StrategySessionChatProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking, pendingChoices]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content) return;
    setInput("");
    onSend(content);
    inputRef.current?.focus();
  }

  const showInput = !pendingChoices;

  return (
    <div className="flex h-full min-w-0 flex-col bg-zinc-950">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-3">
        {headerLeft}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-sm font-bold text-white">
          L
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold text-zinc-100">
            {title}
          </h1>
          <p className="truncate text-xs text-zinc-500">
            {subtitle ?? "Strategy session with Lia"}
          </p>
        </div>
        {rightSlot}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 overflow-hidden">
        <div className="mx-auto max-w-2xl px-4 py-6">
          {starting && messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-violet-600/20">
                <span className="text-2xl font-bold text-violet-400">L</span>
              </div>
              <h2 className="mb-1 text-lg font-semibold text-zinc-200">
                Construisons votre stratégie
              </h2>
              <p className="max-w-md text-sm text-zinc-500">
                Lia analyse votre contexte et démarre le diagnostic…
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <div key={message.id}>
                  <MessageBubble role={message.role} content={message.content} />
                </div>
              ))}
              {pendingChoices && !isThinking && (
                <DiscoveryChoiceCard
                  choices={pendingChoices}
                  onSelect={onSelect}
                />
              )}
              {isThinking && <TypingIndicator />}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {showInput && (
        <>
          <Separator className="bg-zinc-800" />
          <ChatInput
            ref={inputRef}
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            placeholder="Votre réponse à Lia…"
          />
        </>
      )}
    </div>
  );
}
