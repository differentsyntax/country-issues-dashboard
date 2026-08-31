"use client";

import { indicators } from "@/lib/data";
import { colorForIndicator } from "@/lib/indicatorColors";
import { useDashboardStore } from "@/lib/store";

/** Lets the user switch the map from its default "dominant issue per state"
 * categorical coloring to a single-indicator choropleth. */
export function CategoryPicker() {
  const activeIndicatorId = useDashboardStore((s) => s.activeIndicatorId);
  const setActiveIndicator = useDashboardStore((s) => s.setActiveIndicator);

  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Color the map by">
      <button
        onClick={() => setActiveIndicator(null)}
        className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
          activeIndicatorId === null
            ? "border-white/30 bg-white/10 text-white"
            : "border-white/10 bg-white/[0.03] text-white/50 hover:border-white/20 hover:text-white/80"
        }`}
        aria-pressed={activeIndicatorId === null}
      >
        All (top issue)
      </button>
      {indicators.map((ind) => {
        const isActive = activeIndicatorId === ind.id;
        const color = colorForIndicator(ind.id);
        return (
          <button
            key={ind.id}
            onClick={() => setActiveIndicator(isActive ? null : ind.id)}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
              isActive
                ? "border-white/30 bg-white/10 text-white"
                : "border-white/10 bg-white/[0.03] text-white/50 hover:border-white/20 hover:text-white/80"
            }`}
            aria-pressed={isActive}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: color }} />
            {ind.label}
            {ind.live && <span className="text-[9px] text-teal-400">live</span>}
          </button>
        );
      })}
    </div>
  );
}
