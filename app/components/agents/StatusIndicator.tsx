"use client";

import { motion } from "motion/react";

export function StatusIndicator({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
      className="flex items-center gap-2 text-[13px] leading-[18px] text-black/55"
    >
      <ThinkingOrb />
      <span>{text}</span>
    </motion.div>
  );
}

/**
 * Same breathing-orb used in ThinkingIndicator's streaming variant and the
 * agent empty-runs state — kept inline so the loader matches the rest of
 * the app's "agent is thinking" signal.
 */
function ThinkingOrb() {
  return (
    <motion.div
      className="relative flex flex-shrink-0 items-center justify-center"
      style={{ width: 32, height: 28 }}
      animate={{ scale: [0.88, 1.12, 0.88] }}
      transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
    >
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(186,220,255,0.65) 0%, rgba(200,228,255,0.28) 55%, transparent 100%)",
          filter: "blur(5px)",
        }}
        animate={{ opacity: [0.75, 1, 0.75] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: 18,
          height: 14,
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(210,235,255,0.95) 0%, rgba(186,220,255,0.55) 60%, transparent 100%)",
          filter: "blur(2.5px)",
        }}
      />
      <span
        className="relative flex items-center gap-[3px]"
        aria-hidden="true"
      >
        <Eye delay={0} />
        <Eye delay={0.06} />
      </span>
    </motion.div>
  );
}

function Eye({ delay = 0 }: { delay?: number }) {
  return (
    <motion.span
      style={{
        display: "inline-block",
        width: 2.5,
        height: 2.5,
        background: "rgba(0,0,0,0.55)",
        borderRadius: 1,
        transformOrigin: "center",
      }}
      animate={{ scaleY: [1, 1, 0.05, 0.05, 1] }}
      transition={{
        duration: 0.38,
        repeat: Infinity,
        repeatDelay: 3.2,
        delay,
        ease: "easeInOut",
        times: [0, 0.15, 0.45, 0.6, 1],
      }}
    />
  );
}
