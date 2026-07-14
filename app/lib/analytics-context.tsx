"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * Analytics-scoped context for Ask Wati on the Analytics page. Mirrors
 * [[inbox-context]], [[contacts-context]], and [[shopify-context]]. Null
 * outside the Analytics surface.
 */

export type AnalyticsStats = {
  totalAgents: number;
  avgFirstResponseMinutes: number;
  avgResponseSeconds: number;
  avgResolutionHours: number;
};

type AnalyticsContextValue = {
  stats: AnalyticsStats;
};

const Ctx = createContext<AnalyticsContextValue | null>(null);

export function AnalyticsContextProvider({
  stats,
  children,
}: {
  stats: AnalyticsStats;
  children: ReactNode;
}) {
  return <Ctx.Provider value={{ stats }}>{children}</Ctx.Provider>;
}

export function useAnalyticsContext(): AnalyticsContextValue | null {
  return useContext(Ctx);
}
