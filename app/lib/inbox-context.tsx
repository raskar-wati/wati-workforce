"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * Inbox-scoped context that surfaces queue-level stats to Ask Wati when
 * it's opened inside an inbox surface. When this context is absent (e.g.
 * on the main app shell where Ask Wati lives in the global drawer), the
 * hook returns null and consumers fall back to their non-inbox behavior.
 */

export type InboxStats = {
  /** Number of active chats currently in the queue. */
  activeChats: number;
  /** Chats currently breaching SLA. */
  overSla: number;
  /** Unread chats. */
  unread: number;
  /** Age in hours of the oldest open chat. */
  oldestOpenHours: number;
};

type InboxContextValue = {
  stats: InboxStats;
};

const Ctx = createContext<InboxContextValue | null>(null);

export function InboxContextProvider({
  stats,
  children,
}: {
  stats: InboxStats;
  children: ReactNode;
}) {
  return <Ctx.Provider value={{ stats }}>{children}</Ctx.Provider>;
}

/**
 * Returns the inbox context if Ask Wati is mounted inside an inbox surface,
 * or `null` otherwise. Callers must handle the null case.
 */
export function useInboxContext(): InboxContextValue | null {
  return useContext(Ctx);
}
