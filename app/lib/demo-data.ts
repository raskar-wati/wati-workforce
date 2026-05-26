import type { Agent, Handoff, WatcherTypeId } from "./agents";
import type { Thread } from "./chat-threads";
import { getPixabotByIndex } from "./pixabots";
import { getWatcherType } from "./watcher-types";

export type DemoSeed = {
  agents: Agent[];
  handoffsByAgent: Record<string, Handoff[]>;
  threads: Thread[];
  /** Handoff ids to leave UNREAD on first seed — so the sidebar count is non-zero. */
  unreadHandoffIds: string[];
};

/**
 * A blueprint for one demo agent + its run history. `offsetsHours` controls
 * how far back each run sits relative to "now" — the seed builder converts
 * these to real ISO timestamps when seeding so the inbox feels current.
 */
type AgentBlueprint = {
  /** Stable id — used so re-seeds don't churn read-state. */
  id: string;
  name: string;
  watcherType: WatcherTypeId;
  avatarIndex: number;
  description: string;
  /** Hour offsets back from now, newest first. */
  offsetsHours: number[];
};

const BLUEPRINTS: readonly AgentBlueprint[] = [
  {
    id: "demo-urgency",
    name: "Urgency Watcher",
    watcherType: "urgency",
    avatarIndex: 3,
    description: "Flags same-week / urgent requests across WhatsApp inbox.",
    offsetsHours: [2, 7, 26, 74],
  },
  {
    id: "demo-ready-to-buy",
    name: "Hot Leads",
    watcherType: "ready-to-buy",
    avatarIndex: 17,
    description: "Surfaces contacts showing strong purchase intent.",
    offsetsHours: [5, 22, 49, 96],
  },
  {
    id: "demo-delivery",
    name: "Delivery Issues",
    watcherType: "delivery-issue",
    avatarIndex: 42,
    description: "Clusters delivery complaints and damaged-order reports.",
    offsetsHours: [9, 52],
  },
  {
    id: "demo-paid-acq",
    name: "WhatsApp Ad Leads",
    watcherType: "paid-acq",
    avatarIndex: 61,
    description: "Tracks new leads arriving from paid WhatsApp campaigns.",
    offsetsHours: [19, 70, 118],
  },
  {
    id: "demo-top-topics",
    name: "Top Topics",
    watcherType: "top-topics",
    avatarIndex: 88,
    description: "Discovers emerging themes in customer conversations.",
    offsetsHours: [11, 58, 120],
  },
  {
    id: "demo-response-gap",
    name: "Response SLA",
    watcherType: "response-gap",
    avatarIndex: 109,
    description: "Pings when chats wait too long for a human reply.",
    offsetsHours: [3],
  },
];

/** How many of the newest handoffs to leave unread on first seed. */
const UNREAD_NEWEST = 5;

/**
 * Build a complete seed payload for the returning-user demo state.
 * Generates real ISO timestamps relative to `now` so the inbox always looks
 * fresh. IDs are deterministic — re-seeds against the same blueprint produce
 * the same ids, so previously persisted read-state survives a re-seed.
 */
export function buildReturningUserSeed(now: Date = new Date()): DemoSeed {
  const agents: Agent[] = [];
  const handoffsByAgent: Record<string, Handoff[]> = {};
  const threads: Thread[] = [];
  const allHandoffsSorted: Array<{ id: string; runAt: string }> = [];

  for (const bp of BLUEPRINTS) {
    const threadId = `${bp.id}-thread`;
    const createdAt = new Date(
      now.getTime() - 7 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const agent: Agent = {
      id: bp.id,
      threadId,
      name: bp.name,
      archetype: "watcher",
      watcherType: bp.watcherType,
      description: bp.description,
      schedule: { kind: "recurring", preset: "daily" },
      actions: ["list-customers", "create-segment"],
      autoActions: [],
      avatarSeed: getPixabotByIndex(bp.avatarIndex),
      status: "active",
      createdAt,
    };
    agents.push(agent);
    threads.push({ id: threadId, title: bp.name, agentId: bp.id });

    const wt = getWatcherType(bp.watcherType);
    const handoffs: Handoff[] = bp.offsetsHours.map((offset, i) => {
      const draft = wt.buildDraft();
      const runAt = new Date(
        now.getTime() - offset * 60 * 60 * 1000,
      ).toISOString();
      const id = `${bp.id}-h${i + 1}`;
      const handoff: Handoff = {
        ...draft,
        id,
        agentId: bp.id,
        // runNumber counts from oldest=1, so reverse the index.
        runNumber: bp.offsetsHours.length - i,
        runAt,
      };
      allHandoffsSorted.push({ id, runAt });
      return handoff;
    });
    handoffsByAgent[bp.id] = handoffs;
  }

  // Leave the N newest handoffs unread; mark the rest read so the sidebar
  // count starts small but visible.
  allHandoffsSorted.sort((a, b) => (a.runAt < b.runAt ? 1 : -1));
  const unreadHandoffIds = allHandoffsSorted
    .slice(0, UNREAD_NEWEST)
    .map((h) => h.id);

  return { agents, handoffsByAgent, threads, unreadHandoffIds };
}

/**
 * Computes the "read" set for the returning seed — everything EXCEPT the
 * unread newest. Used to initialize `readHandoffIds` in the agents store.
 */
export function buildReturningUserReadSet(seed: DemoSeed): string[] {
  const unread = new Set(seed.unreadHandoffIds);
  const read: string[] = [];
  for (const list of Object.values(seed.handoffsByAgent)) {
    for (const h of list) if (!unread.has(h.id)) read.push(h.id);
  }
  return read;
}
