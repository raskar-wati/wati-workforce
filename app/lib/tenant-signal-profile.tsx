"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type TenantThemeTrend = "rising" | "stable" | "falling";

export type TenantTheme = {
  theme: string;
  level: "message" | "conversation";
  contactCount: number;
  trend: TenantThemeTrend;
  /** Optional opportunity-value $$ associated with this theme. */
  opportunityValue?: number;
};

export type TenantSignalProfile = {
  tenantId: string;
  displayName: string;
  topThemes: TenantTheme[];
  /** Predefined signal types observed in this tenant's data. */
  dominantSignalTypes: string[];
  /** Themes the LLM discovered but aren't in the predefined taxonomy yet. */
  emergentThemes: string[];
};

/**
 * Travel House (UK travel) — short-window urgency, paid acquisition leads,
 * BNPL/installment asks. Shaped from the signal-discovery study.
 */
export const TRAVEL_HOUSE_PROFILE: TenantSignalProfile = {
  tenantId: "travel-house",
  displayName: "Travel House",
  topThemes: [
    {
      theme: "Same-week / urgent travel requests",
      level: "conversation",
      contactCount: 124,
      trend: "rising",
    },
    {
      theme: "WhatsApp ad-sourced leads",
      level: "conversation",
      contactCount: 96,
      trend: "rising",
    },
    {
      theme: "Close-readiness — ready to book",
      level: "conversation",
      contactCount: 72,
      trend: "stable",
    },
    {
      theme: "Installment / BNPL ask",
      level: "message",
      contactCount: 48,
      trend: "rising",
    },
    {
      theme: "Awaiting agent reply > SLA",
      level: "conversation",
      contactCount: 31,
      trend: "stable",
    },
  ],
  dominantSignalTypes: [
    "timeline_urgency",
    "ctwa_lead",
    "conversation_stage",
    "intent",
    "blocker",
    "response_gap",
  ],
  emergentThemes: [],
};

/**
 * BigHaat (Indian agriculture) — delivery complaint clusters, SKU-level
 * product inquiries, occasional internal/ops misclassification in queue.
 */
export const BIGHAAT_PROFILE: TenantSignalProfile = {
  tenantId: "bighaat",
  displayName: "BigHaat",
  topThemes: [
    {
      theme: "Delivery complaint cluster",
      level: "conversation",
      contactCount: 213,
      trend: "rising",
    },
    {
      theme: "SKU-level product inquiry",
      level: "message",
      contactCount: 187,
      trend: "stable",
    },
    {
      theme: "Price / payment objection",
      level: "message",
      contactCount: 64,
      trend: "stable",
    },
    {
      theme: "Internal / ops messages in customer queue",
      level: "message",
      contactCount: 22,
      trend: "stable",
    },
  ],
  dominantSignalTypes: ["blocker", "response_gap"],
  emergentThemes: ["delivery_complaint", "sku_inquiry", "internal_ops"],
};

export const TENANT_PROFILES: readonly TenantSignalProfile[] = [
  TRAVEL_HOUSE_PROFILE,
  BIGHAAT_PROFILE,
];

const STORAGE_KEY = "wati.tenant.v1";
const DEFAULT_TENANT_ID = TRAVEL_HOUSE_PROFILE.tenantId;

function findProfile(id: string): TenantSignalProfile {
  return (
    TENANT_PROFILES.find((p) => p.tenantId === id) ?? TRAVEL_HOUSE_PROFILE
  );
}

type TenantCtx = {
  profile: TenantSignalProfile;
  setTenantId: (id: string) => void;
};

const TenantContext = createContext<TenantCtx | null>(null);

/**
 * Provides the active tenant profile + setter across the app. Persists the
 * choice in localStorage so the dev toggle survives reloads. Pure dev /
 * Phase-1 affordance — Phase 2 will compute the profile server-side.
 */
export function TenantProfileProvider({ children }: { children: ReactNode }) {
  const [tenantId, setTenantIdState] = useState<string>(DEFAULT_TENANT_ID);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw =
        typeof window !== "undefined"
          ? window.localStorage.getItem(STORAGE_KEY)
          : null;
      if (raw) {
        setTenantIdState(raw);
      }
    } catch {
      // ignore corrupted storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, tenantId);
    } catch {
      // ignore quota / disabled storage
    }
  }, [tenantId, hydrated]);

  const setTenantId = useCallback((id: string) => {
    setTenantIdState(id);
  }, []);

  const value = useMemo<TenantCtx>(
    () => ({ profile: findProfile(tenantId), setTenantId }),
    [tenantId, setTenantId],
  );

  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
}

export function useTenantProfile(): TenantCtx {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    throw new Error(
      "useTenantProfile must be used inside TenantProfileProvider",
    );
  }
  return ctx;
}
