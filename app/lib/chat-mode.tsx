"use client";

import {
  createContext,
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

type ChatModeCtx = {
  mode: ChatMode | null;
  setMode: (mode: ChatMode | null) => void;
};

const ChatModeContext = createContext<ChatModeCtx | null>(null);

export function ChatModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ChatMode | null>(null);
  const value = useMemo<ChatModeCtx>(() => ({ mode, setMode }), [mode]);
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
