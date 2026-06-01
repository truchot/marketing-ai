import { describe, it, expect } from "vitest";
import { ExperimentAggregate } from "@/domains/experimentation/aggregates";
import type { CreateExperimentInput } from "@/domains/experimentation/aggregates";
import type { Hypothesis, ConfidenceSource } from "@/types/experiment";
import type { Action } from "@/types/marketing-strategy";

// --- Builders ---

function makeHypothesis(overrides: Partial<Hypothesis> = {}): Hypothesis {
  return {
    belief: "poster une série sur les erreurs fiscales",
    audience: "freelances en SaaS comptable",
    outcome: "des essais gratuits",
    successMetric: "CTR vers la landing",
    threshold: "> 2%",
    ...overrides,
  };
}

function makeInput(overrides: Partial<CreateExperimentInput> = {}): CreateExperimentInput {
  return {
    keyResultId: "kr-1",
    okrId: "okr-1",
    actionId: "action-1",
    title: "Série LinkedIn erreurs fiscales",
    hypothesis: makeHypothesis(),
    channel: "linkedin",
    audienceSegment: "freelances",
    ice: { impact: 8, confidence: 7, ease: 9 },
    confidenceSources: [{ type: "sector_benchmark", evidence: "secteur SaaS B2B" }],
    companyName: "Kompta",
    ...overrides,
  };
}

function makeAction(overrides: Partial<Action> = {}): Action {
  return {
    id: "action-1",
    okrId: "okr-1",
    keyResultId: "kr-1",
    title: "Créer une page SEO",
    description: "Page d'atterrissage SEO",
    type: "quick_win",
    effort: "low",
    impact: "high",
    requiredSkills: ["marketing"],
    requiredTools: [],
    dependencies: [],
    suggestedTimeline: "Semaine 1-2",
    channel: "seo",
    audienceSegment: "freelances",
    ...overrides,
  };
}

/** Build an experiment with one shipped daily action (status: running). */
function intoRunning(): { agg: ExperimentAggregate; dailyId: string } {
  const agg = ExperimentAggregate.create(makeInput());
  agg.selectForWeek("2026-06-01");
  const dailyId = agg.planDailyAction({ scheduledDate: "2026-06-01", title: "Post #1" });
  agg.produceAsset(dailyId, { format: "linkedin_post", content: "Hook A…" });
  agg.validateDailyAction(dailyId);
  agg.shipDailyAction(dailyId);
  return { agg, dailyId };
}

