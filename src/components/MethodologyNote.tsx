"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { resolveIcon } from "@/lib/icon";
import { indicators, dataset } from "@/lib/data";

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
          Sources &amp; methodology — every number below is real and cited
        </span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-white/50 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-white/50 flex-shrink-0" />
        )}
      </button>

      {expanded && (
        <div id="methodology-note-body" className="border-t border-white/10 px-4 py-3 space-y-4 text-sm text-white/60">
          <p>
            Every indicator comes from a real, published government or official source —
            nothing here is simulated. Each one shows exactly when its figure is from.
          </p>

          <ul className="flex flex-col gap-2">
            {indicators.map((ind) => {
              const Icon = resolveIcon(ind.icon);
              return (
                <li key={ind.id} className="flex items-start gap-2.5 rounded-lg bg-white/[0.03] p-2.5">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-white/40" strokeWidth={1.75} />
                  <div className="min-w-0 flex-1">
                    <p className="text-white/85">{ind.label}</p>
                    <p className="text-[11px] text-white/40">
                      {ind.sourceName}
                      {ind.live ? " · fetched live per page view" : ind.asOf ? ` · as of ${ind.asOf}` : ""}
                    </p>
                  </div>
                  <a
                    href={ind.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-white/30 transition hover:text-teal-300"
                    aria-label={`Source for ${ind.label}`}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </li>
              );
            })}
          </ul>

          <p>
            Ruling government (Chief Minister + party) is sourced from{" "}
            <a
              href={dataset.meta.governmentSourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-300 underline decoration-teal-300/30 hover:decoration-teal-300"
            >
              {dataset.meta.governmentSourceName}
            </a>
            . State context (zone, capital, area, population) is from{" "}
            <a
              href={dataset.meta.contextSourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-300 underline decoration-teal-300/30 hover:decoration-teal-300"
            >
              {dataset.meta.contextSourceName}
            </a>
            .
          </p>

          <p className="text-[11px] text-white/35">
            Last refreshed {new Date(dataset.meta.generatedAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}.
          </p>
        </div>
      )}
    </div>
  );
}
