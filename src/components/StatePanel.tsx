"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, MapPinned } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";
import { IssueRow } from "./IssueRow";
import { formatCount, periods, stateByKey } from "@/lib/data";
import { useDashboardStore } from "@/lib/store";

export function StatePanel() {
  const selectedStateKey = useDashboardStore((s) => s.selectedStateKey);
  const periodIndex = useDashboardStore((s) => s.periodIndex);
  const selectState = useDashboardStore((s) => s.selectState);

  const state = selectedStateKey ? stateByKey.get(selectedStateKey) : null;
  const period = periods[periodIndex];
  const entry = state?.series.find((s) => s.period === period.period);

  const chartData =
    state?.series.map((s) => ({
      period: s.period,
      total: s.totalGrievances,
    })) ?? [];

  const maxCount = entry ? Math.max(...entry.topIssues.map((i) => i.count)) : 1;

  return (
    <AnimatePresence mode="wait">
      {state && entry ? (
        <motion.section
          key={state.key}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 16 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="glass-card rounded-2xl p-4 sm:p-5"
        >
          <div className="mb-1 flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400/20 to-blue-400/20">
                <MapPinned className="h-4 w-4 text-teal-300" strokeWidth={1.75} />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-white/90">{state.name}</h2>
                <p className="text-[11px] text-white/40">
                  ~{state.populationMillions >= 1 ? `${state.populationMillions}M` : `${Math.round(state.populationMillions * 1000)}K`} people &middot; {period.label}
                </p>
              </div>
            </div>
            <button
              onClick={() => selectState(null)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 transition hover:bg-white/10 hover:text-white"
              aria-label="Close state detail"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] text-white/40">Total grievances this period</p>
            <p className="font-mono text-sm tabular-nums text-white/85">{formatCount(entry.totalGrievances)}</p>
          </div>

          <div className="mb-4 h-14 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="stateTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <YAxis hide domain={["dataMin - 50", "dataMax + 50"]} />
                <Tooltip
                  cursor={{ stroke: "rgba(255,255,255,0.15)" }}
                  contentStyle={{
                    background: "#0d1220",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                  labelFormatter={() => ""}
                  formatter={(value) => [formatCount(Number(value)), "Total"]}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#2dd4bf"
                  strokeWidth={1.75}
                  fill="url(#stateTrend)"
                  isAnimationActive={true}
                  animationDuration={500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-white/35">
            Top 3 issues
          </p>
          <ul className="flex flex-col gap-1.5">
            {entry.topIssues.map((issue, i) => (
              <IssueRow key={issue.categoryId} issue={issue} rank={i} maxCount={maxCount} compact />
            ))}
          </ul>
        </motion.section>
      ) : (
        <motion.section
          key="empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="glass-card flex flex-col items-center justify-center gap-2 rounded-2xl p-8 text-center"
        >
          <MapPinned className="h-6 w-6 text-white/25" strokeWidth={1.5} />
          <p className="text-sm text-white/50">Click or tap a state on the map</p>
          <p className="text-[11px] text-white/30">to see its top 3 issues for this period</p>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
