"use client";

import { Check, Filter, Megaphone, Send, Users, type LucideIcon } from "lucide-react";
import type { HandoffCta, HandoffCtaAction } from "../../lib/agents";

const ACTION_ICONS: Record<HandoffCtaAction, LucideIcon> = {
  "create-segment": Users,
  "send-campaign": Megaphone,
  "send-bulk-message": Send,
  "create-inbox-filter": Filter,
};

export function HandoffCtaButton({
  cta,
  variant = "footer",
  fired = false,
  onFire,
}: {
  cta: HandoffCta;
  variant?: "footer" | "inline";
  fired?: boolean;
  onFire?: (cta: HandoffCta) => void;
}) {
  const Icon = ACTION_ICONS[cta.action];
  const handle = () => {
    if (fired) return;
    if (onFire) {
      onFire(cta);
      return;
    }
    // No real wiring yet — log so the surface is exercisable.
    console.log("[handoff cta]", cta.action, cta.payload ?? null);
  };

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={handle}
        disabled={fired}
        aria-disabled={fired}
        className={`flex shrink-0 items-center gap-1 rounded-full border border-[#e5e5e5] bg-white px-2.5 py-1 text-[11px] tracking-[-0.066px] text-[#0a0a0a] ${
          fired
            ? "cursor-default opacity-60"
            : "hover:bg-black/[0.03]"
        }`}
      >
        {fired && <Check size={10} strokeWidth={2.5} className="text-emerald-700" />}
        {fired ? "Done" : cta.label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handle}
      disabled={fired}
      aria-disabled={fired}
      className={`flex items-center gap-1.5 rounded-full border border-[#e5e5e5] bg-white px-3 py-1.5 text-[13px] tracking-[-0.078px] text-[#0a0a0a] ${
        fired ? "cursor-default opacity-60" : "hover:bg-black/[0.03]"
      }`}
    >
      {fired ? (
        <Check size={12} strokeWidth={2.5} className="text-emerald-700" />
      ) : (
        <Icon size={12} strokeWidth={2} />
      )}
      {fired ? "Done" : cta.label}
    </button>
  );
}
