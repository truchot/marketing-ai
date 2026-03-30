// ============================================================
// Shared Kernel - Aggregate Root Base Class
// ============================================================

import type { DomainEvent } from "./domain-events";
import { domainEventBus } from "./domain-events";

/**
 * Base class for all Aggregates in the system.
 * Provides domain event management capabilities.
 */
export abstract class AggregateRoot {
  private uncommittedEvents: DomainEvent[] = [];

  /**
   * Add a domain event to the uncommitted events list.
   * Events are not published automatically - the caller (usually a use case)
   * must retrieve and publish them after persisting the aggregate.
   */
  protected addDomainEvent(event: DomainEvent): void {
    this.uncommittedEvents.push(event);
  }

  /**
   * Get all uncommitted events for this aggregate.
   * Returns a defensive copy to prevent external modification.
   */
  getUncommittedEvents(): DomainEvent[] {
    return [...this.uncommittedEvents];
  }

  /**
   * Publish all uncommitted events to the domain event bus and clear them.
   * Convenience method to avoid repeating get+forEach+clear in every use case.
   */
  publishEvents(): void {
    for (const event of this.uncommittedEvents) {
      domainEventBus.publish(event);
    }
    this.uncommittedEvents = [];
  }

  /**
   * Clear uncommitted events.
   * Should be called after events have been published.
   */
  clearUncommittedEvents(): void {
    this.uncommittedEvents = [];
  }
}
