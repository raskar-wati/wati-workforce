"use client";

import { useState, type KeyboardEvent } from "react";
import type { WatcherTypeId } from "../../lib/agents";
import { WATCHER_TYPES } from "../../lib/watcher-types";

const DISPLAY_ORDER: WatcherTypeId[] = [
  "top-topics",
  "demand-spike",
  "price-alert",
  "sentiment-monitor",
  "volume-spike",
  "ready-to-buy",
  "custom",
];

export function WatcherTypeOptionList({
  value,
  customDescription,
  onChange,
}: {
  value: WatcherTypeId | null;
  customDescription: string;
  onChange: (id: WatcherTypeId, customDescription?: string) => void;
}) {
  const [draftCustom, setDraftCustom] = useState(customDescription);

  const items = DISPLAY_ORDER.map(
    (id, i) => ({
      def: WATCHER_TYPES.find((w) => w.id === id)!,
      index: i + 1,
    }),
  );

  const handleCustomKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const text = draftCustom.trim();
      if (text) onChange("custom", text);
    }
  };

  return (
    <div className="flex flex-col">
      {items.map(({ def, index }) => {
        const selected = value === def.id;
        const isCustom = def.id === "custom";
        return (
          <div key={def.id} className="flex flex-col">
            <button
              type="button"
              onClick={() => {
                if (isCustom) {
                  onChange("custom", draftCustom.trim() || customDescription);
                } else {
                  onChange(def.id);
                }
              }}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                selected ? "bg-black/[0.04]" : "hover:bg-black/[0.02]"
              }`}
            >
              <span className="w-4 shrink-0 text-[13px] tracking-[-0.078px] text-black/40">
                {index}
              </span>
              <span className="text-[14px] tracking-[-0.084px] text-[#0a0a0a]">
                {def.label}
              </span>
            </button>
            {isCustom && selected && (
              <div className="px-3 pb-2 pt-1">
                <input
                  type="text"
                  value={draftCustom}
                  onChange={(e) => {
                    setDraftCustom(e.target.value);
                    onChange("custom", e.target.value);
                  }}
                  onKeyDown={handleCustomKey}
                  placeholder="Describe what to watch for…"
                  autoFocus
                  className="w-full rounded-md border border-[#e5e5e5] bg-white px-3 py-1.5 text-[13px] tracking-[-0.078px] text-[#0a0a0a] placeholder:text-black/40 focus:border-[#0a0a0a] focus:outline-none"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
