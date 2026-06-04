"use client";

import { UserRound } from "lucide-react";
import { useDemoState } from "../lib/demo-state";

/**
 * Phase-1 dev affordance: cycles the app between the empty "first-time user"
 * state and the populated "returning user" demo state.
 *
 * Clicking into "First-time user" is a **hard reset of the playground**:
 * it wipes all per-mode storage (threads, agents, onboarding-seen flag)
 * and full-reloads so the new tenant lands on a clean conversation. The
 * tenant selection survives the reset so people don't have to re-pick
 * Travel House vs. BigHaat every time.
 */
export function DemoStateToggleChip() {
  const { mode } = useDemoState();
  const label = mode === "first-time" ? "First-time user" : "Returning user";

  const cycle = () => {
    const next = mode === "first-time" ? "returning" : "first-time";
    if (next === "first-time") {
      // Wipe everything except tenant choice, then reload.
      try {
        const KEEP = new Set(["wati.tenant.v1"]);
        const toRemove: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (!key) continue;
          if (key.startsWith("wati.") && !KEEP.has(key)) {
            toRemove.push(key);
          }
        }
        toRemove.forEach((k) => window.localStorage.removeItem(k));
        // Set the mode explicitly so the post-reload hydrate lands in
        // first-time without re-running the toggle effect.
        window.localStorage.setItem("wati.demo-mode.v1", "first-time");
      } catch {
        // ignore quota / disabled storage
      }
      window.location.reload();
      return;
    }
    // Switching to returning-user mode: just persist and reload so the
    // returning-mode buckets hydrate fresh from their seeded data.
    try {
      window.localStorage.setItem("wati.demo-mode.v1", "returning");
    } catch {
      // ignore
    }
    window.location.reload();
  };

  return (
    <button
      type="button"
      onClick={cycle}
      title="Switch user state (dev) — picking First-time user resets the playground"
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
