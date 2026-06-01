// ============================================================
// Experiment Aggregate
// Cadenced execution layer below Strategy: a falsifiable bet
// (weekly) that owns its DailyActions (daily) as child entities.
//
// Hierarchy: OKR → KeyResult → Action → Experiment → DailyAction
// References Strategy (keyResultId / actionId) but never mutates it.
// See docs/adr/0001-bounded-context-experimentation.md
// ============================================================

import { AggregateRoot } from "@/domains/shared";
import { EXPERIMENT_CREATED, EXPERIMENT_CONCLUDED } from "@/domains/shared";
import { IdGenerator } from "@/lib/id-generator";
import type {
  Experiment,
  Hypothesis,
  IceScore,
  ConfidenceSource,
  DailyAction,
  DailyActionAsset,
  ExperimentResult,
  ExperimentStatus,
} from "@/types/experiment";
const ICE_MIN = 1;
const ICE_MAX = 10;

function assertIceDimension(name: string, value: number): void {
  if (!Number.isFinite(value) || value < ICE_MIN || value > ICE_MAX) {
    throw new Error(`ICE ${name} must be between ${ICE_MIN} and ${ICE_MAX} (got ${value})`);
  }
}

// --- Factory input ---

export interface CreateExperimentInput {
  keyResultId: string;
  okrId: string;
  actionId?: string;
  title: string;
  hypothesis: Hypothesis;
  channel: string;
  audienceSegment?: string;
  ice: IceScore;
  confidenceSources?: ConfidenceSource[];
  companyName: string;
}

export class ExperimentAggregate extends AggregateRoot {
  private constructor(
    public readonly id: string,
    private _keyResultId: string,
    private _okrId: string,
    private _actionId: string | undefined,
    private _title: string,
    private _hypothesis: Hypothesis,
    private _channel: string,
    private _audienceSegment: string | undefined,
    private _ice: IceScore,
    private _confidenceSources: ConfidenceSource[],
    private _weekOf: string | undefined,
    private _dailyActions: DailyAction[],
    private _status: ExperimentStatus,
    private _result: ExperimentResult | undefined,
    private _learning: string | undefined,
    private readonly _companyName: string,
    private readonly _createdAt: string,
    private _updatedAt: string
  ) {
    super();
  }

  // --- Factories ---

  /**
   * Create a new experiment.
   * Invariants:
   *  - keyResultId is required (the guardrail: every experiment serves a measurable KR)
   *  - hypothesis.threshold is required (falsifiability: no measure → no test)
   *  - title is required
   *  - ICE dimensions in [1, 10]
   */
  static create(input: CreateExperimentInput): ExperimentAggregate {
    const keyResultId = input.keyResultId?.trim();
    if (!keyResultId) {
      throw new Error("An experiment must be linked to a KeyResult (keyResultId is required)");
    }

    const okrId = input.okrId?.trim();
    if (!okrId) {
      throw new Error("An experiment must reference its OKR (okrId is required)");
    }

    const title = input.title?.trim();
    if (!title) {
      throw new Error("An experiment must have a title");
    }

    const threshold = input.hypothesis?.threshold?.trim();
    if (!threshold) {
      throw new Error(
        "An experiment must be falsifiable: hypothesis.threshold is required (if you cannot measure it, do not test it)"
      );
    }

    assertIceDimension("impact", input.ice.impact);
    assertIceDimension("confidence", input.ice.confidence);
    assertIceDimension("ease", input.ice.ease);

    const id = IdGenerator.generate("exp");
    const now = IdGenerator.timestamp();
    const actionId = input.actionId?.trim() || undefined;

    const aggregate = new ExperimentAggregate(
      id,
      keyResultId,
      okrId,
      actionId,
      title,
      { ...input.hypothesis, threshold },
      input.channel.trim(),
      input.audienceSegment?.trim() || undefined,
      { ...input.ice },
      [...(input.confidenceSources ?? [])],
      undefined,
      [],
      "draft",
      undefined,
      undefined,
      input.companyName.trim(),
      now,
      now
    );

    aggregate.addDomainEvent({
      type: EXPERIMENT_CREATED,
      occurredAt: now,
      payload: {
        experimentId: id,
        keyResultId,
        okrId,
        companyName: aggregate._companyName,
        priorityScore: aggregate.priorityScore,
      },
    });

    return aggregate;
  }

