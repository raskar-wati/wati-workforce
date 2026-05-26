"use client";

import Image from "next/image";
import type { HandoffWithAgent } from "../../lib/agents";

/**
 * Single row in the inbox list. Shows the agent avatar, agent name, time,
 * a one-line preview of the handoff, and selection state.
 */
export function HandoffListItem({
  handoff,
  selected,
  agentHandoffCount,
  onSelect,
}: {
  handoff: HandoffWithAgent;
  selected: boolean;
  /** Total number of handoffs this agent has produced — shown as a chip
   * next to the agent name when greater than 1. */
  agentHandoffCount: number;
  onSelect: () => void;
}) {
  const preview = buildPreview(handoff);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? "true" : undefined}
      className={`flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2.5 text-left transition-colors ${
        selected
          ? "bg-[var(--wati-chip-bg)]"
          : "hover:bg-[var(--wati-surface-subtle)]"
      }`}
    >
      <Image
        src={handoff.agent.avatarSeed}
        alt=""
        width={20}
        height={20}
        className="mt-0.5 shrink-0 rounded-full"
        aria-hidden
      />

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-baseline justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="truncate text-[13px] font-medium tracking-[-0.078px] text-[var(--wati-text-body)]">
              {handoff.agent.name}
            </p>
            {agentHandoffCount > 1 && (
              <span className="flex h-[16px] min-w-[16px] shrink-0 items-center justify-center rounded border border-[var(--wati-border-default)] bg-[var(--wati-surface-subtle)] px-1 text-[10px] font-medium text-[var(--wati-text-body)]">
                {agentHandoffCount}
              </span>
            )}
          </div>
          <span className="shrink-0 text-[11px] tracking-[-0.06px] text-black/40">
            {formatTime(handoff.runAt)}
          </span>
        </div>
        <p className="line-clamp-2 text-[12px] leading-[16px] tracking-[-0.06px] text-black/55">
          {preview}
        </p>
      </div>
    </button>
  );
}

function buildPreview(h: HandoffWithAgent): string {
  // Prefer the attention section, then summary, then did.
  const attn = h.sections.find((s) => s.kind === "attention");
  const sum = h.sections.find((s) => s.kind === "summary");
  const did = h.sections.find((s) => s.kind === "did");
  const pick = attn ?? sum ?? did;
  const first = pick?.items[0]?.label;
  if (first) return first;
  return `Run #${h.runNumber}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
