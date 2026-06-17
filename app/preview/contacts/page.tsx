"use client";

import { AskWatiDrawer } from "../../components/AskWatiDrawer";
import { GlobalHeader } from "../../components/GlobalHeader";
import { MainSidebar } from "../../components/MainSidebar";
import {
  ContactsContextProvider,
  type ContactsStats,
} from "../../lib/contacts-context";

// Mock contacts snapshot used to drive Ask Wati's contacts-scoped suggestions.
const MOCK_CONTACTS_STATS: ContactsStats = {
  total: 122697,
  newThisWeek: 184,
};

export default function ContactsPage() {
  return (
    <ContactsContextProvider stats={MOCK_CONTACTS_STATS}>
      <div className="flex h-screen flex-col bg-[var(--wati-surface-subtle)]">
        <GlobalHeader />
        <div className="relative flex flex-1 overflow-hidden">
          <MainSidebar />
          <main className="m-0 flex min-w-0 flex-1 overflow-hidden rounded-tl-xl rounded-tr-xl border border-[var(--wati-border-default)] bg-white">
            <ContactsSkeleton />
          </main>
          <AskWatiDrawer />
        </div>
      </div>
    </ContactsContextProvider>
  );
}

function ContactsSkeleton() {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {/* Tabs row */}
      <div className="flex shrink-0 items-center gap-1 px-6 pt-4">
        <div className="rounded-md bg-slate-100 px-4 py-1.5">
          <div className="h-3.5 w-16 rounded bg-slate-200" />
        </div>
        <div className="rounded-md px-4 py-1.5">
          <div className="h-3.5 w-16 rounded bg-slate-100" />
        </div>
      </div>

      {/* Heading row */}
      <div className="flex shrink-0 items-start justify-between px-6 pt-5">
        <div className="flex flex-col gap-2">
          <div className="h-5 w-44 rounded bg-slate-200" />
          <div className="h-3 w-[420px] rounded bg-slate-100" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-28 rounded bg-slate-100" />
          <div className="h-8 w-24 rounded bg-emerald-200" />
        </div>
      </div>

      {/* Filter / actions row */}
      <div className="flex shrink-0 items-center justify-between px-6 pt-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-40 rounded bg-slate-100" />
          <div className="h-8 w-56 rounded bg-slate-100" />
          <div className="h-8 w-8 rounded bg-emerald-200" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-20 rounded bg-slate-100" />
          <div className="h-8 w-20 rounded bg-slate-100" />
          <div className="h-8 w-8 rounded bg-red-100" />
        </div>
      </div>

      {/* Table */}
      <div className="mt-5 flex min-h-0 flex-1 flex-col px-6 pb-6">
        <div className="overflow-hidden rounded-lg border border-slate-200">
          {/* Header */}
          <div className="grid grid-cols-[36px_1.4fr_1fr_0.9fr_2.2fr_72px] items-center gap-4 bg-slate-50 px-4 py-3">
            <div className="h-3.5 w-3.5 rounded-sm bg-slate-200" />
            <div className="h-3 w-20 rounded bg-slate-200" />
            <div className="h-3 w-24 rounded bg-slate-200" />
            <div className="h-3 w-16 rounded bg-slate-200" />
            <div className="h-3 w-32 rounded bg-slate-200" />
            <div className="ml-auto h-3 w-12 rounded bg-slate-200" />
          </div>

          {/* Rows */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-[36px_1.4fr_1fr_0.9fr_2.2fr_72px] items-center gap-4 border-t border-slate-100 px-4 py-4"
            >
              <div className="h-3.5 w-3.5 rounded-sm bg-slate-100" />
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-full bg-slate-200" />
                <div className="flex flex-col gap-1.5">
                  <div className="h-3 w-28 rounded bg-slate-200" />
                  <div className="h-2.5 w-12 rounded bg-slate-100" />
                </div>
              </div>
              <div className="h-3 w-36 rounded bg-slate-100" />
              <div className="h-6 w-20 rounded bg-slate-100" />
              <div className="flex items-center gap-2">
                <div className="h-6 w-32 rounded-full bg-slate-100" />
                <div className="h-6 w-28 rounded-full bg-slate-100" />
                <div className="h-3 w-20 rounded bg-emerald-100" />
              </div>
              <div className="ml-auto flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-slate-200" />
                <div className="h-4 w-4 rounded bg-slate-200" />
              </div>
            </div>
          ))}
        </div>

        {/* Footer / pagination */}
        <div className="mt-4 flex shrink-0 items-center justify-end gap-4">
          <div className="h-3 w-24 rounded bg-slate-100" />
          <div className="h-7 w-16 rounded bg-slate-100" />
          <div className="h-3 w-24 rounded bg-slate-100" />
          <div className="h-3 w-16 rounded bg-slate-100" />
          <div className="h-3 w-12 rounded bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
