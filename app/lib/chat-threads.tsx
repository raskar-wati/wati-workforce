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
  /** Epoch ms when the thread was created. Older persisted threads may
   *  be missing this — treat them as "Older" when grouping. */
  createdAt?: number;
  /** Pinned threads surface in a dedicated section above the date groups. */
  pinned?: boolean;
  /** True for analytics-style threads whose replies include charts/tables.
   *  Drives a chart-glyph signifier on the row and routes the thread to
   *  a mock analytics conversation when opened. */
  hasVisuals?: boolean;
};

type ChatThreadsCtx = {
  threads: Thread[];
  activeThreadId: string | null;
  setActiveThreadId: (id: string | null) => void;
  createThread: (firstMessage: string) => string;
  attachAgentToThread: (threadId: string, agentId: string) => void;
  setThreadPinned: (threadId: string, pinned: boolean) => void;
  /** True once threads for the current demo mode have hydrated from storage. */
  hydrated: boolean;
};

const STORAGE_KEY_BASE = "wati.chat-threads.v1";

function storageKeyFor(mode: DemoMode): string {
  return `${STORAGE_KEY_BASE}.${mode}`;
}

function initialThreadsFor(mode: DemoMode): Thread[] {
  if (mode !== "returning") return [];
  return buildReturningUserSeed().threads;
}

/**
 * Stamp `createdAt` on any thread that's missing one. Legacy persisted
 * chats from before timestamps were tracked all bucket to "Older" without
 * this — and that defeats the date grouping. We assume the persisted
 * order is newest-first (matches how `createThread` prepends), so we
 * spread positions across the last few weeks: position 0 is "now", each
 * subsequent position falls ~14h further into the past. That seeds a
 * believable mix of Today / Yesterday / Last 7 days / Last 30 days for
 * a typical session-length list of chats.
 */
function backfillTimestamps(threads: Thread[]): Thread[] {
  const now = Date.now();
  const STAGGER_MS = 14 * 60 * 60 * 1000;
  const stamped = threads.map((t, i) =>
    t.createdAt ? t : { ...t, createdAt: now - i * STAGGER_MS },
  );
  // Ensure one analytics demo thread is present so the chart-glyph
  // signifier and mock visual conversation are discoverable. Only
  // inject if none of the existing chats already carry visuals.
  if (!stamped.some((t) => t.hasVisuals && !t.agentId)) {
    stamped.unshift({
      id: ANALYTICS_DEMO_THREAD_ID,
      title: ANALYTICS_DEMO_THREAD_TITLE,
      hasVisuals: true,
      createdAt: now - 2 * 60 * 60 * 1000,
    });
  }
  return stamped;
}

export const ANALYTICS_DEMO_THREAD_ID = "analytics-demo-thread";
export const ANALYTICS_DEMO_THREAD_TITLE =
  "What is our inbox performance this month";

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
    setThreads(backfillTimestamps(next ?? initialThreadsFor(mode)));
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
    setThreads((prev) => [
      { id, title, createdAt: Date.now(), pinned: false },
      ...prev,
    ]);
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

  const setThreadPinned = useCallback(
    (threadId: string, pinned: boolean) => {
      setThreads((prev) =>
        prev.map((t) => (t.id === threadId ? { ...t, pinned } : t)),
      );
    },
    [],
  );

  const hydrated = hydratedForMode === mode;

  const value = useMemo<ChatThreadsCtx>(
    () => ({
      threads,
      activeThreadId,
      setActiveThreadId,
      createThread,
      attachAgentToThread,
      setThreadPinned,
      hydrated,
    }),
    [
      threads,
      activeThreadId,
      createThread,
      attachAgentToThread,
      setThreadPinned,
      hydrated,
    ],
  );

  return (
    <ChatThreadsContext.Provider value={value}>
      {children}
    </ChatThreadsContext.Provider>
  );
}
