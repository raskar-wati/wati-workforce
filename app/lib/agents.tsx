"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AchievementId } from "./achievements";
import { getActionScript } from "./agent-actions";
import {
  buildReturningUserReadSet,
  buildReturningUserSeed,
} from "./demo-data";
import { useDemoState, type DemoMode } from "./demo-state";

export type WatcherTypeId =
  | "ready-to-buy"
  | "top-topics"
  | "demand-spike"
  | "price-alert"
  | "sentiment-monitor"
  | "volume-spike"
  | "urgency"
  | "response-gap"
  | "delivery-issue"
  | "paid-acq"
  | "ops-misclassification"
  | "custom";

export type RecurringPreset = "daily" | "weekly" | "every-other-day";

export type AgentSchedule =
  | { kind: "once" }
  | { kind: "recurring"; preset: RecurringPreset }
  | { kind: "custom"; description: string };

export type AgentStatus = "draft" | "active" | "paused";

export type Agent = {
  id: string;
  threadId: string;
  name: string;
  archetype: "watcher";
  watcherType: WatcherTypeId;
  description?: string;
  schedule: AgentSchedule;
  actions: AchievementId[];
  /**
   * Handoff CTAs whose action the agent should fire automatically on every
   * future run. Driven by the "Always do this" toggle on an action-run result.
   */
  autoActions: HandoffCtaAction[];
  avatarSeed: string;
  status: AgentStatus;
  createdAt: string;
};

export type HandoffCtaAction =
  | "create-segment"
  | "send-campaign"
  | "send-bulk-message"
  | "create-inbox-filter";

export type HandoffCta = {
  id: string;
  action: HandoffCtaAction;
  label: string;
  payload?: Record<string, unknown>;
};

export type HandoffItem = {
  id: string;
  label: string;
  meta?: string;
  cta?: HandoffCta;
};

export type HandoffSectionKind = "did" | "attention" | "summary";

export type HandoffSection = {
  id: string;
  kind: HandoffSectionKind;
  title: string;
  items: HandoffItem[];
};

export type Handoff = {
  id: string;
  agentId: string;
  runAt: string;
  runNumber: number;
  sections: HandoffSection[];
  ctas: HandoffCta[];
};

export type AgentActionRunStatus = "running" | "done";

export type AgentActionRun = {
  id: string;
  agentId: string;
  handoffId: string;
  ctaId: string;
  action: HandoffCtaAction;
  /** Title for the running phase, e.g. "Creating segments by topic". */
  runTitle: string;
  /** Status-indicator lines cycled while running. */
  steps: string[];
  /** Headline of the result card. */
  resultLabel: string;
  /** Where the user can find it in Wati. */
  resultDestination: string;
  /** Label of the (non-clickable) view CTA on the result card. */
  resultCtaLabel: string;
  status: AgentActionRunStatus;
  startedAt: string;
  completedAt?: string;
};

type AgentDraft = Omit<Agent, "id" | "createdAt" | "status" | "autoActions"> & {
  status?: AgentStatus;
  autoActions?: HandoffCtaAction[];
};

type HandoffDraft = Omit<Handoff, "id" | "agentId" | "runNumber">;

type ActionRunDraft = {
  agentId: string;
  handoffId: string;
  ctaId: string;
  action: HandoffCtaAction;
  runTitle: string;
  steps: string[];
  resultLabel: string;
  resultDestination: string;
  resultCtaLabel: string;
};

type AgentsState = {
  agents: Agent[];
  handoffsByAgent: Record<string, Handoff[]>;
  actionRunsByAgent: Record<string, AgentActionRun[]>;
  readHandoffIds: string[];
};

export type HandoffWithAgent = Handoff & { agent: Agent };

type AgentsCtx = AgentsState & {
  createAgent: (draft: AgentDraft) => Agent;
  setAgentStatus: (id: string, status: AgentStatus) => void;
  addHandoff: (agentId: string, draft: HandoffDraft) => Handoff;
  startActionRun: (draft: ActionRunDraft) => AgentActionRun;
  completeActionRun: (runId: string) => void;
  enableAutoAction: (agentId: string, action: HandoffCtaAction) => void;
  markHandoffRead: (handoffId: string) => void;
  markHandoffsRead: (handoffIds: string[]) => void;
  markAllHandoffsRead: () => void;
  isHandoffRead: (handoffId: string) => boolean;
  getAgent: (id: string) => Agent | undefined;
  getHandoffs: (agentId: string) => Handoff[];
  getActionRuns: (agentId: string) => AgentActionRun[];
  getAgentsForThread: (threadId: string) => Agent[];
  /** All handoffs across all agents, sorted newest first, joined with their agent. */
  getAllHandoffs: () => HandoffWithAgent[];
  /** Count of handoffs the user hasn't opened yet (across all agents). */
  unreadHandoffCount: number;
  /** Unread count for a single agent. */
  getUnreadCountForAgent: (agentId: string) => number;
};

const STORAGE_KEY_BASE = "wati.agents.v1";

