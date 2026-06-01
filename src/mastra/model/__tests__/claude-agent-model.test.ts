import { describe, it, expect, vi, beforeEach } from "vitest";
import type { LanguageModelV3StreamPart } from "@ai-sdk/provider";

// --- Mock du Claude Agent SDK (aucun sous-process / token requis) ---
vi.mock("@anthropic-ai/claude-agent-sdk", () => ({
  query: vi.fn(),
  createSdkMcpServer: vi.fn(() => ({ type: "sdk", name: "mastra-tools", instance: {} })),
  tool: vi.fn((name: string) => ({ name })),
}));

import { query } from "@anthropic-ai/claude-agent-sdk";
import { claudeAgentModel } from "../claude-agent-sdk-model";
import { flattenPrompt } from "../flatten-prompt";
import {
  mapUsage,
  mapStopReason,
  finishFromResult,
  isHardError,
  tolerantJsonParse,
} from "../mapping";
import { buildToolBridge, stripMcpPrefix } from "../tool-bridge";
import { makeStreamTranslator } from "../stream-translation";
import type { RawStreamEvent } from "../anthropic-types";

const queryMock = query as unknown as ReturnType<typeof vi.fn>;

function asyncGen<T>(items: T[]): AsyncGenerator<T> {
  return (async function* () {
    for (const it of items) yield it;
  })();
}

beforeEach(() => {
  queryMock.mockReset();
});

// ============================================================
// flattenPrompt
// ============================================================
describe("flattenPrompt", () => {
  it("collapse system + transcript et rejoue tool-call/result", () => {
    const { systemPrompt, prompt } = flattenPrompt(
      [
        { role: "system", content: "SYS" },
        { role: "user", content: [{ type: "text", text: "Bonjour" }] },
        {
          role: "assistant",
          content: [
            { type: "text", text: "Salut" },
            { type: "tool-call", toolCallId: "t1", toolName: "foo", input: { a: 1 } },
          ],
        },
        {
          role: "tool",
          content: [
            { type: "tool-result", toolCallId: "t1", toolName: "foo", output: { type: "json", value: { ok: true } } },
          ],
        },
      ],
      "APPEND"
    );
    expect(systemPrompt).toBe("SYS\n\nAPPEND");
    expect(prompt).toContain("User: Bonjour");
    expect(prompt).toContain("Assistant: Salut");
    expect(prompt).toContain("Assistant called the tool `foo` with {\"a\":1}");
    expect(prompt).toContain('Result of `foo`: {"ok":true}');
  });

  it("systemPrompt undefined si aucun message system", () => {
    const { systemPrompt } = flattenPrompt([
      { role: "user", content: [{ type: "text", text: "x" }] },
    ]);
    expect(systemPrompt).toBeUndefined();
  });
});

