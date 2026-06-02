"use client";

import { useCallback, useEffect, useState } from "react";
import { logError } from "@/lib/error-handler";
import type { ChannelCacReport, MetricSource } from "@/types/marketing-metrics";
import CacByChannelChart from "@/components/metrics/cac-by-channel-chart";
import ChannelDistributionBlock from "@/components/metrics/channel-distribution-block";

const SOURCE_LABEL: Record<MetricSource, string> = {
  ga4: "GA4",
  meta_ads: "Meta Ads",
  linkedin_ads: "LinkedIn Ads",
  hubspot: "HubSpot",
  manual: "Saisie manuelle",
  derived: "Estimé (discovery)",
};

export default function MetricsPanel() {
  const [report, setReport] = useState<ChannelCacReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Kept free of synchronous setState so it's safe to call from an effect.
  const runFetch = useCallback(() => {
    return fetch("/api/metrics/cac-by-channel")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setReport(data as ChannelCacReport);
        setError(null);
      })
      .catch((e: unknown) => {
        logError("metrics:cac", e);
        setError("Impossible de charger les métriques.");
      })
      .finally(() => setLoading(false));
  }, []);

  // User-triggered reload: show the spinner, then refetch.
  const reload = useCallback(() => {
    setLoading(true);
    void runFetch();
  }, [runFetch]);

  useEffect(() => {
    void runFetch();
  }, [runFetch]);

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-zinc-950">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/90 px-5 py-4 backdrop-blur">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-bold tracking-tight text-zinc-100">
            Marketing metrics
          </h2>
          <button
            type="button"
            onClick={reload}
            className="text-[11px] font-medium text-zinc-500 hover:text-zinc-300"
          >
            ↻ Refresh
          </button>
        </div>
        <p className="mt-0.5 text-[11px] text-zinc-500">
          Vos chiffres, mieux présentés
        </p>
      </div>

      <div className="space-y-4 px-5 py-5">
        {loading && (
          <div className="flex h-40 items-center justify-center text-sm text-zinc-500">
            Chargement…
          </div>
        )}

        {error && !loading && (
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-sm text-zinc-500">
            <p>{error}</p>
            <button
              type="button"
              onClick={reload}
              className="rounded-md border border-zinc-700 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
            >
              Réessayer
            </button>
          </div>
        )}

        {report && !loading && !error && (
          <>
            {/* Distribution block (Tremor-style): where the money goes */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold text-zinc-200">
                  Canaux d&apos;acquisition
                </h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    report.estimated
                      ? "bg-amber-500/15 text-amber-300"
                      : "bg-emerald-500/15 text-emerald-300"
                  }`}
                >
                  {report.estimated ? "⚠️ " : "✅ "}
                  {SOURCE_LABEL[report.source]}
                </span>
              </div>
              <ChannelDistributionBlock report={report} />
            </div>

            {/* Efficiency chart: what each € buys */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
              <h3 className="mb-1 text-xs font-semibold text-zinc-200">
                CAC par canal
              </h3>
              <p className="mb-2 text-[11px] text-zinc-500">
                Coût d&apos;acquisition vs CAC moyen
              </p>
              <CacByChannelChart report={report} />
            </div>

            {/* Connectors note */}
            {report.estimated && (
              <p className="text-[11px] leading-relaxed text-zinc-500">
                Chiffres <span className="text-amber-300/90">estimés</span> depuis
                le discovery. Branche un connecteur (GA4, Meta Ads, LinkedIn Ads,
                HubSpot) via ses variables d&apos;environnement pour des données
                réelles.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
