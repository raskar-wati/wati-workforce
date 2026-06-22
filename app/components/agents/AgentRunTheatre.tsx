"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

/**
 * Streaming "theatre" shown while an agent run is being assembled. Used
 * after Run now: an animated avatar GIF on the left + cycling status
 * lines on the right. Caller drives completion via onComplete — the
 * handoff itself is committed by the parent once the cycle ends.
 */
export function AgentRunTheatre({
  avatarGifPath,
  steps,
  stepDurationMs = 1800,
  onComplete,
}: {
  avatarGifPath: string;
  steps: string[];
  stepDurationMs?: number;
  onComplete: () => void;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index >= steps.length) {
      const done = window.setTimeout(onComplete, 300);
      return () => window.clearTimeout(done);
    }
    const id = window.setTimeout(
      () => setIndex((i) => i + 1),
      stepDurationMs,
    );
    return () => window.clearTimeout(id);
  }, [index, steps.length, stepDurationMs, onComplete]);

  const current = steps[Math.min(index, steps.length - 1)];

  return (
    <div className="flex items-center gap-2 py-2">
      {/* Plain <img> — Next/Image doesn't animate GIFs. No container so the
          avatar reads as a small inline mark, not a card. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={avatarGifPath}
        alt=""
        width={20}
        height={20}
        className="shrink-0"
        aria-hidden
      />
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={current}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
          className="text-[13px] tracking-[-0.078px] text-[#0a0a0a]"
        >
          {current}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
