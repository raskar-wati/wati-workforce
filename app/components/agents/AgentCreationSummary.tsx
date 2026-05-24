"use client";

import { motion } from "motion/react";

export type SummaryRow = {
  question: string;
  answer: string;
};

export function AgentCreationSummary({ rows }: { rows: SummaryRow[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
      className="flex flex-col gap-3 rounded-2xl bg-black/[0.04] px-5 py-4"
    >
      {rows.map((r) => (
        <div key={r.question} className="flex flex-col gap-0.5">
          <p className="text-[14px] font-semibold tracking-[-0.084px] text-[#0a0a0a]">
            {r.question}
          </p>
          <p className="text-[14px] tracking-[-0.084px] text-black/60">
            {r.answer}
          </p>
        </div>
      ))}
    </motion.div>
  );
}
