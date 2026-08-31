"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, MapPinned, Landmark, ExternalLink } from "lucide-react";
import { IssueRow } from "./IssueRow";
import { formatArea, formatPopulation, stateByKey, topIndicatorsForState, dataset } from "@/lib/data";
import { partySymbol } from "@/lib/partySymbols";
import { useDashboardStore } from "@/lib/store";
import { useLiveAqi } from "@/lib/useLiveAqi";

const PANEL_TITLE_ID = "state-panel-title";

export function StatePanel() {
  const selectedStateKey = useDashboardStore((s) => s.selectedStateKey);
  const selectState = useDashboardStore((s) => s.selectState);
  const liveAqi = useLiveAqi();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const state = selectedStateKey ? stateByKey.get(selectedStateKey) : null;
  const liveAqiEntry = selectedStateKey ? liveAqi.severityByState[selectedStateKey] : undefined;
  const topIssues = state ? topIndicatorsForState(state, 5, liveAqiEntry ? [liveAqiEntry] : []) : [];

  // Escape closes regardless of breakpoint — reasonable either as "dismiss
  // the modal" on mobile or "deselect" on desktop.
  useEffect(() => {
    if (!state) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") selectState(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [state, selectState]);

  // On mobile the panel is a full modal covering the map, so background
  // scroll should be locked; on desktop it's just a sidebar card sitting
  // next to normally-scrollable content, so it shouldn't be. 1024px matches
  // Tailwind's `lg` breakpoint used for the panel's own responsive classes.
  useEffect(() => {
    if (!state) return;
    const mq = window.matchMedia("(min-width: 1024px)");
    function applyLock() {
      document.body.style.overflow = mq.matches ? "" : "hidden";
    }
    applyLock();
    mq.addEventListener("change", applyLock);
    return () => {
      mq.removeEventListener("change", applyLock);
      document.body.style.overflow = "";
    };
  }, [state]);

  // Move focus into the panel on open (so keyboard/screen-reader users land
  // on it rather than it opening silently behind them) and restore focus to
  // whatever triggered it on close. Note: this does not trap Tab within the
  // panel — a full focus trap is a known gap, not implemented here.
  useEffect(() => {
    if (state) {
      previouslyFocused.current = document.activeElement as HTMLElement | null;
      closeButtonRef.current?.focus();
    } else {
      previouslyFocused.current?.focus();
      previouslyFocused.current = null;
    }
  }, [state]);

  return (
    <>
      {/* Backdrop: mobile only. On desktop the panel sits in-flow in the
       * sidebar column, so there's nothing to dismiss out from behind.
       * Shares AnimatePresence with the panel so both fade out together —
       * kept separate from the panel's own element since it must cover the
       * full viewport regardless of the panel's own (responsive) sizing. */}
      <AnimatePresence>
        {state && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={() => selectState(null)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {state ? (
          <motion.section
            key={state.key}
            role="dialog"
            aria-modal="true"
            aria-labelledby={PANEL_TITLE_ID}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            // Mobile: a closable bottom sheet fixed to the viewport, so
            // opening a state never requires scrolling past the map to see
            // it. Desktop (lg+): back to the normal in-flow sidebar card.
            className="glass-card fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col gap-4 overflow-y-auto rounded-b-none rounded-t-2xl p-4 sm:p-5 lg:static lg:inset-auto lg:z-auto lg:max-h-none lg:overflow-visible lg:rounded-2xl"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400/20 to-blue-400/20">
                  <MapPinned className="h-4 w-4 text-teal-300" strokeWidth={1.75} />
                </span>
                <div>
                  <h2 id={PANEL_TITLE_ID} className="text-sm font-semibold text-white/90">
                    {state.name}
                  </h2>
                  <p className="text-[11px] text-white/40">
                    {formatPopulation(state.population2011)}
                    {state.zone ? ` · ${state.zone} zone` : ""}
                    {state.capital ? ` · Capital: ${state.capital}` : ""}
                  </p>
                </div>
              </div>
              <button
                ref={closeButtonRef}
                onClick={() => selectState(null)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 transition hover:bg-white/10 hover:text-white"
                aria-label="Close state detail"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {state.areaKm2 && (
              <p className="-mt-2 text-[10px] text-white/30">
                {formatArea(state.areaKm2)} · population per{" "}
                <a
                  href={dataset.meta.contextSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-white/20 hover:text-white/60"
                >
                  {dataset.meta.contextSourceName}
                </a>
              </p>
            )}

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-white/35">
                Ruling Government
              </p>
              {state.government ? (
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.05] text-lg">
                    {partySymbol(state.government.party)?.emoji ?? <Landmark className="h-4 w-4 text-white/50" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-white/85">{state.government.cmName}</p>
                    <p className="truncate text-[11px] text-white/40">
                      {state.government.party}
                      {partySymbol(state.government.party) ? ` · ${partySymbol(state.government.party)!.symbolName}` : ""}
                    </p>
                  </div>
                  <a
                    href={dataset.meta.governmentSourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-white/30 transition hover:text-teal-300"
                    title={`Source: ${dataset.meta.governmentSourceName}`}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              ) : (
                <p className="text-[13px] text-white/50">
                  Administered by the Union Government &mdash; no elected Chief Minister.
                </p>
              )}
            </div>

            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-white/35">
                Top {topIssues.length} issue{topIssues.length === 1 ? "" : "s"}
              </p>
              {topIssues.length > 0 ? (
                <ul className="flex flex-col gap-1.5">
                  {topIssues.map((value, i) => (
                    <IssueRow key={value.indicatorId} value={value} rank={i} compact />
                  ))}
                </ul>
              ) : (
                <p className="text-[13px] text-white/40">No indicator data matched for this state/UT yet.</p>
              )}
            </div>
          </motion.section>
        ) : (
          // Nothing selected: only worth showing as static sidebar filler on
          // desktop. On mobile there's no modal to explain, so skip it
          // rather than adding scroll content under the map for no reason.
          <motion.section
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass-card hidden flex-col items-center justify-center gap-2 rounded-2xl p-8 text-center lg:flex"
          >
            <MapPinned className="h-6 w-6 text-white/25" strokeWidth={1.5} />
            <p className="text-sm text-white/50">Click or tap a state on the map</p>
            <p className="text-[11px] text-white/30">to see its top issues, ruling government, and context</p>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
