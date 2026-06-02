// ============================================================
// /strategy/demo — preview route rendering the PriorityPyramid against a
// fully-populated fake strategy (DEMO_STRATEGY). Lets us see the component
// with every tracked tier covered, without generating a real strategy.
// ============================================================

import { assessPriorityPyramid } from "@/domains/strategy/services/priority-pyramid";
import { PriorityPyramid } from "@/components/strategy/priority-pyramid";
import { DEMO_STRATEGY } from "./demo-strategy";

export default async function StrategyDemoPage({
  searchParams,
}: {
  searchParams: Promise<{ open?: string; expand?: string }>;
}) {
  const { open, expand } = await searchParams;
  const assessment = assessPriorityPyramid(DEMO_STRATEGY);

  return (
    <main className="min-h-screen bg-zinc-950">
      <PriorityPyramid
        assessment={assessment}
        companyName={DEMO_STRATEGY.metadata.companyName}
        initialItemId={open}
        initialExpanded={expand === "1"}
      />
    </main>
  );
}
