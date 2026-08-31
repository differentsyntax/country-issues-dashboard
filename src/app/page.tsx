"use client";

import { Header } from "@/components/Header";
import { PeriodSlider } from "@/components/PeriodSlider";
import { RegionMap } from "@/components/RegionMap";
import { NationalPanel } from "@/components/NationalPanel";
import { StatePanel } from "@/components/StatePanel";
import { StateQuickSelect } from "@/components/StateQuickSelect";
import { getNationalForPeriod, periods } from "@/lib/data";
import { useDashboardStore } from "@/lib/store";

export default function Home() {
  const periodIndex = useDashboardStore((s) => s.periodIndex);
  const period = periods[periodIndex];
  const nationalEntry = getNationalForPeriod(period.period);

  return (
    <div className="flex flex-1 flex-col">
      <Header />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 pb-10 sm:px-6">
        <PeriodSlider />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <div className="glass-card flex flex-col gap-3 rounded-2xl p-4 sm:p-5 lg:col-span-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white/90">State-by-state pressure map</h2>
              <span className="text-[11px] text-white/35">Click a state for detail</span>
            </div>
            <RegionMap />
            <StateQuickSelect />
          </div>

          <div className="flex flex-col gap-4 lg:col-span-2">
            <NationalPanel entry={nationalEntry} period={period} />
            <StatePanel />
          </div>
        </div>

        <footer className="mt-4 flex flex-col items-center gap-1 pb-4 text-center text-[11px] text-white/25">
          <p>
            Built with Next.js, Tailwind CSS, Framer Motion, D3-geo &amp; Recharts. Categories and
            cadence modeled on India&rsquo;s DARPG/CPGRAMS public grievance reporting system.
          </p>
        </footer>
      </main>
    </div>
  );
}
