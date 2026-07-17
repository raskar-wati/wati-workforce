"use client";

import { motion } from "motion/react";
import { ArrowUpRight, Check, Hourglass, PencilLine, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { getActionScript } from "../../lib/agent-actions";
import type { AgentActionRun as AgentActionRunType } from "../../lib/agents";
import { useAgents } from "../../lib/agents";
import {
  BroadcastEstimateRows,
  BroadcastScheduleConfirm,
} from "../cards/BroadcastScheduleConfirm";
import { CardCtaChip, EvidenceRow, WorkforceCard } from "../cards/WorkforceCard";
import { StatusIndicator } from "./StatusIndicator";

const STEP_DURATION_MS = 1400;
const SETTLE_MS = 900;

/**
 * One action run rendered as its governance-class card sequence:
 * Class A: draft card (dual commit) → in-flight → receipt
 * Class C: confirmation card → in-flight → receipt
 * Class B / reads: in-flight → receipt
 */
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

  if (run.status === "proposed") {
    return <ActionRunDraftCard run={run} />;
  }
  if (run.status === "confirming") {
    return <ActionRunConfirmation run={run} />;
  }
  if (run.status === "running") {
    return <ActionRunInFlight run={run} />;
  }
  return <ActionRunReceipt run={run} />;
}

/** Class A pre-write draft card: "Will create" + verdicts + dual commit. */
function ActionRunDraftCard({ run }: { run: AgentActionRunType }) {
  const { commitActionRun, dismissActionRun } = useAgents();
  const { draft, sendEstimate } = getActionScript(run.action);
  if (!draft) return null;

  return (
    <WorkforceCard
      tone="draft"
      icon={<PencilLine size={12} strokeWidth={2.5} />}
      title={draft.title}
      subtitle={draft.summary}
      actions={
        <>
          <CardCtaChip primary onClick={() => commitActionRun(run.id, false)}>
            Create as draft
          </CardCtaChip>
          <CardCtaChip onClick={() => commitActionRun(run.id, true)}>
            {draft.activateLabel}
          </CardCtaChip>
          <DeclineButton onClick={() => dismissActionRun(run.id)} />
        </>
      }
    >
      {draft.checks.map((check, i) => (
        <EvidenceRow key={i} verdict={check.verdict} metric={check.metric}>
          {check.text}
        </EvidenceRow>
      ))}
      {sendEstimate && <BroadcastEstimateRows estimate={sendEstimate} />}
    </WorkforceCard>
  );
}

/** Class C confirmation card: states the immediate effect, then executes. */
function ActionRunConfirmation({ run }: { run: AgentActionRunType }) {
  const { confirmActionRun, dismissActionRun } = useAgents();
  const { confirm } = getActionScript(run.action);
  if (!confirm) return null;

  return (
    <WorkforceCard
      tone="info"
      icon={<Zap size={12} strokeWidth={2.5} />}
      title={confirm.title}
      subtitle={confirm.effect}
      actions={
        <>
          <CardCtaChip primary onClick={() => confirmActionRun(run.id)}>
            {confirm.confirmLabel}
          </CardCtaChip>
          <DeclineButton onClick={() => dismissActionRun(run.id)} />
        </>
      }
    />
  );
}

function DeclineButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[13px] tracking-[-0.078px] text-black/60 hover:text-[#0a0a0a]"
    >
      Not now
    </button>
  );
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
      className="flex flex-col gap-3 rounded-2xl border border-wati-border bg-[#f7faf7] px-5 py-4"
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
        <Check size={10} strokeWidth={2.5} className="text-wati-green-text" />
      </span>
      <span>{text}</span>
    </div>
  );
}

/**
 * Receipt card: state pill + deep link + undo/approve (state revert model)
 * + auto-action promotion for classes that allow it.
 */
function ActionRunReceipt({ run }: { run: AgentActionRunType }) {
  const { getAgent, enableAutoAction, setRunObjectState } = useAgents();
  // Broadcast-family approvals restate count + cost before arming (PRD §3.2);
  // this holds the receipt in that restatement step.
  const [restatingEstimate, setRestatingEstimate] = useState(false);
  const agent = getAgent(run.agentId);
  const alwaysOn = agent?.autoActions.includes(run.action) ?? false;

  const script = getActionScript(run.action);
  const { governance } = script;
  // Legacy runs (persisted before governance classes) carry no objectState;
  // Class A objects default to draft — the old behavior.
  const objectState =
    run.objectState ?? (governance === "A" ? "draft" : undefined);
  const isDraftState = objectState === "draft";
  const isPending = objectState === "pending-meta";

  if (restatingEstimate && isDraftState && script.sendEstimate) {
    return (
      <BroadcastScheduleConfirm
        estimate={script.sendEstimate}
        onArm={() =>
          setRunObjectState(run.id, script.draft?.activeState ?? "armed")
        }
        onKeepDraft={() => setRestatingEstimate(false)}
      />
    );
  }

  return (
    <WorkforceCard
      tone={isDraftState ? "draft" : isPending ? "info" : "success"}
      icon={
        isDraftState ? (
          <PencilLine size={12} strokeWidth={2.5} />
        ) : isPending ? (
          <Hourglass size={12} strokeWidth={2.5} />
        ) : (
          <Check size={12} strokeWidth={2.5} />
        )
      }
      title={run.resultLabel}
      subtitle={run.resultDestination}
      note={governance === "B" ? script.inertNote : undefined}
      state={objectState}
      stateLabel={objectState === "live" ? script.liveStateLabel : undefined}
      actions={
        <>
          <CardCtaChip>
            {run.resultCtaLabel}
            <ArrowUpRight size={12} strokeWidth={2} />
          </CardCtaChip>
          {governance === "A" && isDraftState && script.approveLabel && (
            <CardCtaChip
              primary
              onClick={() =>
                script.sendEstimate
                  ? setRestatingEstimate(true)
                  : setRunObjectState(run.id, script.draft?.activeState ?? "live")
              }
            >
              {script.approveLabel}
            </CardCtaChip>
          )}
          {!isDraftState &&
            objectState &&
            objectState !== "pending-meta" &&
            script.undoLabel && (
              <button
                type="button"
                onClick={() => setRunObjectState(run.id, "draft")}
                className="text-[13px] tracking-[-0.078px] text-black/60 hover:text-[#0a0a0a]"
              >
                {script.undoLabel}
              </button>
            )}
          {governance === "C" ? (
            <span className="text-[13px] tracking-[-0.078px] text-black/40">
              Needs your confirmation each run
            </span>
          ) : alwaysOn ? (
            <span className="inline-flex items-center gap-1 text-[13px] tracking-[-0.078px] text-wati-green-text">
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
        </>
      }
    />
  );
}
