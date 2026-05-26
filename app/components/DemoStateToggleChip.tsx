"use client";

import { UserRound } from "lucide-react";
import { useDemoState } from "../lib/demo-state";

/**
 * Phase-1 dev affordance: cycles the app between the empty "first-time user"
 * state and the populated "returning user" demo state. Each mode persists its
 * own agents/threads, so flipping back and forth doesn't destroy work.
 */
export function DemoStateToggleChip() {
  const { mode, setMode } = useDemoState();
  const label = mode === "first-time" ? "First-time user" : "Returning user";

  const cycle = () => {
    setMode(mode === "first-time" ? "returning" : "first-time");
  };

  return (
    <button
      type="button"
      onClick={cycle}
      title="Switch user state (dev)"
      className="flex w-full items-center gap-2 rounded p-1 text-left hover:bg-[var(--wati-surface-subtle)]"
    >
      <span className="flex h-5 w-5 items-center justify-center text-[var(--wati-icon-default)]">
        <UserRound size={14} strokeWidth={2} />
      </span>
      <span className="flex-1 truncate text-[12px] tracking-[-0.06px] text-black/50">
        {label}
      </span>
    </button>
  );
}
