"use client";

import type { WatcherTypeId } from "../../lib/agents";
import { ACTIVE_WATCHER_TYPES } from "../../lib/watcher-types";

// The PRD's out-of-box roster (UI Spec sub-page 6), in its listing order.
// Daily Digest is the pinned system agent, so it isn't a creatable template.
const DISPLAY_ORDER: WatcherTypeId[] = [
  "urgency",
  "ready-to-buy",
  "delivery-issue",
  "paid-acq",
  "top-topics",
  "response-gap",
];

/**
 * The roster: every creatable agent type, pick-to-start. Rendered inside the
 * matching ladder's ambiguous and no-match states (agent-schema.md §2) —
 * there is no free-text "Other" entry; unsupported asks are captured as
 * role requests instead.
 */
export function WatcherTypeOptionList({
  ids,
  onSelect,
}: {
  /** Restrict + order the list (e.g. the ambiguous rung's closest matches). */
  ids?: WatcherTypeId[];
  onSelect: (id: WatcherTypeId) => void;
}) {
  const items = (ids ?? DISPLAY_ORDER).map((id, i) => ({
    def: ACTIVE_WATCHER_TYPES.find((w) => w.id === id)!,
    index: i + 1,
  }));

  return (
    <div className="flex flex-col">
      {items.map(({ def, index }) => (
        <button
          key={def.id}
          type="button"
          onClick={() => onSelect(def.id)}
          className="flex items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-black/[0.03]"
        >
          <span className="w-4 shrink-0 pt-px text-[13px] tracking-[-0.078px] text-black/40">
            {index}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="text-[13px] font-medium tracking-[-0.078px] text-[#0a0a0a]">
              {def.label}
            </span>
            <span className="text-[12px] tracking-[-0.06px] text-black/50">
              {def.blurb}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}
