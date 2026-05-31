// ============================================================
// Adaptateur LanguageModelV2 (Vercel AI SDK) au-dessus de query()
// du Claude Agent SDK.
//
// C'est le SEUL endroit du projet où query() est appelé. Mastra
// orchestre (agents, tools, workflows, memory) ; ce modèle se charge
// d'UNE étape d'inférence par appel.
//
// Auth : CLAUDE_CODE_OAUTH_TOKEN (jamais de clé API Anthropic directe).
// ============================================================

import { query } from "@anthropic-ai/claude-agent-sdk";
import type { Options } from "@anthropic-ai/claude-agent-sdk";
import type {
  LanguageModelV3,
  LanguageModelV3CallOptions,
  LanguageModelV3Content,
  LanguageModelV3StreamPart,
  LanguageModelV3ToolCall,
} from "@ai-sdk/provider";

import type { AnthropicContentBlock } from "./anthropic-types";
import { flattenPrompt } from "./flatten-prompt";
import { buildToolBridge, stripMcpPrefix } from "./tool-bridge";
import { makeStreamTranslator } from "./stream-translation";
import {
  finishFromResult,
  isHardError,
  mapUsage,
  providerMetadata,
  tolerantJsonParse,
  unsupportedSettingWarnings,
  type SdkResultLike,
} from "./mapping";

export interface ClaudeAgentModelDefaults {
  /** Texte additionnel concaténé au systemPrompt issu du prompt AI SDK. */
  systemPromptAppend?: string;
  /** maxTurns utilisé quand AUCUN outil n'est passé (boucle sans outils). Défaut 1. */
  maxTurns?: number;
  /** Override du token OAuth ; défaut process.env.CLAUDE_CODE_OAUTH_TOKEN. */
  oauthToken?: string;
  maxThinkingTokens?: number;
  /** Options query() additionnelles (échappatoire avancée). */
  queryOptions?: Partial<Options>;
}

const PROVIDER = "claude-agent-sdk";

function resolveToken(defaults: ClaudeAgentModelDefaults): string {
  const token = defaults.oauthToken ?? process.env.CLAUDE_CODE_OAUTH_TOKEN;
  if (!token) {
    throw new Error(
      "CLAUDE_CODE_OAUTH_TOKEN manquant : l'adaptateur Claude Agent SDK ne peut pas s'authentifier."
    );
  }
  return token;
}

function bridgeAbort(signal?: AbortSignal): AbortController {
  const ac = new AbortController();
  if (signal) {
    if (signal.aborted) ac.abort(signal.reason);
    else signal.addEventListener("abort", () => ac.abort(signal.reason), { once: true });
  }
  return ac;
}

class ClaudeAgentLanguageModel implements LanguageModelV3 {
  readonly specificationVersion = "v3" as const;
  readonly provider = PROVIDER;
  readonly modelId: string;
  readonly supportedUrls: Record<string, RegExp[]> = {};

  constructor(
    modelId: string,
    private readonly defaults: ClaudeAgentModelDefaults = {}
  ) {
    this.modelId = modelId;
  }

  private buildQuery(options: LanguageModelV3CallOptions, streaming: boolean) {
    const { systemPrompt, prompt } = flattenPrompt(options.prompt, this.defaults.systemPromptAppend);
    const toolBridge = buildToolBridge(options.tools);
    const outputFormat =
      options.responseFormat?.type === "json" && options.responseFormat.schema
        ? { type: "json_schema" as const, schema: options.responseFormat.schema as Record<string, unknown> }
        : undefined;

    const abortController = bridgeAbort(options.abortSignal);
    const token = resolveToken(this.defaults);

    const queryOptions: Options = {
      model: this.modelId,
      ...(systemPrompt ? { systemPrompt } : {}),
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
      tools: [],
      settingSources: [],
      env: { ...process.env, CLAUDE_CODE_OAUTH_TOKEN: token },
      abortController,
      includePartialMessages: streaming,
      maxTurns: toolBridge ? 1 : this.defaults.maxTurns ?? 1,
      ...(toolBridge ? { mcpServers: toolBridge.mcpServers, canUseTool: toolBridge.canUseTool } : {}),
      ...(outputFormat ? { outputFormat } : {}),
      ...(this.defaults.maxThinkingTokens ? { maxThinkingTokens: this.defaults.maxThinkingTokens } : {}),
      ...this.defaults.queryOptions,
    };

    const q = query({ prompt, options: queryOptions });
    return { q, toolBridge, outputFormat, abortController };
  }

