"use client";

import { motion } from "framer-motion";
import { ArrowDown, ArrowUp } from "lucide-react";
import { resolveIcon } from "@/lib/icon";
import { formatCount } from "@/lib/data";
import type { TopIssue } from "@/lib/types";

const RANK_ACCENTS = ["var(--accent-rose)", "var(--accent-amber)", "var(--accent-teal)", "var(--accent-blue)", "var(--accent-violet)"];

export function IssueRow({
  issue,
  rank,
  maxCount,
  compact = false,
}: {
  issue: TopIssue;
  rank: number;
  maxCount: number;
  compact?: boolean;
}) {
  const Icon = resolveIcon(issue.icon);
  const accent = RANK_ACCENTS[rank % RANK_ACCENTS.length];
  const pct = Math.max(6, Math.round((issue.count / Math.max(1, maxCount)) * 100));
  const trendUp = (issue.deltaPct ?? 0) > 0;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5"
    >
      <motion.div
        className="absolute inset-y-0 left-0 opacity-[0.14]"
        style={{ background: accent }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      />
      <div className="relative flex items-center gap-3">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
          style={{ background: `${accent}22`, color: accent }}
        >
          {rank + 1}
        </span>
        {/* eslint-disable-next-line react-hooks/static-components -- resolveIcon is a pure lookup into a static icon map; identity is stable across renders */}
        <Icon className="h-4 w-4 shrink-0 text-white/50" strokeWidth={1.75} />
        <span className={`min-w-0 flex-1 truncate ${compact ? "text-[13px]" : "text-sm"} text-white/85`}>
          {issue.label}
        </span>
        <span className="shrink-0 font-mono text-[13px] tabular-nums text-white/70">
          {formatCount(issue.count)}
        </span>
        {issue.deltaPct !== null && (
          <span
            className={`flex shrink-0 items-center gap-0.5 text-[11px] font-medium tabular-nums ${
              trendUp ? "text-rose-400" : "text-teal-400"
            }`}
          >
            {trendUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            {Math.abs(issue.deltaPct)}%
          </span>
        )}
      </div>
    </motion.li>
  );
}
