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

// Profile data lives in tenant-profiles-data.ts (pure module, no "use
// client") so the /api/chat route can ground the model in the same numbers
// the UI renders. Re-exported here so existing call sites keep working.
import {
  TENANT_PROFILES,
  TRAVEL_HOUSE_PROFILE,
  type TenantSignalProfile,
} from "./tenant-profiles-data";

export {
  BIGHAAT_PROFILE,
  TENANT_PROFILES,
  TRAVEL_HOUSE_PROFILE,
  type TenantSignalProfile,
  type TenantTheme,
  type TenantThemeTrend,
} from "./tenant-profiles-data";

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
