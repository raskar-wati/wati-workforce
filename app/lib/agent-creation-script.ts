import type { AchievementId } from "./achievements";
import type { AgentSchedule, WatcherTypeId } from "./agents";

export type CreationStepId =
  | "watcher-type"
  | "actions"
  | "schedule"
  | "avatar";

export type CreationStepDef = {
  id: CreationStepId;
  question: string;
};

export const CREATION_STEPS: readonly CreationStepDef[] = [
  {
    id: "watcher-type",
    question: "What do you want this agent to Watch?",
  },
  {
    id: "actions",
    question: "What do you want to achieve with this agent?",
  },
  {
    id: "schedule",
    question: "What time of day should you get the agent result?",
  },
  {
    id: "avatar",
    question: "Pick an avatar — shuffle if you'd like a different one.",
  },
];

export type CreationDraft = {
  initialMessage: string;
  watcherType: WatcherTypeId | null;
  customDescription: string;
  actions: AchievementId[];
  schedule: AgentSchedule | null;
  avatarSeed: string | null;
};

export function emptyDraft(initialMessage: string): CreationDraft {
  return {
    initialMessage,
    watcherType: null,
    customDescription: "",
    actions: [],
    schedule: null,
    avatarSeed: null,
  };
}

export function isStepAnswered(
  stepId: CreationStepId,
  draft: CreationDraft,
): boolean {
  switch (stepId) {
    case "watcher-type":
      return (
        draft.watcherType !== null &&
        (draft.watcherType !== "custom" ||
          draft.customDescription.trim().length > 0)
      );
    case "actions":
      return draft.actions.length > 0;
    case "schedule":
      return (
        draft.schedule !== null &&
        (draft.schedule.kind !== "custom" ||
          draft.schedule.description.trim().length > 0)
      );
    case "avatar":
      return draft.avatarSeed !== null;
  }
}

export function isDraftComplete(draft: CreationDraft): boolean {
  return CREATION_STEPS.every((s) => isStepAnswered(s.id, draft));
}
