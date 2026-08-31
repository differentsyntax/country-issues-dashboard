# Country Issues Dashboard

An interactive dashboard of the real, publicly-sourced civic and administrative
indicators facing a country's states/regions — colored by each region's
dominant issue, with a per-indicator drill-down, ruling government, and real
context for every state. Currently ships with one country — **India** — with
the data layer structured so more countries can be added as siblings.

**Every number on this dashboard is real, cited, and traceable to its source
— see "How the Data Works" below.**

## Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS v4** — utility-first styling
- **Framer Motion** — smooth animations and transitions
- **D3-geo** — hand-rolled SVG state map (no react-simple-maps due to React 19 peer-dependency conflicts)
- **Zustand** — lightweight state management
- **lucide-react** — icon library (tree-shaken to only the icons this app actually uses)

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. (Optional) Enable live Air Quality: get a free token at
   [aqicn.org/data-platform/token](https://aqicn.org/data-platform/token/)
   and put it in `.env.local`:
   ```
   AQICN_TOKEN=your-token-here
   ```
   Without it, everything else works normally — Air Quality just shows as
   "not configured" instead of live data.

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## How the Data Works

Five of the six tracked indicators come from real, individually-cited
government/official sources, fetched from their Wikipedia-hosted "List of
Indian states by X" pages (each of which cites its own primary source —
PLFS, NCRB, NITI Aayog, SRS). Only indicators with a real figure from
2018–19 or later are included — older sources (e.g. the 2011 census figure
for water access) are deliberately left out rather than shown as current:

