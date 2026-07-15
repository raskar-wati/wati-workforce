"use client";

import { Bell, Rocket, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAskWatiDrawer } from "../lib/ask-wati-drawer";
import { useNotifications } from "../lib/notifications";
import { WatiLogo } from "./WatiLogo";

export function GlobalHeader() {
  const { toggle } = useAskWatiDrawer();

  return (
    <header className="flex h-11 w-full items-center justify-between bg-[var(--wati-surface-subtle)]">
      <WatiLogo />

      <div className="flex h-full items-center gap-2 pr-3">
        <button
          type="button"
          onClick={toggle}
          className="inline-flex items-center rounded-full bg-wati-green px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-wati-green-hover"
        >
          Ask Wati
        </button>

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
  const { notifications, unreadCount, markAllRead } = useNotifications();
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
                <div key={n.id} className="rounded-lg px-3 py-2 hover:bg-black/[0.03]">
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
