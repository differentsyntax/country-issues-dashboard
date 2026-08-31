"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { resolveIcon } from "@/lib/icon";
import { formatIndicatorValue, indicatorById } from "@/lib/data";
import type { IndicatorDef, StateIndicatorValue } from "@/lib/types";

const RANK_ACCENTS = ["var(--accent-rose)", "var(--accent-amber)", "var(--accent-teal)", "var(--accent-blue)", "var(--accent-violet)"];

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

/** States the rank as an objective fact about the raw value — "Nth highest"
 * or "Nth lowest" — rather than a judgment word like "worst". Which word is
 * correct depends on the indicator's `direction`: `rank` is severity-ordered
 * (1 = most severe, see compute_severity() in scripts/fetch_india_data.py),
 * which for a higherIsWorse indicator means rank 1 has the highest raw
 * value, and for a lowerIsWorse one (e.g. literacy) means rank 1 has the
 * LOWEST raw value — so a fixed "highest" would misstate which end of the
 * scale rank 1 is actually on. */
function rankCaption(rank: number, outOf: number, direction: IndicatorDef["direction"]): string {
  const word = direction === "higherIsWorse" ? "highest" : "lowest";
  return `${ordinal(rank)} ${word} of ${outOf}`;
}

export function IssueRow({
  value,
  rank,
  compact = false,
}: {
  value: StateIndicatorValue;
  rank: number;
  compact?: boolean;
}) {
  const indicator = indicatorById.get(value.indicatorId);
  if (!indicator) return null;
  const Icon = resolveIcon(indicator.icon);
  const accent = RANK_ACCENTS[rank % RANK_ACCENTS.length];
  const pct = Math.max(6, Math.round(value.percentile * 100));

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
        <div className="min-w-0 flex-1">
          <p className={`truncate ${compact ? "text-[13px]" : "text-sm"} text-white/85`}>{indicator.label}</p>
          <p className="truncate text-[10px] text-white/35">
            {rankCaption(value.rank, value.outOf, indicator.direction)}
            {indicator.asOf ? ` · as of ${indicator.asOf}` : indicator.live ? " · live" : ""}
          </p>
        </div>
        <a
          href={indicator.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex shrink-0 items-center gap-1 font-mono text-[13px] tabular-nums text-white/70 transition hover:text-teal-300"
          title={`Source: ${indicator.sourceName}`}
        >
          {formatIndicatorValue(value.value, indicator)}
          <ExternalLink className="h-3 w-3 opacity-50" />
        </a>
      </div>
    </motion.li>
  );
}
