/**
 * Static synthetic data for the pinned Daily Digest agent.
 *
 * Numbers are stable across sessions so the demo reads the same way
 * each time. Each entry in DAILY_DIGEST_ENTRIES represents a past run
 * — newest first, mirroring how watcher handoffs are listed.
 */

export const DAILY_DIGEST_THREAD_TITLE = "Daily Digest";

export type DigestMetric = {
  id: string;
  label: string;
  value: string;
  delta?: { value: string; direction: "up" | "down" };
  /** Secondary fragment shown after the value, e.g. "across 12 bookings". */
  qualifier?: string;
};

export type DigestPerformer = {
  name: string;
  value: string;
};

export type DigestAgentLine = {
  /** Must match an existing agent's `name` so "View agent" can route to it. */
  agent: string;
  /** What the agent did + what needs attention, single line. */
  detail: string;
};

export type DailyDigestData = {
  date: string;
  metrics: DigestMetric[];
  topPerformers: DigestPerformer[];
  agentActivity: DigestAgentLine[];
};

export type DailyDigestEntry = {
  id: string;
  runNumber: number;
  /** Display date for the row header, e.g. "5 Jun · 8:47". */
  runAt: string;
  data: DailyDigestData;
};

const BASE_METRICS: DigestMetric[] = [
  {
    id: "closed",
    label: "Closed yesterday",
    value: "$48,200",
    qualifier: "across 12 bookings",
    delta: { value: "14%", direction: "up" },
  },
  {
    id: "pipeline",
    label: "Pipeline today",
    value: "$124,800",
    qualifier: "across 38 hot leads",
    delta: { value: "9%", direction: "up" },
  },
  {
    id: "conversations",
    label: "Conversations",
    value: "1,247",
    qualifier: "avg response 4m 12s",
    delta: { value: "8%", direction: "up" },
  },
];

const BASE_PERFORMERS: DigestPerformer[] = [
  { name: "Ananya R.", value: "$14.2k" },
  { name: "Vikram S.", value: "$11.8k" },
  { name: "Priya M.", value: "$9.4k" },
];

const BASE_AGENT_ACTIVITY: DigestAgentLine[] = [
  {
    agent: "Urgency Watcher",
    detail: "3 chats flagged · 2 need a follow-up today",
  },
  {
    agent: "Hot Leads",
    detail: "7 new hot leads · 4 with no outreach yet",
  },
  {
    agent: "Delivery Issues",
    detail: "1 complaint · response overdue",
  },
];

function digestForDate(date: string): DailyDigestData {
  return {
    date,
    metrics: BASE_METRICS,
    topPerformers: BASE_PERFORMERS,
    agentActivity: BASE_AGENT_ACTIVITY,
  };
}

export const DAILY_DIGEST_ENTRIES: DailyDigestEntry[] = [
  {
    id: "dd-4",
    runNumber: 4,
    runAt: "5 Jun · 8:47",
    data: digestForDate("Sunday 5 Jun"),
  },
  {
    id: "dd-3",
    runNumber: 3,
    runAt: "4 Jun · 8:47",
    data: digestForDate("Saturday 4 Jun"),
  },
  {
    id: "dd-2",
    runNumber: 2,
    runAt: "3 Jun · 8:47",
    data: digestForDate("Friday 3 Jun"),
  },
  {
    id: "dd-1",
    runNumber: 1,
    runAt: "2 Jun · 8:47",
    data: digestForDate("Thursday 2 Jun"),
  },
];

/** Convenience alias for the most recent entry's data. */
export const DAILY_DIGEST_DATA: DailyDigestData = DAILY_DIGEST_ENTRIES[0].data;
