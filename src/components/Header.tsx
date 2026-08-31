import { MapPin } from "lucide-react";
import { MethodologyNote } from "./MethodologyNote";
import { country } from "@/lib/data";

export function Header() {
  return (
    <header className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 pt-8 pb-2 sm:px-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-teal-400">
          <MapPin className="h-4 w-4" strokeWidth={2} />
          <span className="text-[11px] font-medium uppercase tracking-[0.18em]">
            {country.flag} {country.name} &middot; Civic Issues Tracker
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          What&rsquo;s troubling {country.name} right now
        </h1>
        <p className="max-w-2xl text-sm text-white/50">
          Real, cited government &amp; official data on the issues facing every state &amp; UT
          &mdash; unemployment, poverty, crime, health, water, education, and live air quality.
        </p>
      </div>
      <MethodologyNote />
    </header>
  );
}
