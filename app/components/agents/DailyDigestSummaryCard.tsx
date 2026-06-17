"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Header card for the Daily Digest thread. Mirrors AgentSummaryCard's
 * shape (avatar · title · subtitle · status badge · actions row) so
 * the digest reads as just another agent at the top of its thread.
 *
 * Standalone (doesn't go through getWatcherType / AgentSchedule) because
 * Daily Digest isn't a watcher — its fields are hardcoded.
 */
export function DailyDigestSummaryCard({
  avatarPath,
  onRunNow,
}: {
  avatarPath: string;
  onRunNow?: () => void;
}) {
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
            Daily Digest
          </p>
          <p className="truncate text-[12px] tracking-[-0.06px] text-black/50">
            Yesterday in numbers · Daily at 8 AM
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.5px] text-emerald-700">
          Active
        </span>
      </div>
      <RunNowActions onRunNow={onRunNow} />
    </div>
  );
}

function RunNowActions({ onRunNow }: { onRunNow?: () => void }): ReactNode {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onRunNow}
        className="flex items-center gap-1.5 rounded-full bg-[#0a0a0a] px-3 py-1.5 text-[13px] tracking-[-0.078px] text-white hover:bg-[#0a0a0a]/90"
      >
        <Play size={12} strokeWidth={2} />
        Run now
      </button>
    </div>
  );
}
