"use client";

import {
  Bar,
  BarChart,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChannelCacReport, ChannelCacRow } from "@/types/marketing-metrics";
import { RATING_COLOR, eur } from "@/components/metrics/format";

function CacTooltip({
  active,
  payload,
  blended,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChannelCacRow }>;
  blended: number | null;
}) {
  if (!active || !payload?.length) return null;
  const r = payload[0].payload;
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-semibold text-zinc-100">{r.channel}</p>
      <p className="text-zinc-300">
        CAC :{" "}
        <span className="font-medium text-zinc-50">
          {r.cac !== null ? eur.format(r.cac) : "n/a"}
        </span>
      </p>
      <p className="text-zinc-400">Dépense : {eur.format(r.spend)}</p>
      <p className="text-zinc-400">Nouveaux clients : {r.newCustomers}</p>
      {r.vsBlendedPct !== null && (
        <p className={r.vsBlendedPct > 0 ? "text-rose-400" : "text-emerald-400"}>
          {r.vsBlendedPct > 0 ? "+" : ""}
          {Math.round(r.vsBlendedPct * 100)}% vs CAC moyen
          {blended !== null ? ` (${eur.format(blended)})` : ""}
        </p>
      )}
    </div>
  );
}

export default function CacByChannelChart({
  report,
}: {
  report: ChannelCacReport;
}) {
  const rated = report.rows.filter((r) => r.cac !== null);

  if (rated.length === 0) {
    return (
      <p className="py-6 text-center text-xs text-zinc-500">
        Pas encore de CAC calculable par canal.
      </p>
    );
  }

  const chartHeight = Math.max(150, rated.length * 52);

  return (
    <div style={{ height: chartHeight }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={rated}
          margin={{ top: 12, right: 16, bottom: 4, left: 8 }}
        >
          <XAxis
            type="number"
            tick={{ fill: "#a1a1aa", fontSize: 11 }}
            tickFormatter={(v) => `${Math.round(Number(v))}€`}
            axisLine={{ stroke: "#3f3f46" }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="channel"
            width={104}
            tick={{ fill: "#d4d4d8", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "#ffffff0a" }}
            content={<CacTooltip blended={report.blendedCac} />}
          />
          {report.blendedCac !== null && (
            <ReferenceLine
              x={report.blendedCac}
              stroke="#e4e4e7"
              strokeDasharray="4 4"
              label={{
                value: `moyen ${Math.round(report.blendedCac)}€`,
                position: "top",
                fill: "#a1a1aa",
                fontSize: 10,
              }}
            />
          )}
          <Bar dataKey="cac" radius={[0, 4, 4, 0]} barSize={22}>
            {rated.map((r) => (
              <Cell key={r.channel} fill={RATING_COLOR[r.rating]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
