"use client";

import { Settings } from "lucide-react";
import { useState } from "react";
import { AskWatiDrawer } from "../components/AskWatiDrawer";
import { MainSidebar } from "../components/MainSidebar";
import { InboxComposer } from "../components/inbox/InboxComposer";
import { SettingsModal } from "../components/settings/SettingsModal";
import { TeamInboxSettings } from "../components/settings/TeamInboxSettings";
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
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <MainSidebar />
        <main className="m-0 flex min-w-0 flex-1 overflow-hidden rounded-tl-xl rounded-tr-xl border border-[var(--wati-border-default)] bg-white">
          <InboxSkeleton />
        </main>
        <AskWatiDrawer />
      </div>
    </InboxContextProvider>
  );
}

function InboxSkeleton() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  return (
    <div className="flex h-full w-full flex-col">
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Team Inbox settings"
        className="max-w-[720px]"
      >
        <TeamInboxSettings />
      </SettingsModal>
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
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[15px] font-semibold text-[#0a0a0a]">Team Inbox</h2>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              aria-label="Team Inbox settings"
              className="flex h-7 w-7 items-center justify-center rounded-md text-black/60 hover:bg-black/[0.04] hover:text-[#0a0a0a]"
            >
              <Settings size={17} strokeWidth={1.75} />
            </button>
          </div>
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
                    i % 2 === 0 ? "w-64 bg-white" : "w-72 bg-wati-green-soft"
                  } rounded-2xl`}
                />
              </div>
            ))}
          </div>
          <InboxComposer />
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
