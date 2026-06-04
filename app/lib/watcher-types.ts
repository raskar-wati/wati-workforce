import type {
  Handoff,
  HandoffCta,
  HandoffSection,
  HandoffTable,
  HandoffTableRow,
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
  tbl?: HandoffTable,
): HandoffSection {
  return {
    id: uid(),
    kind,
    title,
    items: items.map((i) => ({ ...i, id: uid() })),
    table: tbl,
  };
}

/** Builds a customer table; assigns row ids automatically. */
function table(
  columns: string[],
  rows: Array<Omit<HandoffTableRow, "id">>,
): HandoffTable {
  return { columns, rows: rows.map((r) => ({ ...r, id: uid() })) };
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
      section(
        "attention",
        "Hot leads",
        [],
        table(
          ["Contact", "Channel", "Signal", ""],
          [
            {
              cells: [
                "Sarah J.",
                "WhatsApp · 2h ago",
                "Asked about pricing 3× this week",
              ],
              cta: cta("send-bulk-message", "Send follow-up"),
            },
            {
              cells: [
                "Mark P.",
                "Web chat · 4h ago",
                "Added items to cart, didn’t check out",
              ],
              cta: cta("send-bulk-message", "Send nudge"),
            },
            {
              cells: [
                "Priya K.",
                "WhatsApp · 1d ago",
                "Requested a demo yesterday",
              ],
              cta: cta("send-bulk-message", "Send demo link"),
            },
          ],
        ),
      ),
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

const URGENCY: WatcherTypeDef = {
  id: "urgency",
  label: "Urgent / same-week requests",
  defaultName: "Urgency Agent",
  blurb: "Surface customers with time-sensitive or same-week requests.",
  keywords: ["urgent", "same-week", "last-minute", "prioritize"],
  buildDraft: () => ({
    runAt: nowIso(),
    sections: [
      section("did", "What I scanned", [
        { label: "Reviewed 1,842 conversations from the last 24h" },
        { label: "Flagged 31 contacts with same-week or urgent language" },
      ]),
      section(
        "attention",
        "Urgent requests",
        [],
        table(
          ["Customer", "Channel", "Request", ""],
          [
            {
              cells: [
                "Riya M.",
                "WhatsApp · 1h ago",
                "“need this by Friday, can you confirm?”",
              ],
              cta: cta("send-bulk-message", "Send priority reply"),
            },
            {
              cells: [
                "Carlos T.",
                "WhatsApp · 3h ago",
                "“booking for this weekend, is it available?”",
              ],
              cta: cta("send-bulk-message", "Confirm availability"),
            },
            {
              note: true,
              cells: ["14 more contacts with same-week intent"],
              cta: cta("create-segment", "Save as urgent segment"),
            },
          ],
        ),
      ),
    ],
    ctas: [
      cta("create-segment", "Save urgent cohort"),
      cta("create-inbox-filter", "Route urgent to priority queue"),
    ],
  }),
};

const RESPONSE_GAP: WatcherTypeDef = {
  id: "response-gap",
  label: "Response gap / SLA breach",
  defaultName: "SLA Agent",
  blurb: "Flag conversations where customers are waiting past SLA.",
  keywords: ["sla", "response gap", "waiting", "no reply", "unanswered"],
  buildDraft: () => ({
    runAt: nowIso(),
    sections: [
      section("did", "What I monitored", [
        { label: "Checked all open conversations for first-reply time" },
        { label: "Flagged threads with no agent reply past the 3-minute SLA" },
      ]),
      section("attention", "SLA breaches", [
        {
          label: "18 conversations waiting > 10 min with no reply",
          meta: "Avg wait: 23 min",
          cta: cta("create-inbox-filter", "Route to available agents"),
        },
        {
          label: "5 conversations waiting > 1 hour",
          meta: "High escalation risk",
          cta: cta("send-bulk-message", "Send holding message"),
        },
      ]),
    ],
    ctas: [
      cta("create-segment", "Save breached conversations"),
      cta("create-inbox-filter", "Auto-escalate on SLA breach"),
    ],
  }),
};

const DELIVERY_ISSUE: WatcherTypeDef = {
  id: "delivery-issue",
  label: "Delivery complaints",
  defaultName: "Delivery Agent",
  blurb: "Group delivery complaints by route or vendor and surface affected customers.",
  keywords: ["delivery", "shipping", "dispatch", "courier", "shipment"],
  buildDraft: () => ({
    runAt: nowIso(),
    sections: [
      section("did", "What I scanned", [
        { label: "Scanned all conversations for delivery-related keywords" },
        { label: "Found 64 delivery complaint threads in the last 24h" },
      ]),
      section("attention", "Complaints by cluster", [
        {
          label: "Blue Dart — 27 complaints, avg 2.3 days late",
          meta: "Northern zone",
          cta: cta("send-bulk-message", "Send apology + update"),
        },
        {
          label: "Delhivery — 19 complaints, 'not delivered' reports",
          meta: "Western zone",
          cta: cta("create-segment", "Save affected customers"),
        },
        {
          label: "18 unassigned delivery complaints",
          meta: "No vendor identified",
          cta: cta("create-inbox-filter", "Route to ops team"),
        },
      ]),
    ],
    ctas: [
      cta("send-campaign", "Proactive delay notification"),
      cta("create-segment", "Save all delivery-complaint contacts"),
    ],
  }),
};

const PAID_ACQ: WatcherTypeDef = {
  id: "paid-acq",
  label: "Paid acquisition leads",
  defaultName: "Paid Leads Agent",
  blurb: "Track WhatsApp ad leads and surface high-intent ones.",
  keywords: ["paid acquisition", "whatsapp ad", "ctwa", "ad lead", "click to whatsapp"],
  buildDraft: () => ({
    runAt: nowIso(),
    sections: [
      section("did", "What I tracked", [
        { label: "Identified conversations originating from WhatsApp ad clicks" },
        { label: "Scored each lead on engagement and response speed" },
      ]),
      section(
        "attention",
        "High-intent ad leads",
        [],
        table(
          ["Lead", "Source", "Signal", ""],
          [
            {
              cells: [
                "Neha S.",
                "Summer sale · 45m ago",
                "Clicked ad, asked 3 questions, shared budget",
              ],
              cta: cta("send-bulk-message", "Send offer link"),
            },
            {
              note: true,
              cells: ["32 leads from ‘Book Now’ ad — responded within 1 min"],
              cta: cta("create-segment", "Save as hot leads"),
            },
            {
              note: true,
              cells: ["61 leads went cold after first message"],
              cta: cta("send-campaign", "Re-engage cold leads"),
            },
          ],
        ),
      ),
    ],
    ctas: [
      cta("create-segment", "Save high-intent ad leads"),
      cta("send-campaign", "Launch lead nurture sequence"),
    ],
  }),
};

const OPS_MISCLASSIFICATION: WatcherTypeDef = {
  id: "ops-misclassification",
  label: "Internal / ops messages",
  defaultName: "Ops Filter Agent",
  blurb: "Detect internal or ops messages landing in the customer queue.",
  keywords: ["internal", "ops", "operations", "misclassified", "staff message"],
  buildDraft: () => ({
    runAt: nowIso(),
    sections: [
      section("did", "What I checked", [
        { label: "Scanned all inbound conversations for internal sender patterns" },
        { label: "Found 12 ops or internal messages routed to the customer queue" },
      ]),
      section("attention", "Misrouted messages", [
        {
          label: "4 messages from internal WhatsApp numbers in customer inbox",
          meta: "Sent by ops team members",
          cta: cta("create-inbox-filter", "Exclude internal numbers"),
        },
        {
          label: "8 messages with internal shortcodes or tags",
          meta: "Likely test or broadcast noise",
          cta: cta("create-inbox-filter", "Filter by tag"),
        },
      ]),
    ],
    ctas: [
      cta("create-inbox-filter", "Block internal senders from customer queue"),
      cta("create-segment", "Save misrouted thread list"),
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
  URGENCY,
  RESPONSE_GAP,
  DELIVERY_ISSUE,
  PAID_ACQ,
  OPS_MISCLASSIFICATION,
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
