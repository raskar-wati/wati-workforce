import type {
  Handoff,
  HandoffCta,
  HandoffSection,
  WatcherTypeId,
} from "./agents";

export type HandoffDraft = Omit<Handoff, "id" | "agentId" | "runNumber">;

/**
 * Free-text match hints — the Role slot's self-description of what user
 * language maps to this type (agent-schema.md §2). Strong hints are specific
 * to the type (weight 2); weak hints are shared vocabulary (weight 1). In
 * production an LLM classifier reads these same hints + blurbs; the roster
 * is the classifier prompt.
 */
export type MatchHints = {
  strong: readonly string[];
  weak: readonly string[];
};

export type WatcherTypeDef = {
  id: WatcherTypeId;
  label: string;
  defaultName: string;
  blurb: string;
  matchHints: MatchHints;
  buildDraft: () => HandoffDraft;
  /**
   * Parked types stay in the codebase but are hidden from every surface
   * (template shelf, free-text matching, suggestions). The PRD's out-of-box
   * roster is exactly seven agents (UI Spec sub-page 6: Daily Digest,
   * Urgency Watcher, Hot Leads, Delivery Issues, WhatsApp Ad Leads,
   * Top Topics, Response SLA); the rest are future candidates for the
   * "Suggested for you" shelf.
   */
  parked?: boolean;
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
  matchHints: {
    strong: ["ready to buy", "ready-to-buy", "buying signal", "purchase intent", "hot lead", "abandoned cart", "ready to purchase"],
    weak: ["buy", "purchase", "lead", "intent", "convert", "demo", "pricing"],
  },
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
      cta("create-quick-reply", "Save follow-up as quick reply"),
    ],
  }),
};

const TOP_TOPICS: WatcherTypeDef = {
  id: "top-topics",
  label: "Find top topics",
  defaultName: "Top topics Agent",
  blurb: "See what customers are talking about most.",
  matchHints: {
    strong: ["top topic", "top topics", "talking about", "most discussed", "common question", "trending topic"],
    weak: ["topic", "trending", "popular", "discussion", "theme", "themes"],
  },
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
      cta("create-chatbot", "Draft FAQ bot for top topic"),
    ],
  }),
};

const DEMAND_SPIKE: WatcherTypeDef = {
  id: "demand-spike",
  parked: true,
  label: "Demand spike",
  defaultName: "Demand Spike Agent",
  blurb: "Get alerts when inbound demand surges.",
  matchHints: {
    strong: ["demand spike", "spike in demand", "demand surge"],
    weak: ["demand", "surge", "rush", "inbound"],
  },
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
      cta("create-keyword-reply", "Auto-reply to launch questions"),
    ],
  }),
};

const PRICE_ALERT: WatcherTypeDef = {
  id: "price-alert",
  parked: true,
  label: "Price alert",
  defaultName: "Price Alert Agent",
  blurb: "Detect price-sensitive customer chatter.",
  matchHints: {
    strong: ["price alert", "price sensitive", "competitor pricing"],
    weak: ["price", "discount", "deal", "cost", "expensive", "cheap"],
  },
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
      cta("create-template", "Draft discount template"),
    ],
  }),
};

const SENTIMENT_MONITOR: WatcherTypeDef = {
  id: "sentiment-monitor",
  parked: true,
  label: "Sentiment monitor",
  defaultName: "Sentiment Agent",
  blurb: "Track customer sentiment across conversations.",
  matchHints: {
    strong: ["sentiment", "negative sentiment", "customer mood"],
    weak: ["mood", "satisfaction", "happy", "angry", "upset", "frustrated"],
  },
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
      cta("assign-team", "Route escalations to recovery team"),
    ],
  }),
};

const VOLUME_SPIKE: WatcherTypeDef = {
  id: "volume-spike",
  parked: true,
  label: "Volume spike",
  defaultName: "Volume Agent",
  blurb: "Catch surges in message volume and capacity risk.",
  matchHints: {
    strong: ["volume spike", "spike in volume", "capacity risk"],
    weak: ["volume", "load", "capacity", "queue", "backlog"],
  },
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
      cta("set-default-reply", "Set delay auto-reply"),
    ],
  }),
};

const URGENCY: WatcherTypeDef = {
  id: "urgency",
  label: "Urgent / same-week requests",
  defaultName: "Urgency Agent",
  blurb: "Surface customers with time-sensitive or same-week requests.",
  matchHints: {
    strong: ["urgent", "urgency", "same-week", "same week", "last-minute", "time-sensitive", "by friday", "this weekend"],
    weak: ["prioritize", "priority", "deadline", "asap"],
  },
  buildDraft: () => ({
    runAt: nowIso(),
    sections: [
      section("did", "What I scanned", [
        { label: "Reviewed 1,842 conversations from the last 24h" },
        { label: "Flagged 31 contacts with same-week or urgent language" },
      ]),
      section("attention", "Urgent requests", [
        {
          label: "Riya M. — 'need this by Friday, can you confirm?'",
          meta: "WhatsApp · 1h ago",
          cta: cta("send-bulk-message", "Send priority reply"),
        },
        {
          label: "Carlos T. — 'booking for this weekend, is it available?'",
          meta: "WhatsApp · 3h ago",
          cta: cta("send-bulk-message", "Confirm availability"),
        },
        {
          label: "14 more contacts with same-week intent",
          meta: "Grouped by urgency score",
          cta: cta("create-segment", "Save as urgent segment"),
        },
      ]),
    ],
    ctas: [
      cta("create-segment", "Save urgent cohort"),
      cta("create-inbox-filter", "Route urgent to priority queue"),
      cta("assign-team", "Route to priority team"),
    ],
  }),
};

