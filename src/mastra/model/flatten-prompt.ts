// ============================================================
// Aplatissement du prompt AI SDK (LanguageModelV2Prompt) vers le
// format accepté par query() du Claude Agent SDK.
//
// query() n'accepte en entrée que des messages *user* (string ou
// AsyncIterable<SDKUserMessage>). On collapse donc tout l'historique
// AI SDK en (systemPrompt: string, prompt: string) :
//  - messages `system`  -> systemPrompt
//  - messages user/assistant/tool -> transcript texte unique
//    (les tool-calls et tool-results sont rejoués textuellement,
//     l'input étant user-only on ne peut pas rejouer de bloc natif).
// ============================================================

import type { LanguageModelV3Prompt } from "@ai-sdk/provider";

export interface FlattenedPrompt {
  systemPrompt: string | undefined;
  prompt: string;
}

type Msg = LanguageModelV3Prompt[number];
type UserOrAssistantContent = Extract<Msg, { role: "user" | "assistant" }>["content"];

function textOfParts(content: UserOrAssistantContent): string {
  const out: string[] = [];
  for (const part of content) {
    if (part.type === "text") out.push(part.text);
    // file/reasoning parts ne sont pas transmis via le canal user-only
  }
  return out.join("\n");
}

function stringifyToolOutput(output: unknown): string {
  // LanguageModelV2ToolResultOutput : { type: 'text'|'json'|'error-text'|'error-json'|'content', value/... }
  const o = output as { type?: string; value?: unknown };
  if (o && (o.type === "text" || o.type === "error-text") && typeof o.value === "string") {
    return o.value;
  }
  if (o && (o.type === "json" || o.type === "error-json")) {
    return JSON.stringify(o.value);
  }
  return JSON.stringify(output);
}

/**
 * @param systemAppend Texte additionnel concaténé au systemPrompt (optionnel).
 */
export function flattenPrompt(
  prompt: LanguageModelV3Prompt,
  systemAppend?: string
): FlattenedPrompt {
  const systemParts: string[] = [];
  const convo: string[] = [];

  for (const msg of prompt) {
    if (msg.role === "system") {
      systemParts.push(msg.content);
      continue;
    }
    if (msg.role === "user") {
      convo.push(`User: ${textOfParts(msg.content)}`);
      continue;
    }
    if (msg.role === "assistant") {
      for (const part of msg.content) {
        if (part.type === "text") {
          convo.push(`Assistant: ${part.text}`);
        } else if (part.type === "tool-call") {
          convo.push(
            `Assistant called the tool \`${part.toolName}\` with ${JSON.stringify(part.input)}.`
          );
        }
      }
      continue;
    }
    if (msg.role === "tool") {
      for (const part of msg.content) {
        if (part.type === "tool-result") {
          convo.push(`Result of \`${part.toolName}\`: ${stringifyToolOutput(part.output)}`);
        }
      }
    }
  }

  if (systemAppend) systemParts.push(systemAppend);

  return {
    systemPrompt: systemParts.length ? systemParts.join("\n\n") : undefined,
    prompt: convo.join("\n\n"),
  };
}
