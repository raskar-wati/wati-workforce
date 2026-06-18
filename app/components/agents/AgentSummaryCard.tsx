"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type {
  Agent,
  AgentSchedule,
  AgentStatus,
  WatcherTypeId,
} from "../../lib/agents";
import { getWatcherType } from "../../lib/watcher-types";
import { AgentActionMenu } from "./AgentActionMenu";
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

/**
 * Display card for a single agent (non-Daily-Digest). Manages rename,
 * status toggle, View Instructions toggle, and surfaces the kebab menu.
 * `actions` (e.g. Run now) is composed in by the caller so this card
 * doesn't need to know about action firing.
 */
export function AgentSummaryCard({
  data,
  actions,
  agentId,
  showInstructions,
  onToggleInstructions,
  onRename,
  onToggleStatus,
  onDeleteRequest,
}: {
  data: AgentSummaryData;
  actions?: ReactNode;
  agentId?: string;
  showInstructions?: boolean;
  onToggleInstructions?: () => void;
  onRename?: (next: string) => void;
  onToggleStatus?: () => void;
  onDeleteRequest?: () => void;
}) {
  const wt = getWatcherType(data.watcherType);
  const subtitle =
    wt.id === "custom" && data.description ? data.description : wt.label;
  const [renaming, setRenaming] = useState(false);
  const manageable = Boolean(
    agentId && onRename && onToggleStatus && onDeleteRequest,
  );
  const pillStatus: AgentStatus | undefined = data.status;

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
          {manageable && renaming ? (
            <NameEditor
              initial={data.name}
              onCommit={(next) => {
                onRename?.(next);
                setRenaming(false);
              }}
              onCancel={() => setRenaming(false)}
            />
          ) : manageable ? (
            <button
              type="button"
              onClick={() => setRenaming(true)}
              className="block w-full truncate text-left text-[14px] font-medium tracking-[-0.084px] text-[#0a0a0a] hover:underline"
              title="Click to rename"
            >
              {data.name}
            </button>
          ) : (
            <p className="truncate text-[14px] font-medium tracking-[-0.084px] text-[#0a0a0a]">
              {data.name}
            </p>
          )}
          <p className="truncate text-[12px] tracking-[-0.06px] text-black/50">
            {subtitle} · {formatSchedule(data.schedule)}
          </p>
        </div>
        {pillStatus &&
          (manageable && pillStatus !== "draft" ? (
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
      {(actions || manageable) && (
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          {manageable && onToggleInstructions && (
            <button
              type="button"
              onClick={onToggleInstructions}
              aria-pressed={showInstructions}
              className={`rounded-full border border-[#0a0a0a] px-3 py-1.5 text-[13px] tracking-[-0.078px] ${
                showInstructions
                  ? "bg-[#0a0a0a] text-white"
                  : "bg-white text-[#0a0a0a] hover:bg-black/[0.04]"
              }`}
            >
              View Instructions
            </button>
          )}
          {manageable && (
            <div className="ml-auto">
              <AgentActionMenu
                status={pillStatus === "active" ? "active" : "paused"}
                onRename={() => setRenaming(true)}
                onToggleStatus={() => onToggleStatus?.()}
                onDelete={() => onDeleteRequest?.()}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NameEditor({
  initial,
  onCommit,
  onCancel,
}: {
  initial: string;
  onCommit: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initial);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);
  return (
    <input
      ref={ref}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => onCommit(value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onCommit(value);
        } else if (e.key === "Escape") {
          e.preventDefault();
          onCancel();
        }
      }}
      className="w-full rounded-md border border-[#1570EF] bg-white px-2 py-0.5 text-[14px] font-medium tracking-[-0.084px] text-[#0a0a0a] outline-none"
    />
  );
}
