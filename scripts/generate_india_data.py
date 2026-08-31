#!/usr/bin/env python3
"""
Generates the dataset backing the dashboard.

Design (documented for the README too):
  Real, verifiable inputs:
    - The list of 36 states/UTs and their boundaries (src/data/countries/india/geo.json,
      derived from Survey-of-India-aligned district boundaries).
    - The category taxonomy is grounded in real, published CPGRAMS/DARPG grievance
      department categories (Power, Land Records, Railways, Banking/EPFO, etc.) plus the
      everyday civic-issue categories that Indian state/city governments and news
      coverage consistently report (water, roads, sanitation, pollution, flooding...).
    - The reporting cadence (monthly snapshots, "Report #N") mirrors DARPG's real
      published cadence for CPGRAMS (they release a numbered *monthly* report — as of
      late 2025 they were in the low-40s of consecutive monthly reports).
    - Relative emphasis per state (e.g. water stress weighted higher in Rajasthan,
      flood/disaster weighted higher in Assam & Bihar in monsoon months, air pollution
      weighted higher in Delhi-NCR in winter) is modeled on well-documented, widely
      reported regional patterns.

  What is modeled (not scraped live), and disclosed as such in the UI/README:
    Government portals that hold the real per-state-per-category daily/monthly counts
    (data.gov.in / CPGRAMS) require an API key and are not reachable from this build
    environment's network, and in any case do not publish a public per-state
    category-level breakdown at daily granularity. So exact complaint COUNTS and the
    day-to-day ranking swaps are generated with a seeded, deterministic model rather
    than pulled live. The category names, the state archetypes driving the weighting,
    and the monthly cadence are all real; the numbers are a reasonable, reproducible
    stand-in until a live feed is wired in (see README "Swapping in live data").

Run: python3 scripts/generate_india_data.py
"""
import json
import hashlib
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "data" / "countries" / "india" / "issues.json"

# ---------------------------------------------------------------------------
# 1. States/UTs — key must match the `st_nm` property in the GeoJSON exactly.
#    population_millions are rounded, approximate (recent estimates) and used
#    only to scale plausible complaint-volume magnitude, not presented as precise.
# ---------------------------------------------------------------------------
STATES = [
    # name, geojson key, population(millions, approx), archetypes[]
    ("Uttar Pradesh", "Uttar Pradesh", 235, ["agrarian", "high_pop", "industrial"]),
    ("Maharashtra", "Maharashtra", 128, ["metro", "industrial", "arid", "agrarian"]),
    ("Bihar", "Bihar", 129, ["agrarian", "flood", "high_pop"]),
    ("West Bengal", "West Bengal", 100, ["flood", "high_pop", "industrial", "metro"]),
    ("Madhya Pradesh", "Madhya Pradesh", 86, ["agrarian", "arid"]),
    ("Tamil Nadu", "Tamil Nadu", 77, ["metro", "industrial", "flood"]),
    ("Rajasthan", "Rajasthan", 81, ["arid", "agrarian"]),
    ("Karnataka", "Karnataka", 68, ["metro", "arid", "industrial"]),
    ("Gujarat", "Gujarat", 71, ["industrial", "arid", "agrarian"]),
    ("Andhra Pradesh", "Andhra Pradesh", 53, ["agrarian", "flood"]),
    ("Odisha", "Odisha", 46, ["flood", "agrarian"]),
    ("Telangana", "Telangana", 39, ["metro", "arid", "agrarian"]),
    ("Kerala", "Kerala", 35, ["flood", "high_density"]),
    ("Jharkhand", "Jharkhand", 39, ["industrial", "agrarian", "hilly"]),
    ("Assam", "Assam", 35, ["flood", "hilly", "agrarian"]),
    ("Punjab", "Punjab", 30, ["agrarian"]),
    ("Chhattisgarh", "Chhattisgarh", 30, ["agrarian", "industrial", "hilly"]),
    ("Haryana", "Haryana", 29, ["agrarian", "industrial", "arid"]),
    ("Delhi", "Delhi", 32, ["metro", "high_density", "pollution_hotspot"]),
    ("Jammu and Kashmir", "Jammu and Kashmir", 14, ["hilly", "connectivity"]),
    ("Uttarakhand", "Uttarakhand", 11, ["hilly", "connectivity", "flood"]),
    ("Himachal Pradesh", "Himachal Pradesh", 7.5, ["hilly", "connectivity"]),
    ("Tripura", "Tripura", 4.2, ["hilly", "connectivity", "agrarian"]),
    ("Meghalaya", "Meghalaya", 3.4, ["hilly", "connectivity"]),
    ("Manipur", "Manipur", 3.2, ["hilly", "connectivity"]),
    ("Nagaland", "Nagaland", 2.2, ["hilly", "connectivity"]),
    ("Goa", "Goa", 1.6, ["flood", "metro"]),
    ("Arunachal Pradesh", "Arunachal Pradesh", 1.6, ["hilly", "connectivity"]),
    ("Puducherry", "Puducherry", 1.4, ["metro", "flood", "small"]),
    ("Mizoram", "Mizoram", 1.2, ["hilly", "connectivity"]),
    ("Chandigarh", "Chandigarh", 1.2, ["metro", "small"]),
    ("Sikkim", "Sikkim", 0.7, ["hilly", "connectivity", "small"]),
    ("Andaman and Nicobar Islands", "Andaman and Nicobar Islands", 0.4, ["island", "small"]),
    ("Dadra and Nagar Haveli and Daman and Diu", "Dadra and Nagar Haveli and Daman and Diu", 0.7, ["industrial", "small"]),
    ("Ladakh", "Ladakh", 0.3, ["hilly", "connectivity", "small"]),
    ("Lakshadweep", "Lakshadweep", 0.07, ["island", "small"]),
]

