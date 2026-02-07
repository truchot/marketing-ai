"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Project, Message } from "@/types";
import { logError } from "@/lib/error-handler";

export default function ConversationPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${projectId}`).then((r) => r.json()),
      fetch(`/api/projects/${projectId}/messages`).then((r) => r.json()),
    ])
      .then(([projectData, messagesData]) => {
        setProject(projectData.project);
        setMessages(messagesData.messages);
        setLoading(false);
      })
      .catch((error: unknown) => {
        logError("project:load", error);
        setLoading(false);
      });
  }, [projectId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content || sending) return;

    setInput("");
    setSending(true);

    // Optimistic user message
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      projectId,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch(`/api/projects/${projectId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      // The API returns the newly created messages (user + assistant)
      setMessages((prev) => {
        // Remove temp message and append the real ones
        const withoutTemp = prev.filter((m) => m.id !== tempUserMsg.id);
        return [...withoutTemp, ...data.messages];
      });
    } catch (error) {
      logError("project:update", error);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return <LoadingSpinner message="Chargement..." />;
  }

  if (!project) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">Projet introuvable</p>
          <Link href="/">
            <Button variant="outline" className="border-zinc-700 text-zinc-300">
              Retour
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-zinc-950">
      {/* Top bar */}
      <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-3">
        <Link href="/">
          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-zinc-100"
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
          </Button>
        </Link>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-lg">
          {project.icon}
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-zinc-100 truncate">
            {project.name}
          </h1>
          <p className="text-xs text-zinc-500 truncate">
            {project.description}
          </p>
        </div>
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1 overflow-hidden">
        <div className="mx-auto max-w-3xl px-4 py-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-600/20 mb-4">
                <span className="text-2xl font-bold text-violet-400">L</span>
              </div>
              <h2 className="text-lg font-semibold text-zinc-200 mb-1">
                Bonjour ! Je suis Lia
              </h2>
              <p className="text-sm text-zinc-500 max-w-md">
                Votre assistante marketing IA. Posez-moi une question sur ce
                projet pour commencer.
              </p>
            </div>
          )}

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
                        <span className="text-xs text-zinc-600">
                          {new Date(message.createdAt).toLocaleTimeString(
                            "fr-FR",
                            { hour: "2-digit", minute: "2-digit" }
                          )}
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
                        <span className="text-xs text-zinc-600">
                          {new Date(message.createdAt).toLocaleTimeString(
                            "fr-FR",
                            { hour: "2-digit", minute: "2-digit" }
                          )}
                        </span>
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

            {sending && (
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
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ecrivez votre message..."
            disabled={sending}
            className="flex-1 border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600 focus-visible:border-violet-500 focus-visible:ring-violet-500/20"
          />
          <Button
            type="submit"
            disabled={sending || !input.trim()}
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
