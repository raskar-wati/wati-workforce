"use client";

import { Inbox } from "lucide-react";

/**
 * Shown when there are zero handoffs across all agents.
 */
export function HandoffInboxEmpty() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex max-w-[360px] flex-col items-center gap-3 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/[0.04] text-black/40">
          <Inbox size={20} strokeWidth={1.75} />
        </span>
        <h2 className="text-[16px] font-semibold tracking-[-0.32px] text-[#0a0a0a]">
          No handoffs yet
        </h2>
        <p className="text-[13px] leading-[18px] tracking-[-0.078px] text-black/55">
          Your agents will report here after their first run. Create or run an
          agent to see its handoff in this inbox.
        </p>
      </div>
    </div>
  );
}
