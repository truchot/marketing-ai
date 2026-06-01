// ============================================================
// Workflow Mastra "onboarding" : extraction structurée -> persistance.
//
//   extract (agent structuredOutput) -> persist (use-case DDD existant)
//
// Frontière "Mastra orchestre, le domaine exécute" : le step `persist`
// appelle CompleteOnboardingUseCase sans le modifier.
//
// Import des dépendances par chemin direct (pas via @/mastra/index) pour
// éviter un cycle d'import (index importe ce workflow). Voir [[mastra-migration]].
// ============================================================

import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { discoveryExtractionAgent } from "@/mastra/agents/discovery-agent";
import { businessDiscoveryZodSchema } from "@/mastra/schemas/business-discovery";
import { isBusinessDiscovery } from "@/agents/discovery";
import { completeOnboardingUseCase } from "@/infrastructure/composition-root";
import type { BusinessDiscovery } from "@/types/business-discovery";

export const ONBOARDING_WORKFLOW_ID = "onboarding";

const inputSchema = z.object({ transcript: z.string() });
const persistOutputSchema = z.object({
  success: z.boolean(),
  profileId: z.string(),
  discoveryId: z.string(),
  companyName: z.string(),
});

const extractStep = createStep({
  id: "extract",
  description: "Extrait l'objet BusinessDiscovery structuré depuis la transcription.",
  inputSchema,
  outputSchema: businessDiscoveryZodSchema,
  execute: async ({ inputData }) => {
    const res = await discoveryExtractionAgent.generate(inputData.transcript, {
      structuredOutput: { schema: businessDiscoveryZodSchema },
    });
    const discovery = (res as { object?: unknown }).object;
    if (!discovery || !isBusinessDiscovery(discovery)) {
      throw new Error("Extraction structurée impossible.");
    }
    return discovery;
  },
});

const persistStep = createStep({
  id: "persist",
  description: "Persiste la découverte via le use-case d'onboarding (domaine DDD).",
  inputSchema: businessDiscoveryZodSchema,
  outputSchema: persistOutputSchema,
  execute: async ({ inputData }) => {
    const result = completeOnboardingUseCase.execute(inputData as BusinessDiscovery, []);
    if (result.isErr()) {
      throw new Error(result.error.message);
    }
    const profile = result.value;
    return {
      success: true,
      profileId: profile.id,
      discoveryId: profile.discoveryId ?? "",
      companyName: profile.name,
    };
  },
});

export const onboardingWorkflow = createWorkflow({
  id: ONBOARDING_WORKFLOW_ID,
  inputSchema,
  outputSchema: persistOutputSchema,
})
  .then(extractStep)
  .then(persistStep)
  .commit();
