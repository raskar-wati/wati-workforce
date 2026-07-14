import type { TenantSignalProfile } from "./tenant-signal-profile";

export type TenantPromptCopy = {
  greeting: string;
  subline: string;
  prompts: string[];
};

const TRAVEL_HOUSE_COPY: TenantPromptCopy = {
  greeting: "Hi — I'm Wati.",
  subline:
    "I keep an eye on Travel House's inbox and surface what needs you. Want to start with one of these?",
  prompts: [
    "What needs my attention this morning?",
    "Find customers ready to book",
    "Draft a follow-up for ad-sourced leads",
  ],
};

const BIGHAAT_COPY: TenantPromptCopy = {
  greeting: "Hi — I'm Wati.",
  subline:
    "I cluster what's coming in to BigHaat's queue and act when you say go. Want to start with one of these?",
  prompts: [
    "Show today's delivery complaints",
    "Which SKUs are customers asking about?",
    "Filter ops messages out of the queue",
  ],
};

const FALLBACK_COPY: TenantPromptCopy = {
  greeting: "Hi — I'm Wati.",
  subline:
    "I watch your customer conversations, surface what matters, and can act when you say go. Want to start with one of these?",
  prompts: [
    "What needs my attention today?",
    "Show me customers who've been waiting too long",
    "Draft a follow-up for stalled conversations",
  ],
};

export function getTenantPromptCopy(
  profile: TenantSignalProfile,
): TenantPromptCopy {
  if (profile.tenantId === "travel-house") return TRAVEL_HOUSE_COPY;
  if (profile.tenantId === "bighaat") return BIGHAAT_COPY;
  return FALLBACK_COPY;
}
