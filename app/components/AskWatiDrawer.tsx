"use client";

import { Inbox, Maximize2, X } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAskWatiDrawer } from "../lib/ask-wati-drawer";
import { WorkforceMain } from "./WorkforceMain";

/**
 * Ask Wati drawer — slots into the page's flex layout as a sibling of the
 * main content, so opening it pushes the surface behind it (no overlay,
 * no backdrop). Width snaps to 420px when open, unmounts when closed.
 *
 * State is shared via `useAskWatiDrawer()` so the trigger (top-nav
 * button) and the drawer can live in different parts of the tree.
 *
 * Context-aware: when opened on a module surface (e.g. `/preview` =
 * Inbox), a dismissable "Sharing <module>" pill renders at the top of
 * the drawer body so the user knows Wati has scope on what they're
 * looking at. Dismiss is ephemeral and resets when the drawer closes.
 */
export function AskWatiDrawer() {
  const { open, closeDrawer } = useAskWatiDrawer();
  const router = useRouter();
  const pathname = usePathname();
  const [contextDismissed, setContextDismissed] = useState(false);

  // ESC closes — only while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeDrawer]);

  // Reset the context-pill dismissal each time the drawer reopens, so the
  // module badge is visible again on the next summon.
  useEffect(() => {
    if (!open) setContextDismissed(false);
  }, [open]);

  if (!open) return null;

  const maximize = () => {
    closeDrawer();
    router.push("/");
  };

  // Map the current route to its module context. Only `/preview` carries
  // a meaningful module today; expand here as new module surfaces land.
  const moduleContext =
    pathname === "/preview" ? { label: "Inbox", Icon: Inbox } : null;

  return (
    <aside
      role="region"
      aria-label="Ask Wati"
      className="relative flex h-full shrink-0 flex-col overflow-hidden border-l border-[var(--wati-border-default)] bg-white"
      style={{ width: 420, minWidth: 420, maxWidth: 420 }}
    >
      {/* Drawer controls — pinned top-right, sit visually inside the
          drawer's top edge alongside any context badge below. */}
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

      {/* Context badge — only shows on module surfaces; dismissable. */}
      {moduleContext && !contextDismissed && (
        <div className="flex shrink-0 items-center gap-2 px-3 pt-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--wati-border-default)] bg-[var(--wati-surface-subtle)] py-1 pl-2.5 pr-1 text-[12px] tracking-[-0.06px] text-[var(--wati-text-body)]">
            <moduleContext.Icon size={12} strokeWidth={1.75} className="text-[var(--wati-icon-default)]" />
            <span>
              Sharing <strong className="font-semibold">{moduleContext.label}</strong>
            </span>
            <button
              type="button"
              onClick={() => setContextDismissed(true)}
              aria-label="Dismiss context"
              className="flex h-4 w-4 items-center justify-center rounded-full text-black/40 hover:bg-black/5 hover:text-black/70"
            >
              <X size={10} strokeWidth={2.5} />
            </button>
          </span>
        </div>
      )}

      {/* Embedded WorkForce surface (providers + panel + main). The
          drawer-specific chrome flag flips ChatArea + Composer into the
          drawer layout. */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <WorkforceMain
          hideHandoffs
          panelDefaultCollapsed
          panelStyle="popover"
          hideDailyDigest
          hideDevTools
          forceDemoMode="returning"
          chrome="drawer"
        />
      </div>
    </aside>
  );
}
