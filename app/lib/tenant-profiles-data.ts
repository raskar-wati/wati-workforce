export type TenantThemeTrend = "rising" | "stable" | "falling";

export type TenantTheme = {
  theme: string;
  level: "message" | "conversation";
  contactCount: number;
  trend: TenantThemeTrend;
  /** Optional opportunity-value $$ associated with this theme. */
  opportunityValue?: number;
};

export type TenantSignalProfile = {
  tenantId: string;
  displayName: string;
  topThemes: TenantTheme[];
  /** Predefined signal types observed in this tenant's data. */
  dominantSignalTypes: string[];
  /** Themes the LLM discovered but aren't in the predefined taxonomy yet. */
  emergentThemes: string[];
};

/**
 * Travel House (UK travel) — short-window urgency, paid acquisition leads,
 * BNPL/installment asks. Shaped from the signal-discovery study.
 */
export const TRAVEL_HOUSE_PROFILE: TenantSignalProfile = {
  tenantId: "travel-house",
  displayName: "Travel House",
  topThemes: [
    {
      theme: "Same-week / urgent travel requests",
      level: "conversation",
      contactCount: 124,
      trend: "rising",
    },
    {
      theme: "WhatsApp ad-sourced leads",
      level: "conversation",
      contactCount: 96,
      trend: "rising",
    },
    {
      theme: "Close-readiness — ready to book",
      level: "conversation",
      contactCount: 72,
      trend: "stable",
    },
    {
      theme: "Installment / BNPL ask",
      level: "message",
      contactCount: 48,
      trend: "rising",
    },
    {
      theme: "Awaiting agent reply > SLA",
      level: "conversation",
      contactCount: 31,
      trend: "stable",
    },
  ],
  dominantSignalTypes: [
    "timeline_urgency",
    "ctwa_lead",
    "conversation_stage",
    "intent",
    "blocker",
    "response_gap",
  ],
  emergentThemes: [],
};

/**
 * BigHaat (Indian agriculture) — delivery complaint clusters, SKU-level
 * product inquiries, occasional internal/ops misclassification in queue.
 */
export const BIGHAAT_PROFILE: TenantSignalProfile = {
  tenantId: "bighaat",
  displayName: "BigHaat",
  topThemes: [
    {
      theme: "Delivery complaint cluster",
      level: "conversation",
      contactCount: 213,
      trend: "rising",
    },
    {
      theme: "SKU-level product inquiry",
      level: "message",
      contactCount: 187,
      trend: "stable",
    },
    {
      theme: "Price / payment objection",
      level: "message",
      contactCount: 64,
      trend: "stable",
    },
    {
      theme: "Internal / ops messages in customer queue",
      level: "message",
      contactCount: 22,
      trend: "stable",
    },
  ],
  dominantSignalTypes: ["blocker", "response_gap"],
  emergentThemes: ["delivery_complaint", "sku_inquiry", "internal_ops"],
};

export const TENANT_PROFILES: readonly TenantSignalProfile[] = [
  TRAVEL_HOUSE_PROFILE,
  BIGHAAT_PROFILE,
];
