"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Shared state for the Ask Wati drawer. Lifted to a context so the
 * trigger (top-nav button) and the drawer surface can live in different
 * parts of the tree and on different routes. Ephemeral — not persisted.
 */

type AskWatiDrawerCtx = {
  open: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggle: () => void;
};

const Ctx = createContext<AskWatiDrawerCtx | null>(null);

export function AskWatiDrawerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const openDrawer = useCallback(() => setOpen(true), []);
  const closeDrawer = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  const value = useMemo<AskWatiDrawerCtx>(
    () => ({ open, openDrawer, closeDrawer, toggle }),
    [open, openDrawer, closeDrawer, toggle],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAskWatiDrawer(): AskWatiDrawerCtx {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error(
      "useAskWatiDrawer must be used within an AskWatiDrawerProvider",
    );
  }
  return ctx;
}