  /** Reconstitute from persistence (no domain events). */
  static fromPersisted(dto: Experiment): ExperimentAggregate {
    return new ExperimentAggregate(
      dto.id,
      dto.keyResultId,
      dto.okrId,
      dto.actionId,
      dto.title,
      dto.hypothesis,
      dto.channel,
      dto.audienceSegment,
      dto.ice,
      [...dto.confidenceSources],
      dto.weekOf,
      dto.dailyActions.map((d) => ({ ...d })),
      dto.status,
      dto.result,
      dto.learning,
      dto.companyName,
      dto.createdAt,
      dto.updatedAt
    );
  }

  // --- Getters ---

  get keyResultId(): string {
    return this._keyResultId;
  }

  get okrId(): string {
    return this._okrId;
  }

  get actionId(): string | undefined {
    return this._actionId;
  }

  get title(): string {
    return this._title;
  }

  get status(): ExperimentStatus {
    return this._status;
  }

  get weekOf(): string | undefined {
    return this._weekOf;
  }

  get ice(): Readonly<IceScore> {
    return { ...this._ice };
  }

  /** ICE priority = (impact + confidence + ease) / 3, rounded to 1 decimal. */
  get priorityScore(): number {
    const raw = (this._ice.impact + this._ice.confidence + this._ice.ease) / 3;
    return Math.round(raw * 10) / 10;
  }

  get confidenceSources(): readonly ConfidenceSource[] {
    return this._confidenceSources.map((s) => ({ ...s }));
  }

  get dailyActions(): readonly DailyAction[] {
    return this._dailyActions.map((d) => ({
      ...d,
      asset: d.asset ? { ...d.asset } : null,
    }));
  }

  get companyName(): string {
    return this._companyName;
  }

  // --- Strategic lifecycle ---

  /** Select this experiment for a given week's backlog (draft → selected). */
  selectForWeek(weekOf: string): void {
    if (this._status !== "draft") {
      throw new Error(`Only a draft experiment can be selected (current: ${this._status})`);
    }
    const week = weekOf?.trim();
    if (!week) {
      throw new Error("selectForWeek requires the week date (ISO date of the Monday)");
    }
    this._status = "selected";
    this._weekOf = week;
    this.touch();
  }

  /**
   * Recompute confidence from refreshed evidence (weekly recalibration).
   * This is the entry point for the future Measure phase: prior results feed
   * the confidence of the next experiments.
   */
  recomputeConfidence(confidence: number, sources: ConfidenceSource[]): void {
    if (this._status === "concluded" || this._status === "archived") {
      throw new Error(`Cannot recompute confidence on a ${this._status} experiment`);
    }
    assertIceDimension("confidence", confidence);
    this._ice = { ...this._ice, confidence };
    this._confidenceSources = [...sources];
    this.touch();
  }

  /** Conclude with a measured result (running → concluded). Future Measure phase. */
  conclude(result: ExperimentResult): void {
    if (this._status !== "running") {
      throw new Error(`Only a running experiment can be concluded (current: ${this._status})`);
    }
    this._result = { ...result };
    this._status = "concluded";
    this.touch();

    this.addDomainEvent({
      type: EXPERIMENT_CONCLUDED,
      occurredAt: this._updatedAt,
      payload: {
        experimentId: this.id,
        keyResultId: this._keyResultId,
        metThreshold: result.metThreshold,
        measuredValue: result.measuredValue,
      },
    });
  }

  /** Capture the learning extracted toward semantic memory (after conclusion). */
  captureLearning(learning: string): void {
    if (this._status !== "concluded") {
      throw new Error("Learning can only be captured on a concluded experiment");
    }
    const text = learning?.trim();
    if (!text) {
      throw new Error("Learning cannot be empty");
    }
    this._learning = text;
    this.touch();
  }

  /** Abandon the experiment (cannot archive a concluded one). */
  archive(): void {
    if (this._status === "concluded") {
      throw new Error("A concluded experiment cannot be archived");
    }
    this._status = "archived";
    this.touch();
  }

  // --- Daily declination (child entities, managed through the root only) ---

