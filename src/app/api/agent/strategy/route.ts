import { NextRequest } from "next/server";
import { query } from "@anthropic-ai/claude-agent-sdk";
import { getStrategistSystemPrompt } from "@/agents/strategist";
import {
  createStrategyMcpServer,
  createStrategyRequestState,
} from "@/tools/strategy/tool-definitions";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 min max

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { messages, discoveryJson } = body as {
    messages?: ChatMessage[];
    discoveryJson?: string;
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

  // Create request-scoped state and MCP server
  const requestState = createStrategyRequestState();
  const strategyMcpServer = createStrategyMcpServer(requestState);

  const systemPrompt = getStrategistSystemPrompt();

  // Format messages as transcript for the agent
  const transcript = messages
    .map(
      (m) =>
        `${m.role === "user" ? "Utilisateur" : "Lia"} : ${m.content}`
    )
    .join("\n\n");

  // Include discovery JSON as context if provided
  const discoveryContext = discoveryJson
    ? `\n\n## BusinessDiscovery (input de la phase discovery)\n\`\`\`json\n${discoveryJson}\n\`\`\``
    : "";

  const prompt = `${transcript}${discoveryContext}\n\nContinue la session stratégique.`;

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
          prompt,
          options: {
            model: "claude-sonnet-4-5-20250929",
            systemPrompt,
            permissionMode: "bypassPermissions",
            allowDangerouslySkipPermissions: true,
            tools: [],
            mcpServers: {
              "strategy-tools": strategyMcpServer,
            },
            maxTurns: 8, // More turns needed: diagnostic + OKR + actions + save
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

        // Emit choices if the tool was called
        if (requestState.pendingChoices) {
          sendEvent("choices", requestState.pendingChoices);
        }

        // Emit strategy_complete if the session is done
        if (requestState.strategyComplete) {
          sendEvent("strategy_complete", {
            timestamp: new Date().toISOString(),
            okrCount: requestState.validatedOKRs.length,
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
