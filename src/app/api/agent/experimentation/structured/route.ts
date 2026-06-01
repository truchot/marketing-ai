import { NextRequest, NextResponse } from "next/server";
import { query } from "@anthropic-ai/claude-agent-sdk";
import {
  getGrowthStrategistSystemPrompt,
  experimentBacklogSchema,
  isExperimentBacklog,
} from "@/agents/growth-strategist";

export const runtime = "nodejs";
export const maxDuration = 300;

// POST /api/agent/experimentation/structured
// Takes a validated MarketingStrategy (+ optional market intel) and produces
// the weekly experiment backlog (candidates) as structured JSON.
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { strategyJson, companyName, marketIntel } = body;

  if (!strategyJson || typeof strategyJson !== "string") {
    return NextResponse.json(
      { error: "strategyJson is required" },
      { status: 400 }
    );
  }

  if (!process.env.CLAUDE_CODE_OAUTH_TOKEN) {
    return NextResponse.json(
      { error: "CLAUDE_CODE_OAUTH_TOKEN not configured" },
      { status: 500 }
    );
  }

  const systemPrompt = `${getGrowthStrategistSystemPrompt()}

## Mode: Structured Output

Tu reçois la stratégie validée (OKR, KR, actions) et, si disponible, l'intelligence marché.
Produis l'objet ExperimentBacklog complet au format JSON : un tableau \`candidates\`.
Chaque candidat doit être falsifiable (seuil chiffré) et rattaché à un keyResultId.`;

  const sections = [`## Stratégie\n\`\`\`json\n${strategyJson}\n\`\`\``];
  if (companyName) {
    sections.unshift(`## Entreprise\n${companyName}`);
  }
  if (marketIntel && typeof marketIntel === "string") {
    sections.push(`## Intelligence marché\n${marketIntel}`);
  }
  const prompt = sections.join("\n\n");

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
          schema: experimentBacklogSchema,
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

    if (!structuredOutput || !isExperimentBacklog(structuredOutput)) {
      return NextResponse.json(
        { error: "Failed to produce structured output" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { backlog: structuredOutput.candidates },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
