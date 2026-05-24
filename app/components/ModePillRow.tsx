"use client";

import { motion } from "motion/react";

/**
 * Modes available in the chat composer. Kept in sync with `MODE_OPTIONS`
 * in ChatArea — when adding a new mode there, mirror it here.
 */
export type ChatMode = "agent" | "automation" | "insights";

type ModePill = {
  id: ChatMode;
  label: string;
};

const PILLS: readonly ModePill[] = [
  { id: "agent", label: "Create an agent" },
  { id: "automation", label: "Build an automation" },
  { id: "insights", label: "Get insights" },
];

/**
 * Renders the three top-level chat modes as clickable pills directly below
 * the composer. Shown only on the hero state when no mode has been picked —
 * tapping a pill is equivalent to selecting the mode from the slash menu.
 */
export function ModePillRow({
  onSelect,
}: {
  onSelect: (mode: ChatMode) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
      className="flex flex-wrap items-center justify-center gap-2 pt-4"
    >
      {PILLS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onSelect(id)}
          className="rounded-full border border-[#e5e5e5] bg-white px-4 py-2 text-[13px] tracking-[-0.078px] text-[#0a0a0a] transition-colors hover:bg-black/[0.03]"
        >
          {label}
        </button>
      ))}
    </motion.div>
  );
}
