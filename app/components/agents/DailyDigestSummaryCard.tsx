"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import {
  useDailyDigestMeta,
  type DailyDigestStatus,
} from "../../lib/daily-digest-meta";

/**
 * Header card for the Daily Digest thread. Mirrors AgentSummaryCard's
 * shape (avatar · title · subtitle · status badge · actions row) so
 * the digest reads as just another agent at the top of its thread.
 *
 * All edit affordances now live in EditAgentDialog (opened by the
 * View Instructions button). The card itself only exposes Run now,
 * View Instructions, and a clickable status pill.
 */
export function DailyDigestSummaryCard({
  avatarPath,
  showInstructions,
  onRunNow,
  onToggleInstructions,
}: {
  avatarPath: string;
  showInstructions: boolean;
  onRunNow?: () => void;
  onToggleInstructions: () => void;
}) {
  const meta = useDailyDigestMeta();

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[#e5e5e5] bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#e5e5e5] bg-[#f5f5f5]">
          <Image
            src={avatarPath}
            alt=""
            width={32}
            height={32}
            className="object-contain"
            aria-hidden
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium tracking-[-0.084px] text-[#0a0a0a]">
            {meta.name}
          </p>
          <p className="truncate text-[12px] tracking-[-0.06px] text-black/50">
            {meta.description} · Daily at {meta.scheduleTime}
          </p>
        </div>
        <StatusPill
          status={meta.status}
          onToggle={() =>
            meta.setStatus(meta.status === "active" ? "paused" : "active")
          }
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onRunNow}
          className="flex items-center gap-1.5 rounded-full bg-[#0a0a0a] px-3 py-1.5 text-[13px] tracking-[-0.078px] text-white hover:bg-[#0a0a0a]/90"
        >
          <Play size={12} strokeWidth={2} />
          Run now
        </button>
        <button
          type="button"
          onClick={onToggleInstructions}
          aria-pressed={showInstructions}
          className="rounded-full border border-[#0a0a0a] bg-white px-3 py-1.5 text-[13px] tracking-[-0.078px] text-[#0a0a0a] hover:bg-black/[0.04]"
        >
          Edit Agent
        </button>
      </div>
    </div>
  );
}

function StatusPill({
  status,
  onToggle,
}: {
  status: DailyDigestStatus;
  onToggle: () => void;
}) {
  const tone =
    status === "active"
      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
      : "bg-amber-100 text-amber-700 hover:bg-amber-200";
  const label = status === "active" ? "Active" : "Inactive";
  return (
    <button
      type="button"
      onClick={onToggle}
      title={status === "active" ? "Click to pause" : "Click to activate"}
      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.5px] ${tone}`}
    >
      {label}
    </button>
  );
}
