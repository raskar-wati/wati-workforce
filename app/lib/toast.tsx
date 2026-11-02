"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Toast } from "../components/Toast";

/**
 * One-line confirmations ("Campaign scheduled…"), shown top-right for a few
 * seconds. Any page under the provider calls `showToast`; a new toast
 * replaces the one on screen.
 */

export type ToastItem = { id: string; message: string };

type ToastCtx = { showToast: (message: string) => void };

const Ctx = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const showToast = useCallback((message: string) => {
    setToast({ id: crypto.randomUUID(), message });
  }, []);
  const dismiss = useCallback((id: string) => {
    setToast((t) => (t?.id === id ? null : t));
  }, []);
  const value = useMemo(() => ({ showToast }), [showToast]);
  return (
    <Ctx.Provider value={value}>
      {children}
      <Toast toast={toast} onDismiss={dismiss} />
    </Ctx.Provider>
  );
}

export function useToast(): ToastCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
