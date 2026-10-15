"use client";

import { Bell, Rocket, User } from "lucide-react";
import { motion, type Transition } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { useNotifications } from "../lib/notifications";
import { useShellLayout } from "../lib/shell-layout";
import { AskWatiBar } from "./AskWatiBar";
import { WatiLogo } from "./WatiLogo";

/** The bar never crosses the logo (104px) or the right-hand icons. */
const LOGO_CLEARANCE = 116;
const ICONS_GAP = 12;
/** Bar width when centred over a module's content. */
const CENTRED_MAX_WIDTH = 600;
/** The rail's width transition (MainSidebar) — re-measure once it settles. */
const NAV_SETTLE_MS = 200;
/** How long after first placement the bar snaps rather than glides. */
const LOAD_SETTLE_MS = 250;

const GLIDE: Transition = { type: "spring", stiffness: 260, damping: 32, mass: 0.9 };

type Placement = { x: number; width: number };

/**
 * Where the Wati AI bar sits: lined up with the chat input on the full Ask
 * Wati page, centred over the content area (right of the side nav)
 * everywhere else. Never crosses the logo or the right-hand icons.
 */
function useBarPlacement(iconsRef: RefObject<HTMLDivElement | null>): Placement | null {
  const { navWidth, barAnchor } = useShellLayout();
  const [placement, setPlacement] = useState<Placement | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const viewport = window.innerWidth;
      const maxRight = (iconsRef.current?.getBoundingClientRect().left ?? viewport) - ICONS_GAP;
      let x: number;
      let width: number;
      if (barAnchor) {
        // Share the chat input's left edge and width; if its right end runs
        // under the icons (narrow windows), trim the bar rather than shift it.
        const r = barAnchor.getBoundingClientRect();
        x = Math.max(r.left, LOGO_CLEARANCE);
        width = Math.min(r.right, maxRight) - x;
      } else {
        // Centred over the content; shrink symmetrically so the centre holds.
        const centre = navWidth + (window.innerWidth - navWidth) / 2;
        width = Math.min(CENTRED_MAX_WIDTH, 2 * (centre - LOGO_CLEARANCE), 2 * (maxRight - centre));
        x = centre - width / 2;
      }
      x = Math.round(x);
      width = Math.round(Math.max(0, width));
      setPlacement((p) => (p && p.x === x && p.width === width ? p : { x, width }));
    };

    measure();
    // The chat input rides the rail's width transition; catch where it lands.
    const settle = window.setTimeout(measure, NAV_SETTLE_MS);
    window.addEventListener("resize", measure);
    const ro = barAnchor ? new ResizeObserver(measure) : null;
    if (barAnchor) ro!.observe(barAnchor);
    return () => {
      window.clearTimeout(settle);
      window.removeEventListener("resize", measure);
      ro?.disconnect();
    };
  }, [navWidth, barAnchor, iconsRef]);

  return placement;
}

export function GlobalHeader() {
  const iconsRef = useRef<HTMLDivElement | null>(null);
  const placement = useBarPlacement(iconsRef);
  // Placements land instantly while the page settles on load (the chat
  // input registers a beat after the header first measures); only moves
  // after that glide.
  const [placed, setPlaced] = useState(false);
  const hasPlacement = placement !== null;
  useEffect(() => {
    if (!hasPlacement || placed) return;
    const t = window.setTimeout(() => setPlaced(true), LOAD_SETTLE_MS);
    return () => window.clearTimeout(t);
  }, [hasPlacement, placed]);

  return (
    <header className="relative z-40 flex h-11 w-full items-center justify-between gap-4 bg-[var(--wati-surface-subtle)]">
      <WatiLogo className="shrink-0" />

      {/* Glides between its spots on navigation, nav collapse and resize.
          Hidden until first measured so it doesn't flash at the wrong spot. */}
      <motion.div
        initial={false}
        animate={
          placement
            ? { x: placement.x, width: placement.width, opacity: 1 }
            : { opacity: 0 }
        }
        transition={placed ? { ...GLIDE, opacity: { duration: 0.2 } } : { duration: 0 }}
        className="absolute inset-y-0 left-0 flex items-center"
        style={{ width: CENTRED_MAX_WIDTH }}
      >
        <AskWatiBar />
      </motion.div>

      <div ref={iconsRef} className="flex h-full shrink-0 items-center gap-2 pr-3">
        <div className="flex h-full items-center pl-1">
          <NotificationBell />
        </div>

        <div className="h-4 w-px bg-[var(--wati-divider-light)]" />

        <button
          type="button"
          aria-label="What's new"
          className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--wati-icon-default)]"
        >
          <Rocket size={20} strokeWidth={1.75} />
        </button>

        <div className="h-4 w-px bg-[var(--wati-divider-light)]" />

        <button
          type="button"
          aria-label="Account"
          className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--wati-icon-default)]"
        >
          <User size={20} strokeWidth={1.75} />
        </button>
      </div>
    </header>
  );
}

/**
 * Header bell backed by the notifications store. Unread dot, and a dropdown
 * of recent notifications; opening the dropdown marks everything read.
 */
function NotificationBell() {
  const { notifications, unreadCount, markAllRead, openNotice } = useNotifications();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Everything visible once the tray is open counts as read.
  useEffect(() => {
    if (open) markAllRead();
  }, [open, markAllRead]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-8 w-8 items-center justify-center rounded-full text-[var(--wati-icon-default)] hover:bg-black/[0.04]"
      >
        <Bell size={20} strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-wati-green" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-50 w-[320px] rounded-xl border border-wati-border bg-white p-1.5 shadow-lg">
          {notifications.length === 0 ? (
            <p className="px-3 py-6 text-center text-[12px] tracking-[-0.06px] text-black/45">
              No notifications yet
            </p>
          ) : (
            <div className="flex max-h-[320px] flex-col gap-0.5 overflow-y-auto">
              {notifications.slice(0, 20).map((n) => (
                <div
                  key={n.id}
                  role={n.source ? "button" : undefined}
                  tabIndex={n.source ? 0 : undefined}
                  onClick={
                    n.source
                      ? () => {
                          openNotice(n.id);
                          setOpen(false);
                        }
                      : undefined
                  }
                  className={`rounded-lg px-3 py-2 hover:bg-black/[0.03] ${n.source ? "cursor-pointer" : ""}`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[13px] font-medium tracking-[-0.078px] text-[#0a0a0a]">
                      {n.title}
                    </p>
                    <span className="shrink-0 text-[11px] text-black/40">
                      {relativeTime(n.at)}
                    </span>
                  </div>
                  {n.body && (
                    <p className="mt-0.5 text-[12px] leading-[17px] tracking-[-0.06px] text-black/55">
                      {n.body}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function relativeTime(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}
