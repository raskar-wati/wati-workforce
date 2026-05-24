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

export type WatcherTypeId =
  | "ready-to-buy"
  | "top-topics"
  | "demand-spike"
  | "price-alert"
  | "sentiment-monitor"
  | "volume-spike"
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

type AgentDraft = Omit<Agent, "id" | "createdAt" | "status"> & {
  status?: AgentStatus;
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
};

type AgentsCtx = AgentsState & {
  createAgent: (draft: AgentDraft) => Agent;
  setAgentStatus: (id: string, status: AgentStatus) => void;
  addHandoff: (agentId: string, draft: HandoffDraft) => Handoff;
  startActionRun: (draft: ActionRunDraft) => AgentActionRun;
  completeActionRun: (runId: string) => void;
  getAgent: (id: string) => Agent | undefined;
  getHandoffs: (agentId: string) => Handoff[];
  getActionRuns: (agentId: string) => AgentActionRun[];
  getAgentsForThread: (threadId: string) => Agent[];
};

const STORAGE_KEY = "wati.agents.v1";

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
  const [state, setState] = useState<AgentsState>({
    agents: [],
    handoffsByAgent: {},
    actionRunsByAgent: {},
  });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw =
        typeof window !== "undefined"
          ? window.localStorage.getItem(STORAGE_KEY)
          : null;
      if (raw) {
        const parsed = JSON.parse(raw) as AgentsState;
        if (parsed && Array.isArray(parsed.agents)) {
          setState({
            agents: parsed.agents,
            handoffsByAgent: parsed.handoffsByAgent ?? {},
            actionRunsByAgent: parsed.actionRunsByAgent ?? {},
          });
        }
      }
    } catch {
      // ignore corrupted storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota / disabled storage
    }
  }, [state, hydrated]);

  const createAgent = useCallback((draft: AgentDraft): Agent => {
    const agent: Agent = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      status: draft.status ?? "active",
      ...draft,
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
        const existing = prev.handoffsByAgent[agentId] ?? [];
        const handoff: Handoff = {
          ...draft,
          id: crypto.randomUUID(),
          agentId,
          runNumber: existing.length + 1,
        };
        created = handoff;
        return {
          ...prev,
          handoffsByAgent: {
            ...prev.handoffsByAgent,
            [agentId]: sortByRunAtDesc([handoff, ...existing]),
          },
        };
      });
      // setState batches; created is assigned synchronously inside the updater
      return created!;
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

  const value = useMemo<AgentsCtx>(
    () => ({
      agents: state.agents,
      handoffsByAgent: state.handoffsByAgent,
      actionRunsByAgent: state.actionRunsByAgent,
      createAgent,
      setAgentStatus,
      addHandoff,
      startActionRun,
      completeActionRun,
      getAgent: (id) => state.agents.find((a) => a.id === id),
      getHandoffs: (agentId) => state.handoffsByAgent[agentId] ?? [],
      getActionRuns: (agentId) => state.actionRunsByAgent[agentId] ?? [],
      getAgentsForThread: (threadId) =>
        state.agents.filter((a) => a.threadId === threadId),
    }),
    [state, createAgent, setAgentStatus, addHandoff, startActionRun, completeActionRun],
  );

  return (
    <AgentsContext.Provider value={value}>{children}</AgentsContext.Provider>
  );
}
