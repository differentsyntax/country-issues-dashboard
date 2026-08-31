"use client";

import { useMemo, useRef, useState } from "react";
import { MAP_HEIGHT, MAP_WIDTH, centroidFor, pathGenerator, statesGeo } from "@/lib/geo";
import { effectiveTopIssueId, indicatorById, indicators, stateByKey } from "@/lib/data";
import { colorForIndicator, sequentialColor, FALLBACK_COLOR } from "@/lib/indicatorColors";
import { resolveIcon } from "@/lib/icon";
import { useDashboardStore } from "@/lib/store";
import { useLiveAqi } from "@/lib/useLiveAqi";

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
  const selectedStateKey = useDashboardStore((s) => s.selectedStateKey);
  const hoveredStateKey = useDashboardStore((s) => s.hoveredStateKey);
  const activeIndicatorId = useDashboardStore((s) => s.activeIndicatorId);
  const selectState = useDashboardStore((s) => s.selectState);
  const hoverState = useDashboardStore((s) => s.hoverState);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const liveAqi = useLiveAqi();

  function handleMove(e: React.MouseEvent) {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  // For each state, resolve which indicator is driving its color and how
  // severe that reading is, in both the default categorical mode and the
  // single-indicator picker mode.
  const stateColor = useMemo(() => {
    const map = new Map<string, { color: string; indicatorId: string | null }>();
    for (const state of stateByKey.values()) {
      if (activeIndicatorId) {
        const live = activeIndicatorId === "pollution" ? liveAqi.severityByState[state.key] : undefined;
        const value = live ?? state.indicators.find((i) => i.indicatorId === activeIndicatorId);
        map.set(state.key, {
          indicatorId: activeIndicatorId,
          color: value ? sequentialColor(activeIndicatorId, value.percentile) : FALLBACK_COLOR,
        });
      } else {
        const topId = effectiveTopIssueId(state, liveAqi.severityByState[state.key]);
        map.set(state.key, { indicatorId: topId, color: colorForIndicator(topId) });
      }
    }
    return map;
  }, [activeIndicatorId, liveAqi.severityByState]);

  // Legend: in categorical mode, only the indicators that actually appear as
  // someone's dominant issue; in single-indicator mode, a min–max gradient
  // key for that one indicator.
  const categoricalLegend = useMemo(() => {
    if (activeIndicatorId) return [];
    const present = new Set<string>();
    for (const { indicatorId } of stateColor.values()) {
      if (indicatorId) present.add(indicatorId);
    }
    return indicators
      .filter((i) => present.has(i.id))
      .map((i) => ({ id: i.id, label: i.label, color: colorForIndicator(i.id) }));
  }, [activeIndicatorId, stateColor]);

  const hoveredState = hoveredStateKey ? stateByKey.get(hoveredStateKey) : null;
  const hoveredColorInfo = hoveredStateKey ? stateColor.get(hoveredStateKey) : null;
  const hoveredIndicator = hoveredColorInfo?.indicatorId ? indicatorById.get(hoveredColorInfo.indicatorId) : null;

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
        aria-label="Map of India, states colored by dominant civic indicator"
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
            const fill = stateColor.get(key)?.color ?? FALLBACK_COLOR;
            const isSelected = selectedStateKey === key;
            const isHovered = hoveredStateKey === key;
            return (
              <path
                key={key}
                d={d}
                className="state-shape"
                fill={fill}
                opacity={isHovered ? 1 : 0.92}
                stroke={isSelected ? "#f2f4f8" : "rgba(6,9,15,0.65)"}
                strokeWidth={isSelected ? 1.6 : 0.6}
                filter={isHovered || isSelected ? "url(#state-glow)" : undefined}
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
            const fill = stateColor.get(key)?.color ?? FALLBACK_COLOR;
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
                  fill={fill}
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

      {hoveredState && hoveredIndicator && tooltipPos && (
        <div
          className="glass-card pointer-events-none absolute z-10 w-52 rounded-xl p-3 text-xs shadow-2xl"
          style={{
            left: Math.min(tooltipPos.x + 14, MAP_WIDTH - 210),
            top: Math.max(tooltipPos.y - 10, 4),
          }}
        >
          <p className="mb-1 text-sm font-semibold text-white">{hoveredState.name}</p>
          <p className="flex items-center gap-1.5 text-white/60">
            {(() => {
              const Icon = resolveIcon(hoveredIndicator.icon);
              return <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />;
            })()}
            <span className="text-white/85">{hoveredIndicator.label}</span>
          </p>
          <p className="mt-1 text-[10px] text-white/35">Click for full detail</p>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-[10px] text-white/45">
        {activeIndicatorId ? (
          <span className="flex items-center gap-2">
            <span
              className="h-2.5 w-24 rounded-full"
              style={{
                background: `linear-gradient(to right, ${sequentialColor(activeIndicatorId, 0)}, ${sequentialColor(activeIndicatorId, 1)})`,
              }}
            />
            Lower <span className="mx-1">&rarr;</span> Higher severity
          </span>
        ) : (
          categoricalLegend.map((item) => (
            <span key={item.id} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
              {item.label}
            </span>
          ))
        )}
      </div>
    </div>
  );
}
