"use client";

import type { ChannelCacReport } from "@/types/marketing-metrics";
import {
  CHANNEL_PALETTE,
  RATING_COLOR,
  RATING_LABEL,
  eur,
} from "@/components/metrics/format";

/**
 * Spend distribution per channel, styled after Tremor's "channel distribution"
 * block: a KPI total, a segmented share bar, and one row per channel with a
 * colored dot, the share %, the spend, and the CAC verdict. Dependency-free.
 */
export default function ChannelDistributionBlock({
  report,
}: {
  report: ChannelCacReport;
}) {
  const total = report.rows.reduce((s, r) => s + r.spend, 0);
  const rows = report.rows
    .map((r, i) => ({
      ...r,
      color: CHANNEL_PALETTE[i % CHANNEL_PALETTE.length],
      share: total > 0 ? r.spend / total : 0,
    }))
    .sort((a, b) => b.spend - a.spend);

  return (
    <div>
      {/* KPI */}
      <p className="text-[11px] text-zinc-500">Dépense marketing / mois</p>
      <p className="text-2xl font-bold tracking-tight text-zinc-50">
        {eur.format(total)}
      </p>
      {report.blendedCac !== null && (
        <p className="mt-0.5 text-[11px] text-zinc-500">
          CAC moyen{" "}
          <span className="font-medium text-zinc-300">
            {eur.format(report.blendedCac)}
          </span>
        </p>
      )}

      {/* Segmented distribution bar */}
      <div className="mt-3 flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-zinc-800">
        {rows.map((r) => (
          <div
            key={r.channel}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{ width: `${r.share * 100}%`, backgroundColor: r.color }}
            title={`${r.channel} — ${Math.round(r.share * 100)}%`}
          />
        ))}
      </div>

      {/* Rows */}
      <div className="mt-3 space-y-1.5">
        {rows.map((r) => (
          <div
            key={r.channel}
            className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2"
          >
            <div className="min-w-0">
              <span className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: r.color }}
                />
                <span className="truncate text-xs text-zinc-200">
                  {r.channel}
                </span>
              </span>
              <p className="mt-0.5 pl-[18px] text-xs">
                <span className="font-bold text-zinc-100">
                  {Math.round(r.share * 100)}%
                </span>
                <span className="text-zinc-500"> · {eur.format(r.spend)}</span>
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs font-semibold text-zinc-100">
                {r.cac !== null ? eur.format(r.cac) : "n/a"}
                <span className="font-normal text-zinc-500"> CAC</span>
              </p>
              <span
                className="mt-0.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium"
                style={{
                  backgroundColor: `${RATING_COLOR[r.rating]}22`,
                  color: RATING_COLOR[r.rating],
                }}
              >
                {RATING_LABEL[r.rating]}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
