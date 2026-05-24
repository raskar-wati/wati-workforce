import type { HandoffCtaAction } from "./agents";
import type { HandoffDraft } from "./watcher-types";

export type AchievementId =
  | "list-customers"
  | "create-segment"
  | "inbox-filter"
  | "draft-responses";

export type AchievementDef = {
  id: AchievementId;
  label: string;
  enabledActions: HandoffCtaAction[];
};

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  {
    id: "list-customers",
    label: "Get a list of customers",
    enabledActions: [],
  },
  {
    id: "create-segment",
    label: "Create a segment to send campaigns",
    enabledActions: ["create-segment", "send-campaign"],
  },
  {
    id: "inbox-filter",
    label: "Add a custom filter on Team Inbox",
    enabledActions: ["create-inbox-filter"],
  },
  {
    id: "draft-responses",
    label: "Draft responses",
    enabledActions: ["send-bulk-message"],
  },
];

export function getAchievement(id: AchievementId): AchievementDef {
  const found = ACHIEVEMENTS.find((a) => a.id === id);
  if (!found) throw new Error(`Unknown achievement: ${id}`);
  return found;
}

export function enabledActionsFor(ids: AchievementId[]): Set<HandoffCtaAction> {
  const out = new Set<HandoffCtaAction>();
  for (const id of ids) {
    for (const action of getAchievement(id).enabledActions) {
      out.add(action);
    }
  }
  return out;
}

export function filterHandoffByAchievements(
  draft: HandoffDraft,
  achievementIds: AchievementId[],
): HandoffDraft {
  const enabled = enabledActionsFor(achievementIds);
  return {
    ...draft,
    sections: draft.sections.map((s) => ({
      ...s,
      items: s.items.map((item) => {
        if (!item.cta) return item;
        if (enabled.has(item.cta.action)) return item;
        const { cta: _drop, ...rest } = item;
        return rest;
      }),
    })),
    ctas: draft.ctas.filter((c) => enabled.has(c.action)),
  };
}
