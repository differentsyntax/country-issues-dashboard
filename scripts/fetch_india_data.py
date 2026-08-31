#!/usr/bin/env python3
"""
Fetches the real dataset backing the dashboard from live, public, cited
sources and writes src/data/countries/india/indicators.json.

This REPLACES the old generate_india_data.py simulator. Every number here
comes from a real published source — no seeded/synthetic data.

Sources (each also embedded per-indicator in the output JSON, and rendered
in-app with a link):
  - Unemployment rate: PLFS 2018-19 (MoSPI), via Wikipedia
  - Poverty rate (MPI): NITI Aayog, 2023, via Wikipedia
  - Crime rate: NCRB "Crime in India" 2023, via Wikipedia
  - Literacy rate: PLFS report 2024, via Wikipedia
  - Infant mortality rate: Sample Registration System (SRS) 2019, via
    Wikipedia
  - Access to safe drinking water: Census 2011, via Wikipedia
  - Ruling government (CM + party): Wikipedia "Chief minister (India)",
    current list section
  - State basics (zone, capital, area): Wikipedia "States and union
    territories of India"

Air Quality (pollution) is intentionally NOT fetched/stored here: AQICN's
free API terms forbid caching or redistributing their data, so it's fetched
live, per pageview, by src/app/api/aqi/route.ts instead.

Run: python3 scripts/fetch_india_data.py
Requires: requests, beautifulsoup4 (pip install -r scripts/requirements.txt)
"""
import json
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "data" / "countries" / "india" / "indicators.json"

API = "https://en.wikipedia.org/w/api.php"
HEADERS = {
    "User-Agent": "country-issues-dashboard/1.0 "
    "(https://github.com/differentsyntax/country-issues-dashboard; "
    "data-fetch-script, contact via GitHub issues)"
}

# The 36 canonical state/UT names, matching `st_nm` in geo.json.
CANONICAL_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
    "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
    "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
    "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
    "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
]

# Short/alternate forms seen across the various Wikipedia tables, mapped to
# the canonical name above. Anything not resolvable here is skipped with a
# printed warning rather than guessed.
STATE_ALIASES = {
    "a&n islands": "Andaman and Nicobar Islands",
    "andaman & nicobar islands": "Andaman and Nicobar Islands",
    "d&n haveli and daman & diu": "Dadra and Nagar Haveli and Daman and Diu",
    "dadra & nagar haveli and daman & diu": "Dadra and Nagar Haveli and Daman and Diu",
    "jammu & kashmir": "Jammu and Kashmir",
    "nct of delhi": "Delhi",
    "pondicherry": "Puducherry",
    "orissa": "Odisha",
    "keralam": "Kerala",
    "uttaranchal": "Uttarakhand",
}


def normalize_state(raw: str) -> str | None:
    """Strip Wikipedia footnote markers and match against the canonical
    state/UT list. Returns None (never a guess) if unresolvable."""
    name = re.sub(r"\[.*?\]", "", raw).strip()
    name = re.sub(r"\s+", " ", name)
    if name in CANONICAL_STATES:
        return name
    key = name.lower().replace("&", "and")
    key = re.sub(r"\s+", " ", key).strip()
    if key in STATE_ALIASES:
        return STATE_ALIASES[key]
    for canonical in CANONICAL_STATES:
        if canonical.lower().replace("&", "and") == key:
            return canonical
    return None


def table_to_grid(table) -> list[list[str]]:
    """Parse an HTML <table>, respecting rowspan/colspan, into a list of
    rows where each row is fully filled in (spanned cells repeated)."""
    grid = []
    pending: dict[int, tuple[str, int]] = {}
    for row_el in table.find_all("tr"):
        cells = row_el.find_all(["th", "td"])
        row = []
        col = 0
        cell_iter = iter(cells)
        current = next(cell_iter, None)
        while current is not None or col in pending:
            if col in pending:
                text, remaining = pending[col]
                row.append(text)
                pending[col] = (text, remaining - 1) if remaining > 1 else None
                if pending[col] is None:
                    del pending[col]
                col += 1
                continue
            if current is None:
                break
            text = current.get_text(" ", strip=True)
            colspan = int(current.get("colspan", 1))
            rowspan = int(current.get("rowspan", 1))
            for i in range(colspan):
                row.append(text)
                if rowspan > 1:
                    pending[col + i] = (text, rowspan - 1)
            col += colspan
            current = next(cell_iter, None)
        grid.append(row)
    return grid