// ============================================================
// mapping
// ============================================================
describe("mapping", () => {
  it("mapUsage mappe les tokens (forme V3)", () => {
    const u = mapUsage({ input_tokens: 10, output_tokens: 5 });
    expect(u.inputTokens.total).toBe(10);
    expect(u.outputTokens.total).toBe(5);
    expect(mapUsage(undefined).inputTokens.total).toBeUndefined();
  });

  it("mapStopReason", () => {
    expect(mapStopReason("end_turn").unified).toBe("stop");
    expect(mapStopReason("max_tokens").unified).toBe("length");
    expect(mapStopReason("tool_use").unified).toBe("tool-calls");
    expect(mapStopReason("refusal").unified).toBe("content-filter");
  });

  it("finishFromResult réinterprète error_max_turns avec tool-call", () => {
    const r = { type: "result", subtype: "error_max_turns" } as const;
    expect(finishFromResult(r, true).unified).toBe("tool-calls");
    expect(finishFromResult(r, false).unified).toBe("length");
    expect(finishFromResult({ type: "result", subtype: "success", stop_reason: "end_turn" }, false).unified).toBe("stop");
  });

  it("isHardError ne déclenche pas sur tool-call ni max_turns", () => {
    expect(isHardError({ type: "result", subtype: "error_during_execution" }, false)).toBe(true);
    expect(isHardError({ type: "result", subtype: "error_during_execution" }, true)).toBe(false);
    expect(isHardError({ type: "result", subtype: "error_max_turns" }, false)).toBe(false);
    expect(isHardError({ type: "result", subtype: "success" }, false)).toBe(false);
  });

  it("tolerantJsonParse extrait le JSON des code fences", () => {
    expect(tolerantJsonParse('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(tolerantJsonParse('blabla {"b":2} fin')).toEqual({ b: 2 });
    expect(tolerantJsonParse("pas de json")).toBeUndefined();
  });
});

// ============================================================
// tool-bridge
// ============================================================
describe("tool-bridge", () => {
  it("stripMcpPrefix retire le préfixe mcp", () => {
    expect(stripMcpPrefix("mcp__mastra-tools__foo")).toBe("foo");
    expect(stripMcpPrefix("foo")).toBe("foo");
  });

  it("canUseTool refuse+interrompt et capture l'appel", async () => {
    const bridge = buildToolBridge([
      {
        type: "function",
        name: "foo",
        description: "desc",
        inputSchema: { type: "object", properties: { a: { type: "number" } } },
      },
    ]);
    expect(bridge).toBeDefined();
    const res = await bridge!.canUseTool(
      "mcp__mastra-tools__foo",
      { a: 1 },
      { signal: new AbortController().signal, toolUseID: "u1" } as never
    );
    expect(res).toMatchObject({ behavior: "deny", interrupt: true });
    expect(bridge!.captured).toMatchObject({ toolName: "foo", input: { a: 1 }, toolUseID: "u1" });
  });

  it("retourne undefined sans tools fonction", () => {
    expect(buildToolBridge([])).toBeUndefined();
    expect(buildToolBridge(undefined)).toBeUndefined();
  });
});

// ============================================================
// stream-translation
// ============================================================
describe("makeStreamTranslator", () => {
  it("traduit texte streamé", () => {
    const parts: LanguageModelV3StreamPart[] = [];
    const t = makeStreamTranslator((p) => parts.push(p));
    const events: RawStreamEvent[] = [
      { type: "message_start", message: { usage: { input_tokens: 3 } } },
      { type: "content_block_start", index: 0, content_block: { type: "text" } },
      { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "Hel" } },
      { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "lo" } },
      { type: "content_block_stop", index: 0 },
      { type: "message_delta", delta: { stop_reason: "end_turn" }, usage: { output_tokens: 2 } },
    ];
    events.forEach((e) => t.handleEvent(e));
    t.finish({ type: "result", subtype: "success", stop_reason: "end_turn" });

    const types = parts.map((p) => p.type);
    expect(types).toEqual(["stream-start", "text-start", "text-delta", "text-delta", "text-end", "finish"]);
    const deltas = parts.filter((p) => p.type === "text-delta").map((p) => (p as { delta: string }).delta);
    expect(deltas.join("")).toBe("Hello");
    const finish = parts.find((p) => p.type === "finish") as unknown as { finishReason: { unified: string } };
    expect(finish.finishReason.unified).toBe("stop");
  });

  it("traduit un tool_use streamé en tool-call", () => {
    const parts: LanguageModelV3StreamPart[] = [];
    const t = makeStreamTranslator((p) => parts.push(p));
    const events: RawStreamEvent[] = [
      { type: "content_block_start", index: 0, content_block: { type: "tool_use", id: "tu1", name: "mcp__mastra-tools__foo" } },
      { type: "content_block_delta", index: 0, delta: { type: "input_json_delta", partial_json: '{"a":' } },
      { type: "content_block_delta", index: 0, delta: { type: "input_json_delta", partial_json: "1}" } },
      { type: "content_block_stop", index: 0 },
    ];
    events.forEach((e) => t.handleEvent(e));
    t.finish({ type: "result", subtype: "error_max_turns" });

    const call = parts.find((p) => p.type === "tool-call") as { toolName: string; input: string; toolCallId: string };
    expect(call.toolName).toBe("foo");
    expect(call.toolCallId).toBe("tu1");
    expect(call.input).toBe('{"a":1}');
    const finish = parts.find((p) => p.type === "finish") as unknown as { finishReason: { unified: string } };
    expect(finish.finishReason.unified).toBe("tool-calls");
  });
});

