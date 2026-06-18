"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { ChatArea } from "./ChatArea";

export function MainContent({
  hideDailyDigest = false,
  chrome,
  panelCollapsed,
  onTogglePanel,
}: {
  hideDailyDigest?: boolean;
  chrome?: "drawer";
  /** Drawer-only: when defined, MainContent renders a small "WorkForce"
   *  header bar with a panel toggle next to the label. */
  panelCollapsed?: boolean;
  onTogglePanel?: () => void;
} = {}) {
  const showHeader = chrome === "drawer" && onTogglePanel !== undefined;
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-white">
      {showHeader && (
        <div className="flex shrink-0 items-center gap-2 px-3 pt-3 pb-1">
          <button
            type="button"
            onClick={onTogglePanel}
            aria-label={
              panelCollapsed ? "Open navigation" : "Close navigation"
            }
            title={panelCollapsed ? "Open navigation" : "Close navigation"}
            className="flex h-7 w-7 items-center justify-center rounded text-[var(--wati-icon-default)] hover:bg-[var(--wati-surface-subtle)]"
          >
            {panelCollapsed ? (
              <PanelLeftOpen size={16} strokeWidth={1.75} />
            ) : (
              <PanelLeftClose size={16} strokeWidth={1.75} />
            )}
          </button>
          <p className="text-sm font-semibold text-[var(--wati-text-body)]">
            WorkForce
          </p>
        </div>
      )}
      <div className="min-h-0 flex-1">
        <ChatArea hideDailyDigest={hideDailyDigest} chrome={chrome} />
      </div>
    </div>
  );
}
