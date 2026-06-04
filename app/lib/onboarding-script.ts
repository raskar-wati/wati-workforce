import type { WatcherTypeId } from "./agents";
import type { TenantSignalProfile } from "./tenant-signal-profile";

/**
 * Adoption-focused onboarding script. Walks first-time users through one
 * concrete value moment (ask → see real answer → convert to a persistent
 * agent), then offers a small set of next-step pointers. Tenant-shaped:
 * the lead prompt, watcher conversion, and closing CTAs all change per
 * tenant so the journey feels relevant.
 */

export type ClosingChipAction =
  | { kind: "open-handoffs" }
  | { kind: "open-digest" }
  | { kind: "fill-composer"; prompt: string };

export type ClosingChip = {
  label: string;
  action: ClosingChipAction;
};

export type OnboardingScript = {
  intro: {
    greeting: string;
    subline: string;
    leadChipLabel: string;
    leadPrompt: string;
  };
  leadWatcherType: WatcherTypeId;
  /** Wati's follow-up after the mock result lands. */
  afterResult: {
    text: string;
    convertLabel: string;
    declineLabel: string;
  };
  /** Wati's closing message after the agent is created. */
  afterAgent: {
    text: string;
  };
  closingChips: readonly ClosingChip[];
};

const TRAVEL_HOUSE: OnboardingScript = {
  intro: {
    greeting: "Hi — I'm Ask Wati.",
    subline:
      "I can dig through your Travel House conversations, draft replies, and run small agents that keep watching while you focus on something else. The fastest way to feel it is to try one.",
    leadChipLabel: "Find customers ready to book this week",
    leadPrompt: "Find customers ready to book this week",
  },
  leadWatcherType: "ready-to-buy",
  afterResult: {
    text: "A handful of customers are showing strong intent right now. Want me to keep an eye on this and bring you new ones daily?",
    convertLabel: "Set up a Hot Leads watcher",
    declineLabel: "Not now",
  },
  afterAgent: {
    text: "Your Hot Leads watcher is running. A few more things I can do whenever you're ready:",
  },
  closingChips: [
    { label: "Browse the Handoff Inbox", action: { kind: "open-handoffs" } },
    { label: "Show today's Daily Digest", action: { kind: "open-digest" } },
    {
      label: "Draft follow-ups for ad-sourced leads",
      action: {
        kind: "fill-composer",
        prompt: "Draft follow-ups for our ad-sourced leads from this week",
      },
    },
  ],
};

const BIGHAAT: OnboardingScript = {
  intro: {
    greeting: "Hi — I'm Ask Wati.",
    subline:
      "I can dig through your BigHaat customer queue, cluster what's coming in, and run small agents that keep watching while you focus on something else. The fastest way to feel it is to try one.",
    leadChipLabel: "Show today's delivery complaints",
    leadPrompt: "Show today's delivery complaints",
  },
  leadWatcherType: "delivery-issue",
  afterResult: {
    text: "There's a real cluster here. Want me to keep watching for delivery complaints and bring you the new ones daily?",
    convertLabel: "Set up a Delivery-issue watcher",
    declineLabel: "Not now",
  },
  afterAgent: {
    text: "Your Delivery-issue watcher is running. A few more things I can do whenever you're ready:",
  },
  closingChips: [
    { label: "Browse the Handoff Inbox", action: { kind: "open-handoffs" } },
    { label: "Show today's Daily Digest", action: { kind: "open-digest" } },
    {
      label: "Filter ops messages out of the customer queue",
      action: {
        kind: "fill-composer",
        prompt: "Find messages that look like internal ops sent to the customer queue by mistake",
      },
    },
  ],
};

export function getOnboardingScript(
  profile: TenantSignalProfile,
): OnboardingScript {
  if (profile.tenantId === "bighaat") return BIGHAAT;
  return TRAVEL_HOUSE;
}
