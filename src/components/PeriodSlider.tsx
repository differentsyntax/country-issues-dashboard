"use client";

import { useEffect, useRef } from "react";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { periods } from "@/lib/data";
import { useDashboardStore } from "@/lib/store";

export function PeriodSlider() {
  const periodIndex = useDashboardStore((s) => s.periodIndex);
  const isPlaying = useDashboardStore((s) => s.isPlaying);
  const setPeriodIndex = useDashboardStore((s) => s.setPeriodIndex);
  const step = useDashboardStore((s) => s.step);
  const togglePlay = useDashboardStore((s) => s.togglePlay);
  const setPlaying = useDashboardStore((s) => s.setPlaying);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => step(1), 1400);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  useEffect(() => {
    if (periodIndex === periods.length - 1) setPlaying(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodIndex]);

  const current = periods[periodIndex];

  return (
    <div className="glass-card flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:gap-5">
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => step(-1)}
          disabled={periodIndex === 0}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
          aria-label="Previous period"
        >
          <SkipBack className="h-4 w-4" />
        </button>
        <button
          onClick={togglePlay}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-400/90 text-black transition hover:bg-teal-300"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
        </button>
        <button
          onClick={() => step(1)}
          disabled={periodIndex === periods.length - 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
          aria-label="Next period"
        >
          <SkipForward className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1">
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="text-sm font-medium text-white/85">{current.label}</span>
          <span className="text-[11px] text-white/40">Monthly DARPG-style report &middot; #{current.reportNo}</span>
        </div>
        <input
          type="range"
          min={0}
          max={periods.length - 1}
          value={periodIndex}
          onChange={(e) => setPeriodIndex(Number(e.target.value))}
          className="range-input w-full"
          aria-label="Select reporting period"
        />
        <div className="mt-1 hidden justify-between sm:flex">
          {periods.map((p, i) => (
            <span
              key={p.period}
              className={`text-[9px] transition ${i === periodIndex ? "text-teal-400" : "text-white/25"}`}
            >
              {p.label.slice(0, 3)}
            </span>
          ))}
        </div>
      </div>

      <style jsx>{`
        .range-input {
          -webkit-appearance: none;
          appearance: none;
          height: 4px;
          border-radius: 999px;
          background: linear-gradient(
            to right,
            var(--accent-teal) 0%,
            var(--accent-teal) ${(periodIndex / (periods.length - 1)) * 100}%,
            rgba(255, 255, 255, 0.12) ${(periodIndex / (periods.length - 1)) * 100}%,
            rgba(255, 255, 255, 0.12) 100%
          );
          outline: none;
        }
        .range-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 15px;
          height: 15px;
          border-radius: 999px;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(45, 212, 191, 0.35);
          cursor: pointer;
        }
        .range-input::-moz-range-thumb {
          width: 15px;
          height: 15px;
          border: none;
          border-radius: 999px;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(45, 212, 191, 0.35);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
