import type { CacRating } from "@/types/marketing-metrics";

export const eur = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

// Efficiency (CAC health) colors — used for the verdict badges.
export const RATING_COLOR: Record<CacRating, string> = {
  efficient: "#34d399", // emerald
  watch: "#fbbf24", // amber
  critical: "#fb7185", // rose
  unknown: "#71717a", // zinc
};

export const RATING_LABEL: Record<CacRating, string> = {
  efficient: "Rentable",
  watch: "À surveiller",
  critical: "À couper",
  unknown: "Inconnu",
};

// Categorical channel colors (identity), à la Tremor distribution block.
export const CHANNEL_PALETTE = [
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#06b6d4", // cyan
  "#a1a1aa", // zinc
  "#8b5cf6", // violet
  "#10b981", // emerald
  "#ec4899", // pink
];
