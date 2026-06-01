import { readFileSync } from "fs";
import { join } from "path";
import type { MarketingStrategy } from "@/types/marketing-strategy";

// Load system prompt from .claude/agents/strategist.md
const PROMPT_PATH = join(process.cwd(), ".claude/agents/strategist.md");

export function getStrategistSystemPrompt(): string {
  return readFileSync(PROMPT_PATH, "utf-8");
}

// JSON Schema for structured output — composed from sub-schemas
// that mirror the TypeScript interfaces in src/types/marketing-strategy.ts
export { marketingStrategySchema } from "./schema";

// Type guard for the structured output
export function isMarketingStrategy(
  data: unknown
): data is MarketingStrategy {
  if (
    typeof data !== "object" ||
    data === null ||
    !("metadata" in data) ||
    !("strategic" in data) ||
    !("tactical" in data) ||
    !("operational" in data) ||
    !("narrativeSummary" in data)
  ) {
    return false;
  }
  const strategic = (data as Record<string, unknown>).strategic;
  const tactical = (data as Record<string, unknown>).tactical;
  return (
    typeof strategic === "object" &&
    strategic !== null &&
    "targetMarket" in strategic &&
    "businessStrategy" in strategic &&
    "feedbackLoop" in strategic &&
    "marketingFoundation" in strategic &&
    "timeHorizon" in strategic &&
    "roadmapValidation" in strategic &&
    typeof tactical === "object" &&
    tactical !== null &&
    "marketingPlan" in tactical &&
    "marketingSystem" in tactical
  );
}
