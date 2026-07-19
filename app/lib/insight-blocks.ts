import type { FindingColumns } from "./agents";

/**
 * Insight blocks — the chat surface's structured response protocol
 * (PRD §3.5.2). The model emits blocks inside its markdown reply as fenced
 * segments:
 *
 *   ```wati:block
 *   { "type": "findings-table", ... }
 *   ```
 *
 * Markdown between fences streams as usual; a block renders once its fence
 * closes. Phase 1 ships the read-only blocks: scan-summary, findings-table,
 * digest-card. Write-proposal blocks (segment proposal, suggested reply)
 * arrive with conversational approvals in Phase 2.
 */

export type ScanSummaryBlock = {
  type: "scan-summary";
  /** One-line opener: window, count reviewed, what was flagged. No buttons. */
  text: string;
};

export type FindingsRow = {
  subject: string;
  finding: string;
  measure?: string;
  source?: string;
};

export type FindingsTableBlock = {
  type: "findings-table";
  title?: string;
  columns: FindingColumns;
  rows: FindingsRow[];
  /**
   * Prose row-overflow line (PRD §3.5.2): "14 more contacts with same-week
   * intent — want me to show them?" Rendered as text, never a button.
   */
  overflowNote?: string;
};

export type DigestLine = {
  label: string;
  value: string;
  trend?: "up" | "down" | "flat";
};

export type DigestCardBlock = {
  type: "digest-card";
  title: string;
  lines: DigestLine[];
  note?: string;
};

export type InsightBlock = ScanSummaryBlock | FindingsTableBlock | DigestCardBlock;

/** A parsed slice of an assistant reply, in original order. */
export type InsightSegment =
  | { kind: "markdown"; text: string }
  | { kind: "block"; block: InsightBlock }
  /** A fence that opened but hasn't closed yet (mid-stream). */
  | { kind: "pending-block" };

const FENCE_OPEN = /^```wati:block\s*$/;
const FENCE_CLOSE = /^```\s*$/;

function isInsightBlock(value: unknown): value is InsightBlock {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (v.type === "scan-summary") return typeof v.text === "string";
  if (v.type === "findings-table") {
    return (
      typeof v.columns === "object" &&
      v.columns !== null &&
      Array.isArray(v.rows) &&
      v.rows.every(
        (r) =>
          typeof r === "object" &&
          r !== null &&
          typeof (r as FindingsRow).subject === "string" &&
          typeof (r as FindingsRow).finding === "string",
      )
    );
  }
  if (v.type === "digest-card") {
    return typeof v.title === "string" && Array.isArray(v.lines);
  }
  return false;
}

/**
 * Split an assistant reply into markdown and block segments. Tolerant of a
 * trailing unclosed fence (yields `pending-block` so the UI can shimmer while
 * the block streams in). A closed fence whose JSON doesn't parse or validate
 * falls back to a markdown segment of the raw text, so a model glitch never
 * blanks part of the answer.
 */
export function parseInsightSegments(content: string): InsightSegment[] {
  const segments: InsightSegment[] = [];
  const lines = content.split("\n");
  let mdBuffer: string[] = [];
  let blockBuffer: string[] | null = null;

  const flushMarkdown = () => {
    const text = mdBuffer.join("\n");
    if (text.trim()) segments.push({ kind: "markdown", text });
    mdBuffer = [];
  };

  for (const line of lines) {
    if (blockBuffer === null) {
      if (FENCE_OPEN.test(line)) {
        flushMarkdown();
        blockBuffer = [];
      } else {
        mdBuffer.push(line);
      }
      continue;
    }
    if (FENCE_CLOSE.test(line)) {
      const raw = blockBuffer.join("\n");
      blockBuffer = null;
      try {
        const parsed: unknown = JSON.parse(raw);
        if (isInsightBlock(parsed)) {
          segments.push({ kind: "block", block: parsed });
        } else {
          segments.push({ kind: "markdown", text: raw });
        }
      } catch {
        segments.push({ kind: "markdown", text: raw });
      }
    } else {
      blockBuffer.push(line);
    }
  }

  if (blockBuffer !== null) {
    // Unclosed fence: mid-stream. Render a placeholder, not half-baked JSON.
    segments.push({ kind: "pending-block" });
  } else {
    flushMarkdown();
  }
  return segments;
}
