"use client";

import { useEffect, useMemo, useState } from "react";
import { useAgents } from "../../lib/agents";
import { useFireHandoffCta } from "../../lib/use-fire-handoff-cta";
import { HandoffDetail } from "./HandoffDetail";
import { HandoffInboxEmpty } from "./HandoffInboxEmpty";
import { HandoffInboxList, type InboxFilter } from "./HandoffInboxList";
import { HandoffInboxPlaceholder } from "./HandoffInboxPlaceholder";

/**
 * Top-level Handoff Inbox surface. Two-column layout:
 *   left  — quick filters + agent-deduped list of handoffs
 *   right — selected handoff content (or empty/placeholder)
 *
 * The list shows ONE row per agent — the row reflects the agent's newest run,
 * with a counter chip on the name indicating total runs. Selecting an agent
 * marks every handoff from that agent as read.
 */
export function HandoffInbox() {
  const {
    actionRunsByAgent,
    handoffsByAgent,
    getAllHandoffs,
    markHandoffsRead,
    markAllHandoffsRead,
    unreadHandoffCount,
  } = useAgents();
  const fireCta = useFireHandoffCta();

  const [filter, setFilter] = useState<InboxFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const allHandoffs = getAllHandoffs();

  // Dedupe by agent — keep only the newest run per agent. `getAllHandoffs`
  // is already sorted newest-first so the first seen is the newest.
  const dedupedByAgent = useMemo(() => {
    const seen = new Set<string>();
    const out: typeof allHandoffs = [];
    for (const h of allHandoffs) {
      if (seen.has(h.agent.id)) continue;
      seen.add(h.agent.id);
      out.push(h);
    }
    return out;
  }, [allHandoffs]);

  // "Needs Attention" filter: only agents whose NEWEST run has an attention
  // section. Older attention items that have since been superseded by a
  // clean run shouldn't keep nagging.
  const attentionDeduped = useMemo(
    () =>
      dedupedByAgent.filter((h) =>
        h.sections.some((s) => s.kind === "attention"),
      ),
    [dedupedByAgent],
  );

  const visible = filter === "attention" ? attentionDeduped : dedupedByAgent;

  // Total handoffs per agent — drives the count chip on each row.
  const agentHandoffCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const h of allHandoffs) {
      counts[h.agent.id] = (counts[h.agent.id] ?? 0) + 1;
    }
    return counts;
  }, [allHandoffs]);

  // Auto-select: if nothing selected or current selection isn't visible,
  // pick the first one in the (filtered) list.
  useEffect(() => {
    if (visible.length === 0) {
      if (selectedId !== null) setSelectedId(null);
      return;
    }
    const inView = selectedId && visible.some((h) => h.id === selectedId);
    if (!inView) setSelectedId(visible[0].id);
  }, [visible, selectedId]);

  // Mark read: when an agent's row is selected, every handoff from that
  // agent gets marked read (older runs would otherwise be unreachable).
  const selectedAgentId = visible.find((h) => h.id === selectedId)?.agent.id;
  useEffect(() => {
    if (!selectedAgentId) return;
    const ids = (handoffsByAgent[selectedAgentId] ?? []).map((h) => h.id);
    markHandoffsRead(ids);
  }, [selectedAgentId, handoffsByAgent, markHandoffsRead]);

  if (allHandoffs.length === 0) {
    return (
      <div className="flex h-full w-full">
        <HandoffInboxEmpty />
      </div>
    );
  }

  const selected = visible.find((h) => h.id === selectedId) ?? null;

  const firedCtaIds = new Set<string>();
  if (selected) {
    for (const r of actionRunsByAgent[selected.agent.id] ?? []) {
      firedCtaIds.add(r.ctaId);
    }
  }

  return (
    <div className="flex h-full w-full">
      <HandoffInboxList
        handoffs={visible}
        filter={filter}
        onFilterChange={setFilter}
        attentionCount={attentionDeduped.length}
        totalCount={dedupedByAgent.length}
        agentHandoffCounts={agentHandoffCounts}
        selectedId={selectedId}
        onSelect={setSelectedId}
        unreadTotal={unreadHandoffCount}
        onMarkAllRead={markAllHandoffsRead}
      />

      {selected ? (
        <HandoffDetail
          handoff={selected}
          firedCtaIds={firedCtaIds}
          onFireCta={(cta) => fireCta(selected.agent.id, selected.id, cta)}
        />
      ) : (
        <HandoffInboxPlaceholder />
      )}
    </div>
  );
}
