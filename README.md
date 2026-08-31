# Country Issues Dashboard

An interactive dashboard of a country's top civic & administrative grievance issues, nationally and region-by-region, on a monthly reporting cadence. Currently ships with one country — **India** — with the data layer structured so more countries can be added as siblings.

## Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS v4** — utility-first styling
- **Framer Motion** — smooth animations and transitions
- **Recharts** — interactive charts and visualizations
- **D3-geo** — hand-rolled SVG state map (no react-simple-maps due to React 19 peer-dependency conflicts)
- **Zustand** — lightweight state management
- **lucide-react** — icon library

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## How the Data Works

This dashboard visualizes civic and administrative grievance issues tracked across a country's states/regions.

**The honest story (India, the current dataset):** the issue category taxonomy — "Power Supply & Outages," "Water Supply & Scarcity," "Land Records & Revenue," "Pension & EPFO Grievances," and others — is grounded in real, published Indian government grievance-reporting themes. The DARPG (Department of Administrative Reforms & Public Grievances) publishes a numbered *monthly* CPGRAMS report covering ministries, departments, and states/UTs. This app mirrors that real monthly reporting cadence, with data spanning September 2025 through August 2026 (reports #43–54).

However, the **exact per-state, per-category complaint counts** displayed are **not live data from a government API**. Why? The official CPGRAMS/data.gov.in feeds require an API key, were not reachable from this build's sandboxed network, and critically, no public source publishes a full per-state, per-category breakdown at the granularity this dashboard shows. So instead, this app uses a **seeded, deterministic, reproducible simulation**. The simulated counts are weighted by real regional patterns:

- Water scarcity issues are weighted higher in arid states (Rajasthan, Gujarat, etc.)
- Flooding and monsoon-related infrastructure issues peak in monsoon months in Assam, Bihar, and Kerala
- Air pollution complaints are higher in winter months in Delhi-NCR
- Power issues correlate with agricultural regions and monsoon patterns
- Population density amplifies complaints in metro/high-density areas

This approach ensures the dashboard is **reproducible, explainable, and geographically sensible** while being clear that the numbers are simulated, not live. Any future country added the same way should carry the same kind of disclosure if it isn't wired to a live feed either — see `src/components/MethodologyNote.tsx`.

## Project Structure

```
src/
  data/countries/
    india/
      geo.json     — state/UT boundaries (GeoJSON FeatureCollection)
      issues.json  — the dataset (meta, national series, per-state series)
      index.ts     — exports both as one CountryPackage
  lib/
    countries.ts   — registry of available countries + the active one
    geo.ts         — d3-geo projection/path built from the active country's geo.json
    data.ts        — typed accessors over the active country's issues.json
    types.ts       — shared types, including CountryPackage
  components/      — map, panels, slider, etc. — all country-agnostic, they
                     only read from lib/data.ts and lib/geo.ts
scripts/
  generate_india_data.py — regenerates src/data/countries/india/issues.json
```

## Adding Another Country

The components never import India-specific files directly — they go through `lib/data.ts` / `lib/geo.ts`, which read from `lib/countries.ts`. To add a new one:

1. Create `src/data/countries/<code>/geo.json` — a GeoJSON `FeatureCollection` of that country's states/regions, each feature's `properties` carrying `st_nm` (region name, used as the unique key) and `st_code`. See "Regenerating the basemap" below for how the India one was built from a district-level shapefile.
2. Create `src/data/countries/<code>/issues.json` — same shape as `india/issues.json` (documented below). Write your own generator script (`generate_<code>_data.py` is a reasonable model to copy) or wire up a real data source if one exists for that country.
3. Create `src/data/countries/<code>/index.ts` exporting a `CountryPackage` (see `india/index.ts` — four lines).
4. Register it in `src/lib/countries.ts`'s `COUNTRIES` array.
5. Right now `activeCountry` in `lib/countries.ts` is a single hardcoded pick (India) — with two or more countries registered, swap that for a small Zustand-backed selection (mirroring `useDashboardStore`) and add a country switcher to `Header.tsx`, then thread the selected country through `lib/data.ts` / `lib/geo.ts` instead of the module-level singletons they export today. That's the one piece of real refactoring a second country requires; everything else above is additive.

### `issues.json` shape

```
{
  "meta": {
    "title": string,
    "cadence": "monthly",
    "generatedNote": string,
    "periods": [{ period, label, reportNo, asOf }, ...],
    "categories": [{ id, label, icon, tags, season }, ...]
  },
  "national": [
    {
      period,
      totalGrievances,
      topIssues: [{ categoryId, label, icon, count, deltaPct }, ...]  // top 5
    }
  ],
  "states": [
    {
      name: string,
      key: string,           // MUST match st_nm in that country's geo.json
      populationMillions: number,
      archetypes: [string],  // tags like "agrarian", "metro", "arid" — drive category weighting
      series: [
        {
          period,
          totalGrievances,
          topIssues: [{ categoryId, label, icon, count, deltaPct }, ...]  // top 3
        }
      ]
    }
  ]
}
```

**Critical:** the `key` field for each state must exactly match the `st_nm` property in that country's `geo.json` so the map links correctly to state boundaries.

## Regenerating the Sample Dataset (India)

```bash
python3 scripts/generate_india_data.py
```

This overwrites `src/data/countries/india/issues.json` with a fresh simulation using the same seeding logic.

## Swapping in Live Data

To wire in a real, live feed from a government or other authoritative source for any country: obtain API access (for India, a free key from [data.gov.in](https://data.gov.in)), write a fetch/ETL script that outputs the `issues.json` shape above, and either replace the relevant `generate_<code>_data.py` or run your script as a separate step before build.

## Known Simplifications

- **Small island/UT territories (India):** Very small territories (Delhi, Chandigarh, Puducherry, Lakshadweep, Andaman & Nicobar, Goa, Dadra and Nagar Haveli and Daman and Diu, Sikkim) are hard to click as thin map shapes at this scale, so the map adds a small colored marker dot at each of their centroids as an easier click target — you'll see both the true shape and a dot for these. The `SMALL_MARKERS` list lives in `src/components/RegionMap.tsx` and is currently India's list specifically; a second country with its own tiny regions would want its own list, keyed off the active country.
- **Basemap resolution:** State boundaries are dissolved from a district-level shapefile and simplified for file size / render speed, so coastlines and borders are stylized rather than survey-precise. Good enough for a choropleth, not for legal/administrative boundary lookups.
- The India basemap reflects the current 28 states + 8 Union Territories (including Telangana and Ladakh as their own entries).
- Only one country is active at a time (see "Adding Another Country" above for what a live switcher needs).
