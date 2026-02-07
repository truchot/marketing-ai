import { NextRequest } from "next/server";
import { query } from "@anthropic-ai/claude-agent-sdk";
import {
  getDiscoverySystemPrompt,
  businessDiscoverySchema,
} from "@/agents/discovery";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 min max for long interviews

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { message } = body;

  if (!message || typeof message !== "string") {
    return new Response(
      JSON.stringify({ error: "Message is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!process.env.CLAUDE_CODE_OAUTH_TOKEN) {
    return new Response(
      JSON.stringify({ error: "CLAUDE_CODE_OAUTH_TOKEN not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const systemPrompt = getDiscoverySystemPrompt();

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

        const result = query({
          prompt: message,
          options: {
            model: "claude-sonnet-4-5-20250929",
            systemPrompt,
            permissionMode: "bypassPermissions",
            allowDangerouslySkipPermissions: true,
            tools: [],
            maxTurns: 1,
          },
        });

        for await (const msg of result) {
          if (msg.type === "assistant") {
            for (const block of msg.message.content) {
              if (block.type === "text") {
                sendEvent("message", { text: block.text });
              }
            }
          } else if (msg.type === "result") {
            if (msg.subtype === "success") {
              sendEvent("success", {
                result: msg.result,
                cost: msg.total_cost_usd,
                turns: msg.num_turns,
              });
            } else {
              sendEvent("error", {
                error: msg.errors?.join(", ") || "Unknown error",
              });
            }
          }
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
