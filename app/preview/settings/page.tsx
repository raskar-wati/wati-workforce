"use client";

import { AskWatiDrawer } from "../../components/AskWatiDrawer";
import { MainSidebar } from "../../components/MainSidebar";
import { BetaBadge } from "../../components/settings/BetaBadge";
import { InboxAiSettings } from "../../components/settings/InboxAiSettings";

/**
 * Team inbox Settings, Wati AI section: the same toggles as the Team inbox
 * tab of the Wati AI settings pop-up, from the same store.
 */
export default function SettingsPage() {
  return (
    <div className="relative flex min-h-0 flex-1 overflow-hidden">
      <MainSidebar />
      <main className="m-0 flex min-w-0 flex-1 flex-col overflow-y-auto rounded-tl-xl rounded-tr-xl border border-[var(--wati-border-default)] bg-white">
        <div className="mx-auto w-full max-w-[760px] px-6 py-8">
          <h1 className="flex items-center gap-2 text-[18px] font-medium tracking-[-0.108px] text-[#0a0a0a]">
            Wati AI settings
            <BetaBadge />
          </h1>
          <p className="mb-6 mt-1 text-[13px] text-black/60">
            All Wati AI features work across your connected channels, including WhatsApp and
            Instagram.
          </p>
          <InboxAiSettings heading={false} />
        </div>
      </main>
      <AskWatiDrawer />
    </div>
  );
}
