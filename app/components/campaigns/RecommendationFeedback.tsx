"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, ThumbsDown, ThumbsUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { RecommendationFeedback as Feedback } from "../../lib/campaigns";

/** Why a recommendation missed, offered as one-tap reasons. */
const REASONS = ["Wrong timing", "Wrong audience", "Template doesn't fit", "Not relevant"];

/**
 * "Was this recommendation helpful?" under a Wati recommendation. Thumbs up
 * is thanked at once; thumbs down asks why (reason chips, optional note) in
 * a popover above the row, so the modal doesn't grow. After a short
 * thank-you the row returns with the chosen thumb selected; it can be changed.
 */
export function RecommendationFeedback({
  given,
  onGive,
}: {
  given?: Feedback;
  onGive: (feedback: Feedback) => void;
}) {
  const [asking, setAsking] = useState(false);
  const [reasons, setReasons] = useState<string[]>(given?.reasons ?? []);
  const [note, setNote] = useState(given?.note ?? "");
  // A brief thank-you right after giving it; then back to the row, with the
  // chosen thumb shown as selected.
  const [thanked, setThanked] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!asking) return;
    const close = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setAsking(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [asking]);
  useEffect(() => {
    if (!thanked) return;
    const t = window.setTimeout(() => setThanked(false), 2500);
    return () => window.clearTimeout(t);
  }, [thanked]);

  const give = (feedback: Feedback) => {
    onGive(feedback);
    setAsking(false);
    setThanked(true);
  };

  if (thanked && given) {
    return (
      <p className="flex h-7 items-center gap-1.5 text-[12px] text-wati-green-text">
        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-wati-green text-white">
          <Check size={9} strokeWidth={3} />
        </span>
        {given.vote === "up" ? "Thanks for the feedback." : "Feedback shared. Thank you!"}
      </p>
    );
  }

  const thumb = "flex h-7 w-7 items-center justify-center rounded-md hover:bg-black/[0.05]";
  const tone = (on: boolean) =>
    on ? "text-black/60" : "text-black/50 hover:text-black/80";
  const toggle = (r: string) =>
    setReasons((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));

  return (
    <div ref={rootRef} className="relative">
      <div className="flex items-center gap-1">
        <span className="mr-1 text-[12px] text-black/55">Was this recommendation helpful?</span>
        <button
          type="button"
          onClick={() => give({ vote: "up", reasons: [], note: "" })}
          aria-label="Helpful"
          aria-pressed={given?.vote === "up"}
          className={`${thumb} ${tone(given?.vote === "up")}`}
        >
          <ThumbsUp size={14} fill={given?.vote === "up" ? "currentColor" : "none"} />
        </button>
        <button
          type="button"
          onClick={() => setAsking(true)}
          aria-label="Not helpful"
          aria-pressed={given?.vote === "down"}
          className={`${thumb} ${asking ? "bg-black/[0.05] text-black/80" : tone(given?.vote === "down")}`}
        >
          <ThumbsDown size={14} fill={given?.vote === "down" && !asking ? "currentColor" : "none"} />
        </button>
      </div>
      <AnimatePresence initial={false}>
        {asking && (
          <motion.div
            role="dialog"
            aria-label="Why wasn't it helpful?"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 z-20 mb-2 w-[340px]"
          >
            <div className="flex flex-col gap-2.5 rounded-xl border border-wati-border bg-white p-3.5 shadow-[0_12px_32px_rgba(0,0,0,0.14)]">
              <p className="text-[12px] font-medium text-black/70">What missed?</p>
              <div className="flex flex-wrap gap-1.5">
                {REASONS.map((r) => {
                  const on = reasons.includes(r);
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => toggle(r)}
                      aria-pressed={on}
                      className={`rounded-full border px-2.5 py-1 text-[12px] ${
                        on
                          ? "border-wati-green bg-wati-green-soft text-wati-green-text"
                          : "border-wati-border bg-white text-black/70 hover:bg-black/[0.03]"
                      }`}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="Tell us more (optional)"
                aria-label="Tell us more"
                className="resize-none rounded-md border border-wati-border bg-white px-2.5 py-1.5 text-[13px] outline-none focus:border-[#1570EF]"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={reasons.length === 0 && !note.trim()}
                  onClick={() => give({ vote: "down", reasons, note: note.trim() })}
                  className="rounded-lg bg-wati-green px-3 py-1.5 text-[12px] font-medium text-white hover:bg-wati-green-hover disabled:opacity-50"
                >
                  Send feedback
                </button>
                <button
                  type="button"
                  onClick={() => setAsking(false)}
                  className="rounded-lg px-2 py-1.5 text-[12px] text-black/55 hover:text-black/80"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