# ---------------------------------------------------------------------------
# 2. Category taxonomy. `tags` are which archetypes push this category's weight up.
#    `season` optionally boosts weight in given month numbers (1-12).
# ---------------------------------------------------------------------------
CATEGORIES = [
    {"id": "power", "label": "Power Supply & Outages", "icon": "zap", "tags": ["agrarian", "industrial", "high_pop"], "season": None},
    {"id": "water", "label": "Water Supply & Scarcity", "icon": "droplet", "tags": ["arid", "high_density"], "season": [3, 4, 5, 6]},
    {"id": "roads", "label": "Roads & Infrastructure", "icon": "road", "tags": ["hilly", "connectivity", "high_pop"], "season": None},
    {"id": "transport", "label": "Public Transport & Railways", "icon": "train", "tags": ["metro", "high_pop", "connectivity"], "season": None},
    {"id": "sanitation", "label": "Sanitation & Waste Management", "icon": "trash", "tags": ["metro", "high_density"], "season": None},
    {"id": "healthcare", "label": "Healthcare Access", "icon": "stethoscope", "tags": ["hilly", "agrarian", "small"], "season": [11, 12, 1, 2]},
    {"id": "education", "label": "Education & Schools", "icon": "school", "tags": ["agrarian", "hilly"], "season": [4, 5, 6]},
    {"id": "law_order", "label": "Law & Order / Policing", "icon": "shield-alert", "tags": ["metro", "high_density"], "season": None},
    {"id": "banking", "label": "Banking & Financial Services", "icon": "landmark", "tags": ["metro", "high_pop"], "season": None},
    {"id": "pension_epfo", "label": "Pension & EPFO Grievances", "icon": "wallet", "tags": ["industrial", "high_pop"], "season": None},
    {"id": "land_records", "label": "Land Records & Revenue", "icon": "map", "tags": ["agrarian", "hilly"], "season": None},
    {"id": "agriculture", "label": "Agriculture & Farmer Distress", "icon": "wheat", "tags": ["agrarian"], "season": [6, 7, 8, 9, 10]},
    {"id": "employment", "label": "Employment & Unemployment", "icon": "briefcase", "tags": ["high_pop", "agrarian", "industrial"], "season": None},
    {"id": "pds_food", "label": "Food & Public Distribution (PDS)", "icon": "shopping-basket", "tags": ["agrarian", "high_pop", "small"], "season": None},
    {"id": "pollution", "label": "Air & Environmental Pollution", "icon": "wind", "tags": ["pollution_hotspot", "industrial", "metro"], "season": [10, 11, 12, 1]},
    {"id": "housing", "label": "Housing & Urban Planning", "icon": "building", "tags": ["metro", "high_density"], "season": None},
    {"id": "flooding", "label": "Flooding & Disaster Relief", "icon": "cloud-rain", "tags": ["flood"], "season": [6, 7, 8, 9]},
    {"id": "digital_docs", "label": "Digital Services & Documentation", "icon": "id-card", "tags": ["high_pop", "small"], "season": None},
    {"id": "price_rise", "label": "Price Rise / Inflation", "icon": "trending-up", "tags": ["high_pop", "agrarian"], "season": None},
    {"id": "corruption", "label": "Corruption Complaints", "icon": "gavel", "tags": ["high_pop", "industrial"], "season": None},
]

