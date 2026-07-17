"use client";

import { Check, Inbox, Split, UserSearch } from "lucide-react";
import { useState } from "react";
import type { WatcherTypeId } from "../../lib/agents";
import type { MatchTier } from "../../lib/watcher-types";
import { getWatcherType } from "../../lib/watcher-types";
import { CardCtaChip, WorkforceCard } from "../cards/WorkforceCard";
import { WatcherTypeOptionList } from "./WatcherTypeOptionList";

/**
 * The free-text matching ladder's three states (agent-schema.md §2):
 * - confident: one type clearly ahead — prefilled confirm + "see all" escape
 * - ambiguous: closest 2–3 types to pick from + "none of these"
 * - none: honest denial — full roster shown, request already captured,
 *   nothing gets created
 * Picking a type resolves the card and starts the normal creation flow.
 */
export function WatcherMatchCard({
  match,
  resolvedTypeId,
  onPick,
  onNone,
}: {
  match: MatchTier;
  /** Set once the user picked — the card locks into a quiet receipt. */
  resolvedTypeId?: WatcherTypeId | null;
  onPick: (id: WatcherTypeId) => void;
  /** Ambiguous rung's "None of these" — parent converts this card to no-match. */
  onNone: () => void;
}) {
  const [showAll, setShowAll] = useState(false);

  if (resolvedTypeId) {
    const wt = getWatcherType(resolvedTypeId);
    return (
      <WorkforceCard
        tone="success"
        icon={<Check size={12} strokeWidth={2.5} />}
        title={`Agent type: ${wt.label}`}
        subtitle={wt.blurb}
      />
    );
  }

  if (match.tier === "confident") {
    const wt = getWatcherType(match.typeId);
    return (
      <WorkforceCard
        tone="info"
        icon={<UserSearch size={12} strokeWidth={2.5} />}
        title={`Sounds like a job for ${wt.label}`}
        subtitle={wt.blurb}
        actions={
          !showAll && (
            <>
              <CardCtaChip primary onClick={() => onPick(match.typeId)}>
                Set up {wt.label}
              </CardCtaChip>
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="text-[13px] tracking-[-0.078px] text-black/60 hover:text-[#0a0a0a]"
              >
                See all agent types
              </button>
            </>
          )
        }
      >
        {showAll && <WatcherTypeOptionList onSelect={onPick} />}
      </WorkforceCard>
    );
  }

  if (match.tier === "ambiguous") {
    return (
      <WorkforceCard
        tone="info"
        icon={<Split size={12} strokeWidth={2.5} />}
        title="This could be one of a few agents"
        subtitle="Pick the closest match to what you described"
        actions={
          <button
            type="button"
            onClick={onNone}
            className="text-[13px] tracking-[-0.078px] text-black/60 hover:text-[#0a0a0a]"
          >
            None of these
          </button>
        }
      >
        <WatcherTypeOptionList ids={match.typeIds} onSelect={onPick} />
      </WorkforceCard>
    );
  }

  return (
    <WorkforceCard
      tone="draft"
      icon={<Inbox size={12} strokeWidth={2.5} />}
      title="That's not something I can watch yet"
      subtitle="I've noted your request for the team. Here's what I can watch today:"
    >
      <WatcherTypeOptionList onSelect={onPick} />
    </WorkforceCard>
  );
}
