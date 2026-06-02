"use client";

import { useCallback, useRef, useState } from "react";
import type { ChatMessage } from "@/types";
import { logError } from "@/lib/error-handler";
import {
  EMPTY_SNAPSHOT,
  mergeSnapshots,
  type StrategyProgressSnapshot,
} from "@/lib/strategy-stages";

export interface ChoiceOption {
  value: string;
  label: string;
  description?: string;
}

export interface PendingChoices {
  question: string;
  choices: ChoiceOption[];
}

export interface UseStrategySessionResult {
  messages: ChatMessage[];
  isStreaming: boolean;
  /** True between request start and the first streamed text token. */
  isThinking: boolean;
  pendingChoices: PendingChoices | null;
  snapshot: StrategyProgressSnapshot;
  complete: boolean;
  start: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  selectChoice: (value: string) => Promise<void>;
}

const KICKOFF =
  "Bonjour Lia. Commencons par mes indicateurs cles (CAC, LTV, payback...), " +
  "puis remontons petit a petit vers la strategie. Sois concise et visuelle.";

interface SessionOptions {
  /** Optional BusinessDiscovery JSON to seed the diagnostic with real context. */
  discoveryJson?: string | null;
}

/**
 * Drives a live strategy-building session against /api/agent/strategy.
 *
 * Unlike the discovery client (which buffers the whole SSE stream), this hook
 * streams text tokens into the in-progress assistant message and applies
 * `progress` events to a cumulative funnel snapshot in real time. The snapshot
 * is OR-merged across turns because server session state resets per request.
 */
export function useStrategySession(
  options: SessionOptions = {}
): UseStrategySessionResult {
  const { discoveryJson } = options;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [pendingChoices, setPendingChoices] = useState<PendingChoices | null>(
    null
  );
  const [snapshot, setSnapshot] = useState<StrategyProgressSnapshot>(
    EMPTY_SNAPSHOT
  );
  const [complete, setComplete] = useState(false);

  const idCounter = useRef(0);
  const nextId = useCallback((prefix: string) => {
    idCounter.current += 1;
    return `${prefix}-${idCounter.current}`;
  }, []);

  const runStream = useCallback(
    async (history: ChatMessage[]) => {
      setIsStreaming(true);
      setIsThinking(true);
      setPendingChoices(null);

      const assistantId = nextId("lia");
      let started = false;
      let assembled = "";

      const ensureAssistant = () => {
        if (started) return;
        started = true;
        setIsThinking(false);
        setMessages((prev) => [
          ...prev,
          { id: assistantId, role: "assistant", content: "" },
        ]);
      };

      try {
        const res = await fetch("/api/agent/strategy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            ...(discoveryJson ? { discoveryJson } : {}),
          }),
        });

        if (!res.ok || !res.body) {
          throw new Error(`Strategy agent error: ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          let event = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) {
              event = line.slice(7).trim();
              continue;
            }
            if (!line.startsWith("data: ")) continue;

            let data: Record<string, unknown>;
            try {
              data = JSON.parse(line.slice(6));
            } catch {
              event = "";
              continue; // malformed chunk — skip
            }

            if (event === "message" && typeof data.text === "string") {
              ensureAssistant();
              assembled += data.text;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: assembled } : m
                )
              );
            } else if (event === "progress") {
              setSnapshot((prev) =>
                mergeSnapshots(prev, data as unknown as StrategyProgressSnapshot)
              );
            } else if (event === "choices" && typeof data.question === "string") {
              setPendingChoices({
                question: data.question,
                choices: (data.choices as ChoiceOption[]) ?? [],
              });
            } else if (event === "strategy_complete") {
              setComplete(true);
            } else if (event === "success" && typeof data.result === "string") {
              // Canonical final text in case any tokens were dropped.
              ensureAssistant();
              if (data.result.length >= assembled.length) {
                assembled = data.result;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: assembled } : m
                  )
                );
              }
            } else if (event === "error") {
              throw new Error(
                typeof data.error === "string" ? data.error : "Unknown strategy error"
              );
            }
            event = "";
          }
        }

        if (!started) {
          // No text streamed (e.g. only tool calls). Surface a fallback line.
          setMessages((prev) => [
            ...prev,
            {
              id: assistantId,
              role: "assistant",
              content: assembled || "…",
            },
          ]);
        }
      } catch (error) {
        logError("strategy:stream", error);
        setMessages((prev) => [
          ...prev,
          {
            id: nextId("error"),
            role: "assistant",
            content:
              "Desolee, une erreur est survenue pendant la construction de la strategie. Veuillez reessayer.",
          },
        ]);
      } finally {
        setIsStreaming(false);
        setIsThinking(false);
      }
    },
    [discoveryJson, nextId]
  );

  const start = useCallback(async () => {
    const kickoff: ChatMessage = {
      id: nextId("user"),
      role: "user",
      content: KICKOFF,
    };
    // The kickoff is an internal trigger — keep it out of the visible thread.
    await runStream([kickoff]);
  }, [nextId, runStream]);

  const sendMessage = useCallback(
    async (content: string) => {
      const userMsg: ChatMessage = {
        id: nextId("user"),
        role: "user",
        content,
      };
      const history = [...messages, userMsg];
      setMessages(history);
      await runStream(history);
    },
    [messages, nextId, runStream]
  );

  const selectChoice = useCallback(
    async (value: string) => {
      if (!pendingChoices) return;
      const choice = pendingChoices.choices.find((c) => c.value === value);
      if (!choice) return;
      await sendMessage(choice.label);
    },
    [pendingChoices, sendMessage]
  );

  return {
    messages,
    isStreaming,
    isThinking,
    pendingChoices,
    snapshot,
    complete,
    start,
    sendMessage,
    selectChoice,
  };
}
