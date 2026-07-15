"use client";

import { ArrowUpRight, Check, Hourglass, PencilLine } from "lucide-react";
import { getActionScript } from "../../lib/agent-actions";
import { useAgents, type ApprovalQueueItem } from "../../lib/agents";
import { CardCtaChip, WorkforceCard } from "../cards/WorkforceCard";

/**
 * The handoff queue (PRD sub-page 3/6): item cards for every draft object
 * awaiting activation, each with its approve action. Approving here resolves
 * the same run the agent thread shows — both surfaces clear together.
 * Waiting items (pending Meta) self-resolve and carry no action.
 */
export function ApprovalQueue() {
  const { approvalQueue, waitingQueue, setRunObjectState } = useAgents();

  if (approvalQueue.length === 0 && waitingQueue.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-wati-green-soft text-wati-green-text">
          <Check size={16} strokeWidth={2.5} />
        </span>
        <p className="text-[14px] font-medium tracking-[-0.084px] text-[#0a0a0a]">
          Nothing waiting on you
        </p>
        <p className="max-w-[300px] text-[12px] leading-[17px] tracking-[-0.06px] text-black/50">
          Drafts your agents create land here until you approve them. Approving
          here or in the agent thread clears both.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
      {approvalQueue.length > 0 && (
        <QueueSection
          title="Waiting for your approval"
          hint="Created as drafts — nothing goes live until you approve it"
        >
          {approvalQueue.map((item) => (
            <ApprovalCard
              key={item.run.id}
              item={item}
              onApprove={(state) => setRunObjectState(item.run.id, state)}
            />
          ))}
        </QueueSection>
      )}

      {waitingQueue.length > 0 && (
        <QueueSection
          title="Waiting on Meta"
          hint="Resolves automatically — no action needed from you"
        >
          {waitingQueue.map((item) => (
            <WaitingCard key={item.run.id} item={item} />
          ))}
        </QueueSection>
      )}
    </div>
  );
}

function QueueSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-[14px] font-semibold tracking-[-0.084px] text-[#0a0a0a]">
          {title}
        </h2>
        <p className="mt-0.5 text-[12px] tracking-[-0.06px] text-black/45">{hint}</p>
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

function ApprovalCard({
  item,
  onApprove,
}: {
  item: ApprovalQueueItem;
  onApprove: (state: "draft" | "live" | "pending-meta" | "armed") => void;
}) {
  const { run, agent } = item;
  const script = getActionScript(run.action);

  return (
    <WorkforceCard
      tone="draft"
      icon={<PencilLine size={12} strokeWidth={2.5} />}
      title={run.resultLabel}
      subtitle={`${agent.name} · ${run.resultDestination}`}
      state="draft"
      actions={
        <>
          {script.approveLabel && (
            <CardCtaChip
              primary
              onClick={() => onApprove(script.draft?.activeState ?? "live")}
            >
              {script.approveLabel}
            </CardCtaChip>
          )}
          <CardCtaChip>
            {run.resultCtaLabel}
            <ArrowUpRight size={12} strokeWidth={2} />
          </CardCtaChip>
        </>
      }
    />
  );
}

function WaitingCard({ item }: { item: ApprovalQueueItem }) {
  const { run, agent } = item;
  return (
    <WorkforceCard
      tone="info"
      icon={<Hourglass size={12} strokeWidth={2.5} />}
      title={run.resultLabel}
      subtitle={`${agent.name} · ${run.resultDestination}`}
      state="pending-meta"
      actions={
        <CardCtaChip>
          {run.resultCtaLabel}
          <ArrowUpRight size={12} strokeWidth={2} />
        </CardCtaChip>
      }
    />
  );
}