  async doGenerate(options: LanguageModelV3CallOptions): Promise<
    Awaited<ReturnType<LanguageModelV3["doGenerate"]>>
  > {
    const warnings = unsupportedSettingWarnings(options);
    const { q, toolBridge, outputFormat } = this.buildQuery(options, false);

    let assistantText = "";
    const assistantToolCalls: LanguageModelV3ToolCall[] = [];
    let result: SdkResultLike | undefined;

    for await (const msg of q) {
      if (msg.type === "assistant") {
        const blocks = (msg.message?.content ?? []) as AnthropicContentBlock[];
        for (const block of blocks) {
          if (block.type === "text") {
            assistantText += block.text;
          } else if (block.type === "tool_use") {
            assistantToolCalls.push({
              type: "tool-call",
              toolCallId: block.id,
              toolName: stripMcpPrefix(block.name),
              input: JSON.stringify(block.input ?? {}),
            });
          }
        }
      } else if (msg.type === "result") {
        result = msg as unknown as SdkResultLike;
        break;
      }
    }

    // Réconciliation tool-calls : message assistant prioritaire, sinon capture canUseTool.
    let toolCalls = assistantToolCalls;
    if (toolCalls.length === 0 && toolBridge?.captured) {
      const c = toolBridge.captured;
      toolCalls = [
        { type: "tool-call", toolCallId: c.toolUseID, toolName: c.toolName, input: JSON.stringify(c.input) },
      ];
    }
    const hasToolCalls = toolCalls.length > 0;

    if (isHardError(result, hasToolCalls)) {
      throw new Error(
        `Claude Agent SDK a échoué (${result?.subtype}).` +
          (result?.result ? ` ${result.result}` : "")
      );
    }

    const content: LanguageModelV3Content[] = [];

    if (outputFormat && result?.subtype === "success") {
      const structured = result.structured_output ?? tolerantJsonParse(result.result);
      content.push({
        type: "text",
        text: typeof structured === "string" ? structured : JSON.stringify(structured ?? null),
      });
    } else {
      const text = assistantText || (result?.subtype === "success" ? result.result ?? "" : "");
      if (text) content.push({ type: "text", text });
      for (const tc of toolCalls) content.push(tc);
    }

    return {
      content,
      finishReason: outputFormat
        ? { unified: "stop" as const, raw: undefined }
        : finishFromResult(result, hasToolCalls),
      usage: mapUsage(result?.usage),
      providerMetadata: providerMetadata(result),
      warnings,
      response: { modelId: this.modelId, id: result?.session_id },
    };
  }

  async doStream(options: LanguageModelV3CallOptions): Promise<
    Awaited<ReturnType<LanguageModelV3["doStream"]>>
  > {
    const warnings = unsupportedSettingWarnings(options);
    const { q } = this.buildQuery(options, true);
    const modelId = this.modelId;

    const stream = new ReadableStream<LanguageModelV3StreamPart>({
      async start(controller) {
        const emit = (part: LanguageModelV3StreamPart) => controller.enqueue(part);
        // Injecter les warnings via le stream-start du translator : on émet d'abord
        // un stream-start avec warnings ici puis on laisse le translator gérer le reste.
        if (warnings.length > 0) {
          controller.enqueue({ type: "stream-start", warnings });
        }
        const translator = makeStreamTranslator((part) => {
          // Eviter un double stream-start si on en a déjà émis un avec warnings.
          if (part.type === "stream-start" && warnings.length > 0) return;
          emit(part);
        });
        let result: SdkResultLike | undefined;
        try {
          for await (const msg of q) {
            if (msg.type === "stream_event") {
              translator.handleEvent((msg as { event: Parameters<typeof translator.handleEvent>[0] }).event);
            } else if (msg.type === "result") {
              result = msg as unknown as SdkResultLike;
              break;
            }
          }
          translator.finish(result);
        } catch (err) {
          controller.enqueue({ type: "error", error: err });
        } finally {
          controller.close();
        }
      },
    });

    return { stream, response: { headers: { "x-model-id": modelId } } };
  }
}

/**
 * Construit un LanguageModelV2 qui route l'inférence via query() du
 * Claude Agent SDK. À passer directement comme `model` d'un Agent Mastra.
 */
export function claudeAgentModel(
  modelId: string,
  defaults?: ClaudeAgentModelDefaults
): LanguageModelV3 {
  return new ClaudeAgentLanguageModel(modelId, defaults);
}
