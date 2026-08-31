import { NextResponse } from "next/server";
import { states } from "@/lib/data";

/**
 * Live Air Quality proxy for AQICN (https://aqicn.org/api/).
 *
 * AQICN's free tier forbids caching/archiving/redistributing their data, so
 * this is fetched fresh per request (Next.js's fetch cache below is a short
 * server-side revalidation window to avoid hammering their API on every
 * pageview, not a stored dataset) and is never written to disk or committed.
 *
 * Requires an AQICN_TOKEN environment variable — get a free one at
 * https://aqicn.org/data-platform/token/ (the `demo` token AQICN publishes
 * for their docs only returns a fixed Shanghai station regardless of the
 * city requested, so it can't be used here). Without a real token this
 * route degrades gracefully: `available: false`, and the UI shows Air
 * Quality as "not configured" rather than wrong data.
 */

export interface AqiEntry {
  aqi: number;
  stationName: string;
  measuredAt: string;
}

interface AqiResponse {
  available: boolean;
  reason?: string;
  data?: Record<string, AqiEntry>;
}

async function fetchOne(city: string, token: string): Promise<AqiEntry | null> {
  try {
    const res = await fetch(
      `https://api.waqi.info/feed/${encodeURIComponent(city)}/?token=${token}`,
      { next: { revalidate: 900 } } // 15 min — never persisted beyond this
    );
    if (!res.ok) return null;
    const json = await res.json();
    if (json.status !== "ok" || typeof json.data?.aqi !== "number") return null;
    return {
      aqi: json.data.aqi,
      stationName: json.data.city?.name ?? city,
      measuredAt: json.data.time?.s ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function GET() {
  const token = process.env.AQICN_TOKEN;
  if (!token) {
    const body: AqiResponse = {
      available: false,
      reason: "AQICN_TOKEN is not configured. Get a free token at https://aqicn.org/data-platform/token/",
    };
    return NextResponse.json(body);
  }

  const capitals = states
    .filter((s) => s.capital)
    .map((s) => ({ key: s.key, capital: s.capital as string }));

  const results = await Promise.all(
    capitals.map(async ({ key, capital }) => [key, await fetchOne(capital, token)] as const)
  );

  const data: Record<string, AqiEntry> = {};
  for (const [key, entry] of results) {
    if (entry) data[key] = entry;
  }

  const body: AqiResponse = { available: true, data };
  return NextResponse.json(body);
}
