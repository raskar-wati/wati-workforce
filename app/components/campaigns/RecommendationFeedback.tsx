"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";
import type { RecommendationFeedback as Feedback } from "../../lib/campaigns";

/** Why a recommendation missed, offered as one-tap reasons. */
const REASONS = ["Wrong timing", "Wrong audience", "Template doesn't fit", "Not relevant"];

/**
 * "Was this recommendation helpful?" under a Wati recommendation. Thumbs up
 * is thanked at once; thumbs down asks why (reason chips, optional note)
 * before it's sent. Once given, it shows as shared.
 */
export function RecommendationFeedback({
  given,
  onGive,
}: {
  given?: Feedback;
  onGive: (feedback: Feedback) => void;
}) {
  const [asking, setAsking] = useState(false);
  const [reasons, setReasons] = useState<string[]>([]);
  const [note, setNote] = useState("");

  if (given) {
    return (
      <p className="flex items-center gap-1.5 text-[12px] text-wati-green-text">
        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-wati-green text-white">
          <Check size={9} strokeWidth={3} />
        </span>
        {given.vote === "up" ? "Thanks for the feedback." : "Feedback shared. Thank you!"}
      </p>
    );
  }

  const thumb =
    "flex h-7 w-7 items-center justify-center rounded-md text-black/50 hover:bg-black/[0.05] hover:text-black/80";
  const toggle = (r: string) =>
    setReasons((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1">
        <span className="mr-1 text-[12px] text-black/55">Was this recommendation helpful?</span>
        <button
          type="button"
          onClick={() => onGive({ vote: "up", reasons: [], note: "" })}
          aria-label="Helpful"
          className={thumb}
        >
          <ThumbsUp size={14} />
        </button>
        <button
          type="button"
          onClick={() => setAsking(true)}
          aria-label="Not helpful"
          aria-pressed={asking}
          className={`${thumb} ${asking ? "bg-black/[0.05] text-black/80" : ""}`}
        >
          <ThumbsDown size={14} />
        </button>
      </div>
      <AnimatePresence initial={false}>
        {asking && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-2.5 rounded-lg bg-black/[0.03] p-3">
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
                  onClick={() => onGive({ vote: "down", reasons, note: note.trim() })}
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
