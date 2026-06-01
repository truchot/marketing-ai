import { NextRequest } from "next/server";
import { getDiscoveryAgent } from "@/mastra";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 min max for long interviews

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** Forme permissive d'un tool-call agrégé (compatibilité de version Mastra). */
interface LooseToolCall {
  toolName?: string;
  args?: Record<string, unknown>;
  input?: Record<string, unknown>;
  payload?: { toolName?: string; args?: Record<string, unknown>; input?: Record<string, unknown> };
}

interface ChoiceOption {
  value: string;
  label: string;
  description?: string;
}

function readToolCall(tc: LooseToolCall): { name: string | undefined; args: Record<string, unknown> } {
  const name = tc.toolName ?? tc.payload?.toolName;
  const args = tc.args ?? tc.input ?? tc.payload?.args ?? tc.payload?.input ?? {};
  return { name, args };
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { messages, conversationId } = body as {
    messages?: ChatMessage[];
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

  // Transcript aplati (l'agent reçoit tout l'historique à chaque tour, comme avant).
  const transcript = messages
    .map((m) => `${m.role === "user" ? "Utilisateur" : "Lia"} : ${m.content}`)
    .join("\n\n");
  const prompt = `${transcript}\n\nContinue l'entretien de découverte.`;

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

        const agent = getDiscoveryAgent();
        // La mémoire conversationnelle Mastra (working memory + recall) n'est
        // activée que si le client fournit un `conversationId` stable. Sans id
        // (front actuel, qui renvoie tout l'historique), on garde le comportement
        // sans persistance — pas de régression.
        // maxSteps:5 = parité avec l'ancien maxTurns:5 (enrichissement + choix + signaux).
        const result = await agent.stream(
          prompt,
          conversationId
            ? { maxSteps: 5, memory: { resource: "discovery", thread: conversationId } }
            : { maxSteps: 5 }
        );

        // 1) Stream du texte en temps réel -> events `message`
        let assembled = "";
        for await (const delta of result.textStream) {
          if (delta) {
            assembled += delta;
            sendEvent("message", { text: delta });
          }
        }

        // 2) Résultat agrégé : tool-calls, texte final, usage
        const full = await result.getFullOutput();
        const toolCalls = (full.toolCalls ?? []) as unknown as LooseToolCall[];

        let pendingChoices: { question: string; choices: ChoiceOption[] } | null = null;
        let interviewComplete = false;
        let fastTrackComplete = false;
        let fastTrackSummary: string | null = null;
        for (const tc of toolCalls) {
          const { name, args } = readToolCall(tc);
          if (name === "present_choices") {
            pendingChoices = {
              question: String(args.question ?? ""),
              choices: (args.choices as ChoiceOption[]) ?? [],
            };
          } else if (name === "signal_interview_complete") {
            interviewComplete = true;
          } else if (name === "signal_fast_track_complete") {
            fastTrackComplete = true;
            fastTrackSummary = typeof args.summary === "string" ? args.summary : null;
          }
        }

        const usage = full.usage as { totalTokens?: number } | undefined;
        sendEvent("success", {
          result: full.text || assembled,
          cost: usage?.totalTokens ?? null,
          turns: full.steps?.length ?? 1,
        });

        if (pendingChoices) {
          sendEvent("choices", pendingChoices);
        }

        // Fin de la phase Fast Track (consommé par le front pour basculer de phase).
        if (fastTrackComplete) {
          sendEvent("fast_track_complete", {
            timestamp: new Date().toISOString(),
            summary: fastTrackSummary,
          });
        }

        // Fin de l'entretien complet (Deep Dive).
        if (interviewComplete) {
          sendEvent("discovery_complete", { timestamp: new Date().toISOString() });
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
