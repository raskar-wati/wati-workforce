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
import { buildReturningUserSeed } from "./demo-data";
import { useDemoState, type DemoMode } from "./demo-state";

export type Thread = {
  id: string;
  title: string;
  agentId?: string;
};

type ChatThreadsCtx = {
  threads: Thread[];
  activeThreadId: string | null;
  setActiveThreadId: (id: string | null) => void;
  createThread: (firstMessage: string) => string;
  attachAgentToThread: (threadId: string, agentId: string) => void;
};

const STORAGE_KEY_BASE = "wati.chat-threads.v1";

function storageKeyFor(mode: DemoMode): string {
  return `${STORAGE_KEY_BASE}.${mode}`;
}

function initialThreadsFor(mode: DemoMode): Thread[] {
  if (mode !== "returning") return [];
  return buildReturningUserSeed().threads;
}

const ChatThreadsContext = createContext<ChatThreadsCtx | null>(null);

export function useChatThreads() {
  const ctx = useContext(ChatThreadsContext);
  if (!ctx) throw new Error("useChatThreads must be used inside ChatThreadsProvider");
  return ctx;
}

type PersistedState = {
  threads: Thread[];
};

export function ChatThreadsProvider({ children }: { children: ReactNode }) {
  const { mode, hydrated: demoHydrated } = useDemoState();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [hydratedForMode, setHydratedForMode] = useState<DemoMode | null>(null);

  useEffect(() => {
    if (!demoHydrated) return;
    const key = storageKeyFor(mode);
    let next: Thread[] | null = null;
    try {
      const raw =
        typeof window !== "undefined"
          ? window.localStorage.getItem(key)
          : null;
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedState;
        if (parsed && Array.isArray(parsed.threads)) {
          next = parsed.threads;
        }
      }
    } catch {
      // ignore
    }
    setThreads(next ?? initialThreadsFor(mode));
    setActiveThreadId(null);
    setHydratedForMode(mode);
  }, [mode, demoHydrated]);

  useEffect(() => {
    if (hydratedForMode !== mode) return;
    try {
      window.localStorage.setItem(
        storageKeyFor(mode),
        JSON.stringify({ threads } satisfies PersistedState),
      );
    } catch {
      // ignore
    }
  }, [threads, hydratedForMode, mode]);

  const createThread = useCallback((firstMessage: string): string => {
    const id = crypto.randomUUID();
    const title =
      firstMessage.length > 30
        ? firstMessage.slice(0, 29) + "…"
        : firstMessage;
    setThreads((prev) => [{ id, title }, ...prev]);
    setActiveThreadId(id);
    return id;
  }, []);

  const attachAgentToThread = useCallback(
    (threadId: string, agentId: string) => {
      setThreads((prev) =>
        prev.map((t) => (t.id === threadId ? { ...t, agentId } : t)),
      );
    },
    [],
  );

  const value = useMemo<ChatThreadsCtx>(
    () => ({
      threads,
      activeThreadId,
      setActiveThreadId,
      createThread,
      attachAgentToThread,
    }),
    [threads, activeThreadId, createThread, attachAgentToThread],
  );

  return (
    <ChatThreadsContext.Provider value={value}>
      {children}
    </ChatThreadsContext.Provider>
  );
}
