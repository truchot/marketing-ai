import { NextRequest, NextResponse } from "next/server";
import { getDiscoveryExtractionAgent } from "@/mastra";
import { isBusinessDiscovery } from "@/agents/discovery";
import { businessDiscoveryZodSchema } from "@/mastra/schemas/business-discovery";

export const runtime = "nodejs";
export const maxDuration = 300;

const STRUCTURED_PREAMBLE = `## Mode: Structured Output

Tu recois la transcription complete d'un entretien de decouverte.
Analyse-la et produis l'objet BusinessDiscovery complet au format JSON.
Remplis TOUS les champs en te basant sur les informations de l'entretien.
Les informations manquantes doivent etre ajoutees dans metadata.gaps.`;

// POST /api/agent/discovery/structured
// Takes the full interview transcript and produces the BusinessDiscovery JSON
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { transcript } = body;

  if (!transcript || typeof transcript !== "string") {
    return NextResponse.json({ error: "Transcript is required" }, { status: 400 });
  }

  if (!process.env.CLAUDE_CODE_OAUTH_TOKEN) {
    return NextResponse.json(
      { error: "CLAUDE_CODE_OAUTH_TOKEN not configured" },
      { status: 500 }
    );
  }

  try {
    const agent = getDiscoveryExtractionAgent();
    const res = await agent.generate(`${STRUCTURED_PREAMBLE}\n\n${transcript}`, {
      structuredOutput: { schema: businessDiscoveryZodSchema },
    });

    // Mastra place l'objet structuré sur `res.object` à l'exécution ; le type
    // ne l'infère pas toujours selon le schéma -> lecture via cast localisé.
    const structured: unknown = (res as { object?: unknown }).object;
    if (!structured || !isBusinessDiscovery(structured)) {
      return NextResponse.json(
        { error: "Failed to produce structured output" },
        { status: 500 }
      );
    }

    return NextResponse.json({ discovery: structured }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