| Indicator | Real source | Cadence |
|---|---|---|
| Unemployment | Periodic Labour Force Survey (PLFS), MoSPI | as of 2018–19 |
| Poverty (MPI) | NITI Aayog Multidimensional Poverty Index | as of 2023 |
| Crime Rate | National Crime Records Bureau (NCRB) | as of 2023 |
| Education Access (literacy) | PLFS report 2024 | as of 2024 |
| Infant Mortality | Sample Registration System (SRS) | as of 2019 |
| Air Pollution | [AQICN](https://aqicn.org/api/) World Air Quality Index | **live**, fetched per page view |

Ruling government (Chief Minister + party) and state context (zone, capital,
area, population) are also real, sourced from Wikipedia's "Chief minister
(India)" and "States and union territories of India" pages respectively.

Most government sources publish annually or periodically, not daily — each
indicator shows exactly when its figure is from rather than pretending
everything updates in real time. Air Quality is the one genuinely live
piece: AQICN's free tier forbids caching/archiving their data, so it's
fetched fresh per pageview through `src/app/api/aqi/route.ts`, never stored.

State severity is computed by ranking each state's value against every other
state with data for that indicator (direction-aware — e.g. higher
unemployment is worse, higher literacy is better). A state's "dominant
issue" (used for the map's default coloring) is whichever indicator it ranks
worst on, relative to other states.

## Keeping the data current

`scripts/fetch_india_data.py` re-fetches every indicator live and rewrites
`src/data/countries/india/indicators.json`. Run it yourself:

```bash
pip install -r scripts/requirements.txt
python3 scripts/fetch_india_data.py
```

`.github/workflows/refresh-data.yml` runs this automatically once a day and
commits the result if anything changed — a push to `main` then triggers a
normal Netlify deploy, so the live site updates on its own. Every data
change is a visible, timestamped git commit, not a silent overwrite.

## Deploying to Netlify

This repo is Netlify-ready out of the box (`netlify.toml` +
`@netlify/plugin-nextjs`):

1. In Netlify: **Add new site → Import an existing project**, point it at
   this repo. Build command and publish directory are already configured.
2. In **Site configuration → Environment variables**, add `AQICN_TOKEN` if
   you want live Air Quality (optional).
3. In this repo's **Settings → Actions → General**, make sure Actions are
   enabled so `refresh-data.yml` can run and keep the data current.

## Project Structure

```
src/
  data/countries/
    india/
      geo.json          — state/UT boundaries (GeoJSON FeatureCollection)
      indicators.json   — the real, sourced dataset (meta, government, per-state indicators)
      index.ts          — exports both as one CountryPackage
  lib/
    countries.ts        — registry of available countries + the active one
    geo.ts               — d3-geo projection/path built from the active country's geo.json
    data.ts              — typed accessors over the active country's indicators.json
    types.ts             — shared types, including CountryPackage
    indicatorColors.ts   — categorical + sequential color mapping per indicator
    partySymbols.ts      — verified ECI election symbol per political party
    useLiveAqi.ts        — client hook for the live Air Quality endpoint
  app/api/aqi/route.ts   — server-side AQICN proxy (never persists data)
  components/            — map, panels, category picker, etc. — all
                          country-agnostic, they only read from lib/data.ts
                          and lib/geo.ts
scripts/
  fetch_india_data.py    — regenerates src/data/countries/india/indicators.json from live sources
  requirements.txt        — Python deps for the fetch script
```

## Adding Another Country

The components never import India-specific files directly — they go through
`lib/data.ts` / `lib/geo.ts`, which read from `lib/countries.ts`. To add a
new one:

1. Create `src/data/countries/<code>/geo.json` — a GeoJSON `FeatureCollection`
   of that country's states/regions, each feature's `properties` carrying
   `st_nm` (region name, used as the unique key) and `st_code`.
2. Create `src/data/countries/<code>/indicators.json` — same shape as
   `india/indicators.json` (see `src/lib/types.ts` for the exact shape). Write
   your own fetch script (`fetch_<code>_data.py` is a reasonable model to
   copy) sourced from that country's own real, citable data.
3. Create `src/data/countries/<code>/index.ts` exporting a `CountryPackage`
   (see `india/index.ts` — four lines).
4. Register it in `src/lib/countries.ts`'s `COUNTRIES` array.
5. Right now `activeCountry` in `lib/countries.ts` is a single hardcoded pick
   (India) — with two or more countries registered, swap that for a small
   Zustand-backed selection (mirroring `useDashboardStore`) and add a country
   switcher to `Header.tsx`, then thread the selected country through
   `lib/data.ts` / `lib/geo.ts` instead of the module-level singletons they
   export today. That's the one piece of real refactoring a second country
   requires; everything else above is additive.

**Critical:** the `key` field for each state must exactly match the `st_nm`
property in that country's `geo.json` so the map links correctly to state
boundaries.

## Known Simplifications

- **Small island/UT territories (India):** Very small territories (Delhi,
  Chandigarh, Puducherry, Lakshadweep, Andaman & Nicobar, Goa, Dadra and Nagar
  Haveli and Daman and Diu, Sikkim) are hard to click as thin map shapes at
  this scale, so the map adds a small colored marker dot at each of their
  centroids as an easier click target. The `SMALL_MARKERS` list lives in
  `src/components/RegionMap.tsx`.
- **Basemap resolution:** State boundaries are dissolved from a
  district-level shapefile and simplified for file size / render speed, so
  coastlines and borders are stylized rather than survey-precise. Good enough
  for a choropleth, not for legal/administrative boundary lookups.
- **Data coverage varies by indicator:** not every source publishes a value
  for every state/UT (see the "matched N/36" counts printed by the fetch
  script). Missing values are omitted, never fabricated — a state's "top
  issues" list only shows indicators it actually has real data for.
- **Party symbols:** shown for parties whose ECI-allotted symbol has been
  individually verified (see `src/lib/partySymbols.ts`); any other party
  gets a neutral fallback rather than a guessed symbol.
- **Live Air Quality coverage:** AQICN's city search doesn't report a "no
  match" status — when it can't find a station for a state's capital, it can
  silently return some unrelated station elsewhere instead (observed:
  querying "Raipur" once returned a Dehradun reading). `src/app/api/aqi/route.ts`
  only accepts a result if the requested city name actually appears in the
  returned station's name, so some capitals without a name-matching station
  show no live AQI rather than a reading from the wrong place. Showing
  nothing is better than showing wrong data.
- Only one country is active at a time (see "Adding Another Country" above
  for what a live switcher needs).
