/** One distinct hue per indicator, used both for the map's default
 * categorical "dominant issue" coloring and as the full-intensity endpoint
 * of that indicator's own sequential gradient when picked individually. */
export const INDICATOR_COLORS: Record<string, string> = {
  unemployment: "#f5a524", // amber
  poverty: "#ec4899", // pink
  crime: "#dc2626", // red
  education: "#38bdf8", // sky blue
  health: "#8b7cf6", // violet
  pollution: "#94a3b8", // slate/smog grey
};

export const FALLBACK_COLOR = "#1e293b";

export function colorForIndicator(indicatorId: string | null | undefined): string {
  if (!indicatorId) return FALLBACK_COLOR;
  return INDICATOR_COLORS[indicatorId] ?? FALLBACK_COLOR;
}

/** Blends an indicator's color toward the map's background at low severity,
 * reaching full color at percentile 1 — used for the single-indicator
 * sequential choropleth mode. */
export function sequentialColor(indicatorId: string, percentile: number): string {
  const base = colorForIndicator(indicatorId);
  const t = Math.max(0, Math.min(1, percentile));
  const minOpacity = 0.18;
  const opacity = minOpacity + t * (1 - minOpacity);
  const r = parseInt(base.slice(1, 3), 16);
  const g = parseInt(base.slice(3, 5), 16);
  const b = parseInt(base.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity.toFixed(3)})`;
}
