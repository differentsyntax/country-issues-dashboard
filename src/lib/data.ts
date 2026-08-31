import { activeCountry } from "./countries";
import type { StateEntry, IndicatorDef, StateIndicatorValue } from "./types";

export const country = activeCountry;
export const dataset = activeCountry.dataset;

export const indicators = dataset.meta.indicators;
export const states = dataset.states;
export const government = dataset.government;

export const indicatorById = new Map(indicators.map((c) => [c.id, c]));
export const stateByKey = new Map(states.map((s) => [s.key, s]));

/** Statically-known (non-live) indicators, i.e. everything except Air
 * Quality, which is fetched live per pageview instead. */
export const staticIndicators = indicators.filter((i) => !i.live);

export function indicatorValueForState(
  stateKey: string,
  indicatorId: string
): StateIndicatorValue | undefined {
  return stateByKey.get(stateKey)?.indicators.find((i) => i.indicatorId === indicatorId);
}

/** The state's dominant issue, recomputed client-side so a live value (e.g.
 * Air Pollution, which isn't in the static dataset) can outrank a static one
 * once it loads. Falls back to the precomputed static `topIssueId` while
 * the live value is still loading/unavailable. */
export function effectiveTopIssueId(
  state: StateEntry,
  liveValue?: StateIndicatorValue
): string | null {
  const all = liveValue ? [...state.indicators, liveValue] : state.indicators;
  if (all.length === 0) return null;
  return all.reduce((best, cur) => (cur.percentile > best.percentile ? cur : best)).indicatorId;
}

/** A state's top N indicators by severity percentile (most severe first),
 * optionally merging in a live value (e.g. Air Pollution) computed at render
 * time since it isn't in the static dataset. */
export function topIndicatorsForState(
  state: StateEntry,
  n: number,
  extra: StateIndicatorValue[] = []
): StateIndicatorValue[] {
  return [...state.indicators, ...extra]
    .slice()
    .sort((a, b) => b.percentile - a.percentile)
    .slice(0, n);
}

/** Formats a value + its unit, e.g. "23.8%" or "390 per lakh pop." — no
 * space before a unit that starts with a symbol like "%", a space otherwise. */
export function formatIndicatorValue(value: number, indicator: IndicatorDef): string {
  const rounded = Number.isInteger(value) ? value : Math.round(value * 10) / 10;
  const needsSpace = !/^[%]/.test(indicator.unit);
  return `${rounded}${needsSpace ? " " : ""}${indicator.unit}`;
}

export function formatPopulation(n: number | null): string {
  if (n === null) return "Population unknown";
  if (n >= 1_000_000) return `~${(n / 1_000_000).toFixed(1)}M people`;
  if (n >= 1_000) return `~${(n / 1_000).toFixed(0)}K people`;
  return `${n} people`;
}

export function formatArea(km2: number | null): string {
  if (km2 === null) return "";
  return `${km2.toLocaleString("en-IN")} km²`;
}
