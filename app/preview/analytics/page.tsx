"use client";

import { AskWatiDrawer } from "../../components/AskWatiDrawer";
import { GlobalHeader } from "../../components/GlobalHeader";
import { MainSidebar } from "../../components/MainSidebar";
import {
  AnalyticsContextProvider,
  type AnalyticsStats,
} from "../../lib/analytics-context";

const MOCK_ANALYTICS_STATS: AnalyticsStats = {
  totalAgents: 12,
  avgFirstResponseMinutes: 42,
  avgResponseSeconds: 424,
  avgResolutionHours: 2,
};

export default function AnalyticsPage() {
  return (
    <AnalyticsContextProvider stats={MOCK_ANALYTICS_STATS}>
      <div className="flex h-screen flex-col bg-[var(--wati-surface-subtle)]">
        <GlobalHeader />
        <div className="relative flex flex-1 overflow-hidden">
          <MainSidebar />
          <main className="m-0 flex min-w-0 flex-1 overflow-hidden rounded-tl-xl rounded-tr-xl border border-[var(--wati-border-default)] bg-white">
            <AnalyticsSkeleton />
          </main>
          <AskWatiDrawer />
        </div>
      </div>
    </AnalyticsContextProvider>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="flex h-full w-full flex-col overflow-y-auto">
      {/* Section title + date pills */}
      <div className="flex shrink-0 items-center justify-between px-6 pt-5">
        <div className="h-5 w-44 rounded bg-slate-200" />
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-md bg-slate-50 p-1">
            <div className="h-7 w-9 rounded" />
            <div className="h-7 w-9 rounded" />
            <div className="h-7 w-9 rounded" />
            <div className="h-7 w-9 rounded bg-white shadow-sm" />
            <div className="h-7 w-24 rounded" />
          </div>
          <div className="h-8 w-8 rounded border border-slate-200" />
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid shrink-0 grid-cols-4 gap-3 px-6 pt-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4"
          >
            <div className="h-3 w-32 rounded bg-slate-100" />
            <div className="flex items-baseline gap-2">
              <div className="h-6 w-24 rounded bg-slate-200" />
              <div className="h-3 w-16 rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>

      {/* Operator Performance label + filters */}
      <div className="flex shrink-0 items-center justify-between px-6 pb-3 pt-6">
        <div className="text-[13px] font-semibold text-slate-400">
          Operator Performance
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-28 rounded border border-slate-200" />
          <div className="h-8 w-8 rounded border border-slate-200" />
        </div>
      </div>

      {/* Table */}
      <div className="shrink-0 px-6">
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <div className="grid grid-cols-[1.4fr_repeat(10,_1fr)] items-center gap-3 bg-slate-50 px-4 py-3">
            <div className="h-3 w-24 rounded bg-slate-200" />
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-3 w-16 rounded bg-slate-200" />
            ))}
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-[1.4fr_repeat(10,_1fr)] items-center gap-3 border-t border-slate-100 px-4 py-3.5"
            >
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-full bg-slate-100" />
                <div className="h-3 w-24 rounded bg-slate-200" />
              </div>
              {Array.from({ length: 10 }).map((_, j) => (
                <div key={j} className="h-3 w-12 rounded bg-slate-100" />
              ))}
            </div>
          ))}
        </div>

        {/* Pagination row */}
        <div className="flex shrink-0 items-center justify-end gap-3 py-3">
          <div className="h-3 w-24 rounded bg-slate-100" />
          <div className="h-7 w-12 rounded border border-slate-200" />
          <div className="h-3 w-12 rounded bg-slate-100" />
          <div className="h-3 w-16 rounded bg-slate-100" />
          <div className="h-3 w-12 rounded bg-slate-100" />
        </div>
      </div>

    </div>
  );
}
