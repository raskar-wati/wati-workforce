"use client";

import type { HandoffWithAgent } from "../../lib/agents";
import { HandoffListItem } from "./HandoffListItem";

export type InboxFilter = "all" | "attention";

type Group = { label: string; handoffs: HandoffWithAgent[] };

/**
 * Left column of the inbox. Header, two quick filters (All / Needs Attention),
 * and a date-grouped list of handoffs.
 */
export function HandoffInboxList({
  handoffs,
  filter,
  onFilterChange,
  attentionCount,
  totalCount,
  agentHandoffCounts,
  selectedId,
  onSelect,
  unreadTotal,
  onMarkAllRead,
}: {
  handoffs: HandoffWithAgent[];
  filter: InboxFilter;
  onFilterChange: (f: InboxFilter) => void;
  attentionCount: number;
  totalCount: number;
  /** Map of agent id → total handoff count, used to badge multi-handoff agents. */
  agentHandoffCounts: Record<string, number>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  unreadTotal: number;
  onMarkAllRead: () => void;
}) {
  const groups = groupByDate(handoffs);

  return (
    <div className="flex h-full w-[320px] shrink-0 flex-col border-r border-[var(--wati-border-default)]">
      {/* Header */}
      <div className="flex flex-col gap-3 px-4 pt-5 pb-3">
        <div className="flex items-baseline justify-between gap-2">
          <h1 className="text-[18px] font-semibold tracking-[-0.36px] text-[#0a0a0a]">
            Handoffs
          </h1>
          {unreadTotal > 0 && (
            <button
              type="button"
              onClick={onMarkAllRead}
              className="text-[12px] tracking-[-0.06px] text-black/50 hover:text-[#0a0a0a]"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Quick filters */}
      <div className="flex flex-wrap gap-1.5 px-4 pb-3">
        <FilterChip
          label="All"
          count={totalCount}
          active={filter === "all"}
          onClick={() => onFilterChange("all")}
        />
        <FilterChip
          label="Needs Attention"
          count={attentionCount}
          active={filter === "attention"}
          onClick={() => onFilterChange("attention")}
        />
      </div>

      {/* List */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-2 pb-4">
        {groups.map((g) => (
          <div key={g.label} className="flex flex-col gap-0.5">
            <p className="px-2.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[1px] text-black/35">
              {g.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {g.handoffs.map((h) => (
                <HandoffListItem
                  key={h.id}
                  handoff={h}
                  selected={selectedId === h.id}
                  agentHandoffCount={agentHandoffCounts[h.agent.id] ?? 1}
                  onSelect={() => onSelect(h.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] tracking-[-0.06px] transition-colors ${
        active
          ? "bg-[#0a0a0a] text-white"
          : "bg-black/[0.05] text-black/65 hover:bg-black/[0.08]"
      }`}
    >
      <span className="truncate max-w-[140px]">{label}</span>
      <span className={active ? "text-white/70" : "text-black/40"}>{count}</span>
    </button>
  );
}

function groupByDate(handoffs: HandoffWithAgent[]): Group[] {
  const now = new Date();
  const today = startOfDay(now);
  const yesterday = startOfDay(new Date(today.getTime() - 24 * 60 * 60 * 1000));
  const weekAgo = startOfDay(new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000));

  const buckets = new Map<string, HandoffWithAgent[]>();
  const order: string[] = [];

  for (const h of handoffs) {
    const d = new Date(h.runAt);
    let label: string;
    if (d >= today) label = "Today";
    else if (d >= yesterday) label = "Yesterday";
    else if (d >= weekAgo)
      label = d.toLocaleDateString(undefined, { weekday: "long" });
    else label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });

    if (!buckets.has(label)) {
      buckets.set(label, []);
      order.push(label);
    }
    buckets.get(label)!.push(h);
  }

  return order.map((label) => ({ label, handoffs: buckets.get(label)! }));
}

function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}
