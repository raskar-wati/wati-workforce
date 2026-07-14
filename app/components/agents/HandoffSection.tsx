"use client";

import type {
  HandoffSection as HandoffSectionType,
  HandoffSectionKind,
} from "../../lib/agents";
import { HandoffItem } from "./HandoffItem";

const SECTION_TONE: Record<HandoffSectionKind, string> = {
  did: "text-black/50",
  attention: "text-amber-700",
  summary: "text-black/50",
};

/**
 * Join the labels of a "did" / "what I scanned" section into one paragraph.
 * Strips trailing punctuation on each line and rejoins with ". " so the
 * block reads as a single sentence regardless of how the source data was
 * authored.
 */
function joinScanLines(lines: string[]): string {
  return lines
    .map((s) => s.trim().replace(/[.;,]+$/, ""))
    .filter(Boolean)
    .join(". ")
    .concat(".");
}

export function HandoffSection({
  section,
}: {
  section: HandoffSectionType;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p
        className={`text-[11px] font-semibold uppercase tracking-[0.6px] ${SECTION_TONE[section.kind]}`}
      >
        {section.title}
      </p>
      {section.kind === "did" ? (
        <div className="rounded-lg bg-black/[0.03] px-3 py-2.5">
          <p className="text-[13px] leading-[20px] tracking-[-0.078px] text-[#0a0a0a]">
            {joinScanLines(section.items.map((i) => i.label))}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {section.items.map((i) => (
            <HandoffItem key={i.id} item={i} />
          ))}
        </div>
      )}
    </div>
  );
}
