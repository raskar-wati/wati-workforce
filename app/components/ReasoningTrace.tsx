"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return seconds === 0 ? `${minutes}m` : `${minutes}m ${seconds}s`;
}

/**
 * Compact, collapsible disclosure for the assistant's reasoning ("thinking")
 * stream. While the model is still reasoning (`active`), it stays open and
 * shows the live text in a height-bounded, auto-scrolling window with a
 * "Thinking…" header and a running timer. Once the answer begins it collapses
 * to a single "Thought for Xs" line that the user can re-open on demand.
 *
 * Embedded inline in the chat thread rather than shown as the full raw
 * transcript — the reasoning is available but never dominates the thread.
 */
export function ReasoningTrace({
  reasoning,
  active,
  durationMs,
}: {
  reasoning: string;
  /** True while reasoning is still streaming (before the answer starts). */
  active: boolean;
  /** Final reasoning duration in ms, once known. */
  durationMs?: number;
}) {
  // null → follow `active` (open while thinking, collapsed once done).
  // boolean → user overrode it by clicking.
  const [manualOpen, setManualOpen] = useState<boolean | null>(null);
  const open = manualOpen ?? active;

  // Live timer while reasoning is in flight; frozen to durationMs afterwards.
  const startRef = useRef<number>(0);
  const [liveMs, setLiveMs] = useState(0);
  useEffect(() => {
    if (!active) return;
    startRef.current = Date.now();
    setLiveMs(0);
    const timer = window.setInterval(
      () => setLiveMs(Date.now() - startRef.current),
      200,
    );
    return () => window.clearInterval(timer);
  }, [active]);

  const shownMs = active ? liveMs : (durationMs ?? liveMs);

  // Keep the live reasoning pinned to the latest line while it streams.
  const scrollRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (active && open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [reasoning, active, open]);

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setManualOpen(!open)}
        aria-expanded={open}
        className="group flex items-center gap-1.5 self-start py-0.5 text-left"
      >
        <motion.span
          animate={{ rotate: open ? 0 : -90 }}
          transition={{ duration: 0.2 }}
          className="flex text-black/35 transition-colors group-hover:text-black/60"
        >
          <ChevronDown size={13} strokeWidth={2} />
        </motion.span>
        <span
          className={`text-[12px] tracking-[-0.06px] ${
            active ? "text-black/55" : "text-black/45 group-hover:text-black/70"
          } transition-colors`}
        >
          {active ? (
            <ShimmerLabel>Thinking…</ShimmerLabel>
          ) : (
            `Thought for ${formatElapsed(shownMs)}`
          )}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
            {/* Faint left rail anchors the trace to the chevron column, matching
                the handoff / digest disclosure pattern. */}
            <div className="ml-[6px] border-l border-black/[0.08] pl-3 pt-1">
              <div
                ref={scrollRef}
                className="max-h-[168px] overflow-y-auto overscroll-contain whitespace-pre-wrap text-[12px] leading-[18px] text-black/45"
              >
                {reasoning}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Subtle left-to-right shimmer on the label while the model is thinking. */
function ShimmerLabel({ children }: { children: string }) {
  return (
    <span
      className="bg-clip-text text-transparent"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.35) 100%)",
        backgroundSize: "200% 100%",
        animation: "reasoning-shimmer 1.8s linear infinite",
      }}
    >
      {children}
      <style>{`@keyframes reasoning-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </span>
  );
}
