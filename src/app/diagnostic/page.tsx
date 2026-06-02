import { DiagnosticGridFromDiagnostic } from "@/components/diagnostic/diagnostic-grid";
import { SAMPLE_DIAGNOSTIC } from "@/components/diagnostic/sample-diagnostic";

// Preview page for the 16-problem marketing diagnostic grid.
export default function DiagnosticPreviewPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <DiagnosticGridFromDiagnostic diagnostic={SAMPLE_DIAGNOSTIC} />
      </div>
    </main>
  );
}
