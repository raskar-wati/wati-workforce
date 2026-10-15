"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
  type RefCallback,
} from "react";

/**
 * Live geometry of the app shell, for the header's Wati AI bar: how wide the
 * side nav currently is, and — on the full Ask Wati page — the chat input the
 * bar should line up with. Everywhere else the bar centres over the content.
 */

type ShellLayoutCtx = {
  navWidth: number;
  setNavWidth: (px: number) => void;
  barAnchor: HTMLElement | null;
  setBarAnchor: (el: HTMLElement | null) => void;
};

const Ctx = createContext<ShellLayoutCtx | null>(null);

/** Expanded nav width — what the shell assumes before the sidebar reports. */
export const DEFAULT_NAV_WIDTH = 210;

export function ShellLayoutProvider({ children }: { children: ReactNode }) {
  const [navWidth, setNavWidth] = useState(DEFAULT_NAV_WIDTH);
  const [barAnchor, setBarAnchor] = useState<HTMLElement | null>(null);
  const value = useMemo(
    () => ({ navWidth, setNavWidth, barAnchor, setBarAnchor }),
    [navWidth, barAnchor],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useShellLayout(): ShellLayoutCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useShellLayout must be used within a ShellLayoutProvider");
  return ctx;
}

/** Marks a subtree whose chat input the header bar should align with. */
const AnchorScope = createContext(false);

export function BarAnchorScope({ children }: { children: ReactNode }) {
  return <AnchorScope.Provider value={true}>{children}</AnchorScope.Provider>;
}

/**
 * Ref for a chat input. Inside a `BarAnchorScope` it registers the element as
 * the header bar's alignment target; anywhere else it does nothing, so the
 * same composer can live in the drawer without pulling the bar around.
 */
export function useBarAnchorRef(): RefCallback<HTMLElement> {
  const inScope = useContext(AnchorScope);
  const ctx = useContext(Ctx);
  const setBarAnchor = ctx?.setBarAnchor;
  return useCallback(
    (el: HTMLElement | null) => {
      if (!inScope || !setBarAnchor || !el) return;
      setBarAnchor(el);
      return () => setBarAnchor(null);
    },
    [inScope, setBarAnchor],
  );
}
