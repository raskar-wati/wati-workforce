"use client";

import { motion } from "motion/react";
import { Play } from "lucide-react";
import type { AgentSchedule } from "../../lib/agents";
import { scheduleSubtitle, scheduleTitle } from "./SchedulePresetList";

export function ScheduleTaskCard({
  agentName,
  schedule,
  disabled = false,
  onSchedule,
  onRunNow,
}: {
  agentName: string;
  schedule: AgentSchedule;
  disabled?: boolean;
  onSchedule: () => void;
  onRunNow: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
      className="flex flex-col gap-4 rounded-2xl border border-[#e5e5e5] bg-white p-5"
    >
      <div className="flex flex-col gap-2">
        <p className="text-[12px] tracking-[-0.06px] text-black/50">
          <span className="font-semibold text-[#0a0a0a]">Schedule task</span>{" "}
          <span className="px-1 text-black/40">·</span> {agentName}
        </p>
        <div className="flex flex-col gap-0.5">
          <p className="text-[15px] font-semibold tracking-[-0.075px] text-[#0a0a0a]">
            {scheduleTitle(schedule)}
          </p>
          <p className="text-[13px] tracking-[-0.078px] text-black/50">
            {scheduleSubtitle(schedule)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onSchedule}
          disabled={disabled}
          className="rounded-lg bg-[#0a0a0a] px-4 py-1.5 text-[13px] tracking-[-0.078px] text-white hover:bg-[#0a0a0a]/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Schedule
        </button>
        <button
          type="button"
          onClick={onRunNow}
          disabled={disabled}
          className="flex items-center gap-1.5 rounded-lg border border-[#e5e5e5] bg-white px-3 py-1.5 text-[13px] tracking-[-0.078px] text-[#0a0a0a] hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Play size={12} strokeWidth={2} />
          Run now
        </button>
      </div>
    </motion.div>
  );
}
