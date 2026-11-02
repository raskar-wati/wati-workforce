"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, type ReactNode } from "react";

/**
 * Asks before a destructive action. Renders over its positioned parent (a
 * modal card), not the whole page, so it reads as part of what it confirms.
 * Escape cancels just this dialog, not the modal underneath.
 */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  children?: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    // Capture phase, so the modal's own Escape handler never sees it.
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onCancel();
    };
    window.addEventListener("keydown", esc, true);
    return () => window.removeEventListener("keydown", esc, true);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          onClick={onCancel}
          className="absolute inset-0 z-20 flex items-center justify-center rounded-[inherit] bg-black/25 p-6"
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[380px] rounded-xl bg-white p-5 shadow-[0_16px_40px_rgba(0,0,0,0.18)]"
          >
            <h3 id="confirm-dialog-title" className="text-[15px] font-semibold text-[#0a0a0a]">
              {title}
            </h3>
            {children && <div className="mt-1.5 text-[13px] leading-[19px] text-black/65">{children}</div>}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                autoFocus
                onClick={onCancel}
                className="rounded-lg border border-wati-border bg-white px-4 py-2 text-[13px] font-medium text-[#0a0a0a] hover:bg-black/[0.03]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="rounded-lg bg-[#d92d20] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#b42318]"
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
