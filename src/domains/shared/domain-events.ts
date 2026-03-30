// ============================================================
// Shared Kernel - Domain Events
// Simple synchronous event bus for decoupled communication
// between domain modules.
// ============================================================

// --- Typed event payloads ---

export interface EpisodeRecordedPayload {
  episodeId: string;
  type: string;
  tags: string[];
  importance: string;
}

export interface PatternDetectedPayload {
  patternType: string;
  occurrences: number;
}

export interface PatternPromotedPayload {
  patternId: string;
  confidence: string;
}

export interface ClientFactAddedPayload {
  factId: string;
  category: string;
}

export interface PreferenceUpdatedPayload {
  preferenceId: string;
  category: string;
  key: string;
}

export interface FeedbackRecordedPayload {
  feedbackId: string;
  sentiment: string;
}

export interface OnboardingCompletedPayload {
  profileId: string;
  companyName: string;
  discoveryId: string;
}

export interface MessageSentPayload {
  userMessageId: string;
  assistantMessageId: string;
}

export interface StrategyGeneratedPayload {
  strategyId: string;
  companyName: string;
  okrCount: number;
  segmentCount: number;
  hypothesisCount: number;
  campaignCount: number;
  processCount: number;
  taskCount: number;
  maturityScore: number;
}

export interface OKRRemovedPayload {
  okrId: string;
  removedCampaignIds: string[];
}

export interface CompanyProfileUpdatedPayload {
  profileId: string;
  field: string;
  oldValue: string;
  newValue: string;
}

export interface DiscoveryLinkedPayload {
  profileId: string;
  discoveryId: string;
}

// --- Discriminated union of all domain events ---

export type DomainEvent =
  | { readonly type: typeof EPISODE_RECORDED; readonly occurredAt: string; readonly payload: EpisodeRecordedPayload }
  | { readonly type: typeof PATTERN_DETECTED; readonly occurredAt: string; readonly payload: PatternDetectedPayload }
  | { readonly type: typeof PATTERN_PROMOTED; readonly occurredAt: string; readonly payload: PatternPromotedPayload }
  | { readonly type: typeof CLIENT_FACT_ADDED; readonly occurredAt: string; readonly payload: ClientFactAddedPayload }
  | { readonly type: typeof PREFERENCE_UPDATED; readonly occurredAt: string; readonly payload: PreferenceUpdatedPayload }
  | { readonly type: typeof FEEDBACK_RECORDED; readonly occurredAt: string; readonly payload: FeedbackRecordedPayload }
  | { readonly type: typeof ONBOARDING_COMPLETED; readonly occurredAt: string; readonly payload: OnboardingCompletedPayload }
  | { readonly type: typeof MESSAGE_SENT; readonly occurredAt: string; readonly payload: MessageSentPayload }
  | { readonly type: typeof STRATEGY_GENERATED; readonly occurredAt: string; readonly payload: StrategyGeneratedPayload }
  | { readonly type: typeof OKR_REMOVED; readonly occurredAt: string; readonly payload: OKRRemovedPayload }
  | { readonly type: typeof COMPANY_PROFILE_UPDATED; readonly occurredAt: string; readonly payload: CompanyProfileUpdatedPayload }
  | { readonly type: typeof DISCOVERY_LINKED; readonly occurredAt: string; readonly payload: DiscoveryLinkedPayload };

// --- Event type constants ---

export const EPISODE_RECORDED = "EPISODE_RECORDED" as const;
export const PATTERN_DETECTED = "PATTERN_DETECTED" as const;
export const PATTERN_PROMOTED = "PATTERN_PROMOTED" as const;
export const CLIENT_FACT_ADDED = "CLIENT_FACT_ADDED" as const;
export const PREFERENCE_UPDATED = "PREFERENCE_UPDATED" as const;
export const FEEDBACK_RECORDED = "FEEDBACK_RECORDED" as const;
export const ONBOARDING_COMPLETED = "ONBOARDING_COMPLETED" as const;
export const MESSAGE_SENT = "MESSAGE_SENT" as const;
export const STRATEGY_GENERATED = "STRATEGY_GENERATED" as const;
export const OKR_REMOVED = "OKR_REMOVED" as const;
export const COMPANY_PROFILE_UPDATED = "COMPANY_PROFILE_UPDATED" as const;
export const DISCOVERY_LINKED = "DISCOVERY_LINKED" as const;

// --- Event Bus ---

type EventHandler = (event: DomainEvent) => void;

/**
 * Simple synchronous event bus.
 *
 * Handlers are invoked synchronously in subscription order when an event is
 * published. This keeps things predictable and easy to reason about for the
 * current in-memory, single-process architecture.
 */
export class DomainEventBus {
  private handlers: Map<string, EventHandler[]> = new Map();

  subscribe(eventType: string, handler: EventHandler): void {
    const existing = this.handlers.get(eventType) ?? [];
    existing.push(handler);
    this.handlers.set(eventType, existing);
  }

  publish(event: DomainEvent): void {
    const handlers = this.handlers.get(event.type);
    if (handlers) {
      for (const handler of handlers) {
        handler(event);
      }
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}

// --- Singleton instance ---

export const domainEventBus = new DomainEventBus();
