"use client";

import { BookOpen, Brain, LayoutGrid, MessagesSquare, SquareSlash } from "lucide-react";
import type { ComponentType } from "react";
import type { SettingsTab } from "../../lib/ask-wati-settings";
import { ConnectorsSettings } from "./ConnectorsSettings";
import { InboxAiSettings } from "./InboxAiSettings";
import { KnowledgeBaseSettings } from "./KnowledgeBaseSettings";
import { HINT } from "./settings-styles";

/** Wati AI settings pages, in nav order (Settings > Wati AI). */
export const WATI_AI_TABS: {
  id: SettingsTab;
  label: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
}[] = [
  { id: "connectors", label: "Connectors", icon: LayoutGrid },
  { id: "skills", label: "Skills", icon: SquareSlash },
  { id: "memory", label: "Memory", icon: Brain },
  { id: "knowledge", label: "Knowledge base", icon: BookOpen },
  { id: "conversations", label: "Conversations", icon: MessagesSquare },
];

/**
 * One Settings > Wati AI page. Positioned so the add-server sheet can cover it.
 */
export function AskWatiSettings({ tab }: { tab: SettingsTab }) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="min-w-0 max-w-[760px] flex-1">
        {tab === "connectors" && <ConnectorsSettings />}
        {tab === "knowledge" && <KnowledgeBaseSettings />}
        {tab === "conversations" && <InboxAiSettings />}
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
