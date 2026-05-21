"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type Thread = {
  id: string;
  title: string;
};

type ChatThreadsCtx = {
  threads: Thread[];
  activeThreadId: string | null;
  setActiveThreadId: (id: string | null) => void;
  createThread: (firstMessage: string) => string;
};

const ChatThreadsContext = createContext<ChatThreadsCtx | null>(null);

export function useChatThreads() {
  const ctx = useContext(ChatThreadsContext);
  if (!ctx) throw new Error("useChatThreads must be used inside ChatThreadsProvider");
  return ctx;
}

export function ChatThreadsProvider({ children }: { children: ReactNode }) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  const createThread = (firstMessage: string): string => {
    const id = crypto.randomUUID();
    const title =
      firstMessage.length > 30
        ? firstMessage.slice(0, 29) + "…"
        : firstMessage;
    setThreads((prev) => [{ id, title }, ...prev]);
    setActiveThreadId(id);
    return id;
  };

  return (
    <ChatThreadsContext.Provider
      value={{ threads, activeThreadId, setActiveThreadId, createThread }}
    >
      {children}
    </ChatThreadsContext.Provider>
  );
}
