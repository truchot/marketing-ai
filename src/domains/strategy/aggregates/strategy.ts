// ============================================================
// Strategy Aggregate
// Represents a validated marketing strategy with 3 layers:
//   Strategic (4 subsystems) → Tactical → Operational
// ============================================================

import { AggregateRoot } from "@/domains/shared";
import type {
  MarketingStrategy,
  StrategicLayer,
  TacticalLayer,
  OperationalLayer,
  ConstraintsFit,
  OKR,
  TargetMarket,
  BusinessStrategy,
  FeedbackLoop,
  MarketingFoundation,
  MarketingPlan,
  MarketingSystem,
  RoadmapValidation,
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

  // Convenience accessors
  get diagnostic() {
    return this._strategic.diagnostic;
  }

  get okrs(): readonly OKR[] {
    return this._strategic.okrs;
  }

  get targetMarket(): TargetMarket {
    return this._strategic.targetMarket;
  }

  get businessStrategy(): BusinessStrategy {
    return this._strategic.businessStrategy;
  }

  get feedbackLoop(): FeedbackLoop {
    return this._strategic.feedbackLoop;
  }

  get marketingFoundation(): MarketingFoundation {
    return this._strategic.marketingFoundation;
  }

  get roadmapValidation(): RoadmapValidation {
    return this._strategic.roadmapValidation;
  }

  get marketingPlan(): MarketingPlan {
    return this._tactical.marketingPlan;
  }

  get marketingSystem(): MarketingSystem {
    return this._tactical.marketingSystem;
  }

  static create(strategy: MarketingStrategy): StrategyAggregate {
    // --- Strategic layer invariants ---

    // OKRs
    if (strategy.strategic.okrs.length === 0) {
      throw new Error("A strategy must have at least one OKR");
    }
    if (strategy.strategic.okrs.length > 3) {
      throw new Error("A strategy must have at most 3 OKRs");
    }

    // Target Market
    if (strategy.strategic.targetMarket.segments.length === 0) {
      throw new Error("Target market must have at least one segment");
    }
    if (strategy.strategic.targetMarket.icp.painPoints.length === 0) {
      throw new Error("ICP must have at least one pain point");
    }

    // Business Strategy
    if (!strategy.strategic.businessStrategy.valueProposition.trim()) {
      throw new Error("Business strategy must have a value proposition");
    }

    // Marketing Foundation
    if (!strategy.strategic.marketingFoundation.messaging.primaryMessage.trim()) {
      throw new Error("Marketing foundation must have a primary message");
    }

    // Feedback Loop
    if (strategy.strategic.feedbackLoop.hypotheses.length === 0) {
      throw new Error("Feedback loop must have at least one hypothesis");
    }

    // Time Horizon
    if (!strategy.strategic.timeHorizon.trim()) {
      throw new Error("Strategic layer must have a time horizon");
    }

    // Roadmap Validation gate
    if (strategy.strategic.roadmapValidation.recommendation === "rethink") {
      throw new Error("Cannot create strategy — roadmap validation recommends rethinking");
    }

    // --- Tactical layer invariants ---

    // Marketing Plan
    if (strategy.tactical.marketingPlan.campaigns.length === 0) {
      throw new Error("Marketing plan must have at least one campaign");
    }
    if (strategy.tactical.marketingPlan.roadmap.length === 0) {
      throw new Error("Marketing plan must have at least one roadmap phase");
    }

    // Marketing System
    if (strategy.tactical.marketingSystem.processes.length === 0) {
      throw new Error("Marketing system must have at least one process");
    }

    // --- Operational layer invariants ---
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
        segmentCount: aggregate.targetMarket.segments.length,
        hypothesisCount: aggregate.feedbackLoop.hypotheses.length,
        campaignCount: aggregate.marketingPlan.campaigns.length,
        processCount: aggregate.marketingSystem.processes.length,
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
    // Cascade: remove campaigns linked to this OKR
    const removedCampaignIds = this._tactical.marketingPlan.campaigns
      .filter((c) => c.okrId === okrId)
      .map((c) => c.id);
    this._tactical.marketingPlan.campaigns = this._tactical.marketingPlan.campaigns.filter((c) => c.okrId !== okrId);
    // Cascade: remove KPIs linked to removed campaigns
    this._tactical.marketingPlan.kpis = this._tactical.marketingPlan.kpis.filter(
      (k) => !removedCampaignIds.includes(k.campaignId)
    );
    // Cascade: remove backlog items linked to removed campaigns
    this._tactical.marketingSystem.backlog = this._tactical.marketingSystem.backlog.filter(
      (b) => !b.linkedCampaignIds.some((id) => removedCampaignIds.includes(id))
    );
    // Cascade: remove tasks linked to removed campaigns
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
        targetMarket: {
          marketDefinition: this._strategic.targetMarket.marketDefinition,
          segments: [...this._strategic.targetMarket.segments],
          icp: { ...this._strategic.targetMarket.icp },
        },
        businessStrategy: { ...this._strategic.businessStrategy },
        feedbackLoop: {
          hypotheses: [...this._strategic.feedbackLoop.hypotheses],
          validationTests: [...this._strategic.feedbackLoop.validationTests],
          reviewCadence: this._strategic.feedbackLoop.reviewCadence,
          pivotTriggers: [...this._strategic.feedbackLoop.pivotTriggers],
        },
        marketingFoundation: {
          offer: this._strategic.marketingFoundation.offer,
          positioning: { ...this._strategic.marketingFoundation.positioning },
          messaging: {
            primaryMessage: this._strategic.marketingFoundation.messaging.primaryMessage,
            segmentMessages: [...this._strategic.marketingFoundation.messaging.segmentMessages],
            proofPoints: [...this._strategic.marketingFoundation.messaging.proofPoints],
          },
        },
        okrs: [...this._strategic.okrs],
        timeHorizon: this._strategic.timeHorizon,
        roadmapValidation: { ...this._strategic.roadmapValidation },
      },
      tactical: {
        marketingPlan: {
          campaigns: [...this._tactical.marketingPlan.campaigns],
          channelStrategy: [...this._tactical.marketingPlan.channelStrategy],
          contentPlan: [...this._tactical.marketingPlan.contentPlan],
          budgetAllocation: [...this._tactical.marketingPlan.budgetAllocation],
          kpis: [...this._tactical.marketingPlan.kpis],
          roadmap: [...this._tactical.marketingPlan.roadmap],
          reviewCycle: this._tactical.marketingPlan.reviewCycle,
        },
        marketingSystem: {
          backlog: [...this._tactical.marketingSystem.backlog],
          processes: [...this._tactical.marketingSystem.processes],
          automations: [...this._tactical.marketingSystem.automations],
          systemArchitecture: {
            tools: [...this._tactical.marketingSystem.systemArchitecture.tools],
            dataFlows: [...this._tactical.marketingSystem.systemArchitecture.dataFlows],
          },
        },
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
