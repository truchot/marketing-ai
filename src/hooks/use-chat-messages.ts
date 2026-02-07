"use client";
import { useState, useCallback } from "react";
import type { ConversationMessage } from "@/types";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface UseChatMessagesResult {
  messages: ChatMessage[];
  isTyping: boolean;
  addLocalMessage: (
    id: string,
    role: "user" | "assistant",
    content: string
  ) => void;
  addLocalMessages: (msgs: ChatMessage[]) => void;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  sendMessage: (content: string) => Promise<void>;
  loadHistory: () => Promise<void>;
  setIsTyping: (typing: boolean) => void;
}

export function useChatMessages(): UseChatMessagesResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const addLocalMessage = useCallback(
    (id: string, role: "user" | "assistant", content: string) => {
      setMessages((prev) => [...prev, { id, role, content }]);
    },
    []
  );

  const addLocalMessages = useCallback((msgs: ChatMessage[]) => {
    setMessages((prev) => [...prev, ...msgs]);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
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
        setMessages((prev) => [
          ...prev,
          {
            id: data.messages[1].id,
            role: "assistant" as const,
            content: data.messages[1].content,
          },
        ]);
      }
    } catch {
      // Silently handle error
    } finally {
      setIsTyping(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations/messages");
      const data = await res.json();
      if (data.messages && data.messages.length > 0) {
        setMessages(
          data.messages.map((m: ConversationMessage) => ({
            id: m.id,
            role: m.role,
            content: m.content,
          }))
        );
      }
    } catch {
      // Silently handle error
    }
  }, []);

  return {
    messages,
    isTyping,
    addLocalMessage,
    addLocalMessages,
    setMessages,
    sendMessage,
    loadHistory,
    setIsTyping,
  };
}
