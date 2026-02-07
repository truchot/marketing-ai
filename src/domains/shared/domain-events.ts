// ============================================================
// Shared Kernel - Domain Events
// Simple synchronous event bus for decoupled communication
// between domain modules.
// ============================================================

// --- Event type constants ---

export const EPISODE_RECORDED = "EPISODE_RECORDED" as const;
export const PATTERN_DETECTED = "PATTERN_DETECTED" as const;
export const PATTERN_PROMOTED = "PATTERN_PROMOTED" as const;
export const CLIENT_FACT_ADDED = "CLIENT_FACT_ADDED" as const;
export const PREFERENCE_UPDATED = "PREFERENCE_UPDATED" as const;
export const FEEDBACK_RECORDED = "FEEDBACK_RECORDED" as const;
export const ONBOARDING_COMPLETED = "ONBOARDING_COMPLETED" as const;
export const MESSAGE_SENT = "MESSAGE_SENT" as const;

// --- Event interface ---

export interface DomainEvent {
  readonly type: string;
  readonly occurredAt: string;
  readonly payload: Record<string, unknown>;
}

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
