import type {
  Handoff,
  HandoffCta,
  HandoffSection,
  WatcherTypeId,
} from "./agents";

export type HandoffDraft = Omit<Handoff, "id" | "agentId" | "runNumber">;

export type WatcherTypeDef = {
  id: WatcherTypeId;
  label: string;
  defaultName: string;
  blurb: string;
  keywords: readonly string[];
  buildDraft: () => HandoffDraft;
};

function uid(): string {
  return crypto.randomUUID();
}

function nowIso(): string {
  return new Date().toISOString();
}

function section(
  kind: HandoffSection["kind"],
  title: string,
  items: Array<Omit<HandoffSection["items"][number], "id">>,
): HandoffSection {
  return {
    id: uid(),
    kind,
    title,
    items: items.map((i) => ({ ...i, id: uid() })),
  };
}

function cta(action: HandoffCta["action"], label: string): HandoffCta {
  return { id: uid(), action, label };
}

const READY_TO_BUY: WatcherTypeDef = {
  id: "ready-to-buy",
  label: "Ready to buy",
  defaultName: "Ready-to-buy Agent",
  blurb: "Surface contacts showing strong purchase intent.",
  keywords: ["ready to buy", "ready-to-buy", "buy", "purchase", "lead", "intent", "convert"],
  buildDraft: () => ({
    runAt: nowIso(),
    sections: [
      section("did", "What I scanned", [
        { label: "Analyzed 1,247 conversations from the last 24h" },
        { label: "Identified 12 contacts with strong buying signals" },
      ]),
      section("attention", "Hot leads", [
        {
          label: "Sarah J. — asked about pricing 3× this week",
          meta: "WhatsApp · 2h ago",
          cta: cta("send-bulk-message", "Send follow-up"),
        },
        {
          label: "Mark P. — added items to cart, did not check out",
          meta: "Web chat · 4h ago",
          cta: cta("send-bulk-message", "Send nudge"),
        },
        {
          label: "Priya K. — requested a demo yesterday",
          meta: "WhatsApp · 1d ago",
          cta: cta("send-bulk-message", "Send demo link"),
        },
      ]),
    ],
    ctas: [
      cta("create-segment", "Save as segment"),
      cta("send-campaign", "Launch re-engagement campaign"),
    ],
  }),
};

const TOP_TOPICS: WatcherTypeDef = {
  id: "top-topics",
  label: "Find top topics",
  defaultName: "Top topics Agent",
  blurb: "See what customers are talking about most.",
  keywords: ["top topic", "topic", "trending", "popular", "discussion", "theme"],
  buildDraft: () => ({
    runAt: nowIso(),
    sections: [
      section("did", "What I analyzed", [
        { label: "Reviewed 2,103 conversations from the last 24h" },
        { label: "Clustered messages into 18 topics; surfaced top 5" },
      ]),
      section("attention", "Top topics", [
        {
          label: "Shipping delays",
          meta: "412 mentions · ↑ 38% vs last week",
          cta: cta("create-inbox-filter", "Filter inbox"),
        },
        {
          label: "Refund requests",
          meta: "287 mentions · ↑ 12%",
          cta: cta("create-inbox-filter", "Filter inbox"),
        },
        {
          label: "Product sizing",
          meta: "198 mentions · ↓ 4%",
          cta: cta("create-inbox-filter", "Filter inbox"),
        },
        {
          label: "Discount codes",
          meta: "164 mentions · ↑ 21%",
          cta: cta("create-inbox-filter", "Filter inbox"),
        },
        {
          label: "Order tracking",
          meta: "132 mentions · ↑ 9%",
          cta: cta("create-inbox-filter", "Filter inbox"),
        },
      ]),
    ],
    ctas: [
      cta("create-segment", "Segment by topic"),
      cta("send-campaign", "Broadcast on top topic"),
    ],
  }),
};

const DEMAND_SPIKE: WatcherTypeDef = {
  id: "demand-spike",
  label: "Demand spike",
  defaultName: "Demand Spike Agent",
  blurb: "Get alerts when inbound demand surges.",
  keywords: ["demand", "surge", "spike in demand", "rush", "inbound"],
  buildDraft: () => ({
    runAt: nowIso(),
    sections: [
      section("did", "What I monitored", [
        { label: "Watched inbound conversation rate vs 30-day baseline" },
        { label: "Detected 2 spike windows in the last 24h" },
      ]),
      section("attention", "Spike windows", [
        {
          label: "10:00–11:30 — +184% vs baseline",
          meta: "Driven by product launch traffic",
          cta: cta("send-bulk-message", "Notify waiting customers"),
        },
        {
          label: "18:00–19:00 — +96% vs baseline",
          meta: "Concentrated on shipping queries",
          cta: cta("create-inbox-filter", "Route to support"),
        },
      ]),
    ],
    ctas: [
      cta("create-segment", "Save spike cohort"),
      cta("send-campaign", "Capacity announcement"),
    ],
  }),
};

