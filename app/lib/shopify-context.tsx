"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * Shopify-scoped context that surfaces commerce analytics stats to Ask Wati
 * when it's opened inside the Shopify dashboard. Mirrors [[inbox-context]]
 * and [[contacts-context]] so the drawer can show a page-scope chip
 * ("Shopify") and tailor its starter prompts. Null outside the Shopify page.
 */

export type ShopifyStats = {
  /** Total spend across all channels for the active window. */
  totalSpend: number;
  /** Orders attributed to messaging in the active window. */
  orders: number;
  /** Total revenue attributed to messaging. */
  totalRevenue: number;
  /** Return on investment (revenue / spend) shown as a multiplier. */
  roi: number;
};

type ShopifyContextValue = {
  stats: ShopifyStats;
};

const Ctx = createContext<ShopifyContextValue | null>(null);

export function ShopifyContextProvider({
  stats,
  children,
}: {
  stats: ShopifyStats;
  children: ReactNode;
}) {
  return <Ctx.Provider value={{ stats }}>{children}</Ctx.Provider>;
}

export function useShopifyContext(): ShopifyContextValue | null {
  return useContext(Ctx);
}
