"use client";

import { motion } from "motion/react";

export function StatusIndicator({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
      className="flex items-center gap-2 pl-1 text-[13px] leading-[18px] text-black/50"
    >
      <PulsingDot />
      <span>{text}</span>
    </motion.div>
  );
}

function PulsingDot() {
  return (
    <span className="relative inline-flex h-3 w-3 items-center justify-center">
      <motion.span
        className="absolute inset-0 rounded-full bg-blue-400/60"
        animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      />
      <span className="relative h-1.5 w-1.5 rounded-full bg-blue-500" />
    </span>
  );
}
