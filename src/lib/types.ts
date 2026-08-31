/** Direction in which a raw indicator value gets worse, used to orient
 * severity ranking (rank 1 / percentile 1.0 is always "most severe"). */
export type IndicatorDirection = "higherIsWorse" | "lowerIsWorse";

export interface IndicatorDef {
  id: string;
  label: string;
  icon: string;
  unit: string;
  direction: IndicatorDirection;
  /** When the underlying real source was published — null for `live` ones. */
  asOf: string | null;
  sourceName: string;
  sourceUrl: string;
  /** true for indicators fetched live per-pageview (not stored in the
   * committed dataset), e.g. Air Pollution. */
  live?: boolean;
}

/** One state's real, sourced reading for one indicator, plus its severity
 * ranking relative to every other state that has data for it. */
export interface StateIndicatorValue {
  indicatorId: string;
  value: number;
  rank: number;
  outOf: number;
  /** 0..1, 1 = most severe among states with data for this indicator. */
  percentile: number;
}

export interface StateGovernment {
  cmName: string;
  party: string;
}

export interface StateEntry {
  name: string;
  key: string;
  zone: string | null;
  capital: string | null;
  areaKm2: number | null;
  population2011: number | null;
  /** null for UTs administered without an elected Chief Minister. */
  government: StateGovernment | null;
  /** Only indicators with real matched data for this state. */
  indicators: StateIndicatorValue[];
  /** The indicator with the highest severity percentile for this state —
   * drives the map's default categorical coloring. Null if no data matched. */
  topIssueId: string | null;
}

export interface IndicatorsDataset {
  meta: {
    title: string;
    generatedAt: string;
    generatedNote: string;
    indicators: IndicatorDef[];
    contextSourceName: string;
    contextSourceUrl: string;
    governmentSourceName: string;
    governmentSourceUrl: string;
  };
  government: Record<string, StateGovernment>;
  states: StateEntry[];
}

/** Property shape on each feature of a country's region-boundary GeoJSON. */
export interface RegionProps {
  st_nm: string;
  st_code: string;
}

/**
 * Everything needed to render the dashboard for one country: its region
 * boundaries plus its indicators dataset. To add a new country, create
 * src/data/countries/<code>/{geo.json,indicators.json,index.ts} following
 * the `india` package as a template, then register it in
 * src/lib/countries.ts.
 */
export interface CountryPackage {
  id: string;
  name: string;
  flag: string;
  geo: GeoJSON.FeatureCollection<GeoJSON.Geometry, RegionProps>;
  dataset: IndicatorsDataset;
}