const RESPONSE_GAP: WatcherTypeDef = {
  id: "response-gap",
  label: "Response gap / SLA breach",
  defaultName: "SLA Agent",
  blurb: "Flag conversations where customers are waiting past SLA.",
  matchHints: {
    strong: ["sla", "response gap", "response time", "no reply", "unanswered", "waiting for a reply", "first reply"],
    weak: ["waiting", "slow", "late reply", "breach"],
  },
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
      cta("add-note", "Add context notes for pickup"),
    ],
  }),
};

const DELIVERY_ISSUE: WatcherTypeDef = {
  id: "delivery-issue",
  label: "Delivery complaints",
  defaultName: "Delivery Agent",
  blurb: "Group delivery complaints by route or vendor and surface affected customers.",
  matchHints: {
    strong: ["delivery", "shipping", "courier", "shipment", "not delivered", "late order"],
    weak: ["dispatch", "complaint", "delayed"],
  },
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
      cta("create-template", "Draft delay-update template"),
    ],
  }),
};

const PAID_ACQ: WatcherTypeDef = {
  id: "paid-acq",
  label: "Paid acquisition leads",
  defaultName: "Paid Leads Agent",
  blurb: "Track WhatsApp ad leads and surface high-intent ones.",
  matchHints: {
    strong: ["paid acquisition", "whatsapp ad", "whatsapp ads", "ctwa", "ad lead", "ad leads", "click to whatsapp"],
    weak: ["ads", "campaign leads", "ad clicks"],
  },
  buildDraft: () => ({
    runAt: nowIso(),
    sections: [
      section("did", "What I tracked", [
        { label: "Identified conversations originating from WhatsApp ad clicks" },
        { label: "Scored each lead on engagement and response speed" },
      ]),
      section("attention", "High-intent ad leads", [
        {
          label: "Neha S. — clicked ad, asked 3 questions, shared budget",
          meta: "Summer sale campaign · 45 min ago",
          cta: cta("send-bulk-message", "Send offer link"),
        },
        {
          label: "32 leads from 'Book Now' ad — responded within 1 min",
          meta: "High intent cohort",
          cta: cta("create-segment", "Save as hot leads"),
        },
        {
          label: "61 leads went cold after first message",
          meta: "Need re-engagement",
          cta: cta("send-campaign", "Re-engage cold leads"),
        },
      ]),
    ],
    ctas: [
      cta("create-segment", "Save high-intent ad leads"),
      cta("send-campaign", "Launch lead nurture sequence"),
      cta("create-chatbot", "Draft lead-qualification bot"),
    ],
  }),
};

const OPS_MISCLASSIFICATION: WatcherTypeDef = {
  id: "ops-misclassification",
  parked: true,
  label: "Internal / ops messages",
  defaultName: "Ops Filter Agent",
  blurb: "Detect internal or ops messages landing in the customer queue.",
  matchHints: {
    strong: ["internal message", "ops message", "misclassified", "staff message"],
    weak: ["internal", "ops", "operations"],
  },
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
      cta("create-automation-rule", "Auto-route internal senders"),
    ],
  }),
};

/**
 * Retired (agent-schema.md §2): free text that matched nothing used to become
 * a hollow custom agent with no real watch logic. The matching ladder's
 * no-match state replaced this path. The id stays resolvable so persisted
 * agents keep working, but no surface creates a new one.
 */
const CUSTOM: WatcherTypeDef = {
  id: "custom",
  parked: true,
  label: "Other",
  defaultName: "Custom Agent",
  blurb: "Describe what this agent should watch for.",
  matchHints: { strong: [], weak: [] },
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

/** The offerable roster — the PRD's out-of-box watcher types. */
export const ACTIVE_WATCHER_TYPES: readonly WatcherTypeDef[] =
  WATCHER_TYPES.filter((w) => !w.parked);

export function getWatcherType(id: WatcherTypeId): WatcherTypeDef {
  const found = WATCHER_TYPES.find((w) => w.id === id);
  if (!found) throw new Error(`Unknown watcher type: ${id}`);
  return found;
}

/* ------------------------------------------------ free-text matching ladder
 * agent-schema.md §2: free-typed instructions are scored against the roster's
 * match hints and land on one of three rungs. The contract ({typeId, score}[]
 * → tier) is engine-agnostic: production swaps the keyword scorer for an LLM
 * classifier that reads the same hints + blurbs.
 */

export type WatcherMatch = { typeId: WatcherTypeId; score: number };

const STRONG_WEIGHT = 2;
const WEAK_WEIGHT = 1;

export function rankWatcherMatches(message: string): WatcherMatch[] {
  const lower = message.toLowerCase();
  return ACTIVE_WATCHER_TYPES.map((w) => {
    const strong = w.matchHints.strong.filter((k) => lower.includes(k)).length;
    const weak = w.matchHints.weak.filter((k) => lower.includes(k)).length;
    return { typeId: w.id, score: strong * STRONG_WEIGHT + weak * WEAK_WEIGHT };
  })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score);
}

export type MatchTier =
  | { tier: "confident"; typeId: WatcherTypeId }
  | { tier: "ambiguous"; typeIds: WatcherTypeId[] }
  | { tier: "none" };

/**
 * Confident needs a strong-hint-level score AND a clear margin over the
 * runner-up; anything scored but unclear disambiguates; silence denies.
 */
export function resolveMatchTier(matches: WatcherMatch[]): MatchTier {
  if (matches.length === 0) return { tier: "none" };
  const [top, second] = matches;
  if (top.score >= STRONG_WEIGHT && (!second || top.score >= second.score * 2)) {
    return { tier: "confident", typeId: top.typeId };
  }
  return { tier: "ambiguous", typeIds: matches.slice(0, 3).map((m) => m.typeId) };
}
