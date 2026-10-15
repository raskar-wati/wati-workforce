"use client";

import { Maximize2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAskWatiDrawer } from "../lib/ask-wati-drawer";
import { WorkforceMain } from "./WorkforceMain";

/** Full-page Ask Wati, reached from the nav (Wati AI > Ask Wati). */
export const ASK_WATI_PAGE = "/preview/ask-wati";

/**
 * Ask Wati drawer — overlays the right edge of the page, 458/690px wide
 * depending on whether its thread panel is open. State is shared via
 * `useAskWatiDrawer()` so the triggers (header bar) and the drawer can live
 * in different parts of the tree. Expand hands off to the full page.
 */
export function AskWatiDrawer() {
  const { open, closeDrawer, inlineHost } = useAskWatiDrawer();
  const router = useRouter();
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

  if (!open || inlineHost) return null;

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
          onClick={() => {
            closeDrawer();
            router.push(ASK_WATI_PAGE);
          }}
          aria-label="Open full page"
          title="Open full page"
          className="flex h-7 w-7 items-center justify-center rounded text-[var(--wati-icon-default)] hover:bg-[var(--wati-surface-subtle)]"
        >
          <Maximize2 size={14} strokeWidth={1.75} />
        </button>
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
