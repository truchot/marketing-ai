// ============================================================
// Composition Root
// The ONLY place where concrete implementations are wired
// to use case constructors. No other file should instantiate
// use cases or import from @/data.
// ============================================================

// --- Concrete implementations (data layer) ---
import {
  episodicMemory,
  semanticMemory,
  workingMemory,
  consolidationPipeline,
  memoryQuery,
} from "@/data/memory";
import { conversationRepository } from "@/data/conversation-repository";
import { companyProfileRepository } from "@/data/company-profile-repository";
import { businessDiscoveryRepository } from "@/data/business-discovery-repository";
import { RandomResponseGenerator } from "@/data/response-generator";

// --- Use case classes (domain layer) ---
import { RecordEpisodeUseCase } from "@/domains/memory/use-cases/record-episode";
import { RecordFeedbackUseCase } from "@/domains/memory/use-cases/record-feedback";
import { QueryMemoryUseCase } from "@/domains/memory/use-cases/query-memory";
import { ConsolidateMemoryUseCase } from "@/domains/memory/use-cases/consolidate-memory";
import { StartSessionUseCase } from "@/domains/memory/use-cases/start-session";
import { AddClientFactUseCase } from "@/domains/memory/use-cases/add-client-fact";
import { AddPreferenceUseCase } from "@/domains/memory/use-cases/add-preference";
import { AddValidatedPatternUseCase } from "@/domains/memory/use-cases/add-validated-pattern";
import { AddLearnedRuleUseCase } from "@/domains/memory/use-cases/add-learned-rule";
import { SendMessageUseCase } from "@/domains/conversation/use-cases/send-message";
import { GetHistoryUseCase } from "@/domains/conversation/use-cases/get-history";
import { GetProfileUseCase } from "@/domains/client-knowledge/use-cases/get-profile";
import { CreateProfileUseCase } from "@/domains/client-knowledge/use-cases/create-profile";
import { CompleteOnboardingUseCase } from "@/domains/onboarding/use-cases/complete-onboarding";

// --- Wire use case instances ---

// Memory
export const recordEpisodeUseCase = new RecordEpisodeUseCase(episodicMemory);
export const recordFeedbackUseCase = new RecordFeedbackUseCase(episodicMemory);
export const queryMemoryUseCase = new QueryMemoryUseCase(memoryQuery);
export const consolidateMemoryUseCase = new ConsolidateMemoryUseCase(
  consolidationPipeline,
  memoryQuery
);
export const startSessionUseCase = new StartSessionUseCase(workingMemory);
export const addClientFactUseCase = new AddClientFactUseCase(semanticMemory);
export const addPreferenceUseCase = new AddPreferenceUseCase(semanticMemory);
export const addValidatedPatternUseCase = new AddValidatedPatternUseCase(
  semanticMemory
);
export const addLearnedRuleUseCase = new AddLearnedRuleUseCase(semanticMemory);

// Conversation
const responseGenerator = new RandomResponseGenerator();
export const sendMessageUseCase = new SendMessageUseCase(
  conversationRepository,
  episodicMemory,
  responseGenerator
);
export const getHistoryUseCase = new GetHistoryUseCase(conversationRepository);

// Client Knowledge
export const getProfileUseCase = new GetProfileUseCase(
  companyProfileRepository
);
export const createProfileUseCase = new CreateProfileUseCase(
  companyProfileRepository
);

// Onboarding
export const completeOnboardingUseCase = new CompleteOnboardingUseCase(
  companyProfileRepository,
  businessDiscoveryRepository,
  semanticMemory,
  conversationRepository
);
