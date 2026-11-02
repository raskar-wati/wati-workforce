"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, X } from "lucide-react";
import { useEffect } from "react";
import type { ToastItem } from "../lib/toast";

/** How long a toast stays up; the bar along its bottom counts it down. */
const TOAST_MS = 5000;

/**
 * Success toast: slides in from the top right, a green bar runs down over
 * five seconds, then it slides back out. × closes it early.
 */
export function Toast({
  toast,
  onDismiss,
}: {
  toast: ToastItem | null;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => onDismiss(toast.id), TOAST_MS);
    return () => window.clearTimeout(t);
  }, [toast, onDismiss]);

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[70]">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            role="status"
            initial={{ opacity: 0, x: 48 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 48 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="pointer-events-auto relative w-[400px] max-w-[calc(100vw-32px)] overflow-hidden rounded-lg border border-black/[0.06] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)]"
          >
            <div className="flex items-center gap-3 py-3.5 pl-4 pr-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-wati-green text-white">
                <Check size={12} strokeWidth={3} />
              </span>
              <p className="min-w-0 flex-1 text-[14px] text-[#0a0a0a]">{toast.message}</p>
              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                aria-label="Dismiss"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-black/55 hover:bg-black/[0.05] hover:text-black/80"
              >
                <X size={16} />
              </button>
            </div>
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: TOAST_MS / 1000, ease: "linear" }}
              className="absolute bottom-0 left-0 h-[3px] w-full origin-left bg-wati-green"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
