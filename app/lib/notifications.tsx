"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * App-wide notification store behind the header bell and the island (the
 * header Wati AI bar). Mounted at the root layout so any module can push,
 * and both surfaces can read, from anywhere.
 *
 * Every notification lands in the bell's history. Ones pushed with
 * `island: true` also surface on the island until they're done with:
 * - "blocking" notices (someone must decide) stay until resolved or
 *   dismissed — seeing them doesn't clear them, and dismissing only hides the
 *   notice, it doesn't decide anything.
 * - "info" notices stay until seen (read) or dismissed.
 *
 * The island never knows which module a notice came from. A module registers
 * handlers for its `source`, and the island hands decisions and "open" clicks
 * back through them; the module then resolves the notice from its own state.
 */

export type NoticePriority = "blocking" | "info";
export type NoticeOutcome = "approved" | "rejected" | "expired" | "resolved";
export type NoticeDecision = "approve" | "reject";

export type AppNotification = {
  id: string;
  title: string;
  body?: string;
  at: string;
  read: boolean;
  /** Sending module, e.g. "agents". Keys the registered handlers. */
  source?: string;
  /** Module-defined event kind, e.g. "needs-approval". */
  kind?: string;
  priority?: NoticePriority;
  /** Also surface on the island, not just in the bell. */
  island?: boolean;
  /** Blocking only: label for the inline approve, e.g. "Enable rule". */
  approveLabel?: string;
  /** Blocking only: the decision can't be made inline (e.g. a cost
   *  restatement first) — the island offers Review instead of Approve. */
  reviewToDecide?: boolean;
  /** Set once a blocking notice is decided, wherever that happened. */
  resolved?: NoticeOutcome;
  dismissed?: boolean;
};

export type NoticeInput = Omit<AppNotification, "at" | "read" | "resolved" | "dismissed">;

export type NoticeSourceHandlers = {
  /** Take the user to the thing the notice is about. */
  open: (notice: AppNotification) => void;
  /** Apply an inline approve/reject. */
  decide?: (notice: AppNotification, decision: NoticeDecision) => void;
};

type NotificationsCtx = {
  notifications: AppNotification[];
  unreadCount: number;
  /** What the island shows: unresolved blocking first, then unseen info,
   *  newest first within each. */
  islandNotices: AppNotification[];
  /**
   * Push with a stable id to dedupe — re-pushing a live id is a no-op. A
   * resolved id comes back to life (e.g. a draft that was approved, then
   * undone, needs approval again).
   */
  push: (n: NoticeInput) => void;
  resolve: (id: string, outcome: NoticeOutcome) => void;
  dismiss: (id: string) => void;
  markSeen: (ids: string[]) => void;
  markAllRead: () => void;
  registerSource: (source: string, handlers: NoticeSourceHandlers) => () => void;
  openNotice: (id: string) => void;
  decideNotice: (id: string, decision: NoticeDecision) => void;
};

const Ctx = createContext<NotificationsCtx | null>(null);

const STORAGE_KEY = "wati-notifications";

/** Is this notice still asking for the island's attention? */
export function isNoticeLive(n: AppNotification): boolean {
  if (!n.island || n.resolved) return false;
  if (n.dismissed) return false;
  if (n.priority === "blocking") return true;
  return !n.read;
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const sourcesRef = useRef(new Map<string, NoticeSourceHandlers>());
  const latestRef = useRef(notifications);
  useEffect(() => {
    latestRef.current = notifications;
  }, [notifications]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setNotifications(JSON.parse(raw));
    } catch {
      // Corrupt storage — start clean.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch {
      // Storage full/unavailable — notifications stay session-only.
    }
  }, [notifications, hydrated]);

  const push = useCallback((n: NoticeInput) => {
    setNotifications((prev) => {
      const existing = prev.find((x) => x.id === n.id);
      if (existing && !existing.resolved) return prev;
      const fresh: AppNotification = { ...n, at: new Date().toISOString(), read: false };
      return [fresh, ...prev.filter((x) => x.id !== n.id)];
    });
  }, []);

  const patch = useCallback(
    (ids: ReadonlySet<string>, fn: (n: AppNotification) => AppNotification) => {
      setNotifications((prev) => {
        let changed = false;
        const next = prev.map((n) => {
          if (!ids.has(n.id)) return n;
          const updated = fn(n);
          if (updated !== n) changed = true;
          return updated;
        });
        return changed ? next : prev;
      });
    },
    [],
  );

  const resolve = useCallback(
    (id: string, outcome: NoticeOutcome) =>
      patch(new Set([id]), (n) => (n.resolved === outcome ? n : { ...n, resolved: outcome, read: true })),
    [patch],
  );

  const dismiss = useCallback(
    (id: string) =>
      patch(new Set([id]), (n) => (n.dismissed ? n : { ...n, dismissed: true, read: true })),
    [patch],
  );

  const markSeen = useCallback(
    (ids: string[]) => patch(new Set(ids), (n) => (n.read ? n : { ...n, read: true })),
    [patch],
  );

  const markAllRead = useCallback(() => {
    setNotifications((prev) =>
      prev.some((n) => !n.read) ? prev.map((n) => ({ ...n, read: true })) : prev,
    );
  }, []);

  const registerSource = useCallback(
    (source: string, handlers: NoticeSourceHandlers) => {
      sourcesRef.current.set(source, handlers);
      return () => {
        if (sourcesRef.current.get(source) === handlers) sourcesRef.current.delete(source);
      };
    },
    [],
  );

  const openNotice = useCallback((id: string) => {
    const notice = latestRef.current.find((n) => n.id === id);
    if (!notice?.source) return;
    sourcesRef.current.get(notice.source)?.open(notice);
  }, []);

  const decideNotice = useCallback((id: string, decision: NoticeDecision) => {
    const notice = latestRef.current.find((n) => n.id === id);
    if (!notice?.source || notice.resolved) return;
    sourcesRef.current.get(notice.source)?.decide?.(notice, decision);
  }, []);

  const value = useMemo<NotificationsCtx>(() => {
    const live = notifications.filter(isNoticeLive);
    const rank = (n: AppNotification) => (n.priority === "blocking" ? 0 : 1);
    live.sort((a, b) => rank(a) - rank(b) || (a.at < b.at ? 1 : -1));
    return {
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
      islandNotices: live,
      push,
      resolve,
      dismiss,
      markSeen,
      markAllRead,
      registerSource,
      openNotice,
      decideNotice,
    };
  }, [
    notifications,
    push,
    resolve,
    dismiss,
    markSeen,
    markAllRead,
    registerSource,
    openNotice,
    decideNotice,
  ]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNotifications(): NotificationsCtx {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return ctx;
}