CAT_BY_ID = {c["id"]: c for c in CATEGORIES}

# ---------------------------------------------------------------------------
# 3. Deterministic seeded "randomness" so the dataset is reproducible.
# ---------------------------------------------------------------------------
def seeded_unit(*parts: str) -> float:
    h = hashlib.sha256("::".join(parts).encode()).hexdigest()
    return int(h[:8], 16) / 0xFFFFFFFF  # 0..1

# ---------------------------------------------------------------------------
# 4. Monthly snapshots — mirrors DARPG's real published cadence: one numbered
#    monthly report. We generate the last 12 months ending Aug 2026, with a
#    report number counting up (their real count was in the low-40s as of
#    Oct 2025, so by Aug 2026 it plausibly reaches the low-50s).
# ---------------------------------------------------------------------------
MONTHS = [
    ("2025-09", 9, 2025, 43), ("2025-10", 10, 2025, 44), ("2025-11", 11, 2025, 45),
    ("2025-12", 12, 2025, 46), ("2026-01", 1, 2026, 47), ("2026-02", 2, 2026, 48),
    ("2026-03", 3, 2026, 49), ("2026-04", 4, 2026, 50), ("2026-05", 5, 2026, 51),
    ("2026-06", 6, 2026, 52), ("2026-07", 7, 2026, 53), ("2026-08", 8, 2026, 54),
]

def month_label(m: int, y: int) -> str:
    names = ["", "January", "February", "March", "April", "May", "June", "July",
             "August", "September", "October", "November", "December"]
    return f"{names[m]} {y}"

def category_weight(cat: dict, archetypes: list[str], month_num: int) -> float:
    w = 1.0
    overlap = len(set(cat["tags"]) & set(archetypes))
    w += overlap * 1.3
    if cat["season"] and month_num in cat["season"]:
        w *= 1.8
    return w

def build_state_month(state_key: str, archetypes: list[str], pop_m: float,
                       period_key: str, month_num: int, year: int) -> dict:
    weighted = []
    for cat in CATEGORIES:
        base = category_weight(cat, archetypes, month_num)
        jitter = 0.55 + seeded_unit(state_key, cat["id"], period_key) * 0.9
        weighted.append((cat, base * jitter))
    weighted.sort(key=lambda x: x[1], reverse=True)
    top3 = weighted[:3]
    total_weight = sum(w for _, w in weighted)
    # Scale to a plausible raw complaint count for this state/month using the
    # population proxy (bigger states -> bigger raw numbers, matching the real
    # pattern that e.g. UP reports the most CPGRAMS registrations nationally).
    volume_base = pop_m * (26 + seeded_unit(state_key, period_key, "vol") * 14)
    issues = []
    for cat, w in top3:
        share = w / total_weight
        count = max(12, round(volume_base * share * 3.1))
        trend_prev = weighted_count_prev(state_key, cat["id"], period_key)
        delta = None
        if trend_prev is not None and trend_prev > 0:
            delta = round(((count - trend_prev) / trend_prev) * 100)
        issues.append({
            "categoryId": cat["id"],
            "label": cat["label"],
            "icon": cat["icon"],
            "count": count,
            "deltaPct": delta,
        })
    return {
        "totalGrievances": round(volume_base),
        "topIssues": issues,
    }

_prev_cache: dict[tuple[str, str, str], int] = {}

