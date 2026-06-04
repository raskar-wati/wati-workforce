import { rankSuggestions } from "./agent-suggestions";
import type { WatcherTypeId } from "./agents";
import type { TenantSignalProfile } from "./tenant-signal-profile";

/**
 * Conversational onboarding payloads. The script is the deterministic
 * fallback path — it returns the exact data shape an LLM-backed Wati
 * would. ChatArea consumes turn payloads and wires chip clicks to
 * behavior; the script itself is pure data so it can move behind an
 * API route handler unchanged when we wire the LLM in.
 *
 * Conversation shape:
 *   intro → (pick-offering) → agentsDrillDown | comingSoon
 *   agentsDrillDown → (pick-agent) → mock handoff preview
 *   preview → afterResult → (convert) → AgentCreationFlow → afterAgent
 *   afterAgent → closing chips
 */

// ---- chip action types ----------------------------------------------------

export type OfferingChoice = "agents" | "automations" | "insights";

export type ClosingChipAction =
  | { kind: "open-handoffs" }
  | { kind: "open-digest" }
  | { kind: "fill-composer"; prompt: string };

export type ClosingChip = {
  label: string;
  action: ClosingChipAction;
};

// ---- turn payload shapes --------------------------------------------------

export type OnboardingAgentOption = {
  label: string;
  agentName: string;
  prompt: string;
  watcherTypeId: WatcherTypeId;
};

export type IntroTurn = {
  text: string;
  offerings: ReadonlyArray<{ label: string; choice: OfferingChoice }>;
  skipLabel: string;
};

export type AgentsDrillDownTurn = {
  text: string;
  agents: ReadonlyArray<OnboardingAgentOption>;
  backLabel: string;
  skipLabel: string;
};

export type ComingSoonTurn = {
  text: string;
  backLabel: string;
  skipLabel: string;
};

export type AfterResultTurn = {
  text: string;
  convertLabel: string;
  declineLabel: string;
};

export type AfterAgentTurn = {
  text: string;
  closingChips: readonly ClosingChip[];
};

export type OnboardingScript = {
  intro: IntroTurn;
  agentsDrillDown: AgentsDrillDownTurn;
  comingSoonAutomations: ComingSoonTurn;
  comingSoonInsights: ComingSoonTurn;
  afterResult: AfterResultTurn;
  afterAgent: AfterAgentTurn;
};

// ---- shared copy ----------------------------------------------------------

const COMING_SOON_AUTOMATIONS: ComingSoonTurn = {
  text: "Automations are coming soon — rules that fire on their own without you in the loop. For now, agents are the entry point. Want to see what I can watch for?",
  backLabel: "Show me agents",
  skipLabel: "Skip intro",
};

const COMING_SOON_INSIGHTS: ComingSoonTurn = {
  text: "Insights are coming soon — ad-hoc questions you can ask about your data and get an answer instantly. For now, agents are the entry point. Want to see what I can watch for?",
  backLabel: "Show me agents",
  skipLabel: "Skip intro",
};

const AFTER_AGENT_TEXT =
  "Your agent is running and will show up here whenever it has something for you. A few more things I can do whenever you're ready:";

// ---- tenant-shaped intro copy --------------------------------------------

type TenantIntroCopy = {
  intro: string;
  agentsHeader: string;
  closingChips: readonly ClosingChip[];
};

const TRAVEL_HOUSE_COPY: TenantIntroCopy = {
  intro:
    "Hey — I'm Wati, your AI workforce inside the Wati platform. I act on Wati directly: I read your Travel House conversations, draft and send replies, update contacts, and run on my own when you're not here.\n\nI can do that as agents that watch for things and act (like spotting customers ready to book), automations that fire on their own (coming soon), or insights you can ask about on demand (coming soon). Where would you like to start?",
  agentsHeader:
    "Here's what I can watch for in your Travel House inbox. Pick one and I'll run it once so you can see what it looks like:",
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

const BIGHAAT_COPY: TenantIntroCopy = {
  intro:
    "Hey — I'm Wati, your AI workforce inside the Wati platform. I act on Wati directly: I read your BigHaat customer queue, cluster what's coming in, reply where I can, and run on my own when you're not here.\n\nI can do that as agents that watch for things and act (like surfacing delivery complaints early), automations that fire on their own (coming soon), or insights you can ask about on demand (coming soon). Where would you like to start?",
  agentsHeader:
    "Here's what I can watch for in your BigHaat queue. Pick one and I'll run it once so you can see what it looks like:",
  closingChips: [
    { label: "Browse the Handoff Inbox", action: { kind: "open-handoffs" } },
    { label: "Show today's Daily Digest", action: { kind: "open-digest" } },
    {
      label: "Filter ops messages out of the customer queue",
      action: {
        kind: "fill-composer",
        prompt:
          "Find messages that look like internal ops sent to the customer queue by mistake",
      },
    },
  ],
};

function getTenantCopy(profile: TenantSignalProfile): TenantIntroCopy {
  if (profile.tenantId === "bighaat") return BIGHAAT_COPY;
  return TRAVEL_HOUSE_COPY;
}

// ---- assembly -------------------------------------------------------------

const OFFERINGS: IntroTurn["offerings"] = [
  { label: "Agents", choice: "agents" },
  { label: "Automations", choice: "automations" },
  { label: "Insights", choice: "insights" },
];

function buildAgentOptions(
  profile: TenantSignalProfile,
): OnboardingAgentOption[] {
  // Reuse the existing tenant-aware suggestion bank so the onboarding
  // drill-in stays in sync with what the user sees elsewhere. Cap at 4 to
  // keep the chip row scannable.
  // Chip label uses the suggestion's short outcome-language name
  // ("Watch for ready-to-buy signals"). The full prompt is preserved
  // separately so it can seed AgentCreationFlow's composer.
  return rankSuggestions(profile, 4).map((s) => ({
    label: s.name,
    agentName: s.name,
    prompt: s.prompt,
    watcherTypeId: s.watcherTypeId,
  }));
}

export function getOnboardingScript(
  profile: TenantSignalProfile,
): OnboardingScript {
  const copy = getTenantCopy(profile);
  return {
    intro: {
      text: copy.intro,
      offerings: OFFERINGS,
      skipLabel: "Skip intro",
    },
    agentsDrillDown: {
      text: copy.agentsHeader,
      agents: buildAgentOptions(profile),
      backLabel: "Back",
      skipLabel: "Skip intro",
    },
    comingSoonAutomations: COMING_SOON_AUTOMATIONS,
    comingSoonInsights: COMING_SOON_INSIGHTS,
    afterResult: {
      text: "Want me to keep an eye on this and bring you new ones as they come in?",
      convertLabel: "Set this up as an agent",
      declineLabel: "Not now",
    },
    afterAgent: {
      text: AFTER_AGENT_TEXT,
      closingChips: copy.closingChips,
    },
  };
}
