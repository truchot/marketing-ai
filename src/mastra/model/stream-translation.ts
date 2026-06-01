// ============================================================
// Traduction des events de streaming Anthropic bruts
// (RawMessageStreamEvent) -> LanguageModelV2StreamPart (AI SDK).
// ============================================================

import type { LanguageModelV3StreamPart } from "@ai-sdk/provider";
import type { AnthropicUsage, RawStreamEvent } from "./anthropic-types";
import { mapUsage } from "./mapping";
import { stripMcpPrefix } from "./tool-bridge";
import type { SdkResultLike } from "./mapping";
import { finishFromResult, mapStopReason, providerMetadata } from "./mapping";

type Emit = (part: LanguageModelV3StreamPart) => void;

type BlockState =
  | { kind: "text"; id: string }
  | { kind: "tool"; id: string; toolName: string; toolUseId: string; jsonBuf: string };

export interface StreamTranslator {
  handleEvent(ev: RawStreamEvent): void;
  finish(result: SdkResultLike | undefined): void;
}

export function makeStreamTranslator(emit: Emit): StreamTranslator {
  const blocks = new Map<number, BlockState>();
  let sawToolCall = false;
  let lastStopReason: string | null | undefined;
  const usageAcc: AnthropicUsage = {};

  emit({ type: "stream-start", warnings: [] });

  return {
    handleEvent(ev: RawStreamEvent) {
      switch (ev.type) {
        case "message_start": {
          const u = (ev as { message?: { usage?: AnthropicUsage } }).message?.usage;
          if (u?.input_tokens != null) usageAcc.input_tokens = u.input_tokens;
          break;
        }
        case "content_block_start": {
          const e = ev as {
            index: number;
            content_block: { type: string; id?: string; name?: string };
          };
          const cb = e.content_block;
          if (cb.type === "text") {
            const id = `txt-${e.index}`;
            blocks.set(e.index, { kind: "text", id });
            emit({ type: "text-start", id });
          } else if (cb.type === "tool_use") {
            sawToolCall = true;
            const id = `tool-${e.index}`;
            const toolName = stripMcpPrefix(cb.name ?? "");
            blocks.set(e.index, { kind: "tool", id, toolName, toolUseId: cb.id ?? id, jsonBuf: "" });
            emit({ type: "tool-input-start", id, toolName });
          }
          break;
        }
        case "content_block_delta": {
          const e = ev as {
            index: number;
            delta: { type: string; text?: string; partial_json?: string };
          };
          const st = blocks.get(e.index);
          if (!st) break;
          if (e.delta.type === "text_delta" && st.kind === "text") {
            emit({ type: "text-delta", id: st.id, delta: e.delta.text ?? "" });
          } else if (e.delta.type === "input_json_delta" && st.kind === "tool") {
            const chunk = e.delta.partial_json ?? "";
            st.jsonBuf += chunk;
            emit({ type: "tool-input-delta", id: st.id, delta: chunk });
          }
          break;
        }
        case "content_block_stop": {
          const e = ev as { index: number };
          const st = blocks.get(e.index);
          if (!st) break;
          if (st.kind === "text") {
            emit({ type: "text-end", id: st.id });
          } else {
            emit({ type: "tool-input-end", id: st.id });
            emit({
              type: "tool-call",
              toolCallId: st.toolUseId,
              toolName: st.toolName,
              input: st.jsonBuf || "{}",
            });
          }
          blocks.delete(e.index);
          break;
        }
        case "message_delta": {
          const e = ev as { delta?: { stop_reason?: string | null }; usage?: AnthropicUsage };
          if (e.usage?.output_tokens != null) usageAcc.output_tokens = e.usage.output_tokens;
          if (e.delta?.stop_reason !== undefined) lastStopReason = e.delta.stop_reason;
          break;
        }
        default:
          break;
      }
    },

    finish(result: SdkResultLike | undefined) {
      const usage = mapUsage(result?.usage ?? usageAcc);
      let finishReason = finishFromResult(result, sawToolCall);
      // Si le SDK n'a pas renvoyé de result exploitable, retomber sur le stop_reason streamé.
      if (!result && !sawToolCall && lastStopReason !== undefined) {
        finishReason = mapStopReason(lastStopReason);
      }
      emit({
        type: "finish",
        finishReason,
        usage,
        providerMetadata: providerMetadata(result),
      });
    },
  };
}
