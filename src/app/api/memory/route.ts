import { NextRequest, NextResponse } from "next/server";
import {
  workingMemory,
  episodicMemory,
  semanticMemory,
  memoryQuery,
} from "@/data/memory";

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

  const result = memoryQuery.query({ types, tags, category, limit });
  const stats = memoryQuery.getStats();

  return NextResponse.json({ memory: result, stats });
}

type MemoryAction =
  | { action: "addFact"; params: { category: string; fact: string; source: string } }
  | { action: "addPreference"; params: { category: string; key: string; value: string; confidence: "low" | "medium" | "strong" } }
  | { action: "addPattern"; params: { type: string; description: string; trigger: string; outcome: string; recommendation: string } }
  | { action: "addRule"; params: { description: string; domain: string; action: string; confidence: "low" | "medium" | "strong" } }
  | { action: "recordEpisode"; params: { type: "interaction" | "task_result" | "feedback" | "discovery"; description: string; data: Record<string, unknown>; tags: string[]; importance: "low" | "medium" | "high" } }
  | { action: "recordFeedback"; params: { source: string; sentiment: "positive" | "neutral" | "negative"; content: string; taskId?: string } }
  | { action: "startSession"; params: { task: string; objective: string } };

export async function POST(request: NextRequest) {
  const body = (await request.json()) as MemoryAction;

  switch (body.action) {
    case "addFact": {
      const { category, fact, source } = body.params;
      const result = semanticMemory.addClientFact(category, fact, source);
      return NextResponse.json({ result }, { status: 201 });
    }
    case "addPreference": {
      const { category, key, value, confidence } = body.params;
      const result = semanticMemory.addPreference(category, key, value, confidence);
      return NextResponse.json({ result }, { status: 201 });
    }
    case "addPattern": {
      const { type, description, trigger, outcome, recommendation } = body.params;
      const result = semanticMemory.addValidatedPattern(type, description, trigger, outcome, recommendation);
      return NextResponse.json({ result }, { status: 201 });
    }
    case "addRule": {
      const { description, domain, action, confidence } = body.params;
      const result = semanticMemory.addLearnedRule(description, domain, action, confidence);
      return NextResponse.json({ result }, { status: 201 });
    }
    case "recordEpisode": {
      const { type, description, data, tags, importance } = body.params;
      const result = episodicMemory.recordEpisode(type, description, data, { tags, importance });
      return NextResponse.json({ result }, { status: 201 });
    }
    case "recordFeedback": {
      const { source, sentiment, content, taskId } = body.params;
      const result = episodicMemory.recordFeedback(source, sentiment, content, taskId);
      return NextResponse.json({ result }, { status: 201 });
    }
    case "startSession": {
      const { task, objective } = body.params;
      workingMemory.startSession(task, objective);
      return NextResponse.json({ result: "session_started" }, { status: 201 });
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
