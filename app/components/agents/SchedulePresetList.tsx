"use client";

import { Pencil } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import type { AgentSchedule } from "../../lib/agents";

type Preset = {
  label: string;
  schedule: AgentSchedule;
};

const PRESETS: readonly Preset[] = [
  { label: "Everyday @8 AM", schedule: { kind: "recurring", preset: "daily" } },
  { label: "Every Week", schedule: { kind: "recurring", preset: "weekly" } },
  {
    label: "Every other day",
    schedule: { kind: "recurring", preset: "every-other-day" },
  },
  { label: "Only once", schedule: { kind: "once" } },
];

function isCustom(s: AgentSchedule | null): s is { kind: "custom"; description: string } {
  return s?.kind === "custom";
}

function schedulesEqual(a: AgentSchedule | null, b: AgentSchedule): boolean {
  if (!a) return false;
  if (a.kind !== b.kind) return false;
  if (a.kind === "recurring" && b.kind === "recurring") {
    return a.preset === b.preset;
  }
  return true;
}

export function SchedulePresetList({
  value,
  customDraft,
  onChange,
}: {
  value: AgentSchedule | null;
  customDraft: string;
  onChange: (schedule: AgentSchedule) => void;
}) {
  const [localCustom, setLocalCustom] = useState(customDraft);
  const customSelected = isCustom(value);

  const submitCustom = (text: string) => {
    onChange({ kind: "custom", description: text });
  };

  const onCustomKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const text = localCustom.trim();
      if (text) submitCustom(text);
    }
  };

  return (
    <div className="flex flex-col">
      {PRESETS.map((p) => {
        const selected = schedulesEqual(value, p.schedule);
        return (
          <button
            key={p.label}
            type="button"
            onClick={() => onChange(p.schedule)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
              selected ? "bg-black/[0.04]" : "hover:bg-black/[0.02]"
            }`}
          >
            <span className="text-[14px] tracking-[-0.084px] text-[#0a0a0a]">
              {p.label}
            </span>
          </button>
        );
      })}

      <div className="flex flex-col">
        <button
          type="button"
          onClick={() => submitCustom(localCustom.trim() || customDraft)}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
            customSelected ? "bg-black/[0.04]" : "hover:bg-black/[0.02]"
          }`}
        >
          <Pencil size={12} strokeWidth={2} className="text-black/40" />
          <span
            className={`text-[14px] tracking-[-0.084px] ${
              customSelected ? "text-[#0a0a0a]" : "text-black/40"
            }`}
          >
            {customSelected && localCustom.trim().length > 0
              ? localCustom
              : "Something else"}
          </span>
        </button>
        {customSelected && (
          <div className="px-3 pb-2 pt-1">
            <input
              type="text"
              value={localCustom}
              onChange={(e) => {
                setLocalCustom(e.target.value);
                submitCustom(e.target.value);
              }}
              onKeyDown={onCustomKey}
              placeholder="Describe when this should run…"
              autoFocus
              className="w-full rounded-md border border-[#e5e5e5] bg-white px-3 py-1.5 text-[13px] tracking-[-0.078px] text-[#0a0a0a] placeholder:text-black/40 focus:border-[#0a0a0a] focus:outline-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function formatSchedule(schedule: AgentSchedule): string {
  if (schedule.kind === "once") return "Runs once";
  if (schedule.kind === "custom") return schedule.description;
  switch (schedule.preset) {
    case "daily":
      return "Daily at 8 AM";
    case "weekly":
      return "Weekly";
    case "every-other-day":
      return "Every other day";
  }
}

export function scheduleTitle(schedule: AgentSchedule): string {
  if (schedule.kind === "once") return "Only once";
  if (schedule.kind === "custom") return "Custom schedule";
  switch (schedule.preset) {
    case "daily":
      return "Everyday @8 AM";
    case "weekly":
      return "Every week";
    case "every-other-day":
      return "Every other day";
  }
}

export function scheduleSubtitle(schedule: AgentSchedule): string {
  if (schedule.kind === "once") return "Runs once when activated";
  if (schedule.kind === "custom") return schedule.description;
  switch (schedule.preset) {
    case "daily":
      return "At 08:00 AM, every day";
    case "weekly":
      return "At 08:00 AM, every Monday";
    case "every-other-day":
      return "At 08:00 AM, every other day";
  }
}
