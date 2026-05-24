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

const STORAGE_KEY = "wati.chat-threads.v1";

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
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw =
        typeof window !== "undefined"
          ? window.localStorage.getItem(STORAGE_KEY)
          : null;
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedState;
        if (parsed && Array.isArray(parsed.threads)) {
          setThreads(parsed.threads);
        }
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ threads } satisfies PersistedState),
      );
    } catch {
      // ignore
    }
  }, [threads, hydrated]);

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
