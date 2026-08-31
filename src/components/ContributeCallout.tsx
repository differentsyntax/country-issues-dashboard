import { MessageSquarePlus } from "lucide-react";

const ISSUE_URL =
  "https://github.com/differentsyntax/country-issues-dashboard/issues/new?template=suggest-source-or-feedback.yml";

/** Invites visitors to suggest fresher/better sources or leave feedback,
 * via a GitHub issue template — no backend needed, and every suggestion is
 * a public, trackable issue. */
export function ContributeCallout() {
  return (
    <div className="glass-card flex flex-col items-center gap-2 rounded-2xl p-5 text-center sm:flex-row sm:justify-between sm:text-left">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-400/10">
          <MessageSquarePlus className="h-4 w-4 text-teal-300" strokeWidth={1.75} />
        </span>
        <div>
          <p className="text-sm text-white/85">Know a fresher or more credible source?</p>
          <p className="text-[11px] text-white/40">
            Suggest a source, flag something out of date, or leave feedback — every submission
            becomes a public, trackable issue.
          </p>
        </div>
      </div>
      <a
        href={ISSUE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 rounded-lg border border-teal-400/30 bg-teal-400/10 px-3.5 py-2 text-[13px] font-medium text-teal-300 transition hover:border-teal-400/50 hover:bg-teal-400/15"
      >
        Suggest a source
      </a>
    </div>
  );
}
