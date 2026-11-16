"use client";

import { Settings } from "lucide-react";
import { useAskWatiSettings } from "../../lib/ask-wati-settings";
import { useChatThreads } from "../../lib/chat-threads";

/**
 * "Gear in the chat header" placement: sits in the row of header icons.
 * In the drawer that row is [gear][+][expand][×] at the top right; the +
 * only shows inside a thread, so the gear slides into its spot without it.
 * The full page has no expand or ×, so the gear sits just right of the +.
 */
export function SettingsGearButton({ expanded }: { expanded: boolean }) {
  const { placement, openSettings, expiredCount } = useAskWatiSettings();
  const { activeThreadId } = useChatThreads();
  if (placement !== "chat-header") return null;

  const right = expanded ? "right-[40px]" : activeThreadId ? "right-[104px]" : "right-[72px]";

  return (
    <button
      type="button"
      onClick={() => openSettings("connectors")}
      aria-label="Ask Wati settings"
      title="Settings"
      className={`absolute ${right} top-2 z-10 flex h-7 w-7 items-center justify-center rounded text-[var(--wati-icon-default)] hover:bg-[var(--wati-surface-subtle)]`}
    >
      <Settings size={15} strokeWidth={1.75} />
      {expiredCount > 0 && (
        <span
          aria-hidden
          className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-red-500 ring-2 ring-white"
        />
      )}
    </button>
  );
}
