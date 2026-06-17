"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * Contacts-scoped context that surfaces a few high-level stats to Ask Wati
 * when it's opened inside the contacts surface. Mirrors [[inbox-context]]
 * so the drawer can show a page-scope chip ("Contacts") and tailor its
 * starter prompts. Null outside the contacts page.
 */

export type ContactsStats = {
  /** Total contacts in the workspace. */
  total: number;
  /** Contacts added in the last 7 days. */
  newThisWeek: number;
};

type ContactsContextValue = {
  stats: ContactsStats;
};

const Ctx = createContext<ContactsContextValue | null>(null);

export function ContactsContextProvider({
  stats,
  children,
}: {
  stats: ContactsStats;
  children: ReactNode;
}) {
  return <Ctx.Provider value={{ stats }}>{children}</Ctx.Provider>;
}

export function useContactsContext(): ContactsContextValue | null {
  return useContext(Ctx);
}
