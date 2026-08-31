"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { resolveIcon } from "@/lib/icon";
import { formatIndicatorValue, indicatorById } from "@/lib/data";
import type { IndicatorDef, StateIndicatorValue } from "@/lib/types";

const RANK_ACCENTS = ["var(--accent-rose)", "var(--accent-amber)", "var(--accent-teal)", "var(--accent-blue)", "var(--accent-violet)"];

/** States the rank as a plain "rank/total" fraction plus which end of the
 * scale it's on ("highest"/"lowest") — e.g. "1/17 highest". `rank` is
 * severity-ordered (1 = most severe, see compute_severity() in
 * scripts/fetch_india_data.py); whether that's the highest or lowest raw
 * value depends on the indicator's `direction`, so a fixed word would
 * misstate it for a lowerIsWorse indicator (e.g. the state with the LOWEST
 * literacy is rank 1, not the highest).
 *
 * Deliberately not ordinal words ("1st", "2nd", ...): "1st highest of 17"
 * reads like 1st place in a leaderboard — i.e. the *best* — regardless of
 * what follows "1st", when rank 1 actually means the single highest (worst,
 * for a higherIsWorse indicator like Air Quality) value in the country. A
 * plain fraction doesn't carry that "1st = winner" baggage. */
function rankCaption(rank: number, outOf: number, direction: IndicatorDef["direction"]): string {
  const word = direction === "higherIsWorse" ? "highest" : "lowest";
  return `${rank}/${outOf} ${word}`;
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
      <div className="relative flex flex-col gap-1.5">
        {/* Label gets its own full-width line — sharing a row with the
         * value/source-link (which can be as long as "35 per 1,000 live
         * births") starved narrow containers (the mobile bottom sheet in
         * particular) of enough space for the label, truncating it into
         * unreadable fragments like "Inf...". */}
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
            style={{ background: `${accent}22`, color: accent }}
          >
            {rank + 1}
          </span>
          {/* eslint-disable-next-line react-hooks/static-components -- resolveIcon is a pure lookup into a static icon map; identity is stable across renders */}
          <Icon className="h-4 w-4 shrink-0 text-white/50" strokeWidth={1.75} />
          <p className={`min-w-0 flex-1 truncate ${compact ? "text-[13px]" : "text-sm"} text-white/85`}>
            {indicator.label}
          </p>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 truncate text-[10px] text-white/35">
            {rankCaption(value.rank, value.outOf, indicator.direction)}
            {indicator.asOf ? ` · as of ${indicator.asOf}` : indicator.live ? " · live" : ""}
          </p>
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
      </div>
    </motion.li>
  );
}
