import type { SSEResult } from "./sse-parser";
import { parseSSEStream } from "./sse-parser";

export interface ApiChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface IDiscoveryAPIClient {
  sendMessages(messages: ApiChatMessage[]): Promise<SSEResult>;
  extractStructured(transcript: string): Promise<unknown>;
}

export class DiscoveryAPIClient implements IDiscoveryAPIClient {
  async sendMessages(messages: ApiChatMessage[]): Promise<SSEResult> {
    const response = await fetch("/api/agent/discovery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!response.ok) {
      throw new Error(`Agent error: ${response.status}`);
    }

    return parseSSEStream(response);
  }

  async extractStructured(transcript: string): Promise<unknown> {
    const response = await fetch("/api/agent/discovery/structured", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript }),
    });

    if (!response.ok) {
      throw new Error(`Structured extraction failed: ${response.status}`);
    }

    return response.json();
  }
}

export const defaultDiscoveryClient = new DiscoveryAPIClient();
