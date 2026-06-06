"use client";

import { Bell, Rocket, Sparkles, User } from "lucide-react";
import { useAskWatiDrawer } from "../lib/ask-wati-drawer";
import { WatiLogo } from "./WatiLogo";

export function GlobalHeader() {
  const { toggle } = useAskWatiDrawer();

  return (
    <header className="flex h-11 w-full items-center justify-between bg-[var(--wati-surface-subtle)]">
      <WatiLogo />

      <div className="flex h-full items-center gap-2 pr-3">
        <span className="text-sm font-semibold text-[var(--wati-text-subtitle)]">
          Quick start
        </span>

        <div className="h-4 w-px bg-[var(--wati-divider-light)]" />

        <button
          type="button"
          onClick={toggle}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#262626] px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-[#0a0a0a]"
        >
          <Sparkles size={13} strokeWidth={2} />
          Ask Wati
        </button>

        <button
          type="button"
          className="rounded-full border border-[var(--wati-text-primary)] px-3 py-1 text-xs font-semibold text-[var(--wati-text-primary)]"
        >
          Book a Demo
        </button>

        <div className="flex h-full items-center pl-1">
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex h-8 w-8 items-center justify-center rounded-full text-[var(--wati-icon-default)]"
          >
            <Bell size={20} strokeWidth={1.75} />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--wati-text-primary)]" />
          </button>
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
