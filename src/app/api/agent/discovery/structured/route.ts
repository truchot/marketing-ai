import { NextRequest, NextResponse } from "next/server";
import { query } from "@anthropic-ai/claude-agent-sdk";
import {
  getDiscoverySystemPrompt,
  businessDiscoverySchema,
  isBusinessDiscovery,
} from "@/agents/discovery";

export const runtime = "nodejs";
export const maxDuration = 300;

// POST /api/agent/discovery/structured
// Takes the full interview transcript and produces the BusinessDiscovery JSON
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { transcript } = body;

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

  const systemPrompt = `${getDiscoverySystemPrompt()}

## Mode: Structured Output

Tu recois la transcription complete d'un entretien de decouverte.
Analyse-la et produis l'objet BusinessDiscovery complet au format JSON.
Remplis TOUS les champs en te basant sur les informations de l'entretien.
Les informations manquantes doivent etre ajoutees dans metadata.gaps.`;

  try {
    const result = query({
      prompt: transcript,
      options: {
        model: "claude-sonnet-4-5-20250929",
        systemPrompt,
        permissionMode: "bypassPermissions",
        allowDangerouslySkipPermissions: true,
        tools: [],
        maxTurns: 1,
        outputFormat: {
          type: "json_schema",
          schema: businessDiscoverySchema,
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

    if (!structuredOutput || !isBusinessDiscovery(structuredOutput)) {
      return NextResponse.json(
        { error: "Failed to produce structured output" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { discovery: structuredOutput },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
