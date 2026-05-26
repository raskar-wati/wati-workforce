"use client";

import { useCallback } from "react";
import { getActionScript } from "./agent-actions";
import { useAgents, type HandoffCta } from "./agents";

/**
 * Fires a handoff CTA — kicks off an action run for the given agent + handoff.
 * Shared by the in-thread Handoff view (ChatArea) and the standalone Handoff
 * Inbox so both surfaces produce identical action runs.
 */
export function useFireHandoffCta() {
  const { actionRunsByAgent, startActionRun } = useAgents();

  return useCallback(
    (agentId: string, handoffId: string, cta: HandoffCta) => {
      const fired = (actionRunsByAgent[agentId] ?? []).some(
        (r) => r.ctaId === cta.id,
      );
      if (fired) return;
      const script = getActionScript(cta.action);
      startActionRun({
        agentId,
        handoffId,
        ctaId: cta.id,
        action: cta.action,
        runTitle: script.runTitle,
        steps: [...script.steps],
        resultLabel: script.resultLabel,
        resultDestination: script.resultDestination,
        resultCtaLabel: script.resultCtaLabel,
      });
    },
    [actionRunsByAgent, startActionRun],
  );
}
