"use client";

import type { HandoffItem as HandoffItemType } from "../../lib/agents";

export function HandoffItem({ item }: { item: HandoffItemType }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg bg-black/[0.03] px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-[13px] tracking-[-0.078px] text-[#0a0a0a]">
          {item.label}
        </p>
        {item.meta && (
          <p className="text-[12px] tracking-[-0.06px] text-black/50">
            {item.meta}
          </p>
        )}
      </div>
    </div>
  );
}
