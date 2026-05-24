import type { TenantSignalProfile, TenantTheme } from "./tenant-signal-profile";

export type AgentSuggestion = {
  id: string;
  /** Short agent name shown as the card title. */
  name: string;
  /**
   * Returns an evidence line grounded in the tenant's profile, e.g.
   * "48 customers asked about BNPL last week", or null if this suggestion
   * doesn't apply to the tenant.
   */
  evidence: (profile: TenantSignalProfile) => string | null;
  /** Higher = ranked earlier. 0 hides the suggestion. */
  score: (profile: TenantSignalProfile) => number;
  /**
   * Pre-filled composer text. Includes keywords matched by
   * matchWatcherType() where a clean watcher type exists; otherwise the
   * creation flow falls through to the "custom" watcher.
   */
  prompt: string;
};

// ---- predicate helpers -----------------------------------------------------

function hasSignal(profile: TenantSignalProfile, ...ids: string[]): boolean {
  return ids.some((id) => profile.dominantSignalTypes.includes(id));
}

function hasEmergent(profile: TenantSignalProfile, ...needles: string[]): boolean {
  const haystack = profile.emergentThemes.join(" ").toLowerCase();
  return needles.some((n) => haystack.includes(n.toLowerCase()));
}

function findTheme(
  profile: TenantSignalProfile,
  ...needles: string[]
): TenantTheme | undefined {
  return profile.topThemes.find((t) =>
    needles.some((n) => t.theme.toLowerCase().includes(n.toLowerCase())),
  );
}

/** Rough relative score for a matched theme — bigger contactCount wins. */
function themeScore(theme: TenantTheme | undefined): number {
  if (!theme) return 0;
  // Boost rising themes; we want urgency-driven suggestions to bubble up.
  const trendBoost = theme.trend === "rising" ? 1.15 : 1;
  return theme.contactCount * trendBoost;
}

function evidenceFromTheme(
  theme: TenantTheme | undefined,
  template: (n: number) => string,
): string | null {
  if (!theme) return null;
  return template(theme.contactCount);
}

// ---- suggestion definitions ------------------------------------------------

const READY_TO_BUY: AgentSuggestion = {
  id: "ready-to-buy",
  name: "Watch for ready-to-buy signals",
  evidence: (p) =>
    evidenceFromTheme(
      findTheme(p, "close-readiness", "ready to book", "ready to buy", "intent"),
      (n) => `${n} contacts showing close-readiness signals`,
    ),
  score: (p) => {
    if (!hasSignal(p, "conversation_stage", "intent")) return 0;
    return themeScore(
      findTheme(p, "close-readiness", "ready to book", "ready to buy", "intent"),
    );
  },
  prompt:
    "Create an agent to watch for ready-to-buy signals in conversations and surface contacts close to purchase.",
};

const RESPONSE_GAP: AgentSuggestion = {
  id: "response-gap",
  name: "Watch for response gap / SLA breach",
  evidence: (p) =>
    evidenceFromTheme(
      findTheme(p, "awaiting agent", "sla", "response gap"),
      (n) => `${n} contacts waiting longer than SLA for first reply`,
    ),
  score: (p) => {
    if (!hasSignal(p, "response_gap", "response_chase")) return 0;
    return themeScore(findTheme(p, "awaiting agent", "sla", "response gap"));
  },
  prompt:
    "Create an agent to flag conversations where customers are waiting longer than SLA for an agent reply, and route them for follow-up.",
};

const CHURN_RISK: AgentSuggestion = {
  id: "churn-risk",
  name: "Watch for churn risk",
  evidence: (p) =>
    evidenceFromTheme(
      findTheme(p, "negative sentiment", "escalation", "churn"),
      (n) => `${n} contacts with negative sentiment last week`,
    ),
  score: (p) => {
    if (!hasSignal(p, "negative_sentiment", "escalation")) return 0;
    return themeScore(findTheme(p, "negative sentiment", "escalation", "churn"));
  },
  // "sentiment" → matches the existing sentiment-monitor watcher
  prompt:
    "Create an agent to monitor sentiment across conversations and surface customers at churn risk.",
};

const BLOCKER_PRICE: AgentSuggestion = {
  id: "blocker-price",
  name: "Watch for price / payment blockers",
  evidence: (p) =>
    evidenceFromTheme(
      findTheme(p, "installment", "bnpl", "price", "payment objection"),
      (n) => `${n} customers asked about BNPL or installments last week`,
    ),
  score: (p) => {
    if (
      !hasSignal(p, "blocker") &&
      !findTheme(p, "installment", "bnpl", "price")
    ) {
      return 0;
    }
    return themeScore(
      findTheme(p, "installment", "bnpl", "price", "payment objection"),
    );
  },
  // "price" → matches the existing price-alert watcher
  prompt:
    "Create an agent to watch for price and payment blockers — BNPL asks, installment requests, and pricing objections.",
};

