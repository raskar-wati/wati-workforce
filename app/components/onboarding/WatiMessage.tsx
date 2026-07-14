"use client";

import { motion } from "motion/react";

export type WatiChip = {
  id: string;
  label: string;
  /** Visual emphasis. "primary" gets a filled treatment, "ghost" stays light. */
  variant?: "primary" | "ghost";
  onClick: () => void;
};

/**
 * Bot-side message bubble used by the onboarding flow (and reusable for future
 * proactive nudges). Renders Wati's text plus an optional row of reply chips.
 * Once a chip is tapped, the parent removes its `chips` from the message so
 * the choice locks in — the chip row only appears for the active turn.
 */
export function WatiMessage({
  text,
  chips,
  delay = 0,
}: {
  text: string;
  chips?: readonly WatiChip[];
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay,
        ease: [0.32, 0.72, 0, 1],
      }}
      className="flex flex-col gap-3"
    >
      <p className="max-w-[560px] whitespace-pre-line text-[14px] leading-[20px] text-black/80">
        {text}
      </p>
      {chips && chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.map((chip, i) => (
            <motion.button
              key={chip.id}
              type="button"
              onClick={chip.onClick}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.25,
                delay: delay + 0.15 + i * 0.05,
                ease: [0.32, 0.72, 0, 1],
              }}
              className={
                chip.variant === "primary"
                  ? "rounded-full bg-[#0a0a0a] px-3.5 py-1.5 text-[13px] leading-[18px] text-white transition-colors hover:bg-[#0a0a0a]/90"
                  : "rounded-full border border-[var(--wati-border-default)] bg-white px-3.5 py-1.5 text-[13px] leading-[18px] text-black/70 transition-colors hover:border-black/20 hover:bg-[var(--wati-surface-subtle)] hover:text-black/85"
              }
            >
              {chip.label}
            </motion.button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
