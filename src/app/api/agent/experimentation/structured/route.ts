import { NextRequest, NextResponse } from "next/server";
import { getExperimentationExtractionAgent } from "@/mastra";
import { experimentBacklogSchema, isExperimentBacklog } from "@/agents/growth-strategist";

export const runtime = "nodejs";
export const maxDuration = 300;

const STRUCTURED_PREAMBLE = `## Mode: Structured Output

Tu reçois la stratégie validée (OKR, KR…) et, si disponible, l'intelligence marché.
Produis l'objet ExperimentBacklog complet au format JSON : un tableau \`candidates\`.
Chaque candidat doit être falsifiable (seuil chiffré) et rattaché à un keyResultId.`;

// POST /api/agent/experimentation/structured
// Takes a validated MarketingStrategy (+ optional market intel) and produces
// the weekly experiment backlog (candidates) as structured JSON.
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { strategyJson, companyName, marketIntel } = body;

  if (!strategyJson || typeof strategyJson !== "string") {
    return NextResponse.json({ error: "strategyJson is required" }, { status: 400 });
  }

  if (!process.env.CLAUDE_CODE_OAUTH_TOKEN) {
    return NextResponse.json(
      { error: "CLAUDE_CODE_OAUTH_TOKEN not configured" },
      { status: 500 }
    );
  }

  const sections = [STRUCTURED_PREAMBLE, `## Stratégie\n\`\`\`json\n${strategyJson}\n\`\`\``];
  if (companyName) {
    sections.push(`## Entreprise\n${companyName}`);
  }
  if (marketIntel && typeof marketIntel === "string") {
    sections.push(`## Intelligence marché\n${marketIntel}`);
  }
  const prompt = sections.join("\n\n");

  try {
    const agent = getExperimentationExtractionAgent();
    const res = await agent.generate(prompt, {
      structuredOutput: { schema: experimentBacklogSchema as never },
    });

    const structured: unknown = (res as { object?: unknown }).object;
    if (!structured || !isExperimentBacklog(structured)) {
      return NextResponse.json(
        { error: "Failed to produce structured output" },
        { status: 500 }
      );
    }

    return NextResponse.json({ backlog: structured.candidates }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
