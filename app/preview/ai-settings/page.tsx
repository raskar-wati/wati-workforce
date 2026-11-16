"use client";

import { useState } from "react";
import { AskWatiDrawer } from "../../components/AskWatiDrawer";
import { MainSidebar } from "../../components/MainSidebar";
import { AskWatiSettings } from "../../components/settings/AskWatiSettings";
import type { SettingsTab } from "../../lib/ask-wati-settings";

/**
 * Ask Wati settings as a page of its own, for the side-nav placements
 * (Wati AI > AI settings, or Connectors > Wati AI connectors).
 */
export default function AiSettingsPage() {
  const [tab, setTab] = useState<SettingsTab>("connectors");
  return (
    <div className="relative flex min-h-0 flex-1 overflow-hidden">
      <MainSidebar />
      <main className="m-0 flex min-w-0 flex-1 flex-col overflow-hidden rounded-tl-xl rounded-tr-xl border border-[var(--wati-border-default)] bg-white">
        <div className="border-b border-black/[0.06] px-5 py-4">
          <h1 className="text-[16px] font-medium tracking-[-0.096px] text-[#0a0a0a]">
            Ask Wati settings
          </h1>
        </div>
        <div className="flex min-h-0 flex-1">
          <div className="flex min-h-0 w-full max-w-[1040px] flex-1">
            <AskWatiSettings tab={tab} onTabChange={setTab} />
          </div>
        </div>
      </main>
      <AskWatiDrawer />
    </div>
  );
}
