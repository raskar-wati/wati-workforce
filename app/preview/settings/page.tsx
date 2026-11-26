"use client";

import { useState } from "react";
import { AskWatiDrawer } from "../../components/AskWatiDrawer";
import { MainSidebar } from "../../components/MainSidebar";
import { ChatAssignmentSettings } from "../../components/settings/ChatAssignmentSettings";
import { SETTINGS_PAGES, SettingsNav } from "../../components/settings/SettingsNav";

/**
 * Global Settings: the account and workspace IA. Chat Assignment is built;
 * the other pages are placeholders. Wati AI settings live inside Ask Wati, not here.
 */
export default function SettingsPage() {
  const [current, setCurrent] = useState("my-profile");
  const label = SETTINGS_PAGES.find((p) => p.id === current)?.label ?? "";

  return (
    <div className="relative flex min-h-0 flex-1 overflow-hidden">
      <MainSidebar />
      <main className="m-0 flex min-w-0 flex-1 overflow-hidden rounded-tl-xl rounded-tr-xl border border-[var(--wati-border-default)] bg-white">
        <SettingsNav current={current} onSelect={setCurrent} />
        <section className="min-w-0 flex-1 overflow-y-auto px-8 py-6">
          <h1 className="text-[16px] font-medium tracking-[-0.096px] text-[#0a0a0a]">{label}</h1>
          {current === "chat-assignment" ? (
            <div className="mt-6">
              <ChatAssignmentSettings />
            </div>
          ) : (
            <div aria-hidden className="mt-6 flex max-w-[640px] flex-col gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-xl border border-[var(--wati-border-default)] p-4">
                  <div className="h-3 w-40 rounded bg-slate-100" />
                  <div className="mt-2.5 h-2.5 w-72 max-w-full rounded bg-slate-100/70" />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <AskWatiDrawer />
    </div>
  );
}
