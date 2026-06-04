"use client";

import { motion } from "motion/react";
import { ArrowUpRight, Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { AgentActionRun as AgentActionRunType } from "../../lib/agents";
import { useAgents } from "../../lib/agents";

const STEP_DURATION_MS = 1400;
const SETTLE_MS = 900;

export function AgentActionRun({
  run,
  nested = false,
}: {
  run: AgentActionRunType;
  /** When true, renders without a detached border so it reads as part of the run. */
  nested?: boolean;
}) {
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
    return <ActionRunInFlight run={run} nested={nested} />;
  }
  return <ActionRunResult run={run} nested={nested} />;
}

function ActionRunInFlight({
  run,
  nested,
}: {
  run: AgentActionRunType;
  nested: boolean;
}) {
  // `active` is the index of the step currently in progress. Earlier indices
  // are complete; later indices are still pending. We show the whole plan
  // up-front so the user can see what the agent is working through.
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (active >= run.steps.length - 1) return;
    const id = window.setTimeout(() => {
      setActive((i) => i + 1);
    }, STEP_DURATION_MS);
    return () => window.clearTimeout(id);
  }, [active, run.steps.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
      className={
        nested
          ? "flex flex-col gap-3 rounded-xl bg-[#f6faf6] px-4 py-3.5"
          : "flex flex-col gap-3 rounded-2xl border border-[#e5e5e5] bg-[#f7faf7] px-5 py-4"
      }
    >
      <div className="flex items-center gap-2">
        <Loader2
          size={14}
          strokeWidth={2}
          className="animate-spin text-black/40"
        />
        <p className="text-[13px] font-medium tracking-[-0.078px] text-[#0a0a0a]">
          {run.runTitle}
        </p>
      </div>

      <div className="flex flex-col">
        {run.steps.map((step, i) => {
          const done = i < active;
          const isActive = i === active;
          const isLast = i === run.steps.length - 1;
          return (
            <div key={i} className="flex gap-2.5">
              <div className="flex flex-col items-center">
                <StepDot state={done ? "done" : isActive ? "active" : "pending"} />
                {!isLast && (
                  <div
                    className={`w-px flex-1 ${
                      done ? "bg-emerald-300" : "bg-black/10"
                    }`}
                  />
                )}
              </div>
              <div
                className={`pb-3 text-[13px] leading-[16px] tracking-[-0.078px] ${
                  isActive
                    ? "text-[#0a0a0a]"
                    : done
                      ? "text-black/40"
                      : "text-black/30"
                }`}
              >
                {step}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function StepDot({ state }: { state: "done" | "active" | "pending" }) {
  if (state === "done") {
    return (
      <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-100">
        <Check size={9} strokeWidth={3} className="text-emerald-700" />
      </span>
    );
  }
  if (state === "active") {
    return (
      <span className="relative flex h-3.5 w-3.5 items-center justify-center">
        <motion.span
          className="absolute inset-0 rounded-full bg-blue-400/50"
          animate={{ scale: [1, 1.7, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        />
        <span className="relative h-2 w-2 rounded-full bg-blue-500" />
      </span>
    );
  }
  return (
    <span className="flex h-3.5 w-3.5 items-center justify-center">
      <span className="h-2 w-2 rounded-full border border-black/20" />
    </span>
  );
}

function ActionRunResult({
  run,
  nested,
}: {
  run: AgentActionRunType;
  nested: boolean;
}) {
  const { getAgent, enableAutoAction } = useAgents();
  const agent = getAgent(run.agentId);
  const alwaysOn = agent?.autoActions.includes(run.action) ?? false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
      className={
        nested
          ? "flex flex-col gap-3 rounded-xl bg-black/[0.02] px-4 py-3.5"
          : "flex flex-col gap-3 rounded-2xl border border-[#e5e5e5] bg-white px-5 py-4"
      }
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