  /** Plan a daily atom. Allowed once the experiment is selected (or running). */
  planDailyAction(input: { scheduledDate: string; channel?: string; title: string }): string {
    if (this._status !== "selected" && this._status !== "running") {
      throw new Error(
        `Daily actions can only be planned on a selected/running experiment (current: ${this._status})`
      );
    }
    const scheduledDate = input.scheduledDate?.trim();
    if (!scheduledDate) {
      throw new Error("A daily action requires a scheduled date");
    }
    const title = input.title?.trim();
    if (!title) {
      throw new Error("A daily action requires a title");
    }

    const daily: DailyAction = {
      id: IdGenerator.generate("daily"),
      experimentId: this.id,
      scheduledDate,
      channel: input.channel?.trim() || this._channel,
      title,
      asset: null,
      status: "proposed",
    };
    this._dailyActions.push(daily);
    this.touch();
    return daily.id;
  }

  /** Attach the produced content to a daily action (machine produces). */
  produceAsset(dailyActionId: string, asset: DailyActionAsset): void {
    const daily = this.requireDaily(dailyActionId);
    if (daily.status !== "proposed" && daily.status !== "carried_over") {
      throw new Error(`Cannot produce an asset for a ${daily.status} daily action`);
    }
    if (!asset.content?.trim()) {
      throw new Error("A produced asset must have content");
    }
    daily.asset = { ...asset };
    this.touch();
  }

  /** Founder approves the produced atom (copilot). proposed → validated. */
  validateDailyAction(dailyActionId: string): void {
    const daily = this.requireDaily(dailyActionId);
    if (daily.status !== "proposed" && daily.status !== "carried_over") {
      throw new Error(`Cannot validate a ${daily.status} daily action`);
    }
    if (!daily.asset) {
      throw new Error("Cannot validate a daily action with no produced asset");
    }
    daily.status = "validated";
    this.touch();
  }

  /** Mark the atom as shipped. validated → shipped; promotes experiment to running. */
  shipDailyAction(dailyActionId: string): void {
    const daily = this.requireDaily(dailyActionId);
    if (daily.status !== "validated") {
      throw new Error(`Only a validated daily action can be shipped (current: ${daily.status})`);
    }
    daily.status = "shipped";
    if (this._status === "selected") {
      this._status = "running";
    }
    this.touch();
  }

  /** Founder skips the atom. */
  skipDailyAction(dailyActionId: string): void {
    const daily = this.requireDaily(dailyActionId);
    if (daily.status === "shipped") {
      throw new Error("A shipped daily action cannot be skipped");
    }
    daily.status = "skipped";
    this.touch();
  }

  /**
   * Carry an un-shipped atom over to a new date (the machine keeps the tempo).
   * The original is marked carried_over; a fresh proposed atom is created.
   */
  carryOverDailyAction(dailyActionId: string, newDate: string): string {
    const daily = this.requireDaily(dailyActionId);
    if (daily.status === "shipped" || daily.status === "skipped") {
      throw new Error(`A ${daily.status} daily action cannot be carried over`);
    }
    const date = newDate?.trim();
    if (!date) {
      throw new Error("carryOver requires the new scheduled date");
    }
    daily.status = "carried_over";

    const next: DailyAction = {
      id: IdGenerator.generate("daily"),
      experimentId: this.id,
      scheduledDate: date,
      channel: daily.channel,
      title: daily.title,
      asset: daily.asset ? { ...daily.asset } : null,
      status: "proposed",
      carryOverFrom: daily.id,
    };
    this._dailyActions.push(next);
    this.touch();
    return next.id;
  }

  // --- Internals ---

  private requireDaily(dailyActionId: string): DailyAction {
    const daily = this._dailyActions.find((d) => d.id === dailyActionId);
    if (!daily) {
      throw new Error(`Daily action ${dailyActionId} not found in experiment ${this.id}`);
    }
    return daily;
  }

  private touch(): void {
    this._updatedAt = IdGenerator.timestamp();
  }

  // --- Persistence ---

  toDTO(): Experiment {
    return {
      id: this.id,
      keyResultId: this._keyResultId,
      okrId: this._okrId,
      actionId: this._actionId,
      title: this._title,
      hypothesis: { ...this._hypothesis },
      channel: this._channel,
      audienceSegment: this._audienceSegment,
      ice: { ...this._ice },
      confidenceSources: this._confidenceSources.map((s) => ({ ...s })),
      weekOf: this._weekOf,
      dailyActions: this._dailyActions.map((d) => ({
        ...d,
        asset: d.asset ? { ...d.asset } : null,
      })),
      status: this._status,
      result: this._result ? { ...this._result } : undefined,
      learning: this._learning,
      companyName: this._companyName,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
