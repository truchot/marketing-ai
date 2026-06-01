import { NextRequest } from "next/server";
import { RequestContext } from "@mastra/core/request-context";
import { getStrategyAgent } from "@/mastra";
import {
  STRATEGY_STATE_KEY,
  createStrategySessionState,
} from "@/mastra/runtime/strategy-state";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 min max

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChoiceOption {
  value: string;
  label: string;
  description?: string;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { messages, discoveryJson, conversationId } = body as {
    messages?: ChatMessage[];
    discoveryJson?: string;
    conversationId?: string;
  };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return new Response(
      JSON.stringify({ error: "messages[] is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!process.env.CLAUDE_CODE_OAUTH_TOKEN) {
    return new Response(
      JSON.stringify({ error: "CLAUDE_CODE_OAUTH_TOKEN not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const transcript = messages
    .map((m) => `${m.role === "user" ? "User" : "Lia"} : ${m.content}`)
    .join("\n\n");

  // Validate discoveryJson if provided
  let discoveryContext = "";
  if (discoveryJson && typeof discoveryJson === "string") {
    try {
      JSON.parse(discoveryJson);
      discoveryContext = `\n\n## BusinessDiscovery (input de la phase discovery)\n\`\`\`json\n${discoveryJson}\n\`\`\``;
    } catch {
      return new Response(
        JSON.stringify({ error: "discoveryJson must be valid JSON" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  const prompt = `${transcript}${discoveryContext}\n\nContinue the strategy session.`;

  // État de session porté par RequestContext (par requête, partagé avec les tools).
  const sessionState = createStrategySessionState();
  const requestContext = new RequestContext();
  requestContext.set(STRATEGY_STATE_KEY, sessionState);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: Record<string, unknown>) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      try {
        sendEvent("start", { timestamp: new Date().toISOString() });

        const agent = getStrategyAgent();
        // maxSteps:16 — 3-level flow: diagnostic + 4 strategic subsystems + OKRs
        // + roadmap validation + 2 tactical subsystems + tasks + save.
        const result = await agent.stream(prompt, {
          requestContext,
          maxSteps: 16,
          ...(conversationId
            ? { memory: { resource: "strategy", thread: conversationId } }
            : {}),
        });

        let assembled = "";
        for await (const delta of result.textStream) {
          if (delta) {
            assembled += delta;
            sendEvent("message", { text: delta });
          }
        }

        const full = await result.getFullOutput();
        const usage = full.usage as { totalTokens?: number } | undefined;
        sendEvent("success", {
          result: full.text || assembled,
          cost: usage?.totalTokens ?? null,
          turns: full.steps?.length ?? 1,
        });

        // État final lu depuis le RequestContext (muté par les tools).
        const pendingChoices = sessionState.pendingChoices as
          | { question: string; choices: ChoiceOption[] }
          | null;
        if (pendingChoices) {
          sendEvent("choices", pendingChoices);
        }

        if (sessionState.strategyComplete) {
          sendEvent("strategy_complete", {
            timestamp: new Date().toISOString(),
            okrCount: sessionState.validatedOKRs.length,
          });
        }

        sendEvent("complete", { timestamp: new Date().toISOString() });
      } catch (err) {
        sendEvent("error", {
          error: err instanceof Error ? err.message : "Unknown error",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
