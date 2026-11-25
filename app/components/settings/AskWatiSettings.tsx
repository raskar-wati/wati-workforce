"use client";

import { Brain, Inbox, LayoutGrid, SquareSlash } from "lucide-react";
import type { ComponentType } from "react";
import type { SettingsTab } from "../../lib/ask-wati-settings";
import { ConnectorsSettings } from "./ConnectorsSettings";
import { InboxAiSettings } from "./InboxAiSettings";
import { HINT } from "./settings-styles";

const TABS: {
  id: SettingsTab;
  label: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
}[] = [
  { id: "connectors", label: "Connectors", icon: LayoutGrid },
  { id: "skills", label: "Skills", icon: SquareSlash },
  { id: "memory", label: "Memory", icon: Brain },
  { id: "team-inbox", label: "Team inbox", icon: Inbox },
];

/**
 * The settings body (tab list + the open tab) of the Wati AI settings
 * pop-up. Positioned so the add-server sheet can cover it.
 */
export function AskWatiSettings({
  tab,
  onTabChange,
}: {
  tab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}) {
  return (
    <div className="relative flex min-h-0 flex-1">
      <nav
        aria-label="Settings sections"
        className="flex w-[188px] shrink-0 flex-col gap-0.5 border-r border-black/[0.06] px-2 py-3"
      >
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onTabChange(id)}
            aria-current={tab === id ? "page" : undefined}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] tracking-[-0.078px] ${
              tab === id
                ? "bg-black/[0.06] font-medium text-[#0a0a0a]"
                : "text-black/70 hover:bg-black/[0.04]"
            }`}
          >
            <Icon size={15} strokeWidth={1.75} />
            {label}
          </button>
        ))}
      </nav>
      <div className="min-w-0 flex-1 overflow-y-auto p-5">
        {tab === "connectors" && <ConnectorsSettings />}
        {tab === "team-inbox" && <InboxAiSettings />}
        {tab === "skills" && (
          <SettingsPlaceholder
            title="Skills"
            body="Playbooks you run in a chat by typing /, like a translated reply or a follow-up nudge. You'll write your own here or start from a template."
          />
        )}
        {tab === "memory" && (
          <SettingsPlaceholder
            title="Memory"
            body="What Wati AI should know about you and your work, plus notes it learns from your chats. You'll be able to edit or delete any of it here."
          />
        )}
      </div>
    </div>
  );
}

function SettingsPlaceholder({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col gap-5">
      <h3 className="text-[14px] font-medium tracking-[-0.084px] text-[#0a0a0a]">{title}</h3>
      <div className="rounded-xl border border-dashed border-[#cfd6de] px-4 py-7 text-center">
        <span className="rounded-full bg-black/[0.06] px-2 py-0.5 text-[11px] font-medium text-black/55">
          Coming soon
        </span>
        <p className={`${HINT} mx-auto mt-3 max-w-[420px] !text-[13px]`}>{body}</p>
      </div>
    </div>
  );
}
