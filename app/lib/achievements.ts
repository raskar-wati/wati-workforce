import type { HandoffCtaAction } from "./agents";
import type { HandoffDraft } from "./watcher-types";

export type AchievementId =
  | "list-customers"
  | "create-segment"
  | "inbox-filter"
  | "draft-responses"
  // Skills Expansion (Agent Skills Expansion doc §3)
  | "manage-templates"
  | "schedule-broadcasts"
  | "build-automations"
  | "build-chatbots"
  | "organize-contacts"
  | "route-teams"
  | "inbox-productivity";

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
  {
    id: "manage-templates",
    label: "Draft & submit WhatsApp templates",
    enabledActions: ["create-template", "submit-template"],
  },
  {
    id: "schedule-broadcasts",
    label: "Schedule broadcast campaigns",
    enabledActions: ["schedule-broadcast"],
  },
  {
    id: "build-automations",
    label: "Set up keyword replies & automation rules",
    enabledActions: [
      "create-keyword-reply",
      "create-automation-rule",
      "set-default-reply",
    ],
  },
  {
    id: "build-chatbots",
    label: "Build & test chatbot flows",
    enabledActions: ["create-chatbot", "test-chatbot"],
  },
  {
    id: "organize-contacts",
    label: "Manage attributes, tags & segments",
    enabledActions: ["create-attribute", "create-tag", "update-segment"],
  },
  {
    id: "route-teams",
    label: "Route conversations to teams",
    enabledActions: ["assign-team"],
  },
  {
    id: "inbox-productivity",
    label: "Leave notes & save quick replies",
    enabledActions: ["add-note", "create-quick-reply"],
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
