"use client";

import { motion } from "motion/react";
import { ThinkingIndicator } from "./ThinkingIndicator";
import type { TenantPromptCopy } from "../lib/tenant-prompts";

export function WatiWelcome({
  copy,
  onSelectPrompt,
}: {
  copy: TenantPromptCopy;
  onSelectPrompt: (prompt: string) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4">
      <ThinkingIndicator />
      <div className="flex flex-col items-center gap-1 px-2 text-center">
        <p className="text-[16px] font-medium tracking-[-0.32px] text-black/80">
          {copy.greeting}
        </p>
        <p className="max-w-[460px] text-[14px] leading-[20px] text-black/55">
          {copy.subline}
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2 pt-1">
        {copy.prompts.map((prompt, i) => (
          <motion.button
            key={prompt}
            type="button"
            onClick={() => onSelectPrompt(prompt)}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              delay: 0.15 + i * 0.06,
              ease: [0.32, 0.72, 0, 1],
            }}
            className="rounded-full border border-[var(--wati-border-default)] bg-white px-3.5 py-1.5 text-[13px] leading-[18px] text-black/70 transition-colors hover:border-black/20 hover:bg-[var(--wati-surface-subtle)] hover:text-black/85"
          >
            {prompt}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
