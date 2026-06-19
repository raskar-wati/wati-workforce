"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import type {
  Agent,
  AgentSchedule,
  AgentStatus,
  WatcherTypeId,
} from "../../lib/agents";
import { getWatcherType } from "../../lib/watcher-types";
import { formatSchedule } from "./SchedulePresetList";

export type AgentSummaryData = {
  avatarPath: string;
  name: string;
  watcherType: WatcherTypeId;
  schedule: AgentSchedule;
  description?: string;
  status?: AgentStatus;
};

const STATUS_LABEL: Record<AgentStatus, string> = {
  draft: "Draft",
  active: "Active",
  paused: "Inactive",
};

const STATUS_TONE: Record<AgentStatus, string> = {
  draft: "bg-black/[0.06] text-black/60",
  active: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
  paused: "bg-amber-100 text-amber-700 hover:bg-amber-200",
};

/**
 * Default instructions seeded from the watcher type. Used when an agent
 * was created before the instructions field existed, or when it was never
 * customized — kept as a function so it stays in sync with watcher-types.
 */
export function getDefaultInstructions(agent: Agent): string {
  const wt = getWatcherType(agent.watcherType);
  const role =
    wt.id === "custom" && agent.description ? agent.description : wt.blurb;
  return `You are ${agent.name}. ${role}\n\nRun on the configured schedule. Each run, deliver a concise handoff with:\n- What you observed in the last cycle.\n- What needs human attention now (with names, counts, and links).\n- A short summary the team can scan in under 30 seconds.\n\nLead with numbers. Don't speculate.`;
}

export function AgentSummaryCard({
  data,
  actions,
  showInstructions,
  onToggleInstructions,
  onToggleStatus,
}: {
  data: AgentSummaryData;
  actions?: ReactNode;
  showInstructions?: boolean;
  onToggleInstructions?: () => void;
  onToggleStatus?: () => void;
}) {
  const wt = getWatcherType(data.watcherType);
  const subtitle =
    wt.id === "custom" && data.description ? data.description : wt.label;
  const pillStatus = data.status;
  const toggleable = pillStatus && pillStatus !== "draft" && onToggleStatus;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[#e5e5e5] bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#e5e5e5] bg-[#f5f5f5]">
          <Image
            src={data.avatarPath}
            alt=""
            width={32}
            height={32}
            className="object-contain"
            aria-hidden
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium tracking-[-0.084px] text-[#0a0a0a]">
            {data.name}
          </p>
          <p className="truncate text-[12px] tracking-[-0.06px] text-black/50">
            {subtitle} · {formatSchedule(data.schedule)}
          </p>
        </div>
        {pillStatus &&
          (toggleable ? (
            <button
              type="button"
              onClick={onToggleStatus}
              title={
                pillStatus === "active" ? "Click to pause" : "Click to activate"
              }
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.5px] ${STATUS_TONE[pillStatus]}`}
            >
              {STATUS_LABEL[pillStatus]}
            </button>
          ) : (
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.5px] ${STATUS_TONE[pillStatus]}`}
            >
              {STATUS_LABEL[pillStatus]}
            </span>
          ))}
      </div>
      {(actions || onToggleInstructions) && (
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          {onToggleInstructions && (
            <button
              type="button"
              onClick={onToggleInstructions}
              aria-pressed={showInstructions}
              className="rounded-full border border-[#0a0a0a] bg-white px-3 py-1.5 text-[13px] tracking-[-0.078px] text-[#0a0a0a] hover:bg-black/[0.04]"
            >
              View Instructions
            </button>
          )}
        </div>
      )}
    </div>
  );
}
