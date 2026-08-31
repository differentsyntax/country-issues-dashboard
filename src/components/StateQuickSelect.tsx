"use client";

import { useMemo } from "react";
import { states } from "@/lib/data";
import { useDashboardStore } from "@/lib/store";

/** A plain, keyboard/screen-reader-friendly list of every state as buttons —
 * an easier click/tap target than the map's small SVG shapes. Ranked by
 * worst overall severity percentile so the states under the most pressure
 * surface first. */
export function StateQuickSelect() {
  const selectedStateKey = useDashboardStore((s) => s.selectedStateKey);
  const selectState = useDashboardStore((s) => s.selectState);

  const ranked = useMemo(() => {
    return [...states].sort((a, b) => {
      const aTop = Math.max(0, ...a.indicators.map((i) => i.percentile));
      const bTop = Math.max(0, ...b.indicators.map((i) => i.percentile));
      return bTop - aTop;
    });
  }, []);

  return (
    <div className="flex flex-wrap gap-1.5">
      {ranked.map((state) => {
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
