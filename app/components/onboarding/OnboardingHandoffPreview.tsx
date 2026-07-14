"use client";

import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { getWatcherType } from "../../lib/watcher-types";
import type { Handoff as HandoffType, WatcherTypeId } from "../../lib/agents";
import { Handoff } from "../agents/Handoff";
import { StatusIndicator } from "../agents/StatusIndicator";

const THINKING_MS = 1400;

/**
 * Renders a previewed handoff for onboarding — uses the real Handoff
 * component with synthesized identifiers so it looks identical to what the
 * user will see after they actually create the agent. CTAs are inert during
 * the preview (the agent doesn't exist yet); we fire `onReady` once the
 * "thinking" phase ends so the orchestrator can post its follow-up message.
 *
 * `watcherTypeId` selects which agent's draft to render — onboarding lets the
 * user pick from multiple tenant agents, so this is no longer hardcoded.
 */
export function OnboardingHandoffPreview({
  watcherTypeId,
  agentName,
  onReady,
}: {
  watcherTypeId: WatcherTypeId;
  agentName: string;
  onReady: () => void;
}) {
  const [phase, setPhase] = useState<"thinking" | "result">("thinking");

  const previewHandoff = useMemo<HandoffType>(() => {
    const wt = getWatcherType(watcherTypeId);
    const draft = wt.buildDraft();
    return {
      id: "onboarding-preview",
      agentId: "onboarding-preview",
      runNumber: 1,
      ...draft,
    };
  }, [watcherTypeId]);

  useEffect(() => {
    if (phase !== "thinking") return;
    const t = window.setTimeout(() => {
      setPhase("result");
      onReady();
    }, THINKING_MS);
    return () => window.clearTimeout(t);
  }, [phase, onReady]);

  if (phase === "thinking") {
    return <StatusIndicator text="Scanning your conversations" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
    >
      <Handoff
        handoff={previewHandoff}
        agentName={`${agentName} · Preview`}
        defaultExpanded
        firedCtaIds={new Set()}
        onFireCta={() => {
          // Preview is inert — the agent doesn't exist yet. Tapping a CTA
          // is a no-op; the real CTAs become live once they create the
          // agent below.
        }}
      />
    </motion.div>
  );
}
