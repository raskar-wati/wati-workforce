"use client";

import type {
  HandoffCta,
  HandoffSection as HandoffSectionType,
  HandoffSectionKind,
} from "../../lib/agents";
import { HandoffItem } from "./HandoffItem";

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
  return (
    <div className="flex flex-col gap-2">
      <p
        className={`text-[11px] font-semibold uppercase tracking-[0.6px] ${SECTION_TONE[section.kind]}`}
      >
        {section.title}
      </p>
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
    </div>
  );
}
