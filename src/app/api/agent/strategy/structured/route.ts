import { NextRequest, NextResponse } from "next/server";
import { getStrategyExtractionAgent } from "@/mastra";
import { marketingStrategySchema, isMarketingStrategy } from "@/agents/strategist";

export const runtime = "nodejs";
export const maxDuration = 300;

const STRUCTURED_PREAMBLE = `## Mode: Structured Output

You receive the complete transcript of a strategy session along with the source BusinessDiscovery.
Analyze them and produce the complete MarketingStrategy object in JSON format.
Fill in ALL fields based on the information from the session and the discovery.`;

// POST /api/agent/strategy/structured
// Takes the full strategy session transcript + discovery JSON
// and produces the MarketingStrategy JSON
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { transcript, discoveryJson } = body;

  if (!transcript || typeof transcript !== "string") {
    return NextResponse.json({ error: "Transcript is required" }, { status: 400 });
  }

  if (!process.env.CLAUDE_CODE_OAUTH_TOKEN) {
    return NextResponse.json(
      { error: "CLAUDE_CODE_OAUTH_TOKEN not configured" },
      { status: 500 }
    );
  }

  const prompt = discoveryJson
    ? `${STRUCTURED_PREAMBLE}\n\n## BusinessDiscovery\n\`\`\`json\n${discoveryJson}\n\`\`\`\n\n## Transcription de la session\n${transcript}`
    : `${STRUCTURED_PREAMBLE}\n\n${transcript}`;

  try {
    const agent = getStrategyExtractionAgent();
    const res = await agent.generate(prompt, {
      // Le schéma d'extraction est un JSON Schema brut (PublicSchema l'accepte).
      structuredOutput: { schema: marketingStrategySchema as never },
    });

    const structured: unknown = (res as { object?: unknown }).object;
    if (!structured || !isMarketingStrategy(structured)) {
      return NextResponse.json(
        { error: "Failed to produce structured output" },
        { status: 500 }
      );
    }

    return NextResponse.json({ strategy: structured }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
