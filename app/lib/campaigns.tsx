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
import { useAskWatiDrawer } from "./ask-wati-drawer";
import { useNotifications } from "./notifications";

/**
 * What the user did with Wati's recommended broadcasts: scheduled (with the
 * set-up they chose) or removed. The calendar reads this; the chat writes it.
 * Lives above both, like the templates store.
 */

export type ScheduledBroadcast = {
  name: string;
  /** YYYY-MM-DD */
  date: string;
  time: string;
  audienceId: string;
  /** Chat thread it was set up in — where the island's notice goes back to. */
  threadId: string;
};

type CampaignsCtx = {
  scheduled: Record<string, ScheduledBroadcast>;
  removed: string[];
  schedule: (campaignId: string, broadcast: ScheduledBroadcast) => void;
  remove: (campaignId: string) => void;
};

const Ctx = createContext<CampaignsCtx | null>(null);
const STORAGE_KEY = "wati.campaigns.v1";

export function CampaignsProvider({ children }: { children: ReactNode }) {
  const outer = useContext(Ctx);
  if (outer) return <>{children}</>;
  return <CampaignsStore>{children}</CampaignsStore>;
}

function CampaignsStore({ children }: { children: ReactNode }) {
  const [scheduled, setScheduled] = useState<Record<string, ScheduledBroadcast>>({});
  const [removed, setRemoved] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const { push, registerSource } = useNotifications();
  const { openThread } = useAskWatiDrawer();

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { scheduled?: CampaignsCtx["scheduled"]; removed?: string[] };
        setScheduled(saved.scheduled ?? {});
        setRemoved(saved.removed ?? []);
      }
    } catch {
      // Corrupt storage — start clean.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ scheduled, removed }));
    } catch {
      // Storage unavailable — session-only.
    }
  }, [scheduled, removed, hydrated]);

  useEffect(
    () =>
      registerSource("campaigns", {
        open: (notice) => {
          const id = notice.id.split(":").pop() ?? "";
          const b = scheduled[id];
          if (b) openThread(b.threadId);
        },
      }),
    [registerSource, scheduled, openThread],
  );

  const schedule = useCallback(
    (campaignId: string, broadcast: ScheduledBroadcast) => {
      setScheduled((prev) => ({ ...prev, [campaignId]: broadcast }));
      setRemoved((prev) => prev.filter((id) => id !== campaignId));
      push({
        id: `campaigns:scheduled:${campaignId}`,
        source: "campaigns",
        kind: "scheduled",
        priority: "info",
        island: true,
        title: "Campaign scheduled",
        body: `${broadcast.name} · ${broadcast.date} ${broadcast.time}`,
      });
    },
    [push],
  );

  const remove = useCallback((campaignId: string) => {
    setRemoved((prev) => (prev.includes(campaignId) ? prev : [...prev, campaignId]));
    setScheduled((prev) => {
      const { [campaignId]: _gone, ...rest } = prev;
      return rest;
    });
  }, []);

  const value = useMemo(() => ({ scheduled, removed, schedule, remove }), [scheduled, removed, schedule, remove]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCampaigns(): CampaignsCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCampaigns must be used inside CampaignsProvider");
  return ctx;
}
