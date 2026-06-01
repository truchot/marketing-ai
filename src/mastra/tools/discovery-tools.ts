// ============================================================
// Discovery tools for the Mastra agent.
//
// Converts the 6 SDK tools (former tool-definitions.ts) into Mastra
// createTool. The business logic is REUSED by importing from
// src/tools/discovery/index.ts — nothing is rewritten here.
//
// Flow control (present_choices / signal_interview_complete) is
// detected by the route via the stream's tool-calls; these two tools
// therefore simply acknowledge receipt.
// ============================================================

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import {
  saveDiscoveryBlock,
  enrichFromWebsite,
  checkCompetitors,
  suggestQuestions,
} from "@/tools/discovery";

const saveDiscoveryBlockTool = createTool({
  id: "saveDiscoveryBlock",
  description: `Persists a validated discovery block into the system's episodic memory.

WHEN TO USE IT:
- After completing an interview block (problem/value, audience, marketing, business)
- When the interlocutor has validated the block's summary
- To prevent information loss on long conversations

IMPORTANT: Always ask the interlocutor for validation before saving with validatedBy=true.`,
  inputSchema: z.object({
    blockNumber: z.number().int().min(1).max(4).describe("Block number (1-4)"),
    blockName: z
      .enum(["problem_value", "audience", "marketing_landscape", "business_context"])
      .describe("Technical name of the block"),
    data: z.record(z.string(), z.unknown()).describe("Partial BusinessDiscovery data for this block"),
    validatedBy: z
      .boolean()
      .describe("Has the interlocutor validated this summary? true = validated, false = draft"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    episodeId: z.string(),
  }),
  execute: async (inputData) =>
    saveDiscoveryBlock({
      blockNumber: inputData.blockNumber as 1 | 2 | 3 | 4,
      blockName: inputData.blockName,
      data: inputData.data,
      validatedBy: inputData.validatedBy,
    }),
});

const enrichFromWebsiteTool = createTool({
  id: "enrichFromWebsite",
  description: `Enriches the discovery by analyzing the company's website.

The tool analyzes the site and RETURNS the insights (value proposition, offerings, audience, social proof, content, pricing, etc.) so that you can pre-fill the answers and avoid redundant questions.

WHEN TO USE IT:
- As soon as the interlocutor provides a website URL
- Call it ONLY ONCE per URL

IMPORTANT:
- Leverage the returned insights to speed up the interview (Fast Track)`,
  inputSchema: z.object({
    websiteUrl: z.string().url().describe("Full website URL (e.g. https://example.com)"),
    companyName: z.string().optional().describe("Company name (optional, improves the analysis)"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    insights: z.record(z.string(), z.unknown()).nullable(),
  }),
  execute: async (inputData) =>
    enrichFromWebsite({
      websiteUrl: inputData.websiteUrl,
      companyName: inputData.companyName,
    }),
});

const checkCompetitorsTool = createTool({
  id: "checkCompetitors",
  description: `Quick analysis of the competitors mentioned by the interlocutor.

WHEN TO USE IT:
- When the interlocutor mentions specific competitors
- A maximum of 3 competitors analyzed (speed limit)

MODEL: Claude Haiku (fast and cost-effective). Surface-level analysis only.`,
  inputSchema: z.object({
    competitorUrls: z.array(z.string().url()).optional().describe("URLs of the competitor sites (max 3 recommended)"),
    competitorNames: z.array(z.string()).optional().describe("Names of competitors without a URL (will return a placeholder)"),
  }),
  outputSchema: z.object({
    competitors: z.array(
      z.object({
        name: z.string(),
        url: z.string().optional(),
        positioning: z.string(),
        channels: z.array(z.string()),
        pricingSignals: z.string(),
      })
    ),
    error: z.string().optional(),
  }),
  execute: async (inputData) =>
    checkCompetitors({
      competitorUrls: inputData.competitorUrls,
      competitorNames: inputData.competitorNames,
    }),
});

const suggestQuestionsTool = createTool({
  id: "suggestQuestions",
  description: `Suggests the next relevant questions based on the sector and the progress.

WHEN TO USE IT:
- For contextual guidance during the interview
- When the agent needs inspiration to dig deeper into a block

SUPPORTED SECTORS: saas, ecommerce, agency, startup, other.
The suggested questions are guides, not rigid scripts.`,
  inputSchema: z.object({
    sector: z
      .enum(["saas", "ecommerce", "agency", "startup", "other"])
      .describe("Sector of the company"),
    completedBlocks: z.array(z.number().int()).describe("Numbers of the blocks already completed (e.g. [1, 2])"),
    currentBlockData: z
      .record(z.string(), z.unknown())
      .optional()
      .describe("Partial data of the current block (optional)"),
  }),
  outputSchema: z.object({
    nextQuestions: z.array(z.string()),
    reasoning: z.string(),
  }),
  execute: async (inputData) =>
    suggestQuestions({
      sector: inputData.sector,
      completedBlocks: inputData.completedBlocks,
      currentBlockData: inputData.currentBlockData,
    }),
});

const signalFastTrackCompleteTool = createTool({
  id: "signal_fast_track_complete",
  description: `Call this tool when the Fast Track phase is complete — that is, when you have collected: name, sector, main problem, main audience, priority objective, and the company's stage (some via the website, others via the questions).

IMPORTANT: Include a structured summary of what you already know. This summary will be used to generate the first recommendations.

Call this tool BEFORE offering the choice "go deeper or see the recommendations".`,
  inputSchema: z.object({
    summary: z
      .string()
      .describe("Structured summary: context in 3 lines, quick strategic hypotheses, identified gaps"),
  }),
  outputSchema: z.object({ acknowledged: z.boolean() }),
  execute: async () => ({ acknowledged: true }),
});

const signalInterviewCompleteTool = createTool({
  id: "signal_interview_complete",
  description:
    "Call this tool when the full discovery interview (Deep Dive) is complete and you have covered the 4 blocks (problem/value proposition, audiences, current marketing, business context). Call it together with your closing message.",
  inputSchema: z.object({}),
  outputSchema: z.object({ acknowledged: z.boolean() }),
  execute: async () => ({ acknowledged: true }),
});

const presentChoicesTool = createTool({
  id: "present_choices",
  description:
    "Use this tool when you ask a closed-choice question (e.g. business sector, urgency level). Instead of writing the options in your text message, call this tool to display a clear selection interface. Do NOT include the options in your text. You can write a short introductory text before calling the tool.",
  inputSchema: z.object({
    question: z.string().describe("The question asked to the user"),
    choices: z
      .array(
        z.object({
          value: z.string().describe("Technical identifier of the choice (e.g. saas)"),
          label: z.string().describe("Displayed label (e.g. SaaS)"),
          description: z.string().optional().describe("Optional short description"),
        })
      )
      .describe("The proposed options"),
  }),
  outputSchema: z.object({ presented: z.boolean() }),
  execute: async () => ({ presented: true }),
});

export const discoveryTools = {
  saveDiscoveryBlock: saveDiscoveryBlockTool,
  enrichFromWebsite: enrichFromWebsiteTool,
  checkCompetitors: checkCompetitorsTool,
  suggestQuestions: suggestQuestionsTool,
  signal_fast_track_complete: signalFastTrackCompleteTool,
  signal_interview_complete: signalInterviewCompleteTool,
  present_choices: presentChoicesTool,
};
