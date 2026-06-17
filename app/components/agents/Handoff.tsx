"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import type { Handoff as HandoffType, HandoffCta } from "../../lib/agents";
import { HandoffCtaButton } from "./HandoffCtaButton";
import { HandoffSection } from "./HandoffSection";

/**
 * Compact handoff row — header is a single line (chevron + "Handoff #N" + date),
 * separated from neighbours by hairlines instead of stacked card chrome.
 * Expanded content reveals the full sections + CTAs in-place.
 *
 * Designed so a list of runs reads like a scannable log rather than a
 * stack of heavy cards.
 */
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

  useEffect(() => {
    if (expanded) onExpand?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-label={`${agentName} Handoff #${handoff.runNumber}`}
        className="group flex items-center gap-2.5 rounded-md px-2 py-2 text-left hover:bg-black/[0.03]"
      >
        <motion.span
          animate={{ rotate: expanded ? 0 : -90 }}
          transition={{ duration: 0.2 }}
          className="flex text-black/40 group-hover:text-black/60"
        >
          <ChevronDown size={14} strokeWidth={2} />
        </motion.span>
        <span className="flex-1 truncate text-[13px] font-medium tracking-[-0.078px] text-[#0a0a0a]">
          Handoff #{handoff.runNumber}
        </span>
        <span className="shrink-0 text-[12px] tracking-[-0.06px] text-black/45">
          {formatRunAt(handoff.runAt)}
        </span>
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
            {/* Faint left rail anchors children to the chevron column. */}
            <div className="ml-[14.5px] flex flex-col gap-4 border-l border-black/[0.08] pb-4 pt-1 pl-4">
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