const PRICE_ALERT: WatcherTypeDef = {
  id: "price-alert",
  label: "Price alert",
  defaultName: "Price Alert Agent",
  blurb: "Detect price-sensitive customer chatter.",
  keywords: ["price", "pricing", "discount", "deal", "cost", "expensive", "cheap"],
  buildDraft: () => ({
    runAt: nowIso(),
    sections: [
      section("did", "What I scanned", [
        { label: "Looked for price, discount, and deal mentions" },
        { label: "Flagged 34 conversations across 5 segments" },
      ]),
      section("attention", "Price-sensitive contacts", [
        {
          label: "8 contacts asked about bulk discounts",
          cta: cta("create-segment", "Save as segment"),
        },
        {
          label: "11 contacts mentioned competitor pricing",
          cta: cta("send-bulk-message", "Send counter-offer"),
        },
        {
          label: "15 contacts asked when the next sale is",
          cta: cta("send-campaign", "Tease upcoming sale"),
        },
      ]),
    ],
    ctas: [
      cta("create-segment", "Save price-sensitive segment"),
      cta("send-campaign", "Launch discount campaign"),
    ],
  }),
};

const SENTIMENT_MONITOR: WatcherTypeDef = {
  id: "sentiment-monitor",
  label: "Sentiment monitor",
  defaultName: "Sentiment Agent",
  blurb: "Track customer sentiment across conversations.",
  keywords: ["sentiment", "mood", "satisfaction", "happy", "angry", "upset", "frustrated"],
  buildDraft: () => ({
    runAt: nowIso(),
    sections: [
      section("did", "What I scored", [
        { label: "Scored 1,876 conversations for sentiment" },
        { label: "Net sentiment: +0.42 (↓ 0.08 vs last week)" },
      ]),
      section("attention", "Negative sentiment", [
        {
          label: "23 contacts with strongly negative sentiment",
          meta: "Mostly shipping and refund issues",
          cta: cta("create-inbox-filter", "Route to recovery"),
        },
        {
          label: "7 escalations flagged for human review",
          cta: cta("send-bulk-message", "Send apology + credit"),
        },
      ]),
    ],
    ctas: [
      cta("create-segment", "Save at-risk segment"),
      cta("create-inbox-filter", "Always route negative to humans"),
    ],
  }),
};

const VOLUME_SPIKE: WatcherTypeDef = {
  id: "volume-spike",
  label: "Volume spike",
  defaultName: "Volume Agent",
  blurb: "Catch surges in message volume and capacity risk.",
  keywords: ["volume", "load", "capacity", "spike in volume", "queue", "backlog"],
  buildDraft: () => ({
    runAt: nowIso(),
    sections: [
      section("did", "What I monitored", [
        { label: "Tracked message volume across all channels" },
        { label: "Compared against rolling 7-day average" },
      ]),
      section("attention", "Capacity risk", [
        {
          label: "Queue depth peaked at 142 — 2.4× normal",
          meta: "Between 14:00 and 15:30",
          cta: cta("create-inbox-filter", "Auto-triage by topic"),
        },
        {
          label: "Avg response time slipped to 8m 12s",
          meta: "SLA target: 3m",
          cta: cta("send-bulk-message", "Send holding message"),
        },
      ]),
    ],
    ctas: [
      cta("create-inbox-filter", "Add overflow routing"),
      cta("send-campaign", "Notify customers of delay"),
    ],
  }),
};

const CUSTOM: WatcherTypeDef = {
  id: "custom",
  label: "Other",
  defaultName: "Custom Agent",
  blurb: "Describe what this agent should watch for.",
  keywords: [],
  buildDraft: () => ({
    runAt: nowIso(),
    sections: [
      section("did", "What I checked", [
        { label: "Ran your custom watch over the last 24h" },
        { label: "See findings below" },
      ]),
      section("attention", "Findings", [
        {
          label: "No actionable matches in this run",
          meta: "I'll check again on the next scheduled run",
        },
      ]),
    ],
    ctas: [
      cta("create-segment", "Save findings as segment"),
      cta("create-inbox-filter", "Create inbox filter"),
    ],
  }),
};

export const WATCHER_TYPES: readonly WatcherTypeDef[] = [
  READY_TO_BUY,
  TOP_TOPICS,
  DEMAND_SPIKE,
  PRICE_ALERT,
  SENTIMENT_MONITOR,
  VOLUME_SPIKE,
  CUSTOM,
];

export function getWatcherType(id: WatcherTypeId): WatcherTypeDef {
  const found = WATCHER_TYPES.find((w) => w.id === id);
  if (!found) throw new Error(`Unknown watcher type: ${id}`);
  return found;
}

export function matchWatcherType(message: string): WatcherTypeId | null {
  const lower = message.toLowerCase();
  for (const w of WATCHER_TYPES) {
    if (w.id === "custom") continue;
    if (w.keywords.some((k) => lower.includes(k))) return w.id;
  }
  return null;
}
