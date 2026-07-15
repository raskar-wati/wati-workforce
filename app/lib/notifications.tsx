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

/**
 * App-wide notification store behind the global header bell. Mounted at the
 * root layout so deep surfaces (e.g. the agents store resolving a Meta
 * review) can push, and the header bell can read, from anywhere.
 */

export type AppNotification = {
  id: string;
  title: string;
  body?: string;
  at: string;
  read: boolean;
};

type NotificationsCtx = {
  notifications: AppNotification[];
  unreadCount: number;
  /** Push with a stable id to dedupe — re-pushing an existing id is a no-op. */
  push: (n: { id: string; title: string; body?: string }) => void;
  markAllRead: () => void;
};

const Ctx = createContext<NotificationsCtx | null>(null);

const STORAGE_KEY = "wati-notifications";

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setNotifications(JSON.parse(raw));
    } catch {
      // Corrupt storage — start clean.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch {
      // Storage full/unavailable — notifications stay session-only.
    }
  }, [notifications]);

  const push = useCallback(
    (n: { id: string; title: string; body?: string }) => {
      setNotifications((prev) => {
        if (prev.some((x) => x.id === n.id)) return prev;
        return [
          { ...n, at: new Date().toISOString(), read: false },
          ...prev,
        ];
      });
    },
    [],
  );

  const markAllRead = useCallback(() => {
    setNotifications((prev) =>
      prev.some((n) => !n.read) ? prev.map((n) => ({ ...n, read: true })) : prev,
    );
  }, []);

  const value = useMemo<NotificationsCtx>(
    () => ({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
      push,
      markAllRead,
    }),
    [notifications, push, markAllRead],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNotifications(): NotificationsCtx {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return ctx;
}
