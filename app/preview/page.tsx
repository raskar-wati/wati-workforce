"use client";

import { AskWatiDrawer } from "../components/AskWatiDrawer";
import { GlobalHeader } from "../components/GlobalHeader";
import { MainSidebar } from "../components/MainSidebar";
import { InboxContextProvider, type InboxStats } from "../lib/inbox-context";

// Mock inbox snapshot used to drive Ask Wati's queue-level suggestions.
// In a real integration this would come from the inbox state itself.
const MOCK_INBOX_STATS: InboxStats = {
  activeChats: 6,
  overSla: 2,
  unread: 1,
  oldestOpenHours: 3,
};

export default function PreviewPage() {
  return (
    <InboxContextProvider stats={MOCK_INBOX_STATS}>
      <div className="flex h-screen flex-col bg-[var(--wati-surface-subtle)]">
        <GlobalHeader />
        <div className="flex flex-1 overflow-hidden">
          <MainSidebar />
          <main className="m-0 flex min-w-0 flex-1 overflow-hidden rounded-tl-xl border border-[var(--wati-border-default)] bg-white">
            <InboxSkeleton />
          </main>
          <AskWatiDrawer />
        </div>
      </div>
    </InboxContextProvider>
  );
}

function InboxSkeleton() {
  return (
    <div className="flex h-full w-full flex-col">
      {/* Skeleton top bar inside the main content card */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-slate-200 px-4">
        <div className="flex items-center gap-3">
          <div className="h-6 w-24 rounded bg-slate-100" />
        </div>
      </div>

      {/* Body: channels + chat list + thread + contact */}
      <div className="flex min-h-0 flex-1">
        {/* Channels */}
        <div className="flex w-56 shrink-0 flex-col gap-2 border-r border-slate-200 bg-white p-3">
          <div className="h-5 w-32 rounded bg-slate-200" />
          <div className="mt-2 flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-7 w-full rounded bg-slate-100" />
            ))}
          </div>
        </div>

        {/* Chat list */}
        <div className="flex w-72 shrink-0 flex-col gap-2 border-r border-slate-200 bg-white p-3">
          <div className="h-6 w-28 rounded bg-slate-200" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5 rounded border border-slate-100 p-3">
              <div className="h-3 w-3/4 rounded bg-slate-200" />
              <div className="h-3 w-full rounded bg-slate-100" />
              <div className="h-3 w-1/2 rounded bg-slate-100" />
            </div>
          ))}
        </div>

        {/* Conversation pane */}
        <div className="flex min-w-0 flex-1 flex-col bg-slate-50">
          <div className="flex h-12 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4">
            <div className="h-7 w-7 rounded-full bg-slate-200" />
            <div className="h-4 w-32 rounded bg-slate-200" />
          </div>
          <div className="flex flex-1 flex-col gap-3 overflow-hidden p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`h-10 ${
                    i % 2 === 0 ? "w-64 bg-white" : "w-72 bg-emerald-100"
                  } rounded-2xl`}
                />
              </div>
            ))}
          </div>
          <div className="flex h-14 shrink-0 items-center gap-2 border-t border-slate-200 bg-white px-4">
            <div className="h-9 flex-1 rounded bg-slate-100" />
            <div className="h-9 w-16 rounded bg-emerald-200" />
          </div>
        </div>

        {/* Contact info */}
        <div className="flex w-72 shrink-0 flex-col gap-3 border-l border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-slate-200" />
            <div className="h-4 w-32 rounded bg-slate-200" />
          </div>
          <div className="mt-2 flex flex-col gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-3 w-24 rounded bg-slate-100" />
                <div className="h-3 w-20 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