_page_cache: dict[str, list] = {}


def _wikitables_from_html(html: str) -> list:
    soup = BeautifulSoup(html, "html.parser")
    return [table_to_grid(t) for t in soup.find_all("table", class_="wikitable")]


def fetch_wikitables(title: str) -> list:
    if title in _page_cache:
        return _page_cache[title]
    r = requests.get(
        API,
        params={"action": "parse", "page": title, "format": "json", "prop": "text", "redirects": 1},
        headers=HEADERS,
        timeout=20,
    )
    r.raise_for_status()
    data = r.json()
    if "error" in data:
        raise RuntimeError(f"Wikipedia API error fetching '{title}': {data['error']}")
    tables = _wikitables_from_html(data["parse"]["text"]["*"])
    _page_cache[title] = tables
    time.sleep(0.4)  # be polite to Wikipedia's API
    return tables


def fetch_wikitables_in_section(title: str, section_title: str) -> list:
    """Fetch only the wikitable(s) inside a named section of a page, found
    by looking up the section index by its title rather than a hardcoded
    number (page structure can change between refreshes)."""
    cache_key = f"{title}#{section_title}"
    if cache_key in _page_cache:
        return _page_cache[cache_key]
    r = requests.get(
        API,
        params={"action": "parse", "page": title, "format": "json", "prop": "sections", "redirects": 1},
        headers=HEADERS,
        timeout=20,
    )
    r.raise_for_status()
    sections = r.json()["parse"]["sections"]
    match = next((s for s in sections if s["line"].strip() == section_title), None)
    if match is None:
        raise RuntimeError(
            f"Section '{section_title}' not found on '{title}' — page structure may "
            f"have changed. Available sections: {[s['line'] for s in sections]}"
        )
    r2 = requests.get(
        API,
        params={"action": "parse", "page": title, "format": "json", "prop": "text", "section": match["index"]},
        headers=HEADERS,
        timeout=20,
    )
    r2.raise_for_status()
    tables = _wikitables_from_html(r2.json()["parse"]["text"]["*"])
    _page_cache[cache_key] = tables
    time.sleep(0.4)
    return tables


def parse_float(raw: str) -> float | None:
    cleaned = re.sub(r"[^\d.\-]", "", raw)
    try:
        return float(cleaned)
    except ValueError:
        return None


# ---------------------------------------------------------------------------
# Per-indicator fetchers. Each returns {state_name: float}.
# ---------------------------------------------------------------------------

def fetch_unemployment() -> dict[str, float]:
    grid = fetch_wikitables("List of states and union territories of India by unemployment rate")[0]
    out = {}
    for row in grid[1:]:
        if len(row) < 2:
            continue
        state = normalize_state(row[0])
        val = parse_float(row[1])
        if state and val is not None:
            out[state] = val
    return out


def fetch_poverty() -> dict[str, float]:
    grid = fetch_wikitables("List of Indian states and union territories by poverty rate")[0]
    out = {}
    for row in grid[3:]:  # 3 header/divider rows
        if len(row) < 5:
            continue
        state = normalize_state(row[1])
        val = parse_float(row[4])  # MPI 2023, most recent unified figure
        if state and val is not None:
            out[state] = val
    return out


def fetch_crime() -> dict[str, float]:
    grid = fetch_wikitables("List of states and union territories of India by crime rate")[0]
    out = {}
    for row in grid[1:]:
        if len(row) < 3 or row[0] in ("India", "States", "Union Territories"):
            continue
        state = normalize_state(row[0])
        val = parse_float(row[2])  # Crime Rate (IPC+SLL) 2023
        if state and val is not None:
            out[state] = val
    return out


def fetch_literacy() -> dict[str, float]:
    grid = fetch_wikitables("List of Indian states and union territories by literacy rate")[0]
    out = {}
    for row in grid[2:]:  # 2 header rows
        if len(row) < 10 or row[0] == "India":
            continue
        state = normalize_state(row[0])
        val = parse_float(row[7])  # PLFS report (2024), Total
        if state and val is not None:
            out[state] = val
    return out


