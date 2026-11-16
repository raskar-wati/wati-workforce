"use client";

import { Settings } from "lucide-react";
import { useAskWatiSettings } from "../../lib/ask-wati-settings";

/** "Foot of the chats list" placement: pinned under the Ask Wati thread list. */
export function ThreadPanelSettingsLink() {
  const { placement, openSettings, expiredCount } = useAskWatiSettings();
  if (placement !== "thread-panel") return null;
  return (
    <div className="shrink-0 border-t border-[var(--wati-border-default)] p-2">
      <button
        type="button"
        onClick={() => openSettings("connectors")}
        className="flex w-full items-center gap-1.5 rounded px-1 py-1.5 text-left transition-colors hover:bg-[var(--wati-surface-subtle)]"
      >
        <span className="flex h-5 w-5 items-center justify-center text-[var(--wati-icon-default)]">
          <Settings size={15} strokeWidth={1.75} />
        </span>
        <span className="flex-1 text-sm font-medium text-[var(--wati-text-body)]">
          Settings
        </span>
        {expiredCount > 0 && (
          <span
            title={`${expiredCount} connector to reconnect`}
            className="h-1.5 w-1.5 rounded-full bg-red-500"
          />
        )}
      </button>
    </div>
  );
}
