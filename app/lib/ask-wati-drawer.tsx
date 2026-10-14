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

export type AskWatiAction = "select-agent" | "view-history";

type AskWatiDrawerCtx = {
  open: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggle: () => void;
  pendingAction: AskWatiAction | null;
  requestAction: (action: AskWatiAction) => void;
  clearAction: () => void;
  /**
   * A prompt handed in from outside the drawer (the header Wati AI bar).
   * The drawer's chat consumes it once — keyed by id so a StrictMode
   * effect replay can't send it twice.
   */
  pendingPrompt: { id: string; text: string } | null;
  askPrompt: (text: string) => void;
  clearPrompt: () => void;
};

const Ctx = createContext<AskWatiDrawerCtx | null>(null);

export function AskWatiDrawerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<AskWatiAction | null>(null);
  const [pendingPrompt, setPendingPrompt] = useState<AskWatiDrawerCtx["pendingPrompt"]>(null);

  const openDrawer = useCallback(() => setOpen(true), []);
  const closeDrawer = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((v) => !v), []);
  const requestAction = useCallback((action: AskWatiAction) => {
    setPendingAction(action);
  }, []);
  const clearAction = useCallback(() => setPendingAction(null), []);
  const askPrompt = useCallback((text: string) => {
    setPendingPrompt({ id: crypto.randomUUID(), text });
    setOpen(true);
  }, []);
  const clearPrompt = useCallback(() => setPendingPrompt(null), []);

  const value = useMemo<AskWatiDrawerCtx>(
    () => ({
      open,
      openDrawer,
      closeDrawer,
      toggle,
      pendingAction,
      requestAction,
      clearAction,
      pendingPrompt,
      askPrompt,
      clearPrompt,
    }),
    [
      open,
      openDrawer,
      closeDrawer,
      toggle,
      pendingAction,
      requestAction,
      clearAction,
      pendingPrompt,
      askPrompt,
      clearPrompt,
    ],
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
