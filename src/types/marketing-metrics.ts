// ============================================================
// Marketing metrics — shared contract.
//
// The data model behind the in-app dashboards (e.g. CAC per channel).
// Framework-neutral: imported by the domain (compute), the API route
// (serialize) and the React dashboards (render).
// ============================================================

export type MetricSource =
  | "ga4"
  | "meta_ads"
  | "linkedin_ads"
  | "hubspot"
  | "manual"
  | "derived"; // estimated from the BusinessDiscovery (no live connector)

export type ChannelType =
  | "organic"
  | "paid"
  | "referral"
  | "partnership"
  | "offline";

/** Raw per-channel input a metrics provider returns for a time window. */
export interface ChannelSpendConversions {
  channel: string;
  type?: ChannelType;
  /** Marketing spend attributed to the channel over the window, in EUR. */
  spend: number;
  /** New customers attributed to the channel over the window. */
  newCustomers: number;
  source: MetricSource;
}

export type CacRating = "efficient" | "watch" | "critical" | "unknown";

/** A computed per-channel CAC row, ready to render. */
export interface ChannelCacRow extends ChannelSpendConversions {
  /** spend / newCustomers, or null when no attributed customers. */
  cac: number | null;
  rating: CacRating;
  /** (cac - blended) / blended, or null when either is missing. */
  vsBlendedPct: number | null;
}

export interface ChannelCacReport {
  currency: "EUR";
  /** Human-readable window label (e.g. "30 derniers jours", "estimé"). */
  window: string;
  /** Blended CAC benchmark from the discovery's unit economics. */
  blendedCac: number | null;
  /** Dominant data source for this report. */
  source: MetricSource;
  /** True when the figures are estimated rather than pulled from a live source. */
  estimated: boolean;
  rows: ChannelCacRow[];
  generatedAt: string;
}
