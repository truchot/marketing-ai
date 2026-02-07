export {
  MemoryId,
  Timestamp,
  ConfidenceLevel,
  Importance,
  Tag,
  Sector,
  BrandTone,
  TargetAudience,
  EpisodeType,
} from "./value-objects";

export {
  type DomainEvent,
  DomainEventBus,
  domainEventBus,
  EPISODE_RECORDED,
  PATTERN_DETECTED,
  PATTERN_PROMOTED,
  CLIENT_FACT_ADDED,
  PREFERENCE_UPDATED,
  FEEDBACK_RECORDED,
  ONBOARDING_COMPLETED,
  MESSAGE_SENT,
} from "./domain-events";

export { AggregateRoot } from "./aggregate-root";

export { Result } from "./result";
export { DomainError, ValidationError, NotFoundError, InvariantViolationError } from "./domain-error";
