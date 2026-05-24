"use client";

import type { HandoffItem as HandoffItemType } from "../../lib/agents";
import { HandoffCtaButton } from "./HandoffCtaButton";

export function HandoffItem({ item }: { item: HandoffItemType }) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-black/[0.03] px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] tracking-[-0.078px] text-[#0a0a0a]">
          {item.label}
        </p>
        {item.meta && (
          <p className="text-[12px] tracking-[-0.06px] text-black/50">
            {item.meta}
          </p>
        )}
      </div>
      {item.cta && <HandoffCtaButton cta={item.cta} variant="inline" />}
    </div>
  );
}
