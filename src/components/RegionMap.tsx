"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { MAP_HEIGHT, MAP_WIDTH, centroidFor, pathGenerator, statesGeo } from "@/lib/geo";
import { periods, severityForState, states, stateByKey } from "@/lib/data";
import { useDashboardStore } from "@/lib/store";

const SEVERITY_COLORS = ["var(--sev-0)", "var(--sev-1)", "var(--sev-2)", "var(--sev-3)"];
const SEVERITY_LABELS = ["Low relative pressure", "Moderate", "Elevated", "High relative pressure"];

// States/UTs small enough that a plain click target on the path alone is impractical.
const SMALL_MARKERS = new Set([
  "Delhi",
  "Chandigarh",
  "Puducherry",
  "Lakshadweep",
  "Andaman and Nicobar Islands",
  "Goa",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Sikkim",
]);

export function RegionMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const periodIndex = useDashboardStore((s) => s.periodIndex);
  const selectedStateKey = useDashboardStore((s) => s.selectedStateKey);
  const hoveredStateKey = useDashboardStore((s) => s.hoveredStateKey);
  const selectState = useDashboardStore((s) => s.selectState);
  const hoverState = useDashboardStore((s) => s.hoverState);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const period = periods[periodIndex].period;

  const severities = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of states) map.set(s.key, severityForState(s, period, states));
    return map;
  }, [period]);

  function handleMove(e: React.MouseEvent) {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  const hoveredState = hoveredStateKey ? stateByKey.get(hoveredStateKey) : null;
  const hoveredEntry = hoveredState?.series.find((s) => s.period === period);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMove}
      className="relative w-full select-none"
      onMouseLeave={() => hoverState(null)}
    >
      <svg
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label="Map of India, states colored by relative civic-issue pressure"
      >
        <defs>
          <filter id="state-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#2dd4bf" floodOpacity="0.55" />
          </filter>
        </defs>
        <g>
          {statesGeo.features.map((feature) => {
            const key = feature.properties.st_nm;
            const d = pathGenerator(feature) ?? undefined;
            const sev = severities.get(key) ?? 0;
            const isSelected = selectedStateKey === key;
            const isHovered = hoveredStateKey === key;
            return (
              <motion.path
                key={key}
                d={d}
                className="state-shape"
                stroke={isSelected ? "#f2f4f8" : "rgba(6,9,15,0.65)"}
                strokeWidth={isSelected ? 1.6 : 0.6}
                filter={isHovered || isSelected ? "url(#state-glow)" : undefined}
                animate={{ fill: SEVERITY_COLORS[sev], opacity: isHovered ? 1 : 0.92 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                onMouseEnter={() => hoverState(key)}
                onClick={() => selectState(isSelected ? null : key)}
                tabIndex={0}
                role="button"
                aria-label={key}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    selectState(isSelected ? null : key);
                  }
                }}
              />
            );
          })}

          {[...SMALL_MARKERS].map((key) => {
            const c = centroidFor(key);
            if (!c) return null;
            const sev = severities.get(key) ?? 0;
            const isSelected = selectedStateKey === key;
            return (
              <g key={`marker-${key}`}>
                <circle
                  cx={c[0]}
                  cy={c[1]}
                  r={11}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => hoverState(key)}
                  onClick={() => selectState(isSelected ? null : key)}
                />
                <circle
                  cx={c[0]}
                  cy={c[1]}
                  r={isSelected ? 5.5 : 4}
                  fill={SEVERITY_COLORS[sev]}
                  stroke="#f2f4f8"
                  strokeWidth={isSelected ? 1.4 : 0.8}
                  className="pointer-events-none"
                />
              </g>
            );
          })}

          {selectedStateKey &&
            (() => {
              const c = centroidFor(selectedStateKey);
              if (!c) return null;
              return (
                <circle
                  cx={c[0]}
                  cy={c[1]}
                  r={7}
                  fill="none"
                  stroke="var(--accent-teal)"
                  strokeWidth={1.5}
                  className="pulse-ring pointer-events-none"
                  style={{ transformOrigin: `${c[0]}px ${c[1]}px` }}
                />
              );
            })()}
        </g>
      </svg>

      {hoveredState && hoveredEntry && tooltipPos && (
        <div
          className="glass-card pointer-events-none absolute z-10 w-52 rounded-xl p-3 text-xs shadow-2xl"
          style={{
            left: Math.min(tooltipPos.x + 14, MAP_WIDTH - 210),
            top: Math.max(tooltipPos.y - 10, 4),
          }}
        >
          <p className="mb-1 text-sm font-semibold text-white">{hoveredState.name}</p>
          {hoveredEntry.topIssues.slice(0, 1).map((issue) => (
            <p key={issue.categoryId} className="text-white/60">
              Top issue: <span className="text-white/85">{issue.label}</span>
            </p>
          ))}
          <p className="mt-1 text-[10px] text-white/35">Click for full detail</p>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-[10px] text-white/45">
        {SEVERITY_COLORS.map((c, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />
            {SEVERITY_LABELS[i]}
          </span>
        ))}
      </div>
    </div>
  );
}
