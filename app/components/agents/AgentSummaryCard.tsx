"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import type {
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
  paused: "Paused",
};

const STATUS_TONE: Record<AgentStatus, string> = {
  draft: "bg-black/[0.06] text-black/60",
  active: "bg-emerald-100 text-emerald-700",
  paused: "bg-amber-100 text-amber-700",
};

export function AgentSummaryCard({
  data,
  actions,
}: {
  data: AgentSummaryData;
  actions?: ReactNode;
}) {
  const wt = getWatcherType(data.watcherType);
  const subtitle =
    wt.id === "custom" && data.description ? data.description : wt.label;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[#e5e5e5] bg-white p-4">
      <div className="flex items-center gap-3">
        <Image
          src={data.avatarPath}
          alt=""
          width={40}
          height={40}
          className="shrink-0 rounded-full border border-[#e5e5e5]"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium tracking-[-0.084px] text-[#0a0a0a]">
            {data.name}
          </p>
          <p className="truncate text-[12px] tracking-[-0.06px] text-black/50">
            {subtitle} · {formatSchedule(data.schedule)}
          </p>
        </div>
        {data.status && (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.5px] ${STATUS_TONE[data.status]}`}
          >
            {STATUS_LABEL[data.status]}
          </span>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
