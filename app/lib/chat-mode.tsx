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
 * Top-level chat modes selectable from the slash menu, the mode pills, or
 * the sidebar's "New Agent" button. Kept in sync with the pill list in
 * `ModePillRow` and the `MODE_OPTIONS` array in ChatArea.
 */
export type ChatMode = "agent" | "automation" | "insights";

/**
 * Which top-level surface is shown in the main area. "chat" is the default
 * thread/agent view; "handoffs" swaps in the Handoff Inbox. Other top-level
 * destinations (e.g. settings) would slot in here later.
 */
export type ChatView = "chat" | "handoffs";

type ChatModeCtx = {
  mode: ChatMode | null;
  setMode: (mode: ChatMode | null) => void;
  view: ChatView;
  setView: (view: ChatView) => void;
};

const ChatModeContext = createContext<ChatModeCtx | null>(null);

export function ChatModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ChatMode | null>(null);
  const [view, setView] = useState<ChatView>("chat");

  // Setting a mode implies we're back on the chat surface — keep them in sync
  // so the user doesn't pick a mode while still pointed at the inbox.
  const setMode = useCallback((next: ChatMode | null) => {
    setModeState(next);
    if (next !== null) setView("chat");
  }, []);

  const value = useMemo<ChatModeCtx>(
    () => ({ mode, setMode, view, setView }),
    [mode, setMode, view],
  );
  return (
    <ChatModeContext.Provider value={value}>{children}</ChatModeContext.Provider>
  );
}

export function useChatMode(): ChatModeCtx {
  const ctx = useContext(ChatModeContext);
  if (!ctx) {
    throw new Error("useChatMode must be used inside ChatModeProvider");
  }
  return ctx;
}
