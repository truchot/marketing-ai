// ============================================================
// Strategy Aggregate
// Represents a validated marketing strategy with OKRs and actions.
// ============================================================

import { AggregateRoot } from "@/domains/shared";
import type {
  MarketingStrategy,
  MarketingDiagnostic,
  OKR,
  Action,
  ExecutionRoadmap,
  ConstraintsFit,
} from "@/types/marketing-strategy";
import { STRATEGY_GENERATED } from "@/domains/shared/domain-events";
import { IdGenerator } from "@/lib/id-generator";

export class StrategyAggregate extends AggregateRoot {
  private constructor(
    public readonly id: string,
    private readonly _metadata: MarketingStrategy["metadata"],
    public readonly diagnostic: MarketingDiagnostic,
    private _okrs: OKR[],
    private _actions: Action[],
    private _roadmap: ExecutionRoadmap,
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

  get okrs(): readonly OKR[] {
    return this._okrs;
  }

  get actions(): readonly Action[] {
    return this._actions;
  }

  get roadmap(): ExecutionRoadmap {
    return this._roadmap;
  }

  get constraints(): ConstraintsFit {
    return this._constraints;
  }

  get narrativeSummary(): string {
    return this._narrativeSummary;
  }

  static create(strategy: MarketingStrategy): StrategyAggregate {
    if (strategy.okrs.length === 0) {
      throw new Error("A strategy must have at least one OKR");
    }
    if (strategy.okrs.length > 3) {
      throw new Error("A strategy must have at most 3 OKRs");
    }
    if (strategy.actions.length === 0) {
      throw new Error("A strategy must have at least one action");
    }

    const id = IdGenerator.generate("strategy");

    const aggregate = new StrategyAggregate(
      id,
      strategy.metadata,
      strategy.diagnostic,
      strategy.okrs,
      strategy.actions,
      strategy.executionRoadmap,
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
        actionCount: aggregate.actions.length,
        maturityScore: aggregate.diagnostic.maturityScore,
      },
    });

    return aggregate;
  }

  updateOKR(okrId: string, updates: Partial<OKR>): void {
    const index = this._okrs.findIndex((o) => o.id === okrId);
    if (index === -1) {
      throw new Error(`OKR ${okrId} not found`);
    }
    this._okrs[index] = { ...this._okrs[index], ...updates };
  }

  removeOKR(okrId: string): void {
    this._okrs = this._okrs.filter((o) => o.id !== okrId);
    this._actions = this._actions.filter((a) => a.okrId !== okrId);
    if (this._okrs.length === 0) {
      throw new Error("Cannot remove last OKR — strategy must have at least one");
    }
  }

  toStrategy(): MarketingStrategy {
    return {
      metadata: { ...this._metadata },
      diagnostic: this.diagnostic,
      okrs: [...this._okrs],
      actions: [...this._actions],
      executionRoadmap: this._roadmap,
      constraints: this._constraints,
      narrativeSummary: this._narrativeSummary,
    };
  }
}
