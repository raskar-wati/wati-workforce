"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAskWatiSettings, type SettingsTab } from "../../lib/ask-wati-settings";
import { AskWatiSettings } from "./AskWatiSettings";

/** Settings pop-up, used by the placements that don't have their own page. */
export function AskWatiSettingsDialog() {
  const { dialogOpen, dialogTab, closeSettings } = useAskWatiSettings();
  const [tab, setTab] = useState<SettingsTab>(dialogTab);

  // Each opening starts on the tab the entry point asked for.
  useEffect(() => {
    if (dialogOpen) setTab(dialogTab);
  }, [dialogOpen, dialogTab]);

  useEffect(() => {
    if (!dialogOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSettings();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [dialogOpen, closeSettings]);

  if (!dialogOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Ask Wati settings"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeSettings();
      }}
    >
      <div className="flex h-[min(680px,calc(100vh-32px))] w-full max-w-[920px] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
        <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
          <h2 className="text-[16px] font-medium tracking-[-0.096px] text-[#0a0a0a]">
            Ask Wati settings
          </h2>
          <button
            type="button"
            onClick={closeSettings}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-full text-black/55 hover:bg-black/[0.04] hover:text-[#0a0a0a]"
          >
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>
        <AskWatiSettings tab={tab} onTabChange={setTab} />
      </div>
    </div>
  );
}
