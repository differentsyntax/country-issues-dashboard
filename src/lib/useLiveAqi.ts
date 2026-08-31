"use client";

import { useEffect, useState } from "react";
import type { AqiEntry } from "@/app/api/aqi/route";
import type { StateIndicatorValue } from "./types";

interface LiveAqiState {
  loading: boolean;
  available: boolean;
  reason?: string;
  /** Raw per-state AQI readings. */
  byState: Record<string, AqiEntry>;
  /** Same readings converted to StateIndicatorValue (with rank/percentile
   * computed client-side, direction = higherIsWorse), ready to merge
   * alongside the static dataset's indicators. */
  severityByState: Record<string, StateIndicatorValue>;
}

function computeSeverity(byState: Record<string, AqiEntry>): Record<string, StateIndicatorValue> {
  const entries = Object.entries(byState);
  const n = entries.length;
  if (n === 0) return {};
  const worstFirst = [...entries].sort((a, b) => b[1].aqi - a[1].aqi);
  const out: Record<string, StateIndicatorValue> = {};
  worstFirst.forEach(([key, entry], i) => {
    const rank = i + 1;
    const percentile = n === 1 ? 1 : 1 - (rank - 1) / (n - 1);
    out[key] = {
      indicatorId: "pollution",
      value: entry.aqi,
      rank,
      outOf: n,
      percentile: Math.round(percentile * 10000) / 10000,
    };
  });
  return out;
}

/** Fetches live Air Pollution once per session and keeps it in memory —
 * shared across every component that needs it (map coloring, state panel)
 * without refetching per state. */
export function useLiveAqi(): LiveAqiState {
  const [state, setState] = useState<LiveAqiState>({
    loading: true,
    available: false,
    byState: {},
    severityByState: {},
  });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/aqi")
      .then((r) => r.json())
      .then((json: { available: boolean; reason?: string; data?: Record<string, AqiEntry> }) => {
        if (cancelled) return;
        const byState = json.data ?? {};
        setState({
          loading: false,
          available: json.available,
          reason: json.reason,
          byState,
          severityByState: computeSeverity(byState),
        });
      })
      .catch(() => {
        if (cancelled) return;
        setState((s) => ({ ...s, loading: false, available: false, reason: "Air quality request failed" }));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
