"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

export function AgentCreationStepCard({
  question,
  stepNumber,
  totalSteps,
  isFinal = false,
  canContinue,
  onContinue,
  children,
}: {
  question: string;
  stepNumber: number;
  totalSteps: number;
  isFinal?: boolean;
  canContinue: boolean;
  onContinue: () => void;
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
      className="flex flex-col gap-4 rounded-2xl border border-[#e5e5e5] bg-white p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[15px] font-semibold tracking-[-0.075px] text-[#0a0a0a]">
          {question}
        </p>
        <span className="shrink-0 pt-0.5 text-[12px] tracking-[-0.06px] text-black/40">
          {stepNumber}/{totalSteps}
        </span>
      </div>
      <div>{children}</div>
      <div className="flex justify-end">
        <button
          type="button"
          disabled={!canContinue}
          onClick={onContinue}
          className="rounded-lg border border-[#e5e5e5] bg-white px-4 py-1.5 text-[13px] tracking-[-0.078px] text-[#0a0a0a] hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isFinal ? "Complete" : "Continue"}
        </button>
      </div>
    </motion.div>
  );
}
