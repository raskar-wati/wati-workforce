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
 * Phase-1 dev affordance: lets us flip the whole app between an empty
 * "first-time user" state (what new tenants see) and a populated "returning
 * user" state seeded from demo data. Each mode gets its own localStorage
 * bucket for agents / threads, so toggling back doesn't merge or destroy
 * the hand-built first-time state.
 */
export type DemoMode = "first-time" | "returning";

type DemoStateCtx = {
  mode: DemoMode;
  setMode: (mode: DemoMode) => void;
  /** True until the persisted mode has been read from storage. */
  hydrated: boolean;
};

const STORAGE_KEY = "wati.demo-mode.v1";
const DEFAULT_MODE: DemoMode = "first-time";

const DemoStateContext = createContext<DemoStateCtx | null>(null);

export function DemoStateProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<DemoMode>(DEFAULT_MODE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw =
        typeof window !== "undefined"
          ? window.localStorage.getItem(STORAGE_KEY)
          : null;
      if (raw === "first-time" || raw === "returning") {
        setModeState(raw);
      }
    } catch {
      // ignore corrupted storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // ignore
    }
  }, [mode, hydrated]);

  const setMode = useCallback((next: DemoMode) => setModeState(next), []);

  const value = useMemo<DemoStateCtx>(
    () => ({ mode, setMode, hydrated }),
    [mode, setMode, hydrated],
  );

  return (
    <DemoStateContext.Provider value={value}>
      {children}
    </DemoStateContext.Provider>
  );
}

export function useDemoState(): DemoStateCtx {
  const ctx = useContext(DemoStateContext);
  if (!ctx) {
    throw new Error("useDemoState must be used inside DemoStateProvider");
  }
  return ctx;
}
