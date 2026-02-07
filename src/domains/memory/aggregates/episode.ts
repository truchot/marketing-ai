// ============================================================
// Episode Aggregate
// Rich domain model encapsulating Episode business logic
// ============================================================

import { AggregateRoot, MemoryId, Timestamp, Importance, Tag, EPISODE_RECORDED } from "@/domains/shared";
import type { Episode, EpisodeType } from "@/types/memory";

/**
 * Episode Aggregate Root
 *
 * Represents a single episodic memory entry with enforced business invariants:
 * - Description must not be empty
 * - Must have at least one tag
 * - Importance level can only be upgraded (never downgraded)
 * - Episode data is immutable after creation
 */
export class EpisodeAggregate extends AggregateRoot {
  // Private fields - encapsulation
  private readonly _id: MemoryId;
  private readonly _type: EpisodeType;
  private readonly _description: string;
  private readonly _data: Readonly<Record<string, unknown>>;
  private readonly _tags: ReadonlyArray<Tag>;
  private _importance: Importance;
  private readonly _timestamp: Timestamp;

  /**
   * Private constructor - use factory methods to create instances
   */
  private constructor(
    id: MemoryId,
    type: EpisodeType,
    description: string,
    data: Record<string, unknown>,
    tags: Tag[],
    importance: Importance,
    timestamp: Timestamp
  ) {
    super();
    this._id = id;
    this._type = type;
    this._description = description;
    this._data = Object.freeze({ ...data });
    this._tags = Object.freeze([...tags]);
    this._importance = importance;
    this._timestamp = timestamp;
  }

  /**
   * Factory method to create a new Episode
   * Validates business invariants and raises EPISODE_RECORDED event
   */
  static create(
    type: EpisodeType,
    description: string,
    data: Record<string, unknown>,
    options: {
      tags: string[];
      importance?: "low" | "medium" | "high";
    }
  ): EpisodeAggregate {
    // Invariant: description must not be empty
    const trimmedDescription = description.trim();
    if (!trimmedDescription) {
      throw new Error("Episode description cannot be empty");
    }

    // Invariant: must have at least one tag
    if (!options.tags || options.tags.length === 0) {
      throw new Error("Episode must have at least one tag");
    }

    // Create value objects
    const id = MemoryId.create(
      `ep-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    );
    const tags = options.tags.map(t => Tag.create(t));
    const importance = Importance.create(options.importance || "low");
    const timestamp = Timestamp.now();

    const episode = new EpisodeAggregate(
      id,
      type,
      trimmedDescription,
      data,
      tags,
      importance,
      timestamp
    );

    // Raise domain event
    episode.addDomainEvent({
      type: EPISODE_RECORDED,
      occurredAt: timestamp.toString(),
      payload: {
        episodeId: id.toString(),
        type,
        tags: options.tags,
        importance: importance.toString(),
      },
    });

    return episode;
  }

  /**
   * Reconstitute an Episode from persisted data
   * Does not raise domain events (already happened in the past)
   */
  static fromPersisted(dto: Episode): EpisodeAggregate {
    const id = MemoryId.create(dto.id);
    const tags = dto.metadata.tags.map(t => Tag.create(t));
    const importance = Importance.create(dto.metadata.importance);
    const timestamp = Timestamp.create(dto.metadata.timestamp);

    return new EpisodeAggregate(
      id,
      dto.type,
      dto.description,
      dto.data,
      tags,
      importance,
      timestamp
    );
  }

  // --- Domain Methods (Business Logic) ---

  /**
   * Add a new tag to this episode
   * Invariant: tag must not already exist
   */
  addTag(tagValue: string): void {
    const newTag = Tag.create(tagValue);

    // Invariant: no duplicate tags
    if (this._tags.some(t => t.equals(newTag))) {
      throw new Error(`Tag "${tagValue}" already exists on this episode`);
    }

    // Create new array with added tag (immutability)
    const updatedTags = [...this._tags, newTag];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this as any)._tags = Object.freeze(updatedTags);
  }

  /**
   * Upgrade the importance level of this episode
   * Invariant: importance can only increase, never decrease
   */
  upgradeImportance(newLevel: "low" | "medium" | "high"): void {
    const newImportance = Importance.create(newLevel);

    // Invariant: can only upgrade, not downgrade
    if (!newImportance.isHigherThan(this._importance)) {
      throw new Error(
        `Cannot downgrade or keep same importance level. Current: ${this._importance}, Requested: ${newImportance}`
      );
    }

    this._importance = newImportance;
  }

  /**
   * Check if this episode has a specific tag
   */
  hasTag(tagValue: string): boolean {
    try {
      const searchTag = Tag.create(tagValue);
      return this._tags.some(t => t.equals(searchTag));
    } catch {
      return false; // Invalid tag format
    }
  }

  /**
   * Check if this episode matches all given tags
   */
  hasAllTags(tagValues: string[]): boolean {
    return tagValues.every(tv => this.hasTag(tv));
  }

  /**
   * Check if this episode is more important than a given level
   */
  isMoreImportantThan(level: "low" | "medium" | "high"): boolean {
    const compareLevel = Importance.create(level);
    return this._importance.isHigherThan(compareLevel);
  }

  // --- Getters (Read-only access) ---

  get id(): string {
    return this._id.toString();
  }

  get type(): EpisodeType {
    return this._type;
  }

  get description(): string {
    return this._description;
  }

  get data(): Readonly<Record<string, unknown>> {
    return this._data;
  }

  get tags(): ReadonlyArray<string> {
    return this._tags.map(t => t.toString());
  }

  get importanceLevel(): "low" | "medium" | "high" {
    return this._importance.value;
  }

  get timestamp(): string {
    return this._timestamp.toString();
  }

  // --- DTO Conversion ---

  /**
   * Convert to DTO for persistence
   * Maintains compatibility with existing Episode interface
   */
  toDTO(): Episode {
    return {
      id: this._id.toString(),
      type: this._type,
      description: this._description,
      data: { ...this._data },
      metadata: {
        tags: this._tags.map(t => t.toString()),
        importance: this._importance.value,
        timestamp: this._timestamp.toString(),
      },
    };
  }
}
