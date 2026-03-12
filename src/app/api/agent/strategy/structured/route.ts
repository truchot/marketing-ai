import { NextRequest, NextResponse } from "next/server";
import { query } from "@anthropic-ai/claude-agent-sdk";
import {
  getStrategistSystemPrompt,
  marketingStrategySchema,
  isMarketingStrategy,
} from "@/agents/strategist";

export const runtime = "nodejs";
export const maxDuration = 300;

// POST /api/agent/strategy/structured
// Takes the full strategy session transcript + discovery JSON
// and produces the MarketingStrategy JSON
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { transcript, discoveryJson } = body;

  if (!transcript || typeof transcript !== "string") {
    return NextResponse.json(
      { error: "Transcript is required" },
      { status: 400 }
    );
  }

  if (!process.env.CLAUDE_CODE_OAUTH_TOKEN) {
    return NextResponse.json(
      { error: "CLAUDE_CODE_OAUTH_TOKEN not configured" },
      { status: 500 }
    );
  }

  const systemPrompt = `${getStrategistSystemPrompt()}

## Mode: Structured Output

Tu reçois la transcription complète d'une session stratégique ainsi que le BusinessDiscovery source.
Analyse-les et produis l'objet MarketingStrategy complet au format JSON.
Remplis TOUS les champs en te basant sur les informations de la session et du discovery.`;

  const prompt = discoveryJson
    ? `## BusinessDiscovery\n\`\`\`json\n${discoveryJson}\n\`\`\`\n\n## Transcription de la session\n${transcript}`
    : transcript;

  try {
    const result = query({
      prompt,
      options: {
        model: "claude-sonnet-4-5-20250929",
        systemPrompt,
        permissionMode: "bypassPermissions",
        allowDangerouslySkipPermissions: true,
        tools: [],
        maxTurns: 1,
        outputFormat: {
          type: "json_schema",
          schema: marketingStrategySchema,
        },
      },
    });

    let structuredOutput: unknown = null;

    for await (const msg of result) {
      if (msg.type === "result") {
        if (msg.subtype === "success") {
          structuredOutput = msg.structured_output ?? null;
        } else {
          return NextResponse.json(
            { error: msg.errors?.join(", ") || "Agent execution failed" },
            { status: 500 }
          );
        }
      }
    }

    if (!structuredOutput || !isMarketingStrategy(structuredOutput)) {
      return NextResponse.json(
        { error: "Failed to produce structured output" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { strategy: structuredOutput },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
