import { getAchievement, type AchievementId } from "./achievements";
import type { AgentSchedule, WatcherTypeId } from "./agents";

export type GenerateInstructionsArgs = {
  agentName: string;
  watcherType: WatcherTypeId;
  customDescription?: string;
  achievements: AchievementId[];
  schedule: AgentSchedule;
};

export function generateInstructions(args: GenerateInstructionsArgs): string {
  const { agentName, watcherType, customDescription, achievements, schedule } =
    args;
  return [
    `You are the ${agentName}. ${watcherJob(watcherType)}`,
    "",
    "---",
    "",
    "## WHAT YOU WATCH",
    watchSection(watcherType, customDescription),
    "",
    "## WHAT YOU DO",
    achievementsSection(achievements),
    "",
    "## SCHEDULE",
    scheduleSection(schedule),
    "",
    "## HANDOFF FORMAT",
    "Each run, produce a visual handoff with two parts:",
    "1. A short summary of what was scanned, with counts.",
    "2. A list of items that need attention, each row showing the contact or signal plus inline action buttons tied to the achievements above.",
  ].join("\n");
}

function watcherJob(id: WatcherTypeId): string {
  switch (id) {
    case "top-topics":
      return "Your job is to surface the most-discussed themes across customer conversations and show how they're trending.";
    case "demand-spike":
      return "Your job is to catch surges in inbound demand the moment they happen and flag the cohort that caused them.";
    case "price-alert":
      return "Your job is to detect price-sensitive chatter — discount requests, competitor pricing mentions, sale enquiries.";
    case "sentiment-monitor":
      return "Your job is to score sentiment across active conversations and surface customers slipping into negative territory.";
    case "volume-spike":
      return "Your job is to monitor message volume and warn when capacity risk is forming.";
    case "ready-to-buy":
      return "Your job is to surface customers showing strong purchase intent but who haven't been responded to in time.";
    case "custom":
      return "Your job is the custom brief described below.";
  }
}

function watchSection(id: WatcherTypeId, customDescription?: string): string {
  switch (id) {
    case "top-topics":
      return "Cluster messages from every open conversation into themes. Count mentions, compare to the prior period, and report the top five with deltas.";
    case "demand-spike":
      return "Track inbound conversation rate against a 30-day baseline. Detect windows where volume exceeds the baseline by 50%+ and report the driver.";
    case "price-alert":
      return "Scan messages for price-related keywords (price, discount, deal, competitor names). Group flagged contacts by intent.";
    case "sentiment-monitor":
      return "Score every conversation for sentiment. Highlight contacts with strongly negative sentiment and escalations.";
    case "volume-spike":
      return "Compare message volume per channel against the rolling 7-day average. Flag queue depth and SLA risk.";
    case "ready-to-buy":
      return "Scan every open conversation in the inbox. Flag a customer as ready-to-buy when they mention pricing repeatedly, abandon a cart, or request a demo.";
    case "custom":
      return customDescription?.trim() || "(No custom description provided.)";
  }
}

function achievementsSection(ids: AchievementId[]): string {
  if (ids.length === 0) {
    return "(No actions selected — the handoff will only show findings.)";
  }
  return ids
    .map((id) => `- ${getAchievement(id).label}`)
    .join("\n");
}

function scheduleSection(s: AgentSchedule): string {
  if (s.kind === "once") return "Run once when activated, then mark complete.";
  if (s.kind === "custom") return s.description;
  switch (s.preset) {
    case "daily":
      return "Run every day at 08:00 AM in the workspace timezone.";
    case "weekly":
      return "Run every Monday at 08:00 AM in the workspace timezone.";
    case "every-other-day":
      return "Run every other day at 08:00 AM in the workspace timezone.";
  }
}
