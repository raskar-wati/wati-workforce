"use client";

import { Maximize2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAskWatiDrawer } from "../lib/ask-wati-drawer";
import { WorkforceMain } from "./WorkforceMain";

/**
 * Ask Wati drawer — slots into the page's flex layout as a sibling of the
 * main content, so opening it pushes the surface behind it (no overlay,
 * no backdrop). Width snaps to 800px when open, unmounts when closed.
 *
 * State is shared via `useAskWatiDrawer()` so the trigger (top-nav
 * button) and the drawer can live in different parts of the tree.
 *
 * The host page is responsible for adding `min-w-0` to whichever sibling
 * needs to shrink when this drawer opens — without it, flex defaults
 * (`min-width: auto`) prevent the layout from compressing.
 */
export function AskWatiDrawer() {
  const { open, closeDrawer } = useAskWatiDrawer();
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeDrawer]);

  if (!open) return null;

  const maximize = () => {
    closeDrawer();
    router.push("/");
  };

  return (
    <aside
      role="region"
      aria-label="Ask Wati"
      className="relative flex h-full shrink-0 overflow-hidden border-l border-[var(--wati-border-default)] bg-white"
      style={{ width: 420, minWidth: 420, maxWidth: 420 }}
    >
      {/* Embedded WorkForce surface (providers + panel + main) */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <WorkforceMain
          hideHandoffs
          panelDefaultCollapsed
          panelStyle="popover"
          defaultMode="agent"
          hideDailyDigest
          hideDevTools
          forceDemoMode="returning"
        />
      </div>

      {/* Floating drawer controls — visually part of the surface */}
      <div className="pointer-events-none absolute right-2 top-2 z-10 flex items-center gap-1">
        <button
          type="button"
          onClick={maximize}
          aria-label="Open in WorkForce"
          title="Open in WorkForce"
          className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded text-[var(--wati-icon-default)] hover:bg-[var(--wati-surface-subtle)]"
        >
          <Maximize2 size={14} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={closeDrawer}
          aria-label="Close"
          title="Close"
          className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded text-[var(--wati-icon-default)] hover:bg-[var(--wati-surface-subtle)]"
        >
          <X size={16} strokeWidth={1.75} />
        </button>
      </div>
    </aside>
  );
}