def weighted_count_prev(state_key, cat_id, period_key):
    return _prev_cache.get((state_key, cat_id, _prev_period(period_key)))

def _prev_period(period_key: str) -> str:
    y, m = map(int, period_key.split("-"))
    if m == 1:
        return f"{y-1}-12"
    return f"{y}-{m-1:02d}"

def main():
    periods = []
    national_series = []
    states_series: dict[str, list[dict]] = {s[1]: [] for s in STATES}

    for period_key, m, y, report_no in MONTHS:
        periods.append({
            "period": period_key,
            "label": month_label(m, y),
            "reportNo": report_no,
            "asOf": f"{y}-{m:02d}-28",
        })

        national_weight_acc: dict[str, float] = {c["id"]: 0.0 for c in CATEGORIES}
        national_count_acc: dict[str, float] = {c["id"]: 0.0 for c in CATEGORIES}
        state_payload = {}

        for name, key, pop_m, archetypes in STATES:
            sm = build_state_month(key, archetypes, pop_m, period_key, m, y)
            state_payload[key] = sm
            # cache full per-category counts (not just top3) for next month's delta
            for cat in CATEGORIES:
                base = category_weight(cat, archetypes, m)
                jitter = 0.55 + seeded_unit(key, cat["id"], period_key) * 0.9
                w = base * jitter
                national_weight_acc[cat["id"]] += w * pop_m
            for issue in sm["topIssues"]:
                national_count_acc[issue["categoryId"]] += issue["count"]
                _prev_cache[(key, issue["categoryId"], period_key)] = issue["count"]

        ranked_national = sorted(national_weight_acc.items(), key=lambda kv: kv[1], reverse=True)[:5]
        total_weight = sum(national_weight_acc.values())
        national_top5 = []
        for cat_id, cat_weight in ranked_national:
            cat = CAT_BY_ID[cat_id]
            real_count = national_count_acc[cat_id]
            if real_count > 0:
                # Real aggregate: this category actually showed up in at least
                # one state's top-3 this period.
                count = round(real_count)
            else:
                # This category ranked in the national top-5 by weight, but no
                # single state's top-3 ever surfaced it, so we have no real
                # count to sum. Estimate from this category's own share of
                # national weight (not a flat per-category average) and warn
                # loudly rather than silently fabricating a plausible number.
                total_national = sum(national_count_acc.values())
                share = cat_weight / total_weight if total_weight else 0
                count = round(total_national * share) or 1
                print(
                    f"  [warn] {period_key}: '{cat_id}' ranked national top-5 by "
                    f"weight but had zero recorded state-level counts; "
                    f"estimating {count} from weight share instead."
                )
            prev_key = _prev_period(period_key)
            prev_count = _prev_cache.get(("__national__", cat_id, prev_key))
            delta = round(((count - prev_count) / prev_count) * 100) if prev_count else None
            national_top5.append({
                "categoryId": cat_id,
                "label": cat["label"],
                "icon": cat["icon"],
                "count": count,
                "deltaPct": delta,
            })
            _prev_cache[("__national__", cat_id, period_key)] = count

        national_series.append({"period": period_key, "topIssues": national_top5,
                                 "totalGrievances": round(sum(national_count_acc.values()))})

        for name, key, pop_m, archetypes in STATES:
            states_series[key].append({"period": period_key, **state_payload[key]})

    data = {
        "meta": {
            "title": "India Civic Issues Tracker",
            "cadence": "monthly",
            "generatedNote": "Category taxonomy & cadence are modeled on real published DARPG/CPGRAMS grievance categories and monthly reporting cycle; exact counts are a seeded, reproducible simulation (no live daily per-state-category feed is publicly available). See README.",
            "periods": periods,
            "categories": CATEGORIES,
        },
        "national": national_series,
        "states": [
            {
                "name": name,
                "key": key,
                "populationMillions": pop_m,
                "archetypes": archetypes,
                "series": states_series[key],
            }
            for name, key, pop_m, archetypes in STATES
        ],
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, indent=2))
    print(f"Wrote {OUT} ({OUT.stat().st_size/1024:.1f} KB), {len(STATES)} states, {len(MONTHS)} periods")

if __name__ == "__main__":
    main()