describe("ExperimentAggregate", () => {
  describe("create", () => {
    it("creates a valid experiment in draft status", () => {
      const agg = ExperimentAggregate.create(makeInput());

      expect(agg.id).toMatch(/^exp-/);
      expect(agg.status).toBe("draft");
      expect(agg.keyResultId).toBe("kr-1");
      expect(agg.okrId).toBe("okr-1");
      expect(agg.actionId).toBe("action-1");
      expect(agg.companyName).toBe("Kompta");
      expect(agg.dailyActions).toHaveLength(0);
      expect(agg.weekOf).toBeUndefined();
    });

    it("computes the ICE priority score = (I + C + E) / 3", () => {
      const agg = ExperimentAggregate.create(makeInput({ ice: { impact: 8, confidence: 7, ease: 9 } }));
      expect(agg.priorityScore).toBe(8); // (8+7+9)/3 = 8
    });

    it("rounds the priority score to 1 decimal", () => {
      const agg = ExperimentAggregate.create(makeInput({ ice: { impact: 5, confidence: 5, ease: 6 } }));
      expect(agg.priorityScore).toBe(5.3); // 16/3 = 5.333 → 5.3
    });

    it("raises EXPERIMENT_CREATED on creation", () => {
      const agg = ExperimentAggregate.create(makeInput());
      const events = agg.getUncommittedEvents();

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("EXPERIMENT_CREATED");
      expect(events[0].payload).toMatchObject({
        experimentId: agg.id,
        keyResultId: "kr-1",
        okrId: "okr-1",
        actionId: "action-1",
        companyName: "Kompta",
        priorityScore: 8,
      });
    });

    it("rejects a missing keyResultId (the guardrail)", () => {
      expect(() => ExperimentAggregate.create(makeInput({ keyResultId: "  " }))).toThrow(
        /linked to a KeyResult/
      );
    });

    it("rejects a missing okrId", () => {
      expect(() => ExperimentAggregate.create(makeInput({ okrId: "" }))).toThrow(/reference its OKR/);
    });

    it("rejects a missing title", () => {
      expect(() => ExperimentAggregate.create(makeInput({ title: "   " }))).toThrow(/must have a title/);
    });

    it("rejects a non-falsifiable hypothesis (empty threshold)", () => {
      expect(() =>
        ExperimentAggregate.create(makeInput({ hypothesis: makeHypothesis({ threshold: "" }) }))
      ).toThrow(/falsifiable/);
    });

    it.each([
      ["impact", { impact: 0, confidence: 5, ease: 5 }],
      ["impact too high", { impact: 11, confidence: 5, ease: 5 }],
      ["confidence", { impact: 5, confidence: 0, ease: 5 }],
      ["ease", { impact: 5, confidence: 5, ease: 11 }],
    ])("rejects out-of-range ICE (%s)", (_label, ice) => {
      expect(() => ExperimentAggregate.create(makeInput({ ice }))).toThrow(/ICE/);
    });

    it("rejects NaN ICE dimensions", () => {
      expect(() =>
        ExperimentAggregate.create(makeInput({ ice: { impact: NaN, confidence: 5, ease: 5 } }))
      ).toThrow(/ICE/);
    });

    it("accepts ICE boundary values 1 and 10", () => {
      const agg = ExperimentAggregate.create(makeInput({ ice: { impact: 1, confidence: 10, ease: 1 } }));
      expect(agg.ice).toEqual({ impact: 1, confidence: 10, ease: 1 });
    });

    it("trims fields and normalizes an empty actionId to undefined", () => {
      const agg = ExperimentAggregate.create(makeInput({ actionId: "   ", title: "  Titre  " }));
      expect(agg.actionId).toBeUndefined();
      expect(agg.title).toBe("Titre");
    });
  });

  describe("promoteFromAction", () => {
    it("seeds ICE impact/ease from the Action levels (high impact → 9, low effort → ease 9)", () => {
      const agg = ExperimentAggregate.promoteFromAction(makeAction({ impact: "high", effort: "low" }), {
        hypothesis: makeHypothesis(),
        confidence: 5,
        companyName: "Kompta",
      });
      expect(agg.ice).toEqual({ impact: 9, confidence: 5, ease: 9 });
    });

    it("maps medium levels to 6", () => {
      const agg = ExperimentAggregate.promoteFromAction(makeAction({ impact: "medium", effort: "medium" }), {
        hypothesis: makeHypothesis(),
        confidence: 6,
        companyName: "Kompta",
      });
      expect(agg.ice).toEqual({ impact: 6, confidence: 6, ease: 6 });
    });

    it("inverts effort into ease (high effort → ease 3)", () => {
      const agg = ExperimentAggregate.promoteFromAction(makeAction({ effort: "high" }), {
        hypothesis: makeHypothesis(),
        confidence: 5,
        companyName: "Kompta",
      });
      expect(agg.ice.ease).toBe(3);
    });

    it("references the Action's keyResultId, okrId and id", () => {
      const action = makeAction({ id: "action-42", okrId: "okr-7", keyResultId: "kr-7" });
      const agg = ExperimentAggregate.promoteFromAction(action, {
        hypothesis: makeHypothesis(),
        confidence: 5,
        companyName: "Kompta",
      });
      expect(agg.actionId).toBe("action-42");
      expect(agg.okrId).toBe("okr-7");
      expect(agg.keyResultId).toBe("kr-7");
    });

    it("defaults title and channel to the Action, allowing overrides", () => {
      const defaulted = ExperimentAggregate.promoteFromAction(makeAction(), {
        hypothesis: makeHypothesis(),
        confidence: 5,
        companyName: "Kompta",
      });
      expect(defaulted.title).toBe("Créer une page SEO");

      const overridden = ExperimentAggregate.promoteFromAction(makeAction(), {
        hypothesis: makeHypothesis(),
        confidence: 5,
        companyName: "Kompta",
        title: "Titre custom",
        channel: "newsletter",
      });
      expect(overridden.title).toBe("Titre custom");
      expect(overridden.toDTO().channel).toBe("newsletter");
    });
  });

  describe("selectForWeek", () => {
    it("moves draft → selected and stores the week", () => {
      const agg = ExperimentAggregate.create(makeInput());
      agg.selectForWeek("2026-06-01");
      expect(agg.status).toBe("selected");
      expect(agg.weekOf).toBe("2026-06-01");
    });

    it("rejects selecting a non-draft experiment", () => {
      const agg = ExperimentAggregate.create(makeInput());
      agg.selectForWeek("2026-06-01");
      expect(() => agg.selectForWeek("2026-06-08")).toThrow(/Only a draft experiment can be selected/);
    });

    it("rejects an empty week date", () => {
      const agg = ExperimentAggregate.create(makeInput());
      expect(() => agg.selectForWeek("  ")).toThrow(/requires the week date/);
    });
  });

  describe("planDailyAction", () => {
    it("rejects planning before selection (draft)", () => {
      const agg = ExperimentAggregate.create(makeInput());
      expect(() => agg.planDailyAction({ scheduledDate: "2026-06-01", title: "Post" })).toThrow(
        /selected\/running/
      );
    });

    it("creates a proposed daily action defaulting the channel to the experiment", () => {
      const agg = ExperimentAggregate.create(makeInput({ channel: "linkedin" }));
      agg.selectForWeek("2026-06-01");
      const id = agg.planDailyAction({ scheduledDate: "2026-06-01", title: "Post #1" });

      expect(id).toMatch(/^daily-/);
      const daily = agg.dailyActions[0];
      expect(daily.status).toBe("proposed");
      expect(daily.channel).toBe("linkedin");
      expect(daily.asset).toBeNull();
      expect(daily.experimentId).toBe(agg.id);
    });

    it("rejects empty scheduledDate or title", () => {
      const agg = ExperimentAggregate.create(makeInput());
      agg.selectForWeek("2026-06-01");
      expect(() => agg.planDailyAction({ scheduledDate: "", title: "Post" })).toThrow(/scheduled date/);
      expect(() => agg.planDailyAction({ scheduledDate: "2026-06-01", title: " " })).toThrow(/title/);
    });
  });

  describe("daily action production lifecycle", () => {
    it("produces, validates, then ships — promoting the experiment to running", () => {
      const agg = ExperimentAggregate.create(makeInput());
      agg.selectForWeek("2026-06-01");
      const id = agg.planDailyAction({ scheduledDate: "2026-06-01", title: "Post #1" });

      agg.produceAsset(id, { format: "linkedin_post", variantLabel: "hook A", content: "Hook A…" });
      expect(agg.dailyActions[0].asset?.content).toBe("Hook A…");

      agg.validateDailyAction(id);
      expect(agg.dailyActions[0].status).toBe("validated");

      agg.shipDailyAction(id);
      expect(agg.dailyActions[0].status).toBe("shipped");
      expect(agg.status).toBe("running");
    });

    it("rejects producing an asset with empty content", () => {
      const agg = ExperimentAggregate.create(makeInput());
      agg.selectForWeek("2026-06-01");
      const id = agg.planDailyAction({ scheduledDate: "2026-06-01", title: "Post" });
      expect(() => agg.produceAsset(id, { format: "linkedin_post", content: "  " })).toThrow(/content/);
    });

    it("rejects validating a daily action with no produced asset", () => {
      const agg = ExperimentAggregate.create(makeInput());
      agg.selectForWeek("2026-06-01");
      const id = agg.planDailyAction({ scheduledDate: "2026-06-01", title: "Post" });
      expect(() => agg.validateDailyAction(id)).toThrow(/no produced asset/);
    });

    it("rejects shipping a non-validated daily action", () => {
      const agg = ExperimentAggregate.create(makeInput());
      agg.selectForWeek("2026-06-01");
      const id = agg.planDailyAction({ scheduledDate: "2026-06-01", title: "Post" });
      agg.produceAsset(id, { format: "linkedin_post", content: "x" });
      expect(() => agg.shipDailyAction(id)).toThrow(/Only a validated daily action can be shipped/);
    });

    it("rejects producing an asset for an already-shipped action", () => {
      const { agg, dailyId } = intoRunning();
      expect(() => agg.produceAsset(dailyId, { format: "linkedin_post", content: "y" })).toThrow(
        /Cannot produce an asset for a shipped/
      );
    });

    it("throws on an unknown daily action id", () => {
      const agg = ExperimentAggregate.create(makeInput());
      agg.selectForWeek("2026-06-01");
      expect(() => agg.validateDailyAction("daily-unknown")).toThrow(/not found/);
    });
  });

  describe("skipDailyAction", () => {
    it("skips a proposed action", () => {
      const agg = ExperimentAggregate.create(makeInput());
      agg.selectForWeek("2026-06-01");
      const id = agg.planDailyAction({ scheduledDate: "2026-06-01", title: "Post" });
      agg.skipDailyAction(id);
      expect(agg.dailyActions[0].status).toBe("skipped");
    });

    it("rejects skipping a shipped action", () => {
      const { agg, dailyId } = intoRunning();
      expect(() => agg.skipDailyAction(dailyId)).toThrow(/shipped daily action cannot be skipped/);
    });
  });

  describe("carryOverDailyAction", () => {
    it("marks the original carried_over and creates a fresh proposed atom", () => {
      const agg = ExperimentAggregate.create(makeInput());
      agg.selectForWeek("2026-06-01");
      const id = agg.planDailyAction({ scheduledDate: "2026-06-01", title: "Post" });
      agg.produceAsset(id, { format: "linkedin_post", content: "draft" });

      const newId = agg.carryOverDailyAction(id, "2026-06-02");

      const original = agg.dailyActions.find((d) => d.id === id);
      const next = agg.dailyActions.find((d) => d.id === newId);
      expect(original?.status).toBe("carried_over");
      expect(next?.status).toBe("proposed");
      expect(next?.scheduledDate).toBe("2026-06-02");
      expect(next?.carryOverFrom).toBe(id);
      expect(next?.asset?.content).toBe("draft"); // carried asset preserved
    });

    it("rejects carrying over a shipped action", () => {
      const { agg, dailyId } = intoRunning();
      expect(() => agg.carryOverDailyAction(dailyId, "2026-06-02")).toThrow(/cannot be carried over/);
    });

    it("rejects an empty new date", () => {
      const agg = ExperimentAggregate.create(makeInput());
      agg.selectForWeek("2026-06-01");
      const id = agg.planDailyAction({ scheduledDate: "2026-06-01", title: "Post" });
      expect(() => agg.carryOverDailyAction(id, "")).toThrow(/new scheduled date/);
    });
  });

  describe("recomputeConfidence", () => {
    it("updates confidence and replaces the sources (weekly recalibration)", () => {
      const agg = ExperimentAggregate.create(makeInput());
      const sources: ConfidenceSource[] = [{ type: "first_party_result", evidence: "boucle #1 : CTR 3.1%" }];
      agg.recomputeConfidence(9, sources);
      expect(agg.ice.confidence).toBe(9);
      expect(agg.confidenceSources).toEqual(sources);
    });

    it("rejects an out-of-range confidence", () => {
      const agg = ExperimentAggregate.create(makeInput());
      expect(() => agg.recomputeConfidence(12, [])).toThrow(/ICE confidence/);
    });

    it("rejects recomputing on a concluded experiment", () => {
      const { agg } = intoRunning();
      agg.conclude({ measuredValue: "3%", metThreshold: true, measuredAt: "2026-06-07" });
      expect(() => agg.recomputeConfidence(5, [])).toThrow(/Cannot recompute confidence on a concluded/);
    });
  });

  describe("conclude", () => {
    it("moves running → concluded, stores the result and raises EXPERIMENT_CONCLUDED", () => {
      const { agg } = intoRunning();
      agg.clearUncommittedEvents();

      agg.conclude({ measuredValue: "2.4%", metThreshold: true, measuredAt: "2026-06-07" });

      expect(agg.status).toBe("concluded");
      expect(agg.toDTO().result).toEqual({
        measuredValue: "2.4%",
        metThreshold: true,
        measuredAt: "2026-06-07",
      });
      const events = agg.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("EXPERIMENT_CONCLUDED");
      expect(events[0].payload).toMatchObject({ experimentId: agg.id, metThreshold: true });
    });

    it("rejects concluding an experiment that is not running", () => {
      const agg = ExperimentAggregate.create(makeInput());
      expect(() =>
        agg.conclude({ measuredValue: "0", metThreshold: false, measuredAt: "2026-06-07" })
      ).toThrow(/Only a running experiment can be concluded/);
    });
  });

  describe("captureLearning", () => {
    it("stores the learning on a concluded experiment", () => {
      const { agg } = intoRunning();
      agg.conclude({ measuredValue: "3%", metThreshold: true, measuredAt: "2026-06-07" });
      agg.captureLearning("L'angle 'peur de l'erreur' surperforme.");
      expect(agg.toDTO().learning).toBe("L'angle 'peur de l'erreur' surperforme.");
    });

    it("rejects capturing learning before conclusion", () => {
      const { agg } = intoRunning();
      expect(() => agg.captureLearning("x")).toThrow(/concluded experiment/);
    });

    it("rejects an empty learning", () => {
      const { agg } = intoRunning();
      agg.conclude({ measuredValue: "3%", metThreshold: true, measuredAt: "2026-06-07" });
      expect(() => agg.captureLearning("   ")).toThrow(/cannot be empty/);
    });
  });

  describe("archive", () => {
    it("archives a draft experiment", () => {
      const agg = ExperimentAggregate.create(makeInput());
      agg.archive();
      expect(agg.status).toBe("archived");
    });

    it("rejects archiving a concluded experiment", () => {
      const { agg } = intoRunning();
      agg.conclude({ measuredValue: "3%", metThreshold: true, measuredAt: "2026-06-07" });
      expect(() => agg.archive()).toThrow(/concluded experiment cannot be archived/);
    });
  });

  describe("persistence (fromPersisted / toDTO)", () => {
    it("round-trips through a DTO without raising events", () => {
      const { agg } = intoRunning();
      const dto = agg.toDTO();

      const restored = ExperimentAggregate.fromPersisted(dto);
      expect(restored.getUncommittedEvents()).toHaveLength(0);
      expect(restored.toDTO()).toEqual(dto);
    });

    it("returns defensive copies of daily actions (mutation does not leak)", () => {
      const { agg } = intoRunning();
      const snapshot = agg.dailyActions;
      // Mutate the returned copy
      (snapshot as unknown as Array<{ status: string }>)[0].status = "HACKED";
      expect(agg.dailyActions[0].status).toBe("shipped");
    });

    it("returns defensive copies of confidence sources", () => {
      const agg = ExperimentAggregate.create(makeInput());
      const a = agg.confidenceSources;
      const b = agg.confidenceSources;
      expect(a).not.toBe(b);
      expect(a).toEqual(b);
    });
  });
});
