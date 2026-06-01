// ============================================================
// Types locaux minimaux pour les structures Anthropic consommées
// par l'adaptateur Claude Agent SDK.
//
// Le SDK (@anthropic-ai/claude-agent-sdk) type ces structures via
// des imports de `@anthropic-ai/sdk` qui ne sont pas garantis résolus
// dans notre code (skipLibCheck masque les imports non résolus du SDK).
// On redéclare donc ici, en local, uniquement les champs qu'on lit.
// ============================================================

/** Bloc de contenu d'un message assistant (APIAssistantMessage.content[]). */
export type AnthropicContentBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input?: Record<string, unknown> }
  | { type: "thinking"; thinking?: string };

/** Usage renvoyé sur le message `result` (NonNullableUsage). */
export interface AnthropicUsage {
  input_tokens?: number;
  output_tokens?: number;
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
}

// --- Events de streaming bruts (RawMessageStreamEvent) ---

export interface RawMessageStartEvent {
  type: "message_start";
  message?: { usage?: AnthropicUsage };
}

export interface RawContentBlockStartEvent {
  type: "content_block_start";
  index: number;
  content_block:
    | { type: "text"; text?: string }
    | { type: "tool_use"; id: string; name: string }
    | { type: string; [k: string]: unknown };
}

export interface RawContentBlockDeltaEvent {
  type: "content_block_delta";
  index: number;
  delta:
    | { type: "text_delta"; text: string }
    | { type: "input_json_delta"; partial_json: string }
    | { type: "thinking_delta"; thinking: string }
    | { type: string; [k: string]: unknown };
}

export interface RawContentBlockStopEvent {
  type: "content_block_stop";
  index: number;
}

export interface RawMessageDeltaEvent {
  type: "message_delta";
  delta?: { stop_reason?: string | null };
  usage?: AnthropicUsage;
}

export interface RawMessageStopEvent {
  type: "message_stop";
}

export type RawStreamEvent =
  | RawMessageStartEvent
  | RawContentBlockStartEvent
  | RawContentBlockDeltaEvent
  | RawContentBlockStopEvent
  | RawMessageDeltaEvent
  | RawMessageStopEvent
  | { type: string; [k: string]: unknown };
