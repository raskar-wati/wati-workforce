import type {
  FindingColumns,
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

type FindingRowDraft = {
  subject: string;
  finding: string;
  measure?: string;
  source?: string;
  cta?: HandoffCta;
};

/**
 * A findings section (agent-schema.md §3): typed rows in the fixed column
 * roles, headers snapshotted from the type's blueprint. `label`/`meta` are
 * derived so legacy renderers and the achievements filter stay untouched.
 */
function findings(
  title: string,
  columns: FindingColumns,
  rows: FindingRowDraft[],
): HandoffSection {
  return {
    id: uid(),
    kind: "attention",
    title,
    columns,
    items: rows.map((r) => ({
      id: uid(),
      label: `${r.subject} — ${r.finding}`,
      meta: [r.source, r.measure].filter(Boolean).join(" · ") || undefined,
      ...r,
    })),
  };
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
      findings(
        "Hot leads",
        { subject: "Contact", finding: "Signal", measure: "Strength", source: "Source" },
        [
          {
            subject: "Sarah J.",
            finding: "asked about pricing",
            measure: "3× this week",
            source: "WhatsApp · 2h ago",
            cta: cta("send-bulk-message", "Send follow-up"),
          },
          {
            subject: "Mark P.",
            finding: "added items to cart, did not check out",
            source: "Web chat · 4h ago",
            cta: cta("send-bulk-message", "Send nudge"),
          },
          {
            subject: "Priya K.",
            finding: "requested a demo",
            source: "WhatsApp · 1d ago",
            cta: cta("send-bulk-message", "Send demo link"),
          },
        ],
      ),
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
      findings(
        "Top topics",
        { subject: "Topic", finding: "Trend", measure: "Mentions", source: "Window" },
        [
          {
            subject: "Shipping delays",
            finding: "↑ 38% vs last week",
            measure: "412 mentions",
            source: "last 24h",
            cta: cta("create-inbox-filter", "Filter inbox"),
          },
          {
            subject: "Refund requests",
            finding: "↑ 12% vs last week",
            measure: "287 mentions",
            source: "last 24h",
            cta: cta("create-inbox-filter", "Filter inbox"),
          },
          {
            subject: "Product sizing",
            finding: "↓ 4% vs last week",
            measure: "198 mentions",
            source: "last 24h",
            cta: cta("create-inbox-filter", "Filter inbox"),
          },
          {
            subject: "Discount codes",
            finding: "↑ 21% vs last week",
            measure: "164 mentions",
            source: "last 24h",
            cta: cta("create-inbox-filter", "Filter inbox"),
          },
          {
            subject: "Order tracking",
            finding: "↑ 9% vs last week",
            measure: "132 mentions",
            source: "last 24h",
            cta: cta("create-inbox-filter", "Filter inbox"),
          },
        ],
      ),
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
      findings(
        "Spike windows",
        { subject: "Window", finding: "Driver", measure: "vs baseline" },
        [
          {
            subject: "10:00–11:30",
            finding: "product launch traffic",
            measure: "+184%",
            cta: cta("send-bulk-message", "Notify waiting customers"),
          },
          {
            subject: "18:00–19:00",
            finding: "concentrated on shipping queries",
            measure: "+96%",
            cta: cta("create-inbox-filter", "Route to support"),
          },
        ],
      ),
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
      findings(
        "Price-sensitive contacts",
        { subject: "Cohort", finding: "Ask", measure: "Contacts" },
        [
          {
            subject: "Bulk-discount askers",
            finding: "asked about bulk discounts",
            measure: "8 contacts",
            cta: cta("create-segment", "Save as segment"),
          },
          {
            subject: "Competitor-price mentions",
            finding: "mentioned competitor pricing",
            measure: "11 contacts",
            cta: cta("send-bulk-message", "Send counter-offer"),
          },
          {
            subject: "Sale watchers",
            finding: "asked when the next sale is",
            measure: "15 contacts",
            cta: cta("send-campaign", "Tease upcoming sale"),
          },
        ],
      ),
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
      findings(
        "Negative sentiment",
        { subject: "Cohort", finding: "Signal", measure: "Contacts", source: "Driver" },
        [
          {
            subject: "Strongly negative",
            finding: "sentiment slipping",
            measure: "23 contacts",
            source: "shipping and refund issues",
            cta: cta("create-inbox-filter", "Route to recovery"),
          },
          {
            subject: "Escalations",
            finding: "flagged for human review",
            measure: "7 contacts",
            cta: cta("send-bulk-message", "Send apology + credit"),
          },
        ],
      ),
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
      findings(
        "Capacity risk",
        { subject: "Metric", finding: "Event", measure: "Value", source: "Window" },
        [
          {
            subject: "Queue depth",
            finding: "peaked at 2.4× normal",
            measure: "142",
            source: "14:00–15:30",
            cta: cta("create-inbox-filter", "Auto-triage by topic"),
          },
          {
            subject: "Avg response time",
            finding: "slipped past the 3m SLA target",
            measure: "8m 12s",
            cta: cta("send-bulk-message", "Send holding message"),
          },
        ],
      ),
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
      findings(
        "Urgent requests",
        { subject: "Contact", finding: "Request", measure: "Due", source: "Source" },
        [
          {
            subject: "Riya M.",
            finding: "'need this by Friday, can you confirm?'",
            measure: "by Friday",
            source: "WhatsApp · 1h ago",
            cta: cta("send-bulk-message", "Send priority reply"),
          },
          {
            subject: "Carlos T.",
            finding: "'booking for this weekend, is it available?'",
            measure: "this weekend",
            source: "WhatsApp · 3h ago",
            cta: cta("send-bulk-message", "Confirm availability"),
          },
          {
            subject: "14 more contacts",
            finding: "same-week intent, grouped by urgency score",
            measure: "same-week",
            cta: cta("create-segment", "Save as urgent segment"),
          },
        ],
      ),
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
      findings(
        "SLA breaches",
        { subject: "Cohort", finding: "Breach", measure: "Wait", source: "Risk" },
        [
          {
            subject: "18 conversations",
            finding: "waiting > 10 min with no reply",
            measure: "avg 23 min",
            cta: cta("create-inbox-filter", "Route to available agents"),
          },
          {
            subject: "5 conversations",
            finding: "waiting > 1 hour",
            measure: "> 1 hour",
            source: "high escalation risk",
            cta: cta("send-bulk-message", "Send holding message"),
          },
        ],
      ),
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
      findings(
        "Complaints by cluster",
        { subject: "Courier", finding: "Issue", measure: "Complaints", source: "Zone" },
        [
          {
            subject: "Blue Dart",
            finding: "avg 2.3 days late",
            measure: "27 complaints",
            source: "Northern zone",
            cta: cta("send-bulk-message", "Send apology + update"),
          },
          {
            subject: "Delhivery",
            finding: "'not delivered' reports",
            measure: "19 complaints",
            source: "Western zone",
            cta: cta("create-segment", "Save affected customers"),
          },
          {
            subject: "Unassigned",
            finding: "no vendor identified",
            measure: "18 complaints",
            cta: cta("create-inbox-filter", "Route to ops team"),
          },
        ],
      ),
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
      findings(
        "High-intent ad leads",
        { subject: "Lead", finding: "Signal", measure: "Count", source: "Campaign" },
        [
          {
            subject: "Neha S.",
            finding: "clicked ad, asked 3 questions, shared budget",
            source: "Summer sale · 45 min ago",
            cta: cta("send-bulk-message", "Send offer link"),
          },
          {
            subject: "'Book Now' ad leads",
            finding: "responded within 1 min — high intent",
            measure: "32 leads",
            cta: cta("create-segment", "Save as hot leads"),
          },
          {
            subject: "Cold leads",
            finding: "went cold after first message",
            measure: "61 leads",
            cta: cta("send-campaign", "Re-engage cold leads"),
          },
        ],
      ),
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
      findings(
        "Misrouted messages",
        { subject: "Cluster", finding: "Issue", measure: "Messages", source: "Origin" },
        [
          {
            subject: "Internal numbers",
            finding: "landed in customer inbox",
            measure: "4 messages",
            source: "ops team members",
            cta: cta("create-inbox-filter", "Exclude internal numbers"),
          },
          {
            subject: "Internal shortcodes/tags",
            finding: "likely test or broadcast noise",
            measure: "8 messages",
            source: "system-generated",
            cta: cta("create-inbox-filter", "Filter by tag"),
          },
        ],
      ),
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
