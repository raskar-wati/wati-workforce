"use client";

import { Minus, ScanSearch, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import type { HandoffItem } from "../../lib/agents";
import {
  parseInsightSegments,
  type DigestCardBlock,
  type FindingsTableBlock,
  type ScanSummaryBlock,
} from "../../lib/insight-blocks";
import MessageMarkdown from "../MessageMarkdown";
import { FindingsTable } from "./FindingsTable";

/**
 * Body of an assistant chat reply under the insight-block protocol
 * (PRD §3.5.2): markdown interleaved with structured blocks. Blocks render
 * with the same components agent handoffs use, so an insight run and an
 * agent run read as one product.
 */
export function InsightMessageBody({
  content,
  streaming,
}: {
  content: string;
  streaming?: boolean;
}) {
  const segments = useMemo(() => parseInsightSegments(content), [content]);

  return (
    <div className="flex min-w-0 flex-col gap-2.5">
      {segments.map((seg, i) => {
        if (seg.kind === "markdown") {
          return <MessageMarkdown key={i} content={seg.text} />;
        }
        if (seg.kind === "pending-block") {
          return <PendingBlock key={i} />;
        }
        const { block } = seg;
        if (block.type === "scan-summary") {
          return <ScanSummaryLine key={i} block={block} />;
        }
        if (block.type === "findings-table") {
          return <InsightFindingsTable key={i} block={block} />;
        }
        return <InsightDigestCard key={i} block={block} />;
      })}
      {streaming && segments.length === 0 && <PendingBlock />}
    </div>
  );
}

/** §3.5.2 Scan summary — one-line opener on every analysis run. No buttons. */
function ScanSummaryLine({ block }: { block: ScanSummaryBlock }) {
  return (
    <div className="flex items-center gap-2">
      <ScanSearch size={13} strokeWidth={2.25} className="shrink-0 text-black/40" />
      <p className="text-[12px] tracking-[-0.06px] text-black/55">{block.text}</p>
    </div>
  );
}

function InsightFindingsTable({ block }: { block: FindingsTableBlock }) {
  const items: HandoffItem[] = block.rows.map((r, i) => ({
    id: `row-${i}`,
    label: `${r.subject} — ${r.finding}`,
    subject: r.subject,
    finding: r.finding,
    measure: r.measure,
    source: r.source,
  }));
  return (
    <div className="flex flex-col gap-1.5">
      {block.title && (
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-amber-700">
          {block.title}
        </p>
      )}
      <FindingsTable items={items} columns={block.columns} />
      {block.overflowNote && (
        <p className="text-[12px] tracking-[-0.06px] text-black/50">
          {block.overflowNote}
        </p>
      )}
    </div>
  );
}

/** §3.5.2 Digest card — title, KPI / trend lines, no buttons. */
function InsightDigestCard({ block }: { block: DigestCardBlock }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-black/[0.03] px-3 py-2.5">
      <p className="text-[13px] font-semibold tracking-[-0.078px] text-[#0a0a0a]">
        {block.title}
      </p>
      <div className="flex flex-col">
        {block.lines.map((line, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-3 border-black/[0.05] py-1.5 [&:not(:first-child)]:border-t"
          >
            <p className="min-w-0 flex-1 text-[13px] tracking-[-0.078px] text-black/70">
              {line.label}
            </p>
            <div className="flex shrink-0 items-center gap-1.5">
              <p className="text-[13px] font-medium tabular-nums tracking-[-0.078px] text-[#0a0a0a]">
                {line.value}
              </p>
              {line.trend && <TrendGlyph trend={line.trend} />}
            </div>
          </div>
        ))}
      </div>
      {block.note && (
        <p className="pt-0.5 text-[12px] tracking-[-0.06px] text-black/50">{block.note}</p>
      )}
    </div>
  );
}

function TrendGlyph({ trend }: { trend: "up" | "down" | "flat" }) {
  if (trend === "up") {
    return <TrendingUp size={13} strokeWidth={2.25} className="text-wati-green-text" />;
  }
  if (trend === "down") {
    return <TrendingDown size={13} strokeWidth={2.25} className="text-amber-700" />;
  }
  return <Minus size={13} strokeWidth={2.25} className="text-black/35" />;
}

/** Shimmer while a block's fence is still streaming in. */
function PendingBlock() {
  return (
    <div className="flex animate-pulse flex-col gap-2 rounded-lg bg-black/[0.03] px-3 py-2.5">
      <div className="h-2.5 w-2/5 rounded bg-black/[0.07]" />
      <div className="h-2.5 w-4/5 rounded bg-black/[0.05]" />
      <div className="h-2.5 w-3/5 rounded bg-black/[0.05]" />
    </div>
  );
}
