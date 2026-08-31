import { activeCountry } from "./countries";
import type { StateEntry, NationalPeriodEntry } from "./types";

export const country = activeCountry;
export const dataset = activeCountry.dataset;

export const periods = dataset.meta.periods;
export const categories = dataset.meta.categories;
export const states = dataset.states;

export const categoryById = new Map(categories.map((c) => [c.id, c]));
export const stateByKey = new Map(states.map((s) => [s.key, s]));

export function getNationalForPeriod(period: string): NationalPeriodEntry | undefined {
  return dataset.national.find((n) => n.period === period);
}

export function getStateForPeriod(stateKey: string, period: string) {
  const state = stateByKey.get(stateKey);
  if (!state) return undefined;
  return state.series.find((s) => s.period === period);
}

export function getStateSeries(stateKey: string) {
  return stateByKey.get(stateKey)?.series ?? [];
}

/** Severity bucket 0..3 based on how this state's leading-issue count compares to the national median leading count in the same period, used for map choropleth shading. */
export function severityForState(state: StateEntry, period: string, allStates: StateEntry[]): number {
  const entry = state.series.find((s) => s.period === period);
  if (!entry || entry.topIssues.length === 0) return 0;
  const top = entry.topIssues[0].count;
  const normalized = top / Math.max(1, state.populationMillions);

  const allNormalized = allStates
    .map((s) => {
      const e = s.series.find((x) => x.period === period);
      if (!e || e.topIssues.length === 0) return 0;
      return e.topIssues[0].count / Math.max(1, s.populationMillions);
    })
    .filter((v) => v > 0)
    .sort((a, b) => a - b);

  const idx = allNormalized.findIndex((v) => v >= normalized);
  const percentile = idx < 0 ? 1 : idx / allNormalized.length;
  if (percentile > 0.85) return 3;
  if (percentile > 0.6) return 2;
  if (percentile > 0.3) return 1;
  return 0;
}

export function formatCount(n: number): string {
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}