const DELIVERY_ISSUE: AgentSuggestion = {
  id: "delivery-issue",
  name: "Watch for delivery complaints",
  evidence: (p) =>
    evidenceFromTheme(
      findTheme(p, "delivery"),
      (n) => `${n} delivery complaint conversations in the last 7 days`,
    ),
  score: (p) => {
    if (!hasEmergent(p, "delivery_complaint") && !findTheme(p, "delivery")) {
      return 0;
    }
    return themeScore(findTheme(p, "delivery"));
  },
  // No keyword match in matchWatcherType → falls through to custom
  prompt:
    "Create an agent to watch for delivery complaints, group them by route or vendor, and surface affected customers.",
};

const PRODUCT_INQUIRY: AgentSuggestion = {
  id: "product-inquiry",
  name: "Watch for product inquiry volume",
  evidence: (p) =>
    evidenceFromTheme(
      findTheme(p, "sku", "product inquiry"),
      (n) => `${n} contacts asking about specific SKUs`,
    ),
  score: (p) => {
    if (!hasEmergent(p, "sku_inquiry") && !findTheme(p, "sku", "product inquiry")) {
      return 0;
    }
    return themeScore(findTheme(p, "sku", "product inquiry"));
  },
  // "top topic" → matches the existing top-topics watcher
  prompt:
    "Create an agent to find top topics in customer inquiries and group conversations by product or SKU.",
};

const URGENCY: AgentSuggestion = {
  id: "urgency",
  name: "Watch for urgent / same-week requests",
  evidence: (p) =>
    evidenceFromTheme(
      findTheme(p, "urgent", "same-week", "same week"),
      (n) => `${n} same-week or urgent requests`,
    ),
  score: (p) => {
    if (!hasSignal(p, "timeline_urgency")) return 0;
    return themeScore(findTheme(p, "urgent", "same-week", "same week"));
  },
  // Falls through to custom — no clean keyword match
  prompt:
    "Create an agent to watch for urgent, same-week, or last-minute customer requests and prioritize them in inbox.",
};

const PAID_ACQ: AgentSuggestion = {
  id: "paid-acq",
  name: "Track paid acquisition leads",
  evidence: (p) =>
    evidenceFromTheme(
      findTheme(p, "ad-sourced", "ctwa", "whatsapp ad"),
      (n) => `${n} leads from WhatsApp ads this week`,
    ),
  score: (p) => {
    if (!hasSignal(p, "ctwa_lead")) return 0;
    return themeScore(findTheme(p, "ad-sourced", "ctwa", "whatsapp ad"));
  },
  // Falls through to custom
  prompt:
    "Create an agent to track paid acquisition leads coming in from WhatsApp ads and surface high-intent ones.",
};

const OPS_MISCLASSIFICATION: AgentSuggestion = {
  id: "ops-misclassification",
  name: "Filter internal / ops messages",
  evidence: (p) =>
    evidenceFromTheme(
      findTheme(p, "internal", "ops"),
      (n) => `${n} internal / ops messages found in the customer queue`,
    ),
  score: (p) => {
    if (!hasEmergent(p, "internal_ops") && !findTheme(p, "internal", "ops")) {
      return 0;
    }
    return themeScore(findTheme(p, "internal", "ops"));
  },
  // Falls through to custom
  prompt:
    "Create an agent to detect and filter internal or operations messages mistakenly landing in the customer support queue.",
};

export const SUGGESTION_BANK: readonly AgentSuggestion[] = [
  READY_TO_BUY,
  RESPONSE_GAP,
  CHURN_RISK,
  BLOCKER_PRICE,
  DELIVERY_ISSUE,
  PRODUCT_INQUIRY,
  URGENCY,
  PAID_ACQ,
  OPS_MISCLASSIFICATION,
];

/**
 * Rank the suggestion bank against a tenant profile. Returns suggestions with
 * score > 0, sorted descending. Caps at `max` (default 5).
 */
export function rankSuggestions(
  profile: TenantSignalProfile,
  max: number = 5,
): AgentSuggestion[] {
  return SUGGESTION_BANK.map((s) => ({ s, score: s.score(profile) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((entry) => entry.s);
}
