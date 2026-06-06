"use client";

import { AlertTriangle, Clock, Inbox, MessageSquareText } from "lucide-react";
import type { WatcherTypeId } from "../../lib/agents";
import type { InboxStats } from "../../lib/inbox-context";

type InboxSuggestion = {
  id: string;
  Icon: typeof Inbox;
  name: string;
  evidence: (s: InboxStats) => string;
  prompt: (s: InboxStats) => string;
  /**
   * Reuse the existing watcher pipeline so picking a suggestion still flows
   * through the same downstream behavior as the WorkForce surface.
   */
  watcherTypeId: WatcherTypeId;
};

const INBOX_SUGGESTIONS: InboxSuggestion[] = [
  {
    id: "summarize-queue",
    Icon: Inbox,
    name: "Summarize my queue",
    evidence: (s) => `${s.activeChats} active chats right now`,
    prompt: (s) =>
      `Summarize my ${s.activeChats} active inbox conversations — what needs attention first?`,
    watcherTypeId: "urgency",
  },
  {
    id: "sla-risk",
    Icon: AlertTriangle,
    name: "Surface SLA risks",
    evidence: (s) =>
      s.overSla > 0
        ? `${s.overSla} thread${s.overSla === 1 ? "" : "s"} over SLA`
        : "Watch for first-response delays",
    prompt: (s) =>
      `Show me threads at risk of breaching SLA — there are ${s.overSla} already over.`,
    watcherTypeId: "urgency",
  },
  {
    id: "draft-oldest",
    Icon: Clock,
    name: "Draft replies for the oldest threads",
    evidence: (s) => `Oldest open thread: ${s.oldestOpenHours}h ago`,
    prompt: (s) =>
      `Draft replies for the ${Math.min(5, s.activeChats)} oldest open conversations in my inbox.`,
    watcherTypeId: "urgency",
  },
  {
    id: "ready-to-buy",
    Icon: MessageSquareText,
    name: "Spot ready-to-buy customers",
    evidence: () => "Across today's inbox activity",
    prompt: () =>
      `Scan my inbox for customers showing buying intent right now and surface the top 5.`,
    watcherTypeId: "ready-to-buy",
  },
];

export function InboxAskWatiSuggestions({
  stats,
  onSelect,
}: {
  stats: InboxStats;
  onSelect: (prompt: string, watcherTypeId: WatcherTypeId) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <p className="text-sm text-[var(--wati-text-body)]">For your inbox</p>
        <span className="rounded-full bg-[#EFF8FF] px-2 py-0.5 text-[11px] font-medium text-[#1570EF]">
          {stats.activeChats} active · {stats.overSla} over SLA · {stats.unread} unread
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {INBOX_SUGGESTIONS.map((s) => {
          const Icon = s.Icon;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s.prompt(stats), s.watcherTypeId)}
              className="flex flex-col items-start gap-2 rounded-[10px] border border-[#e5e5e5] bg-white p-4 text-left transition-colors hover:bg-[var(--wati-surface-subtle)]"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-black/[0.04] text-[#0a0a0a]">
                <Icon size={14} strokeWidth={1.75} />
              </span>
              <span className="text-[12px] font-medium leading-[16.5px] text-[#0a0a0a]">
                {s.name}
              </span>
              <span className="text-[12px] leading-[16.5px] text-[#737373]">
                {s.evidence(stats)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
