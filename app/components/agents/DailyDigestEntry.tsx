"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { DailyDigestEntry as DailyDigestEntryType } from "../../lib/daily-digest-data";

/**
 * One row in the Daily Digest run list. Visually identical to the
 * watcher-agent Handoff row: chevron + "Daily Digest #N" + date,
 * expandable in-place to reveal Overview + Agent overview sections.
 *
 * Renders without outer card chrome — the parent groups several rows
 * inside a `rounded-2xl border divide-y` container, the same pattern
 * ChatArea uses for watcher handoffs.
 */
export function DailyDigestEntry({
  entry,
  defaultExpanded = false,
  onViewAgent,
}: {
  entry: DailyDigestEntryType;
  defaultExpanded?: boolean;
  onViewAgent?: (agentName: string) => void;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const { data } = entry;

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-label={`Daily Digest #${entry.runNumber}`}
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
          Daily Digest #{entry.runNumber}
        </span>
        <span className="shrink-0 text-[12px] tracking-[-0.06px] text-black/45">
          {entry.runAt}
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
              <Section title="Overview">
                {data.metrics.map((m) => (
                  <PillRow
                    key={m.id}
                    label={`${m.label}: ${m.value}`}
                    meta={[m.qualifier, m.delta ? formatDelta(m.delta) : null]
                      .filter(Boolean)
                      .join(" · ")}
                  />
                ))}
                <PillRow
                  label="Top performers"
                  meta={data.topPerformers
                    .map((p) => `${p.name} ${p.value}`)
                    .join(" · ")}
                />
              </Section>

              <Section title="Agent overview">
                {data.agentActivity.map((a) => (
                  <PillRow
                    key={a.agent}
                    label={a.agent}
                    meta={a.detail}
                    cta={
                      onViewAgent
                        ? {
                            label: "View agent",
                            onClick: () => onViewAgent(a.agent),
                          }
                        : undefined
                    }
                  />
                ))}
              </Section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.6px] text-black/50">
        {title}
      </p>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  );
}

function PillRow({
  label,
  meta,
  cta,
}: {
  label: string;
  meta?: string;
  cta?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg bg-black/[0.03] px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-[13px] tracking-[-0.078px] text-[#0a0a0a]">
          {label}
        </p>
        {meta && (
          <p className="text-[12px] tracking-[-0.06px] text-black/50">
            {meta}
          </p>
        )}
      </div>
      {cta && (
        <div className="flex">
          <button
            type="button"
            onClick={cta.onClick}
            className="rounded-full bg-white px-3 py-1 text-[12px] font-medium tracking-[-0.06px] text-[#0a0a0a] shadow-[0_0_0_0.5px_rgba(0,0,0,0.12)] transition-colors hover:bg-black/[0.04]"
          >
            {cta.label}
          </button>
        </div>
      )}
    </div>
  );
}

function formatDelta(d: { value: string; direction: "up" | "down" }): string {
  const sign = d.direction === "up" ? "↑" : "↓";
  return `${sign} ${d.value}`;
}
