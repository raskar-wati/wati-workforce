"use client";

import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { filterHandoffByAchievements } from "../../lib/achievements";
import {
  CREATION_STEPS,
  emptyDraft,
  isStepAnswered,
  type CreationDraft,
  type CreationStepId,
} from "../../lib/agent-creation-script";
import { generateInstructions } from "../../lib/agent-instructions";
import {
  useAgents,
  type AgentSchedule,
} from "../../lib/agents";
import { useChatThreads } from "../../lib/chat-threads";
import { getWatcherType, matchWatcherType } from "../../lib/watcher-types";
import { AgentCreationStepCard } from "./AgentCreationStepCard";
import { AgentCreationSummary } from "./AgentCreationSummary";
import { AgentInstructionsBlock } from "./AgentInstructionsBlock";
import { AvatarShufflePicker } from "./AvatarShufflePicker";
import { HandoffActionPicker } from "./HandoffActionPicker";
import { ScheduleTaskCard } from "./ScheduleTaskCard";
import { SchedulePresetList, scheduleTitle } from "./SchedulePresetList";
import { StatusIndicator } from "./StatusIndicator";
import { ACHIEVEMENTS, type AchievementId } from "../../lib/achievements";

type Phase = "intro" | "in-flow" | "thinking" | "streaming" | "ready" | "done";

const INTRO_DURATION_MS = 1200;
const THINKING_DURATION_MS = 1400;

export function AgentCreationFlow({
  threadId,
  initialMessage,
  onAgentCreated,
}: {
  threadId: string;
  initialMessage: string;
  onAgentCreated?: (
    agentId: string,
    options: { ranImmediately: boolean },
  ) => void;
}) {
  const { createAgent, addHandoff, getAgentsForThread } = useAgents();
  const { attachAgentToThread } = useChatThreads();

  const agentForThread = getAgentsForThread(threadId)[0] ?? null;
  if (agentForThread) {
    // Already created — persistent UI in ChatArea handles display.
    return null;
  }

  return (
    <AgentCreationFlowInner
      threadId={threadId}
      initialMessage={initialMessage}
      onAgentCreated={onAgentCreated}
      createAgent={createAgent}
      addHandoff={addHandoff}
      attachAgentToThread={attachAgentToThread}
    />
  );
}

