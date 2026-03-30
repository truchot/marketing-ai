// ============================================================
// Strategy Aggregate
// Represents a validated marketing strategy with 3 layers:
//   Strategic → Tactical → Operational
// ============================================================

import { AggregateRoot } from "@/domains/shared";
import type {
  MarketingStrategy,
  StrategicLayer,
  TacticalLayer,
  OperationalLayer,
  ConstraintsFit,
  OKR,
} from "@/types/marketing-strategy";
import { STRATEGY_GENERATED } from "@/domains/shared/domain-events";
import { IdGenerator } from "@/lib/id-generator";

export class StrategyAggregate extends AggregateRoot {
  private constructor(
    public readonly id: string,
    private readonly _metadata: MarketingStrategy["metadata"],
    private _strategic: StrategicLayer,
    private _tactical: TacticalLayer,
    private _operational: OperationalLayer,
    private _constraints: ConstraintsFit,
    private _narrativeSummary: string
  ) {
    super();
  }

  get companyName(): string {
    return this._metadata.companyName;
  }

  get metadata(): MarketingStrategy["metadata"] {
    return this._metadata;
  }

  get strategic(): StrategicLayer {
    return this._strategic;
  }

  get tactical(): TacticalLayer {
    return this._tactical;
  }

  get operational(): OperationalLayer {
    return this._operational;
  }

  get constraints(): ConstraintsFit {
    return this._constraints;
  }

  get narrativeSummary(): string {
    return this._narrativeSummary;
  }

  // Convenience accessors for the strategic layer
  get diagnostic() {
    return this._strategic.diagnostic;
  }

  get okrs(): readonly OKR[] {
    return this._strategic.okrs;
  }

  static create(strategy: MarketingStrategy): StrategyAggregate {
    // Validate strategic layer invariants
    if (strategy.strategic.okrs.length === 0) {
      throw new Error("A strategy must have at least one OKR");
    }
    if (strategy.strategic.okrs.length > 3) {
      throw new Error("A strategy must have at most 3 OKRs");
    }

    // Validate tactical layer invariants
    if (strategy.tactical.campaigns.length === 0) {
      throw new Error("A strategy must have at least one campaign");
    }

    // Validate operational layer invariants
    if (strategy.operational.tasks.length === 0) {
      throw new Error("A strategy must have at least one operational task");
    }

    const id = IdGenerator.generate("strategy");

    const aggregate = new StrategyAggregate(
      id,
      strategy.metadata,
      strategy.strategic,
      strategy.tactical,
      strategy.operational,
      strategy.constraints,
      strategy.narrativeSummary
    );

    aggregate.addDomainEvent({
      type: STRATEGY_GENERATED,
      occurredAt: new Date().toISOString(),
      payload: {
        strategyId: id,
        companyName: aggregate.companyName,
        okrCount: aggregate.okrs.length,
        campaignCount: aggregate.tactical.campaigns.length,
        taskCount: aggregate.operational.tasks.length,
        maturityScore: aggregate.diagnostic.maturityScore,
      },
    });

    return aggregate;
  }

  updateOKR(okrId: string, updates: Partial<OKR>): void {
    const index = this._strategic.okrs.findIndex((o) => o.id === okrId);
    if (index === -1) {
      throw new Error(`OKR ${okrId} not found`);
    }
    this._strategic.okrs[index] = { ...this._strategic.okrs[index], ...updates };
  }

  removeOKR(okrId: string): void {
    this._strategic.okrs = this._strategic.okrs.filter((o) => o.id !== okrId);
    // Also remove campaigns linked to this OKR
    const removedCampaignIds = this._tactical.campaigns
      .filter((c) => c.okrId === okrId)
      .map((c) => c.id);
    this._tactical.campaigns = this._tactical.campaigns.filter((c) => c.okrId !== okrId);
    // Also remove tasks linked to removed campaigns
    this._operational.tasks = this._operational.tasks.filter(
      (t) => !removedCampaignIds.includes(t.campaignId)
    );
    if (this._strategic.okrs.length === 0) {
      throw new Error("Cannot remove last OKR — strategy must have at least one");
    }
  }

  toStrategy(): MarketingStrategy {
    return {
      metadata: { ...this._metadata },
      strategic: {
        diagnostic: this._strategic.diagnostic,
        positioning: { ...this._strategic.positioning },
        okrs: [...this._strategic.okrs],
        prioritySegments: [...this._strategic.prioritySegments],
      },
      tactical: {
        campaigns: [...this._tactical.campaigns],
        channelStrategy: [...this._tactical.channelStrategy],
        contentPlan: [...this._tactical.contentPlan],
        budgetAllocation: [...this._tactical.budgetAllocation],
      },
      operational: {
        tasks: [...this._operational.tasks],
        calendar: [...this._operational.calendar],
        weeklyKPIs: [...this._operational.weeklyKPIs],
      },
      constraints: this._constraints,
      narrativeSummary: this._narrativeSummary,
    };
  }
}