// ============================================================
// doGenerate / doStream (query mocké)
// ============================================================
describe("ClaudeAgentLanguageModel.doGenerate", () => {
  const model = claudeAgentModel("claude-haiku-4-5-20251001", { oauthToken: "test-token" });

  it("texte simple", async () => {
    queryMock.mockReturnValue(
      asyncGen([
        { type: "assistant", message: { content: [{ type: "text", text: "Bonjour" }] } },
        { type: "result", subtype: "success", result: "Bonjour", usage: { input_tokens: 10, output_tokens: 5 }, total_cost_usd: 0.001, stop_reason: "end_turn", session_id: "s1" },
      ])
    );
    const res = await model.doGenerate({
      prompt: [{ role: "user", content: [{ type: "text", text: "Salut" }] }],
    });
    expect(res.content).toEqual([{ type: "text", text: "Bonjour" }]);
    expect(res.finishReason.unified).toBe("stop");
    expect(res.usage.inputTokens.total).toBe(10);
    expect(res.providerMetadata?.["claude-agent-sdk"]?.totalCostUsd).toBe(0.001);
  });

  it("surface un tool_use (maxTurns:1 + error_max_turns) en tool-call", async () => {
    queryMock.mockReturnValue(
      asyncGen([
        { type: "assistant", message: { content: [{ type: "tool_use", id: "tu1", name: "mcp__mastra-tools__foo", input: { a: 1 } }] } },
        { type: "result", subtype: "error_max_turns" },
      ])
    );
    const res = await model.doGenerate({
      prompt: [{ role: "user", content: [{ type: "text", text: "Appelle foo" }] }],
      tools: [
        { type: "function", name: "foo", description: "", inputSchema: { type: "object", properties: { a: { type: "number" } } } },
      ],
    });
    expect(res.finishReason.unified).toBe("tool-calls");
    const toolCall = res.content.find((c) => c.type === "tool-call") as { toolName: string; input: string };
    expect(toolCall.toolName).toBe("foo");
    expect(JSON.parse(toolCall.input)).toEqual({ a: 1 });
  });

  it("structured output via responseFormat json", async () => {
    queryMock.mockReturnValue(
      asyncGen([
        { type: "result", subtype: "success", structured_output: { city: "Paris", ok: true }, usage: { input_tokens: 4, output_tokens: 6 } },
      ])
    );
    const res = await model.doGenerate({
      prompt: [{ role: "user", content: [{ type: "text", text: "extrait" }] }],
      responseFormat: { type: "json", schema: { type: "object" } },
    });
    expect(res.finishReason.unified).toBe("stop");
    const text = (res.content[0] as { text: string }).text;
    expect(JSON.parse(text)).toEqual({ city: "Paris", ok: true });
  });

  it("émet un warning pour temperature non supportée", async () => {
    queryMock.mockReturnValue(
      asyncGen([{ type: "result", subtype: "success", result: "ok", usage: {} }])
    );
    const res = await model.doGenerate({
      prompt: [{ role: "user", content: [{ type: "text", text: "x" }] }],
      temperature: 0.7,
    });
    expect(res.warnings?.some((w) => w.type === "other")).toBe(true);
  });

  it("lève sur erreur dure", async () => {
    queryMock.mockReturnValue(
      asyncGen([{ type: "result", subtype: "error_during_execution" }])
    );
    await expect(
      model.doGenerate({ prompt: [{ role: "user", content: [{ type: "text", text: "x" }] }] })
    ).rejects.toThrow();
  });
});

describe("ClaudeAgentLanguageModel.doStream", () => {
  const model = claudeAgentModel("claude-haiku-4-5-20251001", { oauthToken: "test-token" });

  it("streame des text-delta puis finish", async () => {
    queryMock.mockReturnValue(
      asyncGen([
        { type: "stream_event", event: { type: "content_block_start", index: 0, content_block: { type: "text" } } },
        { type: "stream_event", event: { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "Hi" } } },
        { type: "stream_event", event: { type: "content_block_stop", index: 0 } },
        { type: "result", subtype: "success", stop_reason: "end_turn", usage: { input_tokens: 1, output_tokens: 1 } },
      ])
    );
    const { stream } = await model.doStream({
      prompt: [{ role: "user", content: [{ type: "text", text: "salut" }] }],
    });
    const parts: LanguageModelV3StreamPart[] = [];
    const reader = stream.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      parts.push(value);
    }
    const text = parts.filter((p) => p.type === "text-delta").map((p) => (p as { delta: string }).delta).join("");
    expect(text).toBe("Hi");
    expect(parts.some((p) => p.type === "finish")).toBe(true);
  });
});
