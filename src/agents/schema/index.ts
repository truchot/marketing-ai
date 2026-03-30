// Composable JSON Schema for MarketingStrategy structured output.
// Each sub-schema mirrors the corresponding TypeScript interfaces in src/types/marketing-strategy.ts.

import { strategicLayerSchema } from "./strategic";
import { tacticalLayerSchema } from "./tactical";
import { operationalLayerSchema } from "./operational";

export const marketingStrategySchema: Record<string, unknown> = {
  type: "object",
  required: [
    "metadata",
    "strategic",
    "tactical",
    "operational",
    "constraints",
    "narrativeSummary",
  ],
  properties: {
    metadata: {
      type: "object",
      required: ["companyName", "generatedAt", "discoveryCompletionStatus", "strategyVersion"],
      properties: {
        companyName: { type: "string" },
        generatedAt: { type: "string" },
        discoveryCompletionStatus: { type: "string", enum: ["complete", "partial"] },
        strategyVersion: { type: "number" },
      },
    },
    strategic: strategicLayerSchema,
    tactical: tacticalLayerSchema,
    operational: operationalLayerSchema,
    constraints: {
      type: "object",
      required: ["budgetFit", "teamFit", "adaptations"],
      properties: {
        budgetFit: { type: "boolean" },
        teamFit: { type: "boolean" },
        adaptations: { type: "array", items: { type: "string" } },
      },
    },
    narrativeSummary: { type: "string" },
  },
};
