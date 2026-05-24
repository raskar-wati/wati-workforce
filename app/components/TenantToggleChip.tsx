"use client";

import { ArrowLeftRight } from "lucide-react";
import {
  TENANT_PROFILES,
  useTenantProfile,
} from "../lib/tenant-signal-profile";

/**
 * Phase-1 dev affordance: a tiny chip rendered in the WorkforcePanel footer
 * showing the active tenant and cycling through `TENANT_PROFILES` on click.
 * Persisted via `useTenantProfile` (localStorage). Single component so it's
 * easy to delete when Phase 2 introduces a real tenant picker.
 */
export function TenantToggleChip() {
  const { profile, setTenantId } = useTenantProfile();

  const cycle = () => {
    const idx = TENANT_PROFILES.findIndex((p) => p.tenantId === profile.tenantId);
    const next = TENANT_PROFILES[(idx + 1) % TENANT_PROFILES.length];
    setTenantId(next.tenantId);
  };

  return (
    <button
      type="button"
      onClick={cycle}
      title="Switch tenant (dev)"
      className="flex w-full items-center gap-2 rounded p-1 text-left hover:bg-[var(--wati-surface-subtle)]"
    >
      <span className="flex h-5 w-5 items-center justify-center text-[var(--wati-icon-default)]">
        <ArrowLeftRight size={14} strokeWidth={2} />
      </span>
      <span className="flex-1 truncate text-[12px] tracking-[-0.06px] text-black/50">
        Tenant: {profile.displayName}
      </span>
    </button>
  );
}
