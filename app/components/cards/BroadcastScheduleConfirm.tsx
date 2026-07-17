"use client";

import { CalendarClock } from "lucide-react";
import type { SendEstimateSpec } from "../../lib/agent-actions";
import { CardCtaChip, EvidenceRow, WorkforceCard } from "./WorkforceCard";

/**
 * PRD §3.2 (wati_schedule_broadcast): a schedule is armed only after the agent
 * restates recipient count + cost estimate and the human confirms. These are
 * the two halves of that restatement:
 * - BroadcastEstimateRows — the numbers themselves; also embedded in the
 *   Class A draft card so the one-step "Create and schedule" commit already
 *   confirms restated numbers.
 * - BroadcastScheduleConfirm — the arming step shown when approving a
 *   broadcast draft, in the agent thread and the approval queue alike.
 */

export function BroadcastEstimateRows({ estimate }: { estimate: SendEstimateSpec }) {
  return (
    <>
      <EvidenceRow verdict="ok" metric={estimate.recipients}>
        {estimate.audience}
      </EvidenceRow>
      <EvidenceRow metric={estimate.cost}>{estimate.rate}</EvidenceRow>
      <EvidenceRow>{estimate.window}</EvidenceRow>
      {estimate.balanceNote && <EvidenceRow>{estimate.balanceNote}</EvidenceRow>}
    </>
  );
}

export function BroadcastScheduleConfirm({
  estimate,
  onArm,
  onKeepDraft,
}: {
  estimate: SendEstimateSpec;
  onArm?: () => void;
  onKeepDraft?: () => void;
}) {
  return (
    <WorkforceCard
      tone="info"
      icon={<CalendarClock size={12} strokeWidth={2.5} />}
      title={estimate.confirmTitle}
      subtitle="Final count and cost, restated — nothing sends until you arm it"
      state="armed"
      stateLabel="Will arm"
      actions={
        <>
          <CardCtaChip primary onClick={onArm}>
            Arm schedule
          </CardCtaChip>
          <button
            type="button"
            onClick={onKeepDraft}
            className="text-[13px] tracking-[-0.078px] text-black/60 hover:text-[#0a0a0a]"
          >
            Keep as draft
          </button>
        </>
      }
    >
      <BroadcastEstimateRows estimate={estimate} />
    </WorkforceCard>
  );
}
