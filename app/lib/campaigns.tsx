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
import type { CampaignPlan } from "./campaigns-data";
import type { TemplateDraft } from "./template-draft";
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
  /** Chat thread it was set up in — where the island's notice goes back to.
   *  None when scheduled straight from the calendar (a toast confirms it). */
  threadId?: string;
};

/** A recommendation's template as edited in chat and saved as a draft,
 *  with the picks it was edited under (which option, audience, time). */
export type SavedCampaignDraft = { plan: CampaignPlan; template: TemplateDraft };

type CampaignsCtx = {
  scheduled: Record<string, ScheduledBroadcast>;
  removed: string[];
  drafts: Record<string, SavedCampaignDraft>;
  schedule: (campaignId: string, broadcast: ScheduledBroadcast) => void;
  remove: (campaignId: string) => void;
  saveDraft: (campaignId: string, draft: SavedCampaignDraft) => void;
  /** A recommendation to reopen on the calendar (after Save as draft in
   *  chat). The Campaigns page opens its preview and clears it. */
  reviewing: string | null;
  openReview: (campaignId: string) => void;
  clearReview: () => void;
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
  const [drafts, setDrafts] = useState<Record<string, SavedCampaignDraft>>({});
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const { push, registerSource } = useNotifications();
  const { openThread } = useAskWatiDrawer();

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as {
          scheduled?: CampaignsCtx["scheduled"];
          removed?: string[];
          drafts?: CampaignsCtx["drafts"];
        };
        setScheduled(saved.scheduled ?? {});
        setRemoved(saved.removed ?? []);
        setDrafts(saved.drafts ?? {});
      }
    } catch {
      // Corrupt storage — start clean.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ scheduled, removed, drafts }));
    } catch {
      // Storage unavailable — session-only.
    }
  }, [scheduled, removed, drafts, hydrated]);

  useEffect(
    () =>
      registerSource("campaigns", {
        open: (notice) => {
          const id = notice.id.split(":").pop() ?? "";
          const b = scheduled[id];
          if (b?.threadId) openThread(b.threadId);
        },
      }),
    [registerSource, scheduled, openThread],
  );

  const schedule = useCallback(
    (campaignId: string, broadcast: ScheduledBroadcast) => {
      setScheduled((prev) => ({ ...prev, [campaignId]: broadcast }));
      setRemoved((prev) => prev.filter((id) => id !== campaignId));
      // Set up in chat, the island confirms it; from the calendar, a toast does.
      if (!broadcast.threadId) return;
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

  const saveDraft = useCallback((campaignId: string, draft: SavedCampaignDraft) => {
    setDrafts((prev) => ({ ...prev, [campaignId]: draft }));
  }, []);
  const openReview = useCallback((campaignId: string) => setReviewing(campaignId), []);
  const clearReview = useCallback(() => setReviewing(null), []);

  const value = useMemo(
    () => ({ scheduled, removed, drafts, schedule, remove, saveDraft, reviewing, openReview, clearReview }),
    [scheduled, removed, drafts, schedule, remove, saveDraft, reviewing, openReview, clearReview],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCampaigns(): CampaignsCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCampaigns must be used inside CampaignsProvider");
  return ctx;
}
