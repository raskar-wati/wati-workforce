"use client";

import { Settings } from "lucide-react";
import { useAskWatiSettings } from "../../lib/ask-wati-settings";

/** Settings entry pinned under the Ask Wati chats list. */
export function ThreadPanelSettingsLink() {
  const { openSettings } = useAskWatiSettings();
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
        <span className="flex flex-1 items-center gap-2 text-sm font-medium text-[var(--wati-text-body)]">
          Settings
          <span className="rounded-full bg-red-50 px-2 py-px text-[11px] font-medium text-red-600">
            New
          </span>
        </span>
      </button>
    </div>
  );
}
