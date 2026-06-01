// ============================================================
// CompanyProfile Aggregate
// Rich domain model encapsulating Company Profile business logic
// ============================================================

import {
  AggregateRoot,
  MemoryId,
  Timestamp,
  TargetAudience,
  COMPANY_PROFILE_UPDATED,
  DISCOVERY_LINKED,
} from "@/domains/shared";
import type { CompanyProfile } from "@/types";

/**
 * CompanyProfile Aggregate Root
 *
 * Invariants:
 * - Name must be at least 2 characters
 * - Sector must be a valid Sector value object
 * - Description must be at least 10 characters
 * - Target must be a valid TargetAudience value object
 * - BrandTone must be a valid BrandTone value object
 * - Discovery can only be linked once (immutable after set)
 */
export class CompanyProfileAggregate extends AggregateRoot {
  private readonly _id: MemoryId;
  private _name: string;
  private _sector: string;
  private _description: string;
  private _target: TargetAudience;
  private _brandTone: string;
  private _discoveryId: string | undefined;
  private readonly _createdAt: Timestamp;
  private _updatedAt: Timestamp;

  private constructor(
    id: MemoryId,
    name: string,
    sector: string,
    description: string,
    target: TargetAudience,
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

  static create(data: {
    name: string;
    sector: string;
    description: string;
    target: string;
    brandTone: string;
  }): CompanyProfileAggregate {
    const trimmedName = data.name.trim();
    if (trimmedName.length < 2) {
      throw new Error("Company name must be at least 2 characters long");
    }

    const trimmedSector = data.sector.trim();
    if (!trimmedSector) {
      throw new Error("Company sector cannot be empty");
    }

    const trimmedDescription = data.description.trim();
    if (trimmedDescription.length < 10) {
      throw new Error("Company description must be at least 10 characters long");
    }

    const target = TargetAudience.create(data.target);

    const trimmedBrandTone = data.brandTone.trim();
    if (!trimmedBrandTone) {
      throw new Error("Company brand tone cannot be empty");
    }

    const id = MemoryId.create(
      `company-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    );
    const now = Timestamp.now();

    return new CompanyProfileAggregate(
      id,
      trimmedName,
      trimmedSector,
      trimmedDescription,
      target,
      trimmedBrandTone,
      undefined,
      now,
      now
    );
  }

  static fromPersisted(dto: CompanyProfile): CompanyProfileAggregate {
    const id = MemoryId.create(dto.id);
    const createdAt = Timestamp.create(dto.createdAt);
    const updatedAt = Timestamp.create(dto.updatedAt);

    return new CompanyProfileAggregate(
      id,
      dto.name,
      dto.sector,
      dto.description,
      TargetAudience.create(dto.target),
      dto.brandTone,
      dto.discoveryId,
      createdAt,
      updatedAt
    );
  }

  // --- Domain Methods ---

  updateDescription(newDescription: string): void {
    const trimmedDescription = newDescription.trim();
    if (trimmedDescription.length < 10) {
      throw new Error("Company description must be at least 10 characters long");
    }

    const oldValue = this._description;
    this._description = trimmedDescription;
    this._updatedAt = Timestamp.now();

    this.addDomainEvent({
      type: COMPANY_PROFILE_UPDATED,
      occurredAt: this._updatedAt.toString(),
      payload: {
        profileId: this._id.toString(),
        field: "description",
        oldValue,
        newValue: trimmedDescription,
      },
    });
  }

  updateName(newName: string): void {
    const trimmedName = newName.trim();
    if (trimmedName.length < 2) {
      throw new Error("Company name must be at least 2 characters long");
    }

    const oldValue = this._name;
    this._name = trimmedName;
    this._updatedAt = Timestamp.now();

    this.addDomainEvent({
      type: COMPANY_PROFILE_UPDATED,
      occurredAt: this._updatedAt.toString(),
      payload: {
        profileId: this._id.toString(),
        field: "name",
        oldValue,
        newValue: trimmedName,
      },
    });
  }

  updateSector(newSector: string): void {
    const trimmedSector = newSector.trim();
    if (!trimmedSector) {
      throw new Error("Company sector cannot be empty");
    }

    const oldValue = this._sector;
    this._sector = trimmedSector;
    this._updatedAt = Timestamp.now();

    this.addDomainEvent({
      type: COMPANY_PROFILE_UPDATED,
      occurredAt: this._updatedAt.toString(),
      payload: {
        profileId: this._id.toString(),
        field: "sector",
        oldValue,
        newValue: trimmedSector,
      },
    });
  }

  updateTarget(newTarget: string): void {
    const target = TargetAudience.create(newTarget);

    const oldValue = this._target.toString();
    this._target = target;
    this._updatedAt = Timestamp.now();

    this.addDomainEvent({
      type: COMPANY_PROFILE_UPDATED,
      occurredAt: this._updatedAt.toString(),
      payload: {
        profileId: this._id.toString(),
        field: "target",
        oldValue,
        newValue: target.toString(),
      },
    });
  }

  updateBrandTone(newBrandTone: string): void {
    const trimmedBrandTone = newBrandTone.trim();
    if (!trimmedBrandTone) {
      throw new Error("Company brand tone cannot be empty");
    }

    const oldValue = this._brandTone;
    this._brandTone = trimmedBrandTone;
    this._updatedAt = Timestamp.now();

    this.addDomainEvent({
      type: COMPANY_PROFILE_UPDATED,
      occurredAt: this._updatedAt.toString(),
      payload: {
        profileId: this._id.toString(),
        field: "brandTone",
        oldValue,
        newValue: trimmedBrandTone,
      },
    });
  }

  linkDiscovery(discoveryId: string): void {
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

    this.addDomainEvent({
      type: DISCOVERY_LINKED,
      occurredAt: this._updatedAt.toString(),
      payload: {
        profileId: this._id.toString(),
        discoveryId: trimmedDiscoveryId,
      },
    });
  }

  hasDiscoveryLinked(): boolean {
    return this._discoveryId !== undefined;
  }

  // --- Getters ---

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
    return this._target.toString();
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

  toDTO(): CompanyProfile {
    return {
      id: this._id.toString(),
      name: this._name,
      sector: this._sector,
      description: this._description,
      target: this._target.toString(),
      brandTone: this._brandTone,
      discoveryId: this._discoveryId,
      createdAt: this._createdAt.toString(),
      updatedAt: this._updatedAt.toString(),
    };
  }
}