def fetch_infant_mortality() -> dict[str, float]:
    grid = fetch_wikitables("List of Indian states by infant mortality rate")[0]
    out = {}
    for row in grid[2:]:  # 2 header rows
        if len(row) < 3 or row[1] == "India":
            continue
        state = normalize_state(row[1])
        val = parse_float(row[2])  # 2019
        if state and val is not None:
            out[state] = val
    return out


def fetch_water_access() -> dict[str, float]:
    grid = fetch_wikitables("List of Indian states and union territories by access to safe drinking water")[0]
    out = {}
    for row in grid[1:]:
        if len(row) < 3:
            continue
        state = normalize_state(row[1])
        val = parse_float(row[2])
        if state and val is not None:
            out[state] = val
    return out


def fetch_government() -> dict[str, dict]:
    grid = fetch_wikitables_in_section("Chief minister (India)", "Current list")[0]
    out = {}
    for row in grid[1:]:
        if len(row) < 6:
            continue
        state = normalize_state(row[0])
        cm = row[3].strip()
        party = row[5].strip()
        if state and cm and party:
            out[state] = {"cmName": cm, "party": party}
    return out


def fetch_state_basics() -> dict[str, dict]:
    tables = fetch_wikitables("States and union territories of India")
    out = {}
    for idx in (0, 1):  # states table, UTs table
        for row in tables[idx][1:]:
            if len(row) < 9:
                continue
            state = normalize_state(row[0])
            zone = re.sub(r"\[.*?\]", "", row[3]).strip()
            capital = re.sub(r"\[.*?\]", "", row[4]).strip()
            population = parse_float(row[7])
            area = parse_float(row[8])
            if state:
                out[state] = {
                    "zone": zone,
                    "capital": capital,
                    "areaKm2": area,
                    "population2011": int(population) if population else None,
                }
    return out


# ---------------------------------------------------------------------------
# Indicator metadata: id, label, icon, unit, direction, source.
# direction "higherIsWorse" | "lowerIsWorse" determines severity ranking.
# ---------------------------------------------------------------------------

INDICATORS = [
    {
        "id": "unemployment", "label": "Unemployment", "icon": "briefcase",
        "unit": "%", "direction": "higherIsWorse", "asOf": "2018–19",
        "sourceName": "Periodic Labour Force Survey (PLFS), MoSPI — via Wikipedia",
        "sourceUrl": "https://en.wikipedia.org/wiki/List_of_states_and_union_territories_of_India_by_unemployment_rate",
        "fetch": fetch_unemployment,
    },
    {
        "id": "poverty", "label": "Poverty (MPI)", "icon": "wallet",
        "unit": "%", "direction": "higherIsWorse", "asOf": "2023",
        "sourceName": "NITI Aayog Multidimensional Poverty Index — via Wikipedia",
        "sourceUrl": "https://en.wikipedia.org/wiki/List_of_Indian_states_and_union_territories_by_poverty_rate",
        "fetch": fetch_poverty,
    },
    {
        "id": "crime", "label": "Crime Rate", "icon": "shield-alert",
        "unit": "per lakh pop.", "direction": "higherIsWorse", "asOf": "2023",
        "sourceName": "National Crime Records Bureau (NCRB), Crime in India 2023 — via Wikipedia",
        "sourceUrl": "https://en.wikipedia.org/wiki/List_of_states_and_union_territories_of_India_by_crime_rate",
        "fetch": fetch_crime,
    },
    {
        "id": "education", "label": "Education Access", "icon": "school",
        "unit": "% literate", "direction": "lowerIsWorse", "asOf": "2024",
        "sourceName": "Periodic Labour Force Survey (PLFS) report 2024 — via Wikipedia",
        "sourceUrl": "https://en.wikipedia.org/wiki/List_of_Indian_states_and_union_territories_by_literacy_rate",
        "fetch": fetch_literacy,
    },
    {
        "id": "health", "label": "Health (Infant Mortality)", "icon": "stethoscope",
        "unit": "per 1,000 live births", "direction": "higherIsWorse", "asOf": "2019",
        "sourceName": "Sample Registration System (SRS), Ministry of Health — via Wikipedia",
        "sourceUrl": "https://en.wikipedia.org/wiki/List_of_Indian_states_by_infant_mortality_rate",
        "fetch": fetch_infant_mortality,
    },
    {
        "id": "water", "label": "Water Supply & Scarcity", "icon": "droplet",
        "unit": "% households with access", "direction": "lowerIsWorse", "asOf": "2011",
        "sourceName": "Census of India 2011 — via Wikipedia",
        "sourceUrl": "https://en.wikipedia.org/wiki/List_of_Indian_states_and_union_territories_by_access_to_safe_drinking_water",
        "fetch": fetch_water_access,
    },
    {
        "id": "pollution", "label": "Air Quality", "icon": "wind",
        "unit": "AQI", "direction": "higherIsWorse", "asOf": None,
        "sourceName": "World Air Quality Index Project (AQICN), real-time",
        "sourceUrl": "https://aqicn.org/",
        "live": True,
        "fetch": None,
    },
]


