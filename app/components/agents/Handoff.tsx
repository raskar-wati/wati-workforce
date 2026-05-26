"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import type { Handoff as HandoffType, HandoffCta } from "../../lib/agents";
import { HandoffCtaButton } from "./HandoffCtaButton";
import { HandoffSection } from "./HandoffSection";

export function Handoff({
  handoff,
  agentName,
  defaultExpanded = false,
  firedCtaIds,
  onFireCta,
  onExpand,
}: {
  handoff: HandoffType;
  agentName: string;
  defaultExpanded?: boolean;
  firedCtaIds: ReadonlySet<string>;
  onFireCta: (cta: HandoffCta) => void;
  /** Called the first time the handoff is expanded — used to mark it read. */
  onExpand?: () => void;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  // Fire onExpand once on initial mount if defaultExpanded, then on every
  // user-triggered open. The hook in agents.tsx is idempotent so duplicate
  // calls are safe.
  useEffect(() => {
    if (expanded) onExpand?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  return (
    <div className="flex flex-col rounded-2xl border border-[#e5e5e5] bg-white">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex items-center gap-2 px-4 py-3 text-left"
      >
        <motion.span
          animate={{ rotate: expanded ? 0 : -90 }}
          transition={{ duration: 0.2 }}
          className="flex text-black/40"
        >
          <ChevronDown size={14} strokeWidth={2} />
        </motion.span>
        <div className="flex-1">
          <p className="text-[13px] font-medium tracking-[-0.078px] text-[#0a0a0a]">
            {agentName} · Run #{handoff.runNumber}
          </p>
          <p className="text-[12px] tracking-[-0.06px] text-black/50">
            {formatRunAt(handoff.runAt)}
          </p>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-4 border-t border-[#f0f0f0] px-4 py-4">
              {handoff.sections.map((s) => (
                <HandoffSection
                  key={s.id}
                  section={s}
                  firedCtaIds={firedCtaIds}
                  onFireCta={onFireCta}
                />
              ))}
              {handoff.ctas.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {handoff.ctas.map((c) => (
                    <HandoffCtaButton
                      key={c.id}
                      cta={c}
                      fired={firedCtaIds.has(c.id)}
                      onFire={onFireCta}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function formatRunAt(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const time = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${date} · ${time}`;
}