function storageKeyFor(mode: DemoMode): string {
  return `${STORAGE_KEY_BASE}.${mode}`;
}

const EMPTY_STATE: AgentsState = {
  agents: [],
  handoffsByAgent: {},
  actionRunsByAgent: {},
  readHandoffIds: [],
};

/** Build the initial state for a given demo mode. */
function initialStateFor(mode: DemoMode): AgentsState {
  if (mode !== "returning") return EMPTY_STATE;
  const seed = buildReturningUserSeed();
  return {
    agents: seed.agents,
    handoffsByAgent: seed.handoffsByAgent,
    actionRunsByAgent: {},
    readHandoffIds: buildReturningUserReadSet(seed),
  };
}

const AgentsContext = createContext<AgentsCtx | null>(null);

export function useAgents() {
  const ctx = useContext(AgentsContext);
  if (!ctx) throw new Error("useAgents must be used inside AgentsProvider");
  return ctx;
}

function sortByRunAtDesc(handoffs: Handoff[]): Handoff[] {
  return [...handoffs].sort((a, b) => (a.runAt < b.runAt ? 1 : -1));
}

export function AgentsProvider({ children }: { children: ReactNode }) {
  const { mode, hydrated: demoHydrated } = useDemoState();
  const [state, setState] = useState<AgentsState>(EMPTY_STATE);
  /** Bumped on every demo-mode flip so the persistence effect waits for the
   * matching hydration pass before writing back to localStorage. */
  const [hydratedForMode, setHydratedForMode] = useState<DemoMode | null>(null);

  // Re-hydrate from the mode-specific storage key on mount and whenever the
  // demo mode changes. In "returning" mode with no stored data, seed from
  // the demo blueprint.
  useEffect(() => {
    if (!demoHydrated) return;
    const key = storageKeyFor(mode);
    let next: AgentsState | null = null;
    try {
      const raw =
        typeof window !== "undefined"
          ? window.localStorage.getItem(key)
          : null;
      if (raw) {
        const parsed = JSON.parse(raw) as AgentsState;
        if (parsed && Array.isArray(parsed.agents)) {
          next = {
            // Back-fill autoActions for any agents that predate the field.
            agents: parsed.agents.map((a) => ({
              ...a,
              autoActions: a.autoActions ?? [],
            })),
            handoffsByAgent: parsed.handoffsByAgent ?? {},
            actionRunsByAgent: parsed.actionRunsByAgent ?? {},
            readHandoffIds: parsed.readHandoffIds ?? [],
          };
        }
      }
    } catch {
      // ignore corrupted storage
    }
    setState(next ?? initialStateFor(mode));
    setHydratedForMode(mode);
  }, [mode, demoHydrated]);

  useEffect(() => {
    if (hydratedForMode !== mode) return;
    try {
      window.localStorage.setItem(storageKeyFor(mode), JSON.stringify(state));
    } catch {
      // ignore quota / disabled storage
    }
  }, [state, hydratedForMode, mode]);

  const createAgent = useCallback((draft: AgentDraft): Agent => {
    const agent: Agent = {
      ...draft,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      status: draft.status ?? "active",
      autoActions: draft.autoActions ?? [],
    };
    setState((prev) => ({
      ...prev,
      agents: [...prev.agents, agent],
    }));
    return agent;
  }, []);

  const setAgentStatus = useCallback((id: string, status: AgentStatus) => {
    setState((prev) => ({
      ...prev,
      agents: prev.agents.map((a) => (a.id === id ? { ...a, status } : a)),
    }));
  }, []);

  const addHandoff = useCallback(
    (agentId: string, draft: HandoffDraft): Handoff => {
      let created: Handoff | null = null;
      setState((prev) => {
        const agent = prev.agents.find((a) => a.id === agentId);
        const existing = prev.handoffsByAgent[agentId] ?? [];
        const handoff: Handoff = {
          ...draft,
          id: crypto.randomUUID(),
          agentId,
          runNumber: existing.length + 1,
        };
        created = handoff;

        // For each auto-action the agent has opted into, find the first
        // matching footer CTA in this handoff and spawn an action run.
        const autoRuns: AgentActionRun[] = [];
        const auto = agent?.autoActions ?? [];
        for (const action of auto) {
          const cta = handoff.ctas.find((c) => c.action === action);
          if (!cta) continue;
          const script = getActionScript(action);
          autoRuns.push({
            id: crypto.randomUUID(),
            agentId,
            handoffId: handoff.id,
            ctaId: cta.id,
            action,
            runTitle: script.runTitle,
            steps: [...script.steps],
            resultLabel: script.resultLabel,
            resultDestination: script.resultDestination,
            resultCtaLabel: script.resultCtaLabel,
            status: "running",
            startedAt: new Date().toISOString(),
          });
        }

        const prevRuns = prev.actionRunsByAgent[agentId] ?? [];
        return {
          ...prev,
          handoffsByAgent: {
            ...prev.handoffsByAgent,
            [agentId]: sortByRunAtDesc([handoff, ...existing]),
          },
          actionRunsByAgent:
            autoRuns.length > 0
              ? {
                  ...prev.actionRunsByAgent,
                  [agentId]: [...prevRuns, ...autoRuns],
                }
              : prev.actionRunsByAgent,
        };
      });
      // setState batches; created is assigned synchronously inside the updater
      return created!;
    },
    [],
  );

  const enableAutoAction = useCallback(
    (agentId: string, action: HandoffCtaAction) => {
      setState((prev) => ({
        ...prev,
        agents: prev.agents.map((a) => {
          if (a.id !== agentId) return a;
          if (a.autoActions.includes(action)) return a;
          return { ...a, autoActions: [...a.autoActions, action] };
        }),
      }));
    },
    [],
  );

  const startActionRun = useCallback(
    (draft: ActionRunDraft): AgentActionRun => {
      const run: AgentActionRun = {
        ...draft,
        id: crypto.randomUUID(),
        status: "running",
        startedAt: new Date().toISOString(),
      };
      setState((prev) => {
        const existing = prev.actionRunsByAgent[draft.agentId] ?? [];
        return {
          ...prev,
          actionRunsByAgent: {
            ...prev.actionRunsByAgent,
            [draft.agentId]: [...existing, run],
          },
        };
      });
      return run;
    },
    [],
  );

  const completeActionRun = useCallback((runId: string) => {
    setState((prev) => {
      const next: Record<string, AgentActionRun[]> = {};
      for (const [agentId, runs] of Object.entries(prev.actionRunsByAgent)) {
        next[agentId] = runs.map((r) =>
          r.id === runId
            ? { ...r, status: "done", completedAt: new Date().toISOString() }
            : r,
        );
      }
      return { ...prev, actionRunsByAgent: next };
    });
  }, []);

  const markHandoffRead = useCallback((handoffId: string) => {
    setState((prev) => {
      if (prev.readHandoffIds.includes(handoffId)) return prev;
      return { ...prev, readHandoffIds: [...prev.readHandoffIds, handoffId] };
    });
  }, []);

  const markHandoffsRead = useCallback((handoffIds: string[]) => {
    if (handoffIds.length === 0) return;
    setState((prev) => {
      const set = new Set(prev.readHandoffIds);
      let changed = false;
      for (const id of handoffIds) {
        if (!set.has(id)) {
          set.add(id);
          changed = true;
        }
      }
      if (!changed) return prev;
      return { ...prev, readHandoffIds: Array.from(set) };
    });
  }, []);

  const markAllHandoffsRead = useCallback(() => {
    setState((prev) => {
      const allIds = Object.values(prev.handoffsByAgent)
        .flat()
        .map((h) => h.id);
      const set = new Set([...prev.readHandoffIds, ...allIds]);
      return { ...prev, readHandoffIds: Array.from(set) };
    });
  }, []);

  const value = useMemo<AgentsCtx>(() => {
    const readSet = new Set(state.readHandoffIds);
    const agentById = new Map(state.agents.map((a) => [a.id, a]));

    const allHandoffs: HandoffWithAgent[] = [];
    for (const [agentId, list] of Object.entries(state.handoffsByAgent)) {
      const agent = agentById.get(agentId);
      if (!agent) continue;
      for (const h of list) allHandoffs.push({ ...h, agent });
    }
    allHandoffs.sort((a, b) => (a.runAt < b.runAt ? 1 : -1));

    const unreadHandoffCount = allHandoffs.reduce(
      (n, h) => (readSet.has(h.id) ? n : n + 1),
      0,
    );

    return {
      agents: state.agents,
      handoffsByAgent: state.handoffsByAgent,
      actionRunsByAgent: state.actionRunsByAgent,
      readHandoffIds: state.readHandoffIds,
      createAgent,
      setAgentStatus,
      addHandoff,
      startActionRun,
      completeActionRun,
      enableAutoAction,
      markHandoffRead,
      markHandoffsRead,
      markAllHandoffsRead,
      isHandoffRead: (id) => readSet.has(id),
      getAgent: (id) => agentById.get(id),
      getHandoffs: (agentId) => state.handoffsByAgent[agentId] ?? [],
      getActionRuns: (agentId) => state.actionRunsByAgent[agentId] ?? [],
      getAgentsForThread: (threadId) =>
        state.agents.filter((a) => a.threadId === threadId),
      getAllHandoffs: () => allHandoffs,
      unreadHandoffCount,
      getUnreadCountForAgent: (agentId) =>
        (state.handoffsByAgent[agentId] ?? []).reduce(
          (n, h) => (readSet.has(h.id) ? n : n + 1),
          0,
        ),
    };
  }, [
    state,
    createAgent,
    setAgentStatus,
    addHandoff,
    startActionRun,
    completeActionRun,
    enableAutoAction,
    markHandoffRead,
    markHandoffsRead,
    markAllHandoffsRead,
  ]);

  return (
    <AgentsContext.Provider value={value}>{children}</AgentsContext.Provider>
  );
}
