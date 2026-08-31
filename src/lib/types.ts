export interface CategoryDef {
  id: string;
  label: string;
  icon: string;
  tags: string[];
  season: number[] | null;
}

export interface TopIssue {
  categoryId: string;
  label: string;
  icon: string;
  count: number;
  deltaPct: number | null;
}

export interface PeriodMeta {
  period: string;
  label: string;
  reportNo: number;
  asOf: string;
}

export interface StatePeriodEntry {
  period: string;
  totalGrievances: number;
  topIssues: TopIssue[];
}

export interface StateEntry {
  name: string;
  key: string;
  populationMillions: number;
  archetypes: string[];
  series: StatePeriodEntry[];
}

export interface NationalPeriodEntry {
  period: string;
  totalGrievances: number;
  topIssues: TopIssue[];
}

export interface IssuesDataset {
  meta: {
    title: string;
    cadence: string;
    generatedNote: string;
    periods: PeriodMeta[];
    categories: CategoryDef[];
  };
  national: NationalPeriodEntry[];
  states: StateEntry[];
}

/** Property shape on each feature of a country's region-boundary GeoJSON. */
export interface RegionProps {
  st_nm: string;
  st_code: string;
}

/**
 * Everything needed to render the dashboard for one country: its region
 * boundaries plus its issues dataset. To add a new country, create
 * src/data/countries/<code>/{geo.json,issues.json,index.ts} following the
 * `india` package as a template, then register it in src/lib/countries.ts.
 */
export interface CountryPackage {
  id: string;
  name: string;
  flag: string;
  geo: GeoJSON.FeatureCollection<GeoJSON.Geometry, RegionProps>;
  dataset: IssuesDataset;
}
