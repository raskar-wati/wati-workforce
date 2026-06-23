"use client";

import { Maximize2, Minimize2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAskWatiDrawer } from "../lib/ask-wati-drawer";
import { WorkforceMain } from "./WorkforceMain";

/**
 * Ask Wati drawer — overlays the right edge of the page. State is shared
 * via `useAskWatiDrawer()` so the trigger (top-nav button) and the drawer
 * can live in different parts of the tree.
 *
 * Two layouts:
 *   - drawer (default): anchored to the right edge, 458/690px wide.
 *   - expanded: near-fullscreen centered modal, max 1440px wide, with the
 *     left nav permanently visible and the WorkForce header's panel
 *     toggle hidden.
 */
export function AskWatiDrawer() {
  const { open, closeDrawer } = useAskWatiDrawer();
  const [panelCollapsed, setPanelCollapsed] = useState(true);
  const [expanded, setExpanded] = useState(false);
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
    <>
      {expanded && (
        <div
          aria-hidden
          onClick={() => setExpanded(false)}
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm"
        />
      )}
    <aside
      role="region"
      aria-label="Ask Wati"
      className={
        expanded
          ? "fixed inset-y-10 left-10 right-10 z-40 flex flex-col overflow-hidden rounded-xl border border-[var(--wati-border-default)] bg-white shadow-[0_24px_64px_rgba(0,0,0,0.18),0_2px_8px_rgba(0,0,0,0.06)]"
          : "absolute right-1 top-0 bottom-0 z-40 flex flex-col overflow-hidden rounded-tl-xl rounded-tr-xl border border-[var(--wati-border-default)] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)]"
      }
      style={expanded ? undefined : { width: drawerWidth }}
    >
      <div className="absolute right-2 top-2 z-10 flex items-center gap-1">
        <button
          type="button"
          onClick={() => {
            setExpanded((v) => !v);
            // Expanding always reveals the side panel.
            if (!expanded) setPanelCollapsed(false);
          }}
          aria-label={expanded ? "Collapse" : "Expand"}
          title={expanded ? "Collapse" : "Expand"}
          className="flex h-7 w-7 items-center justify-center rounded text-[var(--wati-icon-default)] hover:bg-[var(--wati-surface-subtle)]"
        >
          {expanded ? (
            <Minimize2 size={14} strokeWidth={1.75} />
          ) : (
            <Maximize2 size={14} strokeWidth={1.75} />
          )}
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
          panelCollapsed={expanded ? false : panelCollapsed}
          onPanelCollapsedChange={setPanelCollapsed}
          hideDailyDigest
          hideDevTools
          forceDemoMode="returning"
          chrome="drawer"
          expanded={expanded}
        />
      </div>
    </aside>
    </>
  );
}
