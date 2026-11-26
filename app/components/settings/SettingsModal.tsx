"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

/**
 * Shell for the settings pop-ups (Wati AI, Team Inbox): dimmed backdrop,
 * titled card with a close button. Closes on Escape or a click outside.
 */
export function SettingsModal({
  open,
  onClose,
  title,
  badge,
  className = "max-w-[920px]",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  badge?: ReactNode;
  /** Width of the card. */
  className?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`flex h-[min(680px,calc(100vh-32px))] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.2)] ${className}`}
      >
        <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
          <h2 className="flex items-center gap-2 text-[16px] font-medium tracking-[-0.096px] text-[#0a0a0a]">
            {title}
            {badge}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-full text-black/55 hover:bg-black/[0.04] hover:text-[#0a0a0a]"
          >
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
