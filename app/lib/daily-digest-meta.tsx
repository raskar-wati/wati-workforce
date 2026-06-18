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

export type DailyDigestMeta = {
  name: string;
  instructions: string;
  status: DailyDigestStatus;
  /** Soft-deleted flag — when true, hide the Daily Digest thread + card. */
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
  instructions: DEFAULT_INSTRUCTIONS,
  status: "active",
  deleted: false,
};

const STORAGE_KEY = "wati.daily-digest-meta.v1";

type Ctx = DailyDigestMeta & {
  setName: (name: string) => void;
  setInstructions: (instructions: string) => void;
  setStatus: (status: DailyDigestStatus) => void;
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
      deleteDigest,
      restoreDigest,
      resetInstructions,
    }),
    [
      meta,
      setName,
      setInstructions,
      setStatus,
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
