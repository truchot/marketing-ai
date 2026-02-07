import { NextRequest, NextResponse } from "next/server";
import {
  queryMemoryUseCase,
  recordEpisodeUseCase,
  recordFeedbackUseCase,
  startSessionUseCase,
  addClientFactUseCase,
  addPreferenceUseCase,
  addValidatedPatternUseCase,
  addLearnedRuleUseCase,
} from "@/infrastructure/composition-root";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const typesParam = searchParams.get("types");
  const tagsParam = searchParams.get("tags");
  const categoryParam = searchParams.get("category");
  const limitParam = searchParams.get("limit");

  const types = typesParam
    ? (typesParam.split(",") as ("working" | "episodic" | "semantic")[])
    : undefined;
  const tags = tagsParam ? tagsParam.split(",") : undefined;
  const category = categoryParam || undefined;
  const limit = limitParam ? parseInt(limitParam, 10) : undefined;

  const { memory, stats } = queryMemoryUseCase.execute({ types, tags, category, limit });
  return NextResponse.json({ memory, stats });
}

type MemoryAction =
  | { action: "addFact"; params: { category: string; fact: string; source: string } }
  | { action: "addPreference"; params: { category: string; key: string; value: string; confidence: "low" | "medium" | "strong" } }
  | { action: "addPattern"; params: { type: string; description: string; trigger: string; outcome: string; recommendation: string } }
  | { action: "addRule"; params: { description: string; domain: string; action: string; confidence: "low" | "medium" | "strong" } }
  | { action: "recordEpisode"; params: { type: "interaction" | "task_result" | "feedback" | "discovery"; description: string; data: Record<string, unknown>; tags: string[]; importance: "low" | "medium" | "high" } }
  | { action: "recordFeedback"; params: { source: string; sentiment: "positive" | "neutral" | "negative"; content: string; taskId?: string } }
  | { action: "startSession"; params: { task: string; objective: string } };

const actionHandlers: Record<string, (params: Record<string, unknown>) => { result: unknown }> = {
  addFact: (p) => ({ result: addClientFactUseCase.execute(p as { category: string; fact: string; source: string }) }),
  addPreference: (p) => ({ result: addPreferenceUseCase.execute(p as { category: string; key: string; value: string; confidence: "low" | "medium" | "strong" }) }),
  addPattern: (p) => ({ result: addValidatedPatternUseCase.execute(p as { type: string; description: string; trigger: string; outcome: string; recommendation: string }) }),
  addRule: (p) => ({ result: addLearnedRuleUseCase.execute(p as { description: string; domain: string; action: string; confidence: "low" | "medium" | "strong" }) }),
  recordEpisode: (p) => ({ result: recordEpisodeUseCase.execute(p as { type: "interaction" | "task_result" | "feedback" | "discovery"; description: string; data: Record<string, unknown>; tags: string[]; importance: "low" | "medium" | "high" }) }),
  recordFeedback: (p) => ({ result: recordFeedbackUseCase.execute(p as { source: string; sentiment: "positive" | "neutral" | "negative"; content: string; taskId?: string }) }),
  startSession: (p) => { startSessionUseCase.execute(p as { task: string; objective: string }); return { result: "session_started" }; },
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as MemoryAction;
  const handler = actionHandlers[body.action];
  if (!handler) {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
  const { result } = handler(body.params as Record<string, unknown>);
  return NextResponse.json({ result }, { status: 201 });
}
