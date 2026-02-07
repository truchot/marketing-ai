// ============================================================
// CompanyProfile Aggregate
// Rich domain model encapsulating Company Profile business logic
// ============================================================

import { AggregateRoot, MemoryId, Timestamp } from "@/domains/shared";
import type { CompanyProfile } from "@/types";

/**
 * CompanyProfile Aggregate Root
 *
 * Represents a client's company profile with enforced business invariants:
 * - Name must be at least 2 characters
 * - Sector cannot be empty
 * - Description must be at least 10 characters
 * - Discovery can only be linked once (immutable after set)
 * - Brand tone can be updated multiple times
 */
export class CompanyProfileAggregate extends AggregateRoot {
  // Private fields - encapsulation
  private readonly _id: MemoryId;
  private _name: string;
  private _sector: string;
  private _description: string;
  private _target: string;
  private _brandTone: string;
  private _discoveryId: string | undefined;
  private readonly _createdAt: Timestamp;
  private _updatedAt: Timestamp;

  /**
   * Private constructor - use factory methods to create instances
   */
  private constructor(
    id: MemoryId,
    name: string,
    sector: string,
    description: string,
    target: string,
    brandTone: string,
    discoveryId: string | undefined,
    createdAt: Timestamp,
    updatedAt: Timestamp
  ) {
    super();
    this._id = id;
    this._name = name;
    this._sector = sector;
    this._description = description;
    this._target = target;
    this._brandTone = brandTone;
    this._discoveryId = discoveryId;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  /**
   * Factory method to create a new CompanyProfile
   * Validates business invariants
   */
  static create(data: {
    name: string;
    sector: string;
    description: string;
    target: string;
    brandTone: string;
  }): CompanyProfileAggregate {
    // Invariant: name must be at least 2 characters
    const trimmedName = data.name.trim();
    if (trimmedName.length < 2) {
      throw new Error("Company name must be at least 2 characters long");
    }

    // Invariant: sector cannot be empty
    const trimmedSector = data.sector.trim();
    if (!trimmedSector) {
      throw new Error("Company sector cannot be empty");
    }

    // Invariant: description must be at least 10 characters
    const trimmedDescription = data.description.trim();
    if (trimmedDescription.length < 10) {
      throw new Error("Company description must be at least 10 characters long");
    }

    // Invariant: target cannot be empty
    const trimmedTarget = data.target.trim();
    if (!trimmedTarget) {
      throw new Error("Company target audience cannot be empty");
    }

    // Invariant: brand tone cannot be empty
    const trimmedBrandTone = data.brandTone.trim();
    if (!trimmedBrandTone) {
      throw new Error("Company brand tone cannot be empty");
    }

    // Create value objects
    const id = MemoryId.create(
      `company-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    );
    const now = Timestamp.now();

    return new CompanyProfileAggregate(
      id,
      trimmedName,
      trimmedSector,
      trimmedDescription,
      trimmedTarget,
      trimmedBrandTone,
      undefined,
      now,
      now
    );
  }

  /**
   * Reconstitute a CompanyProfile from persisted data
   * Does not raise domain events (already happened in the past)
   */
  static fromPersisted(dto: CompanyProfile): CompanyProfileAggregate {
    const id = MemoryId.create(dto.id);
    const createdAt = Timestamp.create(dto.createdAt);
    const updatedAt = Timestamp.create(dto.updatedAt);

    return new CompanyProfileAggregate(
      id,
      dto.name,
      dto.sector,
      dto.description,
      dto.target,
      dto.brandTone,
      dto.discoveryId,
      createdAt,
      updatedAt
    );
  }

  // --- Domain Methods (Business Logic) ---

  /**
   * Update the company description
   * Invariant: description must be at least 10 characters
   */
  updateDescription(newDescription: string): void {
    const trimmedDescription = newDescription.trim();
    if (trimmedDescription.length < 10) {
      throw new Error("Company description must be at least 10 characters long");
    }

    this._description = trimmedDescription;
    this._updatedAt = Timestamp.now();
  }

  /**
   * Update the company name
   * Invariant: name must be at least 2 characters
   */
  updateName(newName: string): void {
    const trimmedName = newName.trim();
    if (trimmedName.length < 2) {
      throw new Error("Company name must be at least 2 characters long");
    }

    this._name = trimmedName;
    this._updatedAt = Timestamp.now();
  }

  /**
   * Update the company sector
   * Invariant: sector cannot be empty
   */
  updateSector(newSector: string): void {
    const trimmedSector = newSector.trim();
    if (!trimmedSector) {
      throw new Error("Company sector cannot be empty");
    }

    this._sector = trimmedSector;
    this._updatedAt = Timestamp.now();
  }

  /**
   * Update the target audience
   * Invariant: target cannot be empty
   */
  updateTarget(newTarget: string): void {
    const trimmedTarget = newTarget.trim();
    if (!trimmedTarget) {
      throw new Error("Company target audience cannot be empty");
    }

    this._target = trimmedTarget;
    this._updatedAt = Timestamp.now();
  }

  /**
   * Update the brand tone
   * Invariant: brand tone cannot be empty
   */
  updateBrandTone(newBrandTone: string): void {
    const trimmedBrandTone = newBrandTone.trim();
    if (!trimmedBrandTone) {
      throw new Error("Company brand tone cannot be empty");
    }

    this._brandTone = trimmedBrandTone;
    this._updatedAt = Timestamp.now();
  }

  /**
   * Link a discovery to this company profile
   * Invariant: discovery can only be linked once (immutable after set)
   */
  linkDiscovery(discoveryId: string): void {
    // Invariant: discovery can only be linked once
    if (this._discoveryId !== undefined) {
      throw new Error(
        `Discovery already linked to this profile (${this._discoveryId}). Cannot link again.`
      );
    }

    const trimmedDiscoveryId = discoveryId.trim();
    if (!trimmedDiscoveryId) {
      throw new Error("Discovery ID cannot be empty");
    }

    this._discoveryId = trimmedDiscoveryId;
    this._updatedAt = Timestamp.now();
  }

  /**
   * Check if a discovery has been linked
   */
  hasDiscoveryLinked(): boolean {
    return this._discoveryId !== undefined;
  }

  // --- Getters (Read-only access) ---

  get id(): string {
    return this._id.toString();
  }

  get name(): string {
    return this._name;
  }

  get sector(): string {
    return this._sector;
  }

  get description(): string {
    return this._description;
  }

  get target(): string {
    return this._target;
  }

  get brandTone(): string {
    return this._brandTone;
  }

  get discoveryId(): string | undefined {
    return this._discoveryId;
  }

  get createdAt(): string {
    return this._createdAt.toString();
  }

  get updatedAt(): string {
    return this._updatedAt.toString();
  }

  // --- DTO Conversion ---

  /**
   * Convert to DTO for persistence
   * Maintains compatibility with existing CompanyProfile interface
   */
  toDTO(): CompanyProfile {
    return {
      id: this._id.toString(),
      name: this._name,
      sector: this._sector,
      description: this._description,
      target: this._target,
      brandTone: this._brandTone,
      discoveryId: this._discoveryId,
      createdAt: this._createdAt.toString(),
      updatedAt: this._updatedAt.toString(),
    };
  }
}
