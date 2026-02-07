import { NextRequest, NextResponse } from "next/server";
import type { Result } from "@/domains/shared";
import type { DomainError } from "@/domains/shared/domain-error";
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

  const result = queryMemoryUseCase.execute({ types, tags, category, limit });
  if (result.isErr()) {
    return NextResponse.json(
      { error: result.error.message },
      { status: 500 }
    );
  }
  return NextResponse.json({ memory: result.value.memory, stats: result.value.stats });
}

type MemoryAction =
  | { action: "addFact"; params: { category: string; fact: string; source: string } }
  | { action: "addPreference"; params: { category: string; key: string; value: string; confidence: "low" | "medium" | "strong" } }
  | { action: "addPattern"; params: { type: string; description: string; trigger: string; outcome: string; recommendation: string } }
  | { action: "addRule"; params: { description: string; domain: string; action: string; confidence: "low" | "medium" | "strong" } }
  | { action: "recordEpisode"; params: { type: "interaction" | "task_result" | "feedback" | "discovery"; description: string; data: Record<string, unknown>; tags: string[]; importance: "low" | "medium" | "high" } }
  | { action: "recordFeedback"; params: { source: string; sentiment: "positive" | "neutral" | "negative"; content: string; taskId?: string } }
  | { action: "startSession"; params: { task: string; objective: string } };

const actionHandlers: Record<string, (params: Record<string, unknown>) => Result<unknown, DomainError>> = {
  addFact: (p) => addClientFactUseCase.execute(p as { category: string; fact: string; source: string }),
  addPreference: (p) => addPreferenceUseCase.execute(p as { category: string; key: string; value: string; confidence: "low" | "medium" | "strong" }),
  addPattern: (p) => addValidatedPatternUseCase.execute(p as { type: string; description: string; trigger: string; outcome: string; recommendation: string }),
  addRule: (p) => addLearnedRuleUseCase.execute(p as { description: string; domain: string; action: string; confidence: "low" | "medium" | "strong" }),
  recordEpisode: (p) => recordEpisodeUseCase.execute(p as { type: "interaction" | "task_result" | "feedback" | "discovery"; description: string; data: Record<string, unknown>; tags: string[]; importance: "low" | "medium" | "high" }),
  recordFeedback: (p) => recordFeedbackUseCase.execute(p as { source: string; sentiment: "positive" | "neutral" | "negative"; content: string; taskId?: string }),
  startSession: (p) => startSessionUseCase.execute(p as { task: string; objective: string }) as Result<unknown, DomainError>,
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as MemoryAction;
  const handler = actionHandlers[body.action];
  if (!handler) {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
  const result = handler(body.params as Record<string, unknown>);
  if (result.isErr()) {
    return NextResponse.json(
      { error: result.error.message },
      { status: result.error.code === "VALIDATION_ERROR" ? 400 : 500 }
    );
  }
  return NextResponse.json({ result: result.value }, { status: 201 });
}
