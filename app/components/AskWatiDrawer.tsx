"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAskWatiDrawer } from "../lib/ask-wati-drawer";
import { WorkforceMain } from "./WorkforceMain";

/**
 * Ask Wati drawer — overlays the right edge of the page. State is shared
 * via `useAskWatiDrawer()` so the trigger (top-nav button) and the drawer
 * can live in different parts of the tree.
 */
export function AskWatiDrawer() {
  const { open, closeDrawer } = useAskWatiDrawer();
  // Drawer starts collapsed (icon column only, narrower drawer). Clicking
  // the expand arrow on the icon column reveals the 232px panel and
  // widens the drawer to fit — chat area width on the right is unchanged.
  const [panelCollapsed, setPanelCollapsed] = useState(true);
  const drawerWidth = panelCollapsed ? 458 : 690;

  // ESC closes — only while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeDrawer]);

  if (!open) return null;

  return (
    <aside
      role="region"
      aria-label="Ask Wati"
      className="absolute right-1 top-0 bottom-0 z-40 flex flex-col overflow-hidden rounded-tl-xl rounded-tr-xl border border-[var(--wati-border-default)] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)]"
      style={{ width: drawerWidth }}
    >
      <div className="absolute right-2 top-2 z-10 flex items-center gap-1">
        <button
          type="button"
          onClick={closeDrawer}
          aria-label="Close"
          title="Close"
          className="flex h-7 w-7 items-center justify-center rounded text-[var(--wati-icon-default)] hover:bg-[var(--wati-surface-subtle)]"
        >
          <X size={16} strokeWidth={1.75} />
        </button>
      </div>

      {/* Embedded WorkForce surface (providers + panel + main). The
          drawer-specific chrome flag flips ChatArea + Composer into the
          drawer layout. */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <WorkforceMain
          hideHandoffs
          panelStyle="drawer"
          panelCollapsed={panelCollapsed}
          onPanelCollapsedChange={setPanelCollapsed}
          hideDailyDigest
          hideDevTools
          forceDemoMode="returning"
          chrome="drawer"
        />
      </div>
    </aside>
  );
}
