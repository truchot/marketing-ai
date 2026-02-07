/**
 * Fakes barrel file.
 *
 * - EpisodicMemoryStore and SemanticMemoryStore from src/data/memory/ are
 *   already proper in-memory implementations with no external dependencies.
 *   They can be instantiated directly in tests as fakes.
 *
 * - FakeConversationRepository and FakeCompanyProfileRepository are standalone
 *   implementations that avoid the module-level singletons used by the
 *   production data layer.
 *
 * - FakeResponseGenerator returns a deterministic string for assertions.
 */
export { EpisodicMemoryStore } from "@/data/memory/episodic-memory";
export { SemanticMemoryStore } from "@/data/memory/semantic-memory";
export { FakeConversationRepository } from "./fake-conversation-repository";
export { FakeCompanyProfileRepository } from "./fake-company-profile-repository";
export { FakeResponseGenerator } from "./fake-response-generator";
