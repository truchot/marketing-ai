// ============================================================
// Mappings SDK Claude -> AI SDK (usage, finishReason, metadata, JSON)
// Cible l'interface LanguageModelV3 (@ai-sdk/provider v3 / AI SDK v6).
// ============================================================

import type {
  LanguageModelV3CallOptions,
  LanguageModelV3FinishReason,
  LanguageModelV3Usage,
  SharedV3ProviderMetadata,
  SharedV3Warning,
} from "@ai-sdk/provider";
import type { AnthropicUsage } from "./anthropic-types";

/** Forme minimale du message `result` du SDK qu'on consomme. */
export interface SdkResultLike {
  type: "result";
  subtype:
    | "success"
    | "error_max_turns"
    | "error_during_execution"
    | "error_max_budget_usd"
    | "error_max_structured_output_retries";
  result?: string;
  total_cost_usd?: number;
  usage?: AnthropicUsage;
  modelUsage?: Record<string, unknown>;
  structured_output?: unknown;
  stop_reason?: string | null;
  num_turns?: number;
  session_id?: string;
}

export function mapUsage(u?: AnthropicUsage): LanguageModelV3Usage {
  const input = u?.input_tokens;
  const output = u?.output_tokens;
  const cacheRead = u?.cache_read_input_tokens;
  const cacheWrite = u?.cache_creation_input_tokens;
  return {
    inputTokens: { total: input, noCache: input, cacheRead, cacheWrite },
    outputTokens: { total: output, text: output, reasoning: undefined },
  };
}

type Unified = LanguageModelV3FinishReason["unified"];

export function mapStopReason(sr?: string | null): LanguageModelV3FinishReason {
  let unified: Unified;
  switch (sr) {
    case "end_turn":
    case "stop_sequence":
      unified = "stop";
      break;
    case "max_tokens":
      unified = "length";
      break;
    case "tool_use":
      unified = "tool-calls";
      break;
    case "refusal":
      unified = "content-filter";
      break;
    default:
      unified = "stop";
  }
  return { unified, raw: sr ?? undefined };
}

/**
 * finishReason final, en tenant compte de la réinterprétation des
 * sous-types d'erreur quand un tool-call a été capturé (deny+interrupt
 * sous maxTurns:1).
 */
export function finishFromResult(
  result: SdkResultLike | undefined,
  hasToolCalls: boolean
): LanguageModelV3FinishReason {
  if (hasToolCalls) return { unified: "tool-calls", raw: result?.subtype };
  if (!result) return { unified: "stop", raw: undefined };
  if (result.subtype === "success") return mapStopReason(result.stop_reason);
  if (result.subtype === "error_max_turns") return { unified: "length", raw: result.subtype };
  return { unified: "error", raw: result.subtype };
}

/**
 * Une erreur SDK "dure" (hors interruption volontaire pour capturer un
 * tool-call) doit faire échouer l'appel.
 */
export function isHardError(result: SdkResultLike | undefined, hasToolCalls: boolean): boolean {
  if (!result || hasToolCalls) return false;
  if (result.subtype === "success") return false;
  if (result.subtype === "error_max_turns") return false;
  return true;
}

export function providerMetadata(result?: SdkResultLike): SharedV3ProviderMetadata | undefined {
  if (!result) return undefined;
  return {
    "claude-agent-sdk": {
      totalCostUsd: result.total_cost_usd ?? 0,
      modelUsage: (result.modelUsage ?? {}) as Record<string, never>,
      sessionId: result.session_id ?? null,
      numTurns: result.num_turns ?? 0,
      stopReason: result.stop_reason ?? null,
    },
  } as SharedV3ProviderMetadata;
}

/** Parse tolérant : strip code fences, extrait le premier objet JSON. */
export function tolerantJsonParse(text: string | undefined): unknown {
  if (!text) return undefined;
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return undefined;
      }
    }
    return undefined;
  }
}

/** Avertissements pour les paramètres d'échantillonnage non supportés par query(). */
export function unsupportedSettingWarnings(
  options: LanguageModelV3CallOptions
): SharedV3Warning[] {
  const warnings: SharedV3Warning[] = [];
  const unsupported: (keyof LanguageModelV3CallOptions)[] = [
    "temperature",
    "topP",
    "topK",
    "presencePenalty",
    "frequencyPenalty",
    "stopSequences",
    "seed",
    "maxOutputTokens",
  ];
  for (const setting of unsupported) {
    if (options[setting] != null) {
      warnings.push({
        type: "other",
        message: `Le Claude Agent SDK (query) ne permet pas de régler "${String(setting)}".`,
      });
    }
  }
  return warnings;
}
