"use client";

import { useMemo } from "react";
import { periods, states } from "@/lib/data";
import { useDashboardStore } from "@/lib/store";

export function StateQuickSelect() {
  const periodIndex = useDashboardStore((s) => s.periodIndex);
  const selectedStateKey = useDashboardStore((s) => s.selectedStateKey);
  const selectState = useDashboardStore((s) => s.selectState);
  const period = periods[periodIndex].period;

  const ranked = useMemo(() => {
    return [...states]
      .map((s) => ({
        state: s,
        total: s.series.find((e) => e.period === period)?.totalGrievances ?? 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [period]);

  return (
    <div className="flex flex-wrap gap-1.5">
      {ranked.map(({ state }) => {
        const isSelected = selectedStateKey === state.key;
        return (
          <button
            key={state.key}
            onClick={() => selectState(isSelected ? null : state.key)}
            className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
              isSelected
                ? "border-teal-400/60 bg-teal-400/15 text-teal-300"
                : "border-white/10 bg-white/[0.03] text-white/50 hover:border-white/20 hover:text-white/80"
            }`}
          >
            {state.name}
          </button>
        );
      })}
    </div>
  );
}
