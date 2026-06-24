"use client";

import { AskWatiDrawer } from "../../components/AskWatiDrawer";
import { GlobalHeader } from "../../components/GlobalHeader";
import { MainSidebar } from "../../components/MainSidebar";
import {
  ShopifyContextProvider,
  type ShopifyStats,
} from "../../lib/shopify-context";

const MOCK_SHOPIFY_STATS: ShopifyStats = {
  totalSpend: 7337,
  orders: 1250000,
  totalRevenue: 85000,
  roi: 15000,
};

export default function ShopifyPage() {
  return (
    <ShopifyContextProvider stats={MOCK_SHOPIFY_STATS}>
      <div className="flex h-screen flex-col bg-[var(--wati-surface-subtle)]">
        <GlobalHeader />
        <div className="relative flex flex-1 overflow-hidden">
          <MainSidebar />
          <main className="m-0 flex min-w-0 flex-1 overflow-hidden rounded-tl-xl rounded-tr-xl border border-[var(--wati-border-default)] bg-white">
            <ShopifySkeleton />
          </main>
          <AskWatiDrawer />
        </div>
      </div>
    </ShopifyContextProvider>
  );
}

function ShopifySkeleton() {
  return (
    <div className="flex h-full w-full flex-col overflow-y-auto">
      {/* Header row */}
      <div className="flex shrink-0 items-center justify-between px-6 pt-5">
        <div className="h-5 w-28 rounded bg-slate-200" />
        <div className="flex items-center gap-3">
          <div className="h-3.5 w-36 rounded bg-slate-100" />
          <div className="h-5 w-9 rounded-full bg-slate-200" />
        </div>
      </div>

      {/* Filter pills + selectors */}
      <div className="flex shrink-0 items-center justify-between px-6 pt-5">
        <div className="flex items-center gap-1 rounded-md bg-slate-50 p-1">
          <div className="h-7 w-14 rounded bg-white shadow-sm" />
          <div className="h-7 w-20 rounded" />
          <div className="h-7 w-14 rounded" />
          <div className="h-7 w-14 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-24 rounded border border-slate-200" />
          <div className="h-8 w-28 rounded border border-slate-200" />
        </div>
      </div>

      {/* Overview */}
      <SectionLabel label="Overview" />
      <div className="grid shrink-0 grid-cols-4 gap-3 px-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4"
          >
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-slate-200" />
              <div className="h-3 w-20 rounded bg-slate-200" />
            </div>
            <div className="h-6 w-28 rounded bg-slate-200" />
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-20 rounded bg-slate-100" />
              <div className="h-5 w-16 rounded bg-slate-100" />
              <div className="h-5 w-16 rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>

      {/* Health Metrics */}
      <SectionLabel label="Health Metrics" />
      <div className="grid shrink-0 grid-cols-5 gap-3 px-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-2 rounded-lg border border-slate-200 p-4"
          >
            <div className="h-3 w-16 rounded bg-slate-100" />
            <div className="h-5 w-20 rounded bg-slate-200" />
          </div>
        ))}
      </div>

      {/* Trigger Performance */}
      <SectionLabel label="Trigger Performance" />
      <div className="grid shrink-0 grid-cols-3 gap-3 px-6 pb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4"
          >
            <div className="h-3.5 w-32 rounded bg-slate-200" />
            <div className="h-3 w-24 rounded bg-slate-100" />
            <div className="h-5 w-28 rounded bg-slate-200" />
            {/* Sparkline placeholder */}
            <svg
              viewBox="0 0 220 60"
              className="h-16 w-full"
              preserveAspectRatio="none"
            >
              <path
                d="M0 40 C 30 30, 60 20, 90 22 S 150 30, 180 18 S 220 12, 220 12"
                fill="none"
                stroke="#bbf7d0"
                strokeWidth="2"
              />
            </svg>
            <div className="grid grid-cols-2 gap-y-2 pt-1">
              <div className="flex flex-col gap-1">
                <div className="h-2.5 w-10 rounded bg-slate-100" />
                <div className="h-3 w-14 rounded bg-slate-200" />
              </div>
              <div className="flex flex-col gap-1">
                <div className="h-2.5 w-10 rounded bg-slate-100" />
                <div className="h-3 w-14 rounded bg-slate-200" />
              </div>
              <div className="flex flex-col gap-1">
                <div className="h-2.5 w-12 rounded bg-slate-100" />
                <div className="h-3 w-14 rounded bg-slate-200" />
              </div>
              <div className="flex flex-col gap-1">
                <div className="h-2.5 w-8 rounded bg-slate-100" />
                <div className="h-3 w-12 rounded bg-slate-200" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="shrink-0 px-6 pb-3 pt-6">
      <span className="text-[13px] font-semibold text-slate-400">
        {label}
      </span>
    </div>
  );
}
