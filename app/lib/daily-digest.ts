import type { TenantSignalProfile } from "./tenant-signal-profile";

export type DigestMetric = {
  id: string;
  label: string;
  /** Already-formatted display value, e.g. "$48,200" or "4m 12s". */
  value: string;
  /** Optional small qualifier shown next to value, e.g. "12 deals". */
  subLabel?: string;
  /** Optional trend chip. `tone` reflects whether direction is good or bad. */
  trend?: {
    direction: "up" | "down";
    pct: string;
    tone: "good" | "bad" | "neutral";
  };
};

export type DigestPerformer = {
  name: string;
  /** Stable seed for the pixabot avatar — kept as an index into the bank. */
  avatarIndex: number;
  /** Concise stat line, e.g. "23 deals · $14k". */
  metric: string;
};

export type DigestTopic = {
  label: string;
  /** Signed percent, e.g. "+34%" or "-12%". */
  delta: string;
  tone: "good" | "bad" | "neutral";
};

export type DailyDigestData = {
  /** ISO date string the digest covers (yesterday). */
  forDate: string;
  heroMetrics: DigestMetric[];
  topPerformers: DigestPerformer[];
  trendingTopics: DigestTopic[];
};

/**
 * Builds a tenant-aware daily digest. Numbers are mocked but framed to match
 * the active tenant — Travel House sees bookings/urgent travel, BigHaat sees
 * orders/delivery resolution.
 *
 * Pure function so the same call returns the same data within a session.
 */
export function buildDailyDigest(profile: TenantSignalProfile): DailyDigestData {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const forDate = yesterday.toISOString().slice(0, 10);

  if (profile.tenantId === "bighaat") {
    return BIGHAAT_DIGEST(forDate);
  }
  return TRAVEL_HOUSE_DIGEST(forDate);
}

function TRAVEL_HOUSE_DIGEST(forDate: string): DailyDigestData {
  return {
    forDate,
    heroMetrics: [
      {
        id: "closed-yesterday",
        label: "Closed yesterday",
        value: "$48,200",
        subLabel: "12 bookings",
        trend: { direction: "up", pct: "14%", tone: "good" },
      },
      {
        id: "pipeline-today",
        label: "Pipeline today",
        value: "$124,800",
        subLabel: "38 hot leads",
        trend: { direction: "up", pct: "9%", tone: "good" },
      },
      {
        id: "conversations",
        label: "Conversations",
        value: "1,247",
        trend: { direction: "up", pct: "8%", tone: "good" },
      },
      {
        id: "response-time",
        label: "Avg response",
        value: "4m 12s",
        trend: { direction: "down", pct: "22%", tone: "good" },
      },
    ],
    topPerformers: [
      { name: "Ananya R.", avatarIndex: 12, metric: "9 bookings · $14.2k" },
      { name: "Vikram S.", avatarIndex: 27, metric: "7 bookings · $11.8k" },
      { name: "Priya M.", avatarIndex: 54, metric: "6 bookings · $9.4k" },
    ],
    trendingTopics: [
      { label: "Same-week travel requests", delta: "+34%", tone: "good" },
      { label: "WhatsApp ad-sourced leads", delta: "+22%", tone: "good" },
      { label: "Installment / BNPL asks", delta: "+18%", tone: "neutral" },
    ],
  };
}

function BIGHAAT_DIGEST(forDate: string): DailyDigestData {
  return {
    forDate,
    heroMetrics: [
      {
        id: "closed-yesterday",
        label: "Orders shipped yesterday",
        value: "₹3,42,500",
        subLabel: "186 orders",
        trend: { direction: "up", pct: "11%", tone: "good" },
      },
      {
        id: "pipeline-today",
        label: "Pipeline today",
        value: "₹5,18,200",
        subLabel: "247 active carts",
        trend: { direction: "up", pct: "6%", tone: "good" },
      },
      {
        id: "conversations",
        label: "Conversations",
        value: "2,184",
        trend: { direction: "up", pct: "12%", tone: "good" },
      },
      {
        id: "response-time",
        label: "Avg response",
        value: "6m 48s",
        trend: { direction: "up", pct: "9%", tone: "bad" },
      },
    ],
    topPerformers: [
      { name: "Ravi T.", avatarIndex: 8, metric: "31 orders · ₹52k" },
      { name: "Lakshmi K.", avatarIndex: 41, metric: "28 orders · ₹47k" },
      { name: "Suresh B.", avatarIndex: 73, metric: "22 orders · ₹38k" },
    ],
    trendingTopics: [
      { label: "Delivery complaints", delta: "+28%", tone: "bad" },
      { label: "SKU-level product inquiries", delta: "+15%", tone: "good" },
      { label: "Price / payment objections", delta: "+7%", tone: "neutral" },
    ],
  };
}
