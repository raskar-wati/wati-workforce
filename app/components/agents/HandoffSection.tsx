"use client";

import type {
  HandoffCta,
  HandoffSection as HandoffSectionType,
  HandoffSectionKind,
} from "../../lib/agents";
import { HandoffItem } from "./HandoffItem";
import { HandoffTable } from "./HandoffTable";

const SECTION_TONE: Record<HandoffSectionKind, string> = {
  did: "text-black/50",
  attention: "text-amber-700",
  summary: "text-black/50",
};

export function HandoffSection({
  section,
  firedCtaIds,
  onFireCta,
}: {
  section: HandoffSectionType;
  firedCtaIds: ReadonlySet<string>;
  onFireCta: (cta: HandoffCta) => void;
}) {
  // Scan-style sections ("did" / "summary") read as a single narrative
  // paragraph instead of a stack of separate rows.
  const isNarrative = section.kind === "did" || section.kind === "summary";

  return (
    <div className="flex flex-col gap-2">
      <p
        className={`text-[11px] font-semibold uppercase tracking-[0.6px] ${SECTION_TONE[section.kind]}`}
      >
        {section.title}
      </p>

      {isNarrative ? (
        <p className="rounded-xl bg-black/[0.02] px-3.5 py-3 text-[13px] leading-[20px] tracking-[-0.078px] text-black/70">
          {toNarrative(section.items.map((i) => i.label))}
        </p>
      ) : section.table ? (
        <HandoffTable
          table={section.table}
          firedCtaIds={firedCtaIds}
          onFireCta={onFireCta}
        />
      ) : (
        <div className="flex flex-col gap-1.5">
          {section.items.map((i) => (
            <HandoffItem
              key={i.id}
              item={i}
              firedCtaIds={firedCtaIds}
              onFireCta={onFireCta}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Joins verb-led scan clauses into one flowing sentence, e.g.
 * ["Reviewed 1,842 conversations…", "Flagged 31 contacts…"]
 * → "Reviewed 1,842 conversations…, and flagged 31 contacts…".
 */
function toNarrative(labels: string[]): string {
  const clauses = labels
    .map((l) => l.replace(/\.\s*$/, "").trim())
    .filter(Boolean);
  if (clauses.length === 0) return "";
  if (clauses.length === 1) return `${clauses[0]}.`;
  const [first, ...rest] = clauses;
  const tail = rest.map(lowerFirst);
  return `${first}, and ${tail.join(", and ")}.`;
}

function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}
