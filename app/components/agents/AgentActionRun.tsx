"use client";

import { motion } from "motion/react";
import { ArrowUpRight, Check } from "lucide-react";
import { useEffect, useState } from "react";
import type { AgentActionRun as AgentActionRunType } from "../../lib/agents";
import { useAgents } from "../../lib/agents";
import { StatusIndicator } from "./StatusIndicator";

const STEP_DURATION_MS = 1400;
const SETTLE_MS = 900;

export function AgentActionRun({ run }: { run: AgentActionRunType }) {
  const { completeActionRun } = useAgents();

  // When running, total run length = (each step's beat) + a settle pause so
  // the last step is visible before the result card swaps in.
  useEffect(() => {
    if (run.status !== "running") return;
    const totalMs = run.steps.length * STEP_DURATION_MS + SETTLE_MS;
    const id = window.setTimeout(() => {
      completeActionRun(run.id);
    }, totalMs);
    return () => window.clearTimeout(id);
  }, [run.id, run.status, run.steps.length, completeActionRun]);

  if (run.status === "running") {
    return <ActionRunInFlight run={run} />;
  }
  return <ActionRunResult run={run} />;
}

function ActionRunInFlight({ run }: { run: AgentActionRunType }) {
  // Reveal one step at a time. `revealed` is the index of the step that is
  // currently active (pulsing). Earlier indices have already completed.
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    if (revealed >= run.steps.length - 1) return;
    const id = window.setTimeout(() => {
      setRevealed((i) => i + 1);
    }, STEP_DURATION_MS);
    return () => window.clearTimeout(id);
  }, [revealed, run.steps.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
      className="flex flex-col gap-3 rounded-2xl border border-[#e5e5e5] bg-[#f7faf7] px-5 py-4"
    >
      <p className="text-[13px] font-medium tracking-[-0.078px] text-[#0a0a0a]">
        {run.runTitle}
      </p>
      <div className="flex flex-col gap-2">
        {run.steps.slice(0, revealed + 1).map((step, i) => {
          const isActive = i === revealed;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            >
              {isActive ? (
                <StatusIndicator text={step} />
              ) : (
                <CompletedStep text={step} />
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

function CompletedStep({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 pl-1 text-[13px] leading-[18px] text-black/40">
      <span className="flex h-3 w-3 items-center justify-center">
        <Check size={10} strokeWidth={2.5} className="text-emerald-700" />
      </span>
      <span>{text}</span>
    </div>
  );
}

function ActionRunResult({ run }: { run: AgentActionRunType }) {
  const { getAgent, enableAutoAction } = useAgents();
  const agent = getAgent(run.agentId);
  const alwaysOn = agent?.autoActions.includes(run.action) ?? false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
      className="flex flex-col gap-3 rounded-2xl border border-[#e5e5e5] bg-white px-5 py-4"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <Check size={12} strokeWidth={2.5} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="text-[13px] font-medium tracking-[-0.078px] text-[#0a0a0a]">
            {run.resultLabel}
          </p>
          <p className="text-[12px] tracking-[-0.06px] text-black/50">
            {run.resultDestination}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span
          aria-hidden
          className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e5e5] bg-white px-3 py-1.5 text-[13px] tracking-[-0.078px] text-[#0a0a0a]"
        >
          {run.resultCtaLabel}
          <ArrowUpRight size={12} strokeWidth={2} />
        </span>
        {alwaysOn ? (
          <span className="inline-flex items-center gap-1 text-[13px] tracking-[-0.078px] text-emerald-700">
            <Check size={12} strokeWidth={2.5} />
            Will always do this
          </span>
        ) : (
          <button
            type="button"
            onClick={() => enableAutoAction(run.agentId, run.action)}
            className="text-[13px] tracking-[-0.078px] text-black/60 hover:text-[#0a0a0a]"
          >
            Always do this
          </button>
        )}
      </div>
    </motion.div>
  );
}
