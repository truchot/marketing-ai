// ============================================================
// /strategy — renders the latest generated strategy against the
// 2026 Marketing Priorities pyramid. Server component: it reads the
// strategy through the GetStrategy use case (composition root) and
// computes the assessment server-side before handing it to the client
// PriorityPyramid component.
// ============================================================

import Link from "next/link";
import { getStrategyUseCase } from "@/infrastructure/composition-root";
import { assessPriorityPyramid } from "@/domains/strategy/services/priority-pyramid";
import { PriorityPyramid } from "@/components/strategy/priority-pyramid";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function StrategyPage() {
  const result = await getStrategyUseCase.execute();

  if (result.isErr()) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 text-center">
        <h1 className="text-xl font-semibold text-zinc-200">No strategy yet</h1>
        <p className="mt-2 max-w-md text-sm text-zinc-500">
          Generate a marketing strategy first — your 2026 priorities pyramid will appear here,
          showing which foundations are solid and which still need work.
        </p>
        <Link
          href="/"
          className="mt-6 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
        >
          Back home
        </Link>
      </main>
    );
  }

  const strategy = result.value.toStrategy();
  const assessment = assessPriorityPyramid(strategy);

  return (
    <main className="min-h-screen bg-zinc-950">
      <PriorityPyramid assessment={assessment} companyName={strategy.metadata.companyName} />
    </main>
  );
}