function AgentCreationFlowInner({
  threadId,
  initialMessage,
  onAgentCreated,
  createAgent,
  addHandoff,
  attachAgentToThread,
}: {
  threadId: string;
  initialMessage: string;
  onAgentCreated?: (
    agentId: string,
    options: { ranImmediately: boolean },
  ) => void;
  createAgent: ReturnType<typeof useAgents>["createAgent"];
  addHandoff: ReturnType<typeof useAgents>["addHandoff"];
  attachAgentToThread: ReturnType<typeof useChatThreads>["attachAgentToThread"];
}) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [draft, setDraft] = useState<CreationDraft>(() => {
    const d = emptyDraft(initialMessage);
    d.watcherType = matchWatcherType(initialMessage) ?? "custom";
    return d;
  });

  // intro → in-flow timer
  useEffect(() => {
    if (phase !== "intro") return;
    const t = window.setTimeout(() => setPhase("in-flow"), INTRO_DURATION_MS);
    return () => window.clearTimeout(t);
  }, [phase]);

  // thinking → streaming timer
  useEffect(() => {
    if (phase !== "thinking") return;
    const t = window.setTimeout(
      () => setPhase("streaming"),
      THINKING_DURATION_MS,
    );
    return () => window.clearTimeout(t);
  }, [phase]);

  const currentStep = CREATION_STEPS[currentStepIndex];
  const currentAnswered = isStepAnswered(currentStep.id, draft);
  const isLastStep = currentStepIndex === CREATION_STEPS.length - 1;

  const advance = () => {
    if (!currentAnswered) return;
    if (isLastStep) {
      setPhase("thinking");
    } else {
      setCurrentStepIndex((i) => i + 1);
    }
  };

  const instructions = useMemo(() => {
    if (!draft.watcherType || !draft.schedule) return "";
    const wt = getWatcherType(draft.watcherType);
    return generateInstructions({
      agentName: wt.defaultName,
      watcherType: draft.watcherType,
      customDescription: draft.customDescription,
      achievements: draft.actions,
      schedule: draft.schedule,
    });
  }, [draft]);

  const finalize = (runImmediately: boolean) => {
    if (
      !draft.watcherType ||
      !draft.schedule ||
      !draft.avatarSeed
    )
      return;
    const wt = getWatcherType(draft.watcherType);
    const agent = createAgent({
      threadId,
      name: wt.defaultName,
      archetype: "watcher",
      watcherType: draft.watcherType,
      description:
        draft.watcherType === "custom" ? draft.customDescription : undefined,
      schedule: draft.schedule,
      actions: draft.actions,
      avatarSeed: draft.avatarSeed,
      status: "active",
    });
    attachAgentToThread(threadId, agent.id);
    if (runImmediately) {
      const filteredDraft = filterHandoffByAchievements(
        wt.buildDraft(),
        draft.actions,
      );
      addHandoff(agent.id, filteredDraft);
    }
    setPhase("done");
    onAgentCreated?.(agent.id, { ranImmediately: runImmediately });
  };

  const summaryRows = useMemo(() => {
    if (!draft.watcherType || !draft.schedule) return [];
    const wt = getWatcherType(draft.watcherType);
    return [
      {
        question: "What do you want to achieve with this agent?",
        answer:
          draft.actions
            .map((id) => ACHIEVEMENTS.find((a) => a.id === id)?.label ?? id)
            .join(", ") || "(none)",
      },
      {
        question: "What time of day should you get the agent result?",
        answer: scheduleTitle(draft.schedule),
      },
    ];
  }, [draft]);

  const showSummary =
    phase === "thinking" || phase === "streaming" || phase === "ready" || phase === "done";
  const showInstructions =
    phase === "streaming" || phase === "ready" || phase === "done";
  const showScheduleCard = phase === "ready" || phase === "done";

  return (
    <div className="flex flex-col gap-4">
      <motion.p
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="text-[14px] leading-[20px] text-black/80"
      >
        I will help set-up an internal agent, a few questions before we move forward.
      </motion.p>

      {(() => {
        const statusText =
          phase === "intro" || phase === "in-flow"
            ? "Setting you up for success"
            : phase === "thinking"
              ? "Creating instructions for the agent"
              : null;
        if (!statusText) return null;
        return <StatusIndicator key={statusText} text={statusText} />;
      })()}

      {phase === "in-flow" && (
        <AgentCreationStepCard
          question={currentStep.question}
          stepNumber={currentStepIndex + 1}
          totalSteps={CREATION_STEPS.length}
          isFinal={isLastStep}
          canContinue={currentAnswered}
          onContinue={advance}
        >
          <StepBody
            stepId={currentStep.id}
            draft={draft}
            setDraft={setDraft}
          />
        </AgentCreationStepCard>
      )}

      {showSummary && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="text-[14px] leading-[20px] text-black/80"
        >
          Sound Great! These are your responses, you can always edit instructions later.
        </motion.p>
      )}

      {showSummary && summaryRows.length > 0 && (
        <AgentCreationSummary rows={summaryRows} />
      )}

      {showInstructions && instructions && (
        <AgentInstructionsBlock
          text={instructions}
          onDone={() =>
            setPhase((p) => (p === "streaming" ? "ready" : p))
          }
        />
      )}

      {showScheduleCard && draft.watcherType && draft.schedule && (
        <ScheduleTaskCard
          agentName={getWatcherType(draft.watcherType).defaultName}
          schedule={draft.schedule}
          disabled={phase === "done"}
          onSchedule={() => finalize(false)}
          onRunNow={() => finalize(true)}
        />
      )}
    </div>
  );
}

function StepBody({
  stepId,
  draft,
  setDraft,
}: {
  stepId: CreationStepId;
  draft: CreationDraft;
  setDraft: (updater: (prev: CreationDraft) => CreationDraft) => void;
}) {
  if (stepId === "actions") {
    return (
      <HandoffActionPicker
        value={draft.actions}
        onChange={(next: AchievementId[]) =>
          setDraft((d) => ({ ...d, actions: next }))
        }
      />
    );
  }
  if (stepId === "schedule") {
    return (
      <SchedulePresetList
        value={draft.schedule}
        customDraft={
          draft.schedule?.kind === "custom" ? draft.schedule.description : ""
        }
        onChange={(schedule: AgentSchedule) =>
          setDraft((d) => ({ ...d, schedule }))
        }
      />
    );
  }
  return (
    <AvatarShufflePicker
      value={draft.avatarSeed}
      onChange={(path: string) => setDraft((d) => ({ ...d, avatarSeed: path }))}
    />
  );
}
