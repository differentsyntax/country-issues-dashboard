"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export function MethodologyNote() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur transition-all duration-300">
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-controls="methodology-note-body"
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
      >
        <span className="flex-1 text-sm font-medium text-white/70">
          About this data — modeled on real government reporting categories & cadence
        </span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-white/50 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-white/50 flex-shrink-0" />
        )}
      </button>

      {expanded && (
        <div id="methodology-note-body" className="border-t border-white/10 px-4 py-3 space-y-3 text-sm text-white/60">
          <p>
            The monthly reporting cadence you see here mirrors India&apos;s real government grievance-reporting system: the Department of Administrative Reforms &amp; Public Grievances (DARPG) publishes a numbered monthly CPGRAMS report covering ministries, departments and states/UTs. The issue categories in this dashboard (power, water, land records, pensions, and so on) are everyday, human-readable stand-ins for the kinds of departments and themes those real reports cover.
          </p>
          <p>
            However, the exact per-state, per-category complaint counts shown here are not live data pulled from a government API. The official data sources require an API key and, in any case, don&apos;t publicly release a full per-state-per-category breakdown at this granularity. Instead, this dashboard uses a reproducible simulation seeded from real regional patterns.
          </p>
          <p>
            This means: water-scarcity issues are weighted higher in arid states like Rajasthan; monsoon flooding peaks in states like Assam and Kerala during rainy months; winter air pollution is higher in Delhi-NCR; power complaints correlate with agricultural regions. The result is geographically sensible and deterministic—regenerating the dataset produces the same numbers.
          </p>
          <p>
            The takeaway: the category taxonomy and monthly rhythm are real and grounded in published government reports. The specific numbers are a careful simulation, not live, so they work well for understanding patterns and trends, but should not be cited as definitive grievance counts.
          </p>
        </div>
      )}
    </div>
  );
}
