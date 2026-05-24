"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

const STREAM_DURATION_MS = 3000;
const TICK_MS = 30;

export function AgentInstructionsBlock({
  text,
  onDone,
}: {
  text: string;
  onDone?: () => void;
}) {
  const [revealed, setRevealed] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (startRef.current === null) {
      startRef.current = Date.now();
    }
    if (revealed >= text.length) {
      onDone?.();
      return;
    }
    const id = window.setTimeout(() => {
      const elapsed = Date.now() - (startRef.current ?? Date.now());
      const progress = Math.min(1, elapsed / STREAM_DURATION_MS);
      setRevealed(Math.ceil(text.length * progress));
    }, TICK_MS);
    return () => window.clearTimeout(id);
  }, [revealed, text, onDone]);

  const streaming = revealed < text.length;
  const visible = text.slice(0, revealed);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
      className="rounded-2xl border border-[#e5e5e5] bg-[#f7faf7] px-5 py-4"
    >
      <pre className="whitespace-pre-wrap break-words font-mono text-[12px] leading-[18px] text-emerald-700">
        {visible}
        {streaming && <BlinkingCursor />}
      </pre>
    </motion.div>
  );
}

function BlinkingCursor() {
  return (
    <motion.span
      animate={{ opacity: [1, 0, 1] }}
      transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
      className="inline-block w-[6px] translate-y-[1px] bg-emerald-700"
      style={{ height: "0.9em" }}
      aria-hidden
    />
  );
}
