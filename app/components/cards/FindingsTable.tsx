"use client";

import { Check, TriangleAlert } from "lucide-react";
import type { FindingColumns, HandoffItem } from "../../lib/agents";

/**
 * The FINDINGS slot of the handoff skeleton (agent-schema.md §3): a typed
 * table with fixed column roles (Subject · Finding · Measure · Source) and
 * per-type header labels. Renders as a grid when the container is wide
 * enough (@lg ≈ 512px), collapsing to the stacked layout on narrow surfaces
 * like the drawer. Zero items = the All Clear state.
 *
 * The handoff's footer action block is the ONLY CTA surface — per-row
 * actions (`item.cta`) stay in the data model but are deferred from first
 * launch and never rendered here.
 *
 * Rows without typed fields (legacy persisted handoffs) always render
 * stacked via their label/meta.
 */
export function FindingsTable({
  items,
  columns,
  emptyNote,
}: {
  items: HandoffItem[];
  columns?: FindingColumns;
  emptyNote?: string;
}) {
  if (items.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-black/[0.03] px-3 py-2.5">
        <Check size={13} strokeWidth={2.5} className="shrink-0 text-wati-green-text" />
        <p className="text-[13px] tracking-[-0.078px] text-black/60">
          {emptyNote ?? "All clear — nothing needs your attention this run."}
        </p>
      </div>
    );
  }

  const typed = columns && items.every((i) => i.subject && i.finding);
  const hasMeasure = typed && items.some((i) => i.measure);
  const hasSource = typed && items.some((i) => i.source);

  if (!typed) {
    return (
      <div className="flex flex-col gap-1.5">
        {items.map((i) => (
          <StackedRow key={i.id} item={i} />
        ))}
      </div>
    );
  }

  const gridTemplate = [
    "minmax(0,1fr)", // subject
    "minmax(0,1.6fr)", // finding
    hasMeasure ? "auto" : null,
    hasSource ? "auto" : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="@container">
      {/* Narrow: stacked collapse — the pre-table layout. */}
      <div className="flex flex-col gap-1.5 @lg:hidden">
        {items.map((i) => (
          <StackedRow key={i.id} item={i} />
        ))}
      </div>

      {/* Wide: the typed grid with per-type headers. */}
      <div className="hidden overflow-hidden rounded-lg bg-black/[0.03] @lg:block">
        <div
          className="grid items-center gap-x-4 gap-y-0 px-3 py-1"
          style={{ gridTemplateColumns: gridTemplate }}
        >
          <HeaderCell>{columns.subject}</HeaderCell>
          <HeaderCell>{columns.finding}</HeaderCell>
          {hasMeasure && <HeaderCell align="right">{columns.measure ?? "Measure"}</HeaderCell>}
          {hasSource && <HeaderCell>{columns.source ?? "Source"}</HeaderCell>}

          {items.map((i) => (
            <div
              key={i.id}
              className="col-span-full grid grid-cols-subgrid items-center border-t border-black/[0.05] py-2"
            >
              <p className="text-[13px] font-medium tracking-[-0.078px] text-[#0a0a0a]">
                {i.subject}
              </p>
              <p className="text-[13px] tracking-[-0.078px] text-black/70">{i.finding}</p>
              {hasMeasure && (
                <p className="text-right text-[13px] tabular-nums tracking-[-0.078px] text-[#0a0a0a]">
                  {i.measure}
                </p>
              )}
              {hasSource && (
                <p className="text-[12px] tracking-[-0.06px] text-black/50">{i.source}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HeaderCell({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <p
      className={`pt-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-black/40 ${
        align === "right" ? "text-right" : ""
      }`}
    >
      {children}
    </p>
  );
}

/** Narrow / legacy rendering: one finding per row, evidence right-aligned. */
function StackedRow({ item }: { item: HandoffItem }) {
  const line = item.subject ? `${item.subject} — ${item.finding}` : item.label;
  const evidence = item.subject
    ? [item.source, item.measure].filter(Boolean).join(" · ")
    : item.meta;
  return (
    <div className="flex items-start gap-3 rounded-lg bg-black/[0.03] px-3 py-2.5">
      <TriangleAlert
        size={13}
        strokeWidth={2.25}
        className="mt-[3px] shrink-0 text-amber-700"
      />
      <p className="min-w-0 flex-1 text-[13px] leading-[19px] tracking-[-0.078px] text-[#0a0a0a]">
        {line}
      </p>
      {evidence && (
        <p className="shrink-0 text-[12px] tracking-[-0.06px] text-black/50">{evidence}</p>
      )}
    </div>
  );
}
