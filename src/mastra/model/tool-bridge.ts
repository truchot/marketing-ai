// ============================================================
// Pont d'outils : expose les tools AI SDK au modèle via des stubs MCP,
// mais intercepte l'exécution (canUseTool deny+interrupt) pour que
// l'orchestrateur (Mastra) exécute réellement l'outil.
// ============================================================

import { createSdkMcpServer, tool } from "@anthropic-ai/claude-agent-sdk";
import type { CanUseTool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import type {
  LanguageModelV3FunctionTool,
  LanguageModelV3ProviderTool,
} from "@ai-sdk/provider";

export interface CapturedToolCall {
  toolName: string;
  input: Record<string, unknown>;
  toolUseID: string;
}

export interface ToolBridge {
  mcpServers: Record<string, ReturnType<typeof createSdkMcpServer>>;
  canUseTool: CanUseTool;
  readonly captured: CapturedToolCall | undefined;
}

const MCP_SERVER_NAME = "mastra-tools";

/** `mcp__<server>__<tool>` -> `<tool>` */
export function stripMcpPrefix(name: string): string {
  if (name.startsWith("mcp__")) {
    return name.split("__").slice(2).join("__");
  }
  return name;
}

type JsonSchemaObject = { properties?: Record<string, unknown> };

/**
 * Construit une raw shape Zod permissive depuis le JSON Schema d'un tool.
 * L'exactitude n'importe pas (l'exécution est refusée) : on encode juste
 * les clés top-level pour que le modèle connaisse la surface, et on glisse
 * le schéma complet dans la description du tool.
 */
function rawShapeFromJsonSchema(inputSchema: unknown): z.ZodRawShape {
  const schema = inputSchema as JsonSchemaObject;
  const shape: Record<string, z.ZodType> = {};
  if (schema && typeof schema === "object" && schema.properties) {
    for (const [key, prop] of Object.entries(schema.properties)) {
      shape[key] = z.unknown().describe(JSON.stringify(prop));
    }
  }
  // Toujours au moins une clé pour produire un object schema valide côté SDK.
  if (Object.keys(shape).length === 0) {
    shape._ = z.unknown().optional();
  }
  return shape as z.ZodRawShape;
}

type AiTool = LanguageModelV3FunctionTool | LanguageModelV3ProviderTool;

export function buildToolBridge(tools: AiTool[] | undefined): ToolBridge | undefined {
  const functionTools = (tools ?? []).filter(
    (t): t is LanguageModelV3FunctionTool => t.type === "function"
  );
  if (functionTools.length === 0) return undefined;

  const names = new Set(functionTools.map((t) => t.name));
  const capture: { value: CapturedToolCall | undefined } = { value: undefined };

  const sdkTools = functionTools.map((t) =>
    tool(
      t.name,
      `${t.description ?? ""}\n\nJSON Schema: ${JSON.stringify(t.inputSchema)}`,
      rawShapeFromJsonSchema(t.inputSchema),
      // Handler stub : jamais réellement atteint, canUseTool refuse avant.
      async () => ({ content: [{ type: "text" as const, text: "" }] })
    )
  );

  const canUseTool: CanUseTool = async (toolName, input, { toolUseID }) => {
    const bare = stripMcpPrefix(toolName);
    if (names.has(bare) || names.has(toolName)) {
      capture.value = { toolName: bare, input: input as Record<string, unknown>, toolUseID };
      return { behavior: "deny", message: "Outil délégué au runtime hôte (Mastra).", interrupt: true };
    }
    return { behavior: "deny", message: "Outil indisponible." };
  };

  return {
    mcpServers: { [MCP_SERVER_NAME]: createSdkMcpServer({ name: MCP_SERVER_NAME, tools: sdkTools }) },
    canUseTool,
    get captured() {
      return capture.value;
    },
  };
}
