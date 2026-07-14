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

export type DailyDigestStatus = "active" | "paused";

export type DailyDigestSchedulePreset =
  | "daily"
  | "weekly"
  | "every-other-day";

export type DailyDigestMeta = {
  name: string;
  description: string;
  avatarSeed: string;
  instructions: string;
  schedulePreset: DailyDigestSchedulePreset;
  scheduleTime: string;
  model: string;
  status: DailyDigestStatus;
  /** Soft-archived — when true, hide the Daily Digest thread + card. */
  deleted: boolean;
};

const DEFAULT_INSTRUCTIONS = `You are the Daily Digest agent. Every morning at 8 AM, summarize the prior business day for the team.

Cover:
- Yesterday's revenue, bookings, and how they compare to the prior day.
- Pipeline movement (hot leads added, opportunities at risk).
- Conversation volume and average response time.
- The top performers by closed value.

Then, surface a brief Agent Overview for each watcher that ran in the last 24 hours — what it flagged and what still needs attention.

Keep the tone factual and tight; lead with numbers, never with adjectives.`;

const DEFAULT_META: DailyDigestMeta = {
  name: "Daily Digest",
  description: "Yesterday in numbers",
  avatarSeed: "daily-digest",
  instructions: DEFAULT_INSTRUCTIONS,
  schedulePreset: "daily",
  scheduleTime: "08:00",
  model: "gemini-2.5-flash",
  status: "active",
  deleted: false,
};

const STORAGE_KEY = "wati.daily-digest-meta.v1";

type Ctx = DailyDigestMeta & {
  setName: (name: string) => void;
  setInstructions: (instructions: string) => void;
  setStatus: (status: DailyDigestStatus) => void;
  updateMeta: (patch: Partial<DailyDigestMeta>) => void;
  deleteDigest: () => void;
  restoreDigest: () => void;
  resetInstructions: () => void;
};

const DailyDigestMetaContext = createContext<Ctx | null>(null);

export function useDailyDigestMeta() {
  const ctx = useContext(DailyDigestMetaContext);
  if (!ctx)
    throw new Error(
      "useDailyDigestMeta must be used inside DailyDigestMetaProvider",
    );
  return ctx;
}

export function DailyDigestMetaProvider({ children }: { children: ReactNode }) {
  const [meta, setMeta] = useState<DailyDigestMeta>(DEFAULT_META);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<DailyDigestMeta>;
        setMeta({ ...DEFAULT_META, ...parsed });
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(meta));
    } catch {
      // ignore
    }
  }, [meta, hydrated]);

  const setName = useCallback((name: string) => {
    setMeta((m) => ({ ...m, name: name.trim() || DEFAULT_META.name }));
  }, []);

  const setInstructions = useCallback((instructions: string) => {
    setMeta((m) => ({ ...m, instructions }));
  }, []);

  const setStatus = useCallback((status: DailyDigestStatus) => {
    setMeta((m) => ({ ...m, status }));
  }, []);

  const updateMeta = useCallback((patch: Partial<DailyDigestMeta>) => {
    setMeta((m) => ({ ...m, ...patch }));
  }, []);

  const deleteDigest = useCallback(() => {
    setMeta((m) => ({ ...m, deleted: true }));
  }, []);

  const restoreDigest = useCallback(() => {
    setMeta((m) => ({ ...m, deleted: false }));
  }, []);

  const resetInstructions = useCallback(() => {
    setMeta((m) => ({ ...m, instructions: DEFAULT_INSTRUCTIONS }));
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      ...meta,
      setName,
      setInstructions,
      setStatus,
      updateMeta,
      deleteDigest,
      restoreDigest,
      resetInstructions,
    }),
    [
      meta,
      setName,
      setInstructions,
      setStatus,
      updateMeta,
      deleteDigest,
      restoreDigest,
      resetInstructions,
    ],
  );

  return (
    <DailyDigestMetaContext.Provider value={value}>
      {children}
    </DailyDigestMetaContext.Provider>
  );
}
