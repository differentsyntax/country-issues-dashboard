"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Flame } from "lucide-react";
import { IssueRow } from "./IssueRow";
import { formatCount } from "@/lib/data";
import type { NationalPeriodEntry, PeriodMeta } from "@/lib/types";

export function NationalPanel({
  entry,
  period,
}: {
  entry: NationalPeriodEntry | undefined;
  period: PeriodMeta;
}) {
  const maxCount = entry ? Math.max(...entry.topIssues.map((i) => i.count)) : 1;

  return (
    <section className="glass-card rounded-2xl p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500/20 to-amber-500/20">
            <Flame className="h-4 w-4 text-amber-400" strokeWidth={1.75} />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-white/90">Top 5 issues nationally</h2>
            <p className="text-[11px] text-white/40">
              Report #{period.reportNo} &middot; {period.label}
            </p>
          </div>
        </div>
        {entry && (
          <div className="text-right">
            <p className="font-mono text-sm tabular-nums text-white/85">{formatCount(entry.totalGrievances)}</p>
            <p className="text-[10px] uppercase tracking-wide text-white/35">grievances</p>
          </div>
        )}
      </div>

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.ul key={period.period} className="flex flex-col gap-1.5">
          {entry?.topIssues.map((issue, i) => (
            <IssueRow key={issue.categoryId} issue={issue} rank={i} maxCount={maxCount} />
          ))}
        </motion.ul>
      </AnimatePresence>
    </section>
  );
}
