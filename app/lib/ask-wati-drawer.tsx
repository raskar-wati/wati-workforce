"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
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
  /**
   * True while the full-page Ask Wati view is mounted. That page hosts the
   * chat itself, so asks land there instead of opening the drawer over it.
   */
  inlineHost: boolean;
  setInlineHost: (v: boolean) => void;
  /**
   * A thread to bring up, handed in from outside the chat (an island
   * notice's Review). Consumed once by the chat, like pendingPrompt.
   */
  pendingThread: { id: string; threadId: string } | null;
  openThread: (threadId: string) => void;
  clearThread: () => void;
  /** The chat reports the thread it's showing, so Expand can carry it over. */
  reportShownThread: (threadId: string | null) => void;
  /** Hand the shown thread to the next chat that mounts (the full page). */
  carryShownThread: () => void;
  /**
   * A Wati-recommended campaign to set up in chat, from the Campaigns
   * calendar: "edit" opens its template for changes, "approve" submits it
   * as-is and goes straight to the broadcast set-up. Consumed once.
   */
  pendingCampaign: { id: string; campaignId: string; mode: "edit" | "approve" } | null;
  setUpCampaign: (campaignId: string, mode: "edit" | "approve") => void;
  clearCampaign: () => void;
  /**
   * Island notices posted into the Ask Wati page's chat. On that page the
   * island doesn't open over the conversation — its notices land in the
   * chat as cards instead. Ephemeral, newest last.
   */
  postedNoticeIds: string[];
  postNotices: (ids: string[]) => void;
  unpostNotice: (id: string) => void;
};

const Ctx = createContext<AskWatiDrawerCtx | null>(null);

export function AskWatiDrawerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<AskWatiAction | null>(null);
  const [pendingPrompt, setPendingPrompt] = useState<AskWatiDrawerCtx["pendingPrompt"]>(null);
  const [inlineHost, setInlineHostState] = useState(false);
  const [pendingThread, setPendingThread] = useState<AskWatiDrawerCtx["pendingThread"]>(null);
  const [pendingCampaign, setPendingCampaign] = useState<AskWatiDrawerCtx["pendingCampaign"]>(null);
  const [postedNoticeIds, setPostedNoticeIds] = useState<string[]>([]);
  // Leaving the Ask Wati page drops the notice cards it was showing.
  const setInlineHost = useCallback((v: boolean) => {
    setInlineHostState(v);
    if (!v) setPostedNoticeIds([]);
  }, []);

  const openDrawer = useCallback(() => setOpen(true), []);
  const closeDrawer = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((v) => !v), []);
  const requestAction = useCallback((action: AskWatiAction) => {
    setPendingAction(action);
  }, []);
  const clearAction = useCallback(() => setPendingAction(null), []);
  const askPrompt = useCallback((text: string) => {
    setPendingPrompt({ id: crypto.randomUUID(), text });
    if (!inlineHost) setOpen(true);
  }, [inlineHost]);
  const clearPrompt = useCallback(() => setPendingPrompt(null), []);
  const openThread = useCallback((threadId: string) => {
    setPendingThread({ id: crypto.randomUUID(), threadId });
    if (!inlineHost) setOpen(true);
  }, [inlineHost]);
  const clearThread = useCallback(() => setPendingThread(null), []);
  const shownThreadId = useRef<string | null>(null);
  const reportShownThread = useCallback((threadId: string | null) => {
    shownThreadId.current = threadId;
  }, []);
  const carryShownThread = useCallback(() => {
    const threadId = shownThreadId.current;
    if (threadId) setPendingThread({ id: crypto.randomUUID(), threadId });
  }, []);
  const setUpCampaign = useCallback(
    (campaignId: string, mode: "edit" | "approve") => {
      setPendingCampaign({ id: crypto.randomUUID(), campaignId, mode });
      if (!inlineHost) setOpen(true);
    },
    [inlineHost],
  );
  const clearCampaign = useCallback(() => setPendingCampaign(null), []);
  const postNotices = useCallback((ids: string[]) => {
    setPostedNoticeIds((prev) => {
      const fresh = ids.filter((id) => !prev.includes(id));
      return fresh.length ? [...prev, ...fresh] : prev;
    });
  }, []);
  const unpostNotice = useCallback((id: string) => {
    setPostedNoticeIds((prev) => prev.filter((x) => x !== id));
  }, []);

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
      inlineHost,
      setInlineHost,
      pendingThread,
      openThread,
      clearThread,
      reportShownThread,
      carryShownThread,
      pendingCampaign,
      setUpCampaign,
      clearCampaign,
      postedNoticeIds,
      postNotices,
      unpostNotice,
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
      inlineHost,
      setInlineHost,
      pendingThread,
      openThread,
      clearThread,
      reportShownThread,
      carryShownThread,
      pendingCampaign,
      setUpCampaign,
      clearCampaign,
      postedNoticeIds,
      postNotices,
      unpostNotice,
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
