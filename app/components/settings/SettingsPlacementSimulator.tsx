"use client";

import { Check, FlaskConical } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAskWatiDrawer } from "../../lib/ask-wati-drawer";
import {
  PLACEMENT_OPTIONS,
  useAskWatiSettings,
  type SettingsPlacement,
} from "../../lib/ask-wati-settings";

/** Placements that live inside Ask Wati, so picking one brings the chat up. */
const IN_CHAT: SettingsPlacement[] = ["chat-header", "composer", "thread-panel"];

/**
 * Demo affordance for this branch: switch where the Ask Wati settings
 * (Connectors, Skills, Memory) are reached from, to compare placements.
 * Stands in for the island's Simulate menu while this is explored.
 */
export function SettingsPlacementSimulator() {
  const { placement, setPlacement } = useAskWatiSettings();
  const { openDrawer, inlineHost } = useAskWatiDrawer();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const pick = (id: SettingsPlacement) => {
    setPlacement(id);
    setOpen(false);
    if (IN_CHAT.includes(id) && !inlineHost) openDrawer();
  };

  return (
    <div ref={rootRef} className="fixed bottom-4 left-16 z-[60]">
      {open && (
        <div
          role="menu"
          className="absolute bottom-10 left-0 w-[280px] rounded-xl border border-wati-border bg-white p-1.5 shadow-lg"
        >
          <p className="px-2.5 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-black/45">
            Settings placement
          </p>
          {PLACEMENT_OPTIONS.map((o, i) => {
            const active = o.id === placement;
            return (
              <button
                key={o.id}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => pick(o.id)}
                className="flex w-full items-start gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-black/[0.04]"
              >
                <span className="mt-px w-4 shrink-0 text-[12px] text-black/40">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span
                    className={`block text-[13px] ${active ? "font-medium text-[#0a0a0a]" : "text-[#0a0a0a]"}`}
                  >
                    {o.label}
                  </span>
                  <span className="block text-[11px] text-black/50">{o.hint}</span>
                </span>
                {active && (
                  <Check size={14} strokeWidth={2} className="mt-0.5 shrink-0 text-wati-green" />
                )}
              </button>
            );
          })}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex h-8 items-center gap-1.5 rounded-full border border-wati-border bg-white px-3 text-[12px] font-medium text-black/60 shadow-sm hover:text-[#0a0a0a]"
      >
        <FlaskConical size={14} strokeWidth={1.75} />
        Simulate
      </button>
    </div>
  );
}