def compute_severity(values: dict[str, float], direction: str) -> dict[str, dict]:
    """Rank + percentile per state, direction-adjusted so rank 1 / percentile
    1.0 is always the most severe."""
    if not values:
        return {}
    worst_first = sorted(values.items(), key=lambda kv: kv[1], reverse=(direction == "higherIsWorse"))
    n = len(worst_first)
    out = {}
    for i, (state, value) in enumerate(worst_first):
        rank = i + 1
        percentile = 1.0 if n == 1 else round(1 - (rank - 1) / (n - 1), 4)
        out[state] = {"value": value, "rank": rank, "outOf": n, "percentile": percentile}
    return out


def main():
    print("Fetching real per-state indicators from Wikipedia...")
    basics = fetch_state_basics()
    government = fetch_government()

    severity_by_indicator: dict[str, dict[str, dict]] = {}
    for ind in INDICATORS:
        if ind.get("live"):
            continue
        print(f"  - {ind['id']} ...")
        raw_values = ind["fetch"]()
        matched = len(raw_values)
        print(f"    matched {matched}/{len(CANONICAL_STATES)} states/UTs")
        severity_by_indicator[ind["id"]] = compute_severity(raw_values, ind["direction"])

    states_out = []
    unmatched_states = []
    for state in CANONICAL_STATES:
        indicators = []
        for ind in INDICATORS:
            if ind.get("live"):
                continue
            sev = severity_by_indicator[ind["id"]].get(state)
            if sev:
                indicators.append({"indicatorId": ind["id"], **sev})
        top_issue_id = None
        if indicators:
            top_issue_id = max(indicators, key=lambda x: x["percentile"])["indicatorId"]
        gov = government.get(state)
        basic = basics.get(state, {})
        entry = {
            "name": state,
            "key": state,
            "zone": basic.get("zone"),
            "capital": basic.get("capital"),
            "areaKm2": basic.get("areaKm2"),
            "population2011": basic.get("population2011"),
            "government": gov,  # None for UTs without an elected CM
            "indicators": indicators,
            "topIssueId": top_issue_id,
        }
        states_out.append(entry)
        if not indicators:
            unmatched_states.append(state)

    if unmatched_states:
        print(f"WARNING: no indicator data matched for: {', '.join(unmatched_states)}", file=sys.stderr)

    output = {
        "meta": {
            "title": "India Civic Issues Tracker",
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "generatedNote": (
                "Every figure below comes from a real, cited, published source "
                "(see each indicator's source link). Nothing here is simulated. "
                "Most sources publish annually or periodically, not daily — see "
                "each indicator's 'as of' date. Air Quality is fetched live per "
                "pageview instead of stored here."
            ),
            "indicators": [
                {k: v for k, v in ind.items() if k != "fetch"} for ind in INDICATORS
            ],
            "contextSourceName": "Wikipedia — States and union territories of India (zone, capital, area, 2011 census population)",
            "contextSourceUrl": "https://en.wikipedia.org/wiki/States_and_union_territories_of_India",
            "governmentSourceName": "Wikipedia — Chief minister (India), current list",
            "governmentSourceUrl": "https://en.wikipedia.org/wiki/Chief_minister_(India)#Current_list",
        },
        "government": government,
        "states": states_out,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(output, indent=2, ensure_ascii=False) + "\n")
    size_kb = OUT.stat().st_size / 1024
    print(f"Wrote {OUT} ({size_kb:.1f} KB), {len(states_out)} states/UTs")


if __name__ == "__main__":
    main()
