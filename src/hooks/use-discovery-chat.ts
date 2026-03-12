"use client";
import { useState, useCallback, useRef } from "react";
import type { BusinessDiscovery } from "@/types/business-discovery";
import type { ChatMessage } from "@/types";
import { logError } from "@/lib/error-handler";
import {
  defaultDiscoveryClient,
  type IDiscoveryAPIClient,
} from "@/lib/discovery-api-client";

export interface ChoiceOption {
  value: string;
  label: string;
  description?: string;
}

export interface PendingChoices {
  question: string;
  choices: ChoiceOption[];
}

export type DiscoveryPhase = "fast_track" | "deep_dive" | "complete";

export interface UseDiscoveryChatResult {
  messages: ChatMessage[];
  isTyping: boolean;
  isComplete: boolean;
  phase: DiscoveryPhase;
  fastTrackSummary: string | null;
  discoveryData: BusinessDiscovery | null;
  pendingChoices: PendingChoices | null;
  sendMessage: (content: string) => Promise<void>;
  selectChoice: (value: string) => Promise<void>;
  startInterview: () => Promise<void>;
  finalizeDiscovery: () => Promise<BusinessDiscovery>;
}

export function useDiscoveryChat(
  apiClient: IDiscoveryAPIClient = defaultDiscoveryClient
): UseDiscoveryChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [phase, setPhase] = useState<DiscoveryPhase>("fast_track");
  const [fastTrackSummary, setFastTrackSummary] = useState<string | null>(null);
  const [discoveryData, setDiscoveryData] = useState<BusinessDiscovery | null>(
    null
  );
  const [pendingChoices, setPendingChoices] = useState<PendingChoices | null>(
    null
  );
  const msgIdCounter = useRef(0);

  const nextId = useCallback((prefix: string) => {
    msgIdCounter.current += 1;
    return `${prefix}-${msgIdCounter.current}`;
  }, []);

  /**
   * Process SSE result: update phase, choices, and completion state.
   */
  const processResult = useCallback(
    (result: { text: string; interviewComplete: boolean; fastTrackComplete: boolean; fastTrackSummary: string | null; choices: PendingChoices | null }) => {
      if (result.choices) {
        setPendingChoices(result.choices);
      }
      if (result.fastTrackComplete && result.fastTrackSummary) {
        setFastTrackSummary(result.fastTrackSummary);
      }
      if (result.interviewComplete) {
        setPhase("complete");
        setIsComplete(true);
      }
    },
    []
  );

  /**
   * Start the interview by sending an initial "Bonjour" to trigger the agent's opening.
   */
  const startInterview = useCallback(async () => {
    setIsTyping(true);

    try {
      const result = await apiClient.sendMessages([
        { role: "user", content: "Bonjour" },
      ]);

      const assistantMsg: ChatMessage = {
        id: nextId("lia"),
        role: "assistant",
        content: result.text,
      };
      setMessages([assistantMsg]);
      processResult(result);
    } catch (error) {
      logError("discovery:start", error);
      const errorMsg: ChatMessage = {
        id: nextId("error"),
        role: "assistant",
        content:
          "Désolée, je rencontre un problème technique. Veuillez rafraîchir la page.",
      };
      setMessages([errorMsg]);
    } finally {
      setIsTyping(false);
    }
  }, [apiClient, nextId, processResult]);

  /**
   * Send a user message and get the agent's response.
   */
  const sendMessage = useCallback(
    async (content: string) => {
      // Clear any pending choices when a message is sent
      setPendingChoices(null);

      const userMsg: ChatMessage = {
        id: nextId("user"),
        role: "user",
        content,
      };

      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setIsTyping(true);

      try {
        const result = await apiClient.sendMessages(
          updatedMessages.map((m) => ({ role: m.role, content: m.content }))
        );

        const assistantMsg: ChatMessage = {
          id: nextId("lia"),
          role: "assistant",
          content: result.text,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        processResult(result);

        // Transition to deep_dive phase when user chooses to continue
        if (result.fastTrackComplete && phase === "fast_track") {
          // The agent will present the choice; if user picks deep_dive, the next message will trigger it
          setPhase("deep_dive");
        }
      } catch (error) {
        logError("discovery:send", error);
        const errorMsg: ChatMessage = {
          id: nextId("error"),
          role: "assistant",
          content:
            "Désolée, je rencontre un problème technique. Veuillez réessayer.",
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsTyping(false);
      }
    },
    [messages, apiClient, nextId, processResult, phase]
  );

  /**
   * Select a choice from the presented options.
   * Finds the label and sends it as a regular user message.
   */
  const selectChoice = useCallback(
    async (value: string) => {
      if (!pendingChoices) return;
      const choice = pendingChoices.choices.find((c) => c.value === value);
      if (!choice) return;
      await sendMessage(choice.label);
    },
    [pendingChoices, sendMessage]
  );

  /**
   * After the interview is complete, send the transcript to /api/agent/discovery/structured
   * to extract the BusinessDiscovery JSON.
   */
  const finalizeDiscovery =
    useCallback(async (): Promise<BusinessDiscovery> => {
      const transcript = messages
        .map(
          (m) =>
            `${m.role === "user" ? "Utilisateur" : "Lia"} : ${m.content}`
        )
        .join("\n\n");

      const data = await apiClient.extractStructured(transcript);
      const discovery: BusinessDiscovery = (
        data as { discovery: BusinessDiscovery }
      ).discovery;
      setDiscoveryData(discovery);
      return discovery;
    }, [messages, apiClient]);

  return {
    messages,
    isTyping,
    isComplete,
    phase,
    fastTrackSummary,
    discoveryData,
    pendingChoices,
    sendMessage,
    selectChoice,
    startInterview,
    finalizeDiscovery,
  };
}
