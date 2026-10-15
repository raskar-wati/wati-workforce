"use client";

import { FlaskConical } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getActionScript } from "../../lib/agent-actions";
import { useAgents, type Agent, type HandoffCtaAction } from "../../lib/agents";
import { getWatcherType } from "../../lib/watcher-types";

/**
 * Demo affordance: raise each agent event the island handles, against the
 * real agent store, so the island, the agent thread and the bell all react
 * as they would to a live run. Picks an agent that isn't on screen, since
 * runs you're watching don't ping the island.
 */

const DRAFT_ACTIONS: readonly HandoffCtaAction[] = [
  "create-automation-rule",
  "create-keyword-reply",
  "create-chatbot",
  "create-template",
];

const FAILURE_REASONS = [
  "The inbox API timed out while reading conversations",
  "Wati rate-limited the run — it'll retry on the next schedule",
  "A required template was deleted mid-run",
];

const pick = <T,>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)];

export function IslandSimulator() {
  const {
    agents,
    approvalQueue,
    addHandoff,
    getHandoffs,
    startActionRun,
    commitActionRun,
    completeActionRun,
    setRunObjectState,
    getWatchedThreadId,
  } = useAgents();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const pickAgent = (): Agent | undefined => {
    const active = agents.filter((a) => a.status === "active");
    const pool = active.length ? active : agents;
    const offScreen = pool.filter((a) => a.threadId !== getWatchedThreadId());
    return offScreen.length ? pick(offScreen) : pool[0];
  };

  /** A Class A write that stopped at draft, waiting on a human. */
  const createDraft = (agent: Agent) => {
    const handoff =
      getHandoffs(agent.id)[0] ??
      addHandoff(agent.id, getWatcherType(agent.watcherType).buildDraft());
    const action = pick(DRAFT_ACTIONS);
    const script = getActionScript(action);
    const run = startActionRun({
      agentId: agent.id,
      handoffId: handoff.id,
      ctaId: `sim-${crypto.randomUUID()}`,
      action,
      runTitle: script.runTitle,
      steps: [...script.steps],
      resultLabel: script.resultLabel,
      resultDestination: script.resultDestination,
      resultCtaLabel: script.resultCtaLabel,
    });
    commitActionRun(run.id, false);
    completeActionRun(run.id);
    return run;
  };

  const events: { label: string; run: (agent: Agent) => void }[] = [
    {
      label: "Run completed",
      run: (agent) => addHandoff(agent.id, getWatcherType(agent.watcherType).buildDraft()),
    },
    {
      label: "Run failed",
      run: (agent) =>
        addHandoff(agent.id, {
          runAt: new Date().toISOString(),
          sections: [],
          ctas: [],
          failure: { reason: pick(FAILURE_REASONS) },
        }),
    },
    { label: "Needs approval", run: (agent) => createDraft(agent) },
    {
      label: "Approval expired",
      run: (agent) => {
        // Expire the longest-waiting draft; make one if the queue is empty.
        const oldest = approvalQueue.at(-1)?.run ?? createDraft(agent);
        setRunObjectState(oldest.id, "expired");
      },
    },
  ];

  if (agents.length === 0) return null;

  return (
    <div ref={rootRef} className="fixed bottom-4 left-16 z-[60]">
      {open && (
        <div className="absolute bottom-10 left-0 w-[200px] rounded-xl border border-wati-border bg-white p-1.5 shadow-lg">
          <p className="px-2.5 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-black/45">
            Simulate agent event
          </p>
          {events.map((e) => (
            <button
              key={e.label}
              type="button"
              onClick={() => {
                const agent = pickAgent();
                if (agent) e.run(agent);
                setOpen(false);
              }}
              className="block w-full rounded-lg px-2.5 py-1.5 text-left text-[13px] text-[#0a0a0a] hover:bg-black/[0.04]"
            >
              {e.label}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex h-8 items-center gap-1.5 rounded-full border border-wati-border bg-white px-3 text-[12px] font-medium text-black/60 shadow-sm hover:text-[#0a0a0a]"
      >
        <FlaskConical size={14} strokeWidth={1.75} />
        Simulate
      </button>
    </div>
  );
}
