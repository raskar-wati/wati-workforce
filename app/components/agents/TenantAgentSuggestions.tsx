"use client";

import Image from "next/image";
import { rankSuggestions, type AgentSuggestion } from "../../lib/agent-suggestions";
import { getPixabot } from "../../lib/pixabots";
import type { TenantSignalProfile } from "../../lib/tenant-signal-profile";

export function TenantAgentSuggestions({
  profile,
  onSelect,
  max = 4,
}: {
  profile: TenantSignalProfile;
  /** Called with the suggestion's pre-filled prompt when a card is tapped. */
  onSelect: (prompt: string) => void;
  max?: number;
}) {
  const suggestions = rankSuggestions(profile, max);

  if (suggestions.length === 0) {
    // Nothing in the profile that maps to a suggestion — keep the surface
    // quiet rather than render an empty grid.
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-[var(--wati-text-body)]">Suggested Agents</p>

      <div className="grid grid-cols-2 gap-3">
        {suggestions.map((s) => (
          <SuggestionCard
            key={s.id}
            suggestion={s}
            evidence={s.evidence(profile)}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

function SuggestionCard({
  suggestion,
  evidence,
  onSelect,
}: {
  suggestion: AgentSuggestion;
  evidence: string | null;
  onSelect: (prompt: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(suggestion.prompt)}
      className="flex flex-col items-start gap-2 rounded-[10px] border border-[#e5e5e5] bg-white p-4 text-left transition-colors hover:bg-[var(--wati-surface-subtle)]"
    >
      <Image
        src={getPixabot(suggestion.id)}
        alt=""
        width={24}
        height={24}
        aria-hidden
      />
      <span className="text-[12px] font-medium leading-[16.5px] text-[#0a0a0a]">
        {suggestion.name}
      </span>
      {evidence && (
        <span className="text-[12px] leading-[16.5px] text-[#737373]">
          {evidence}
        </span>
      )}
    </button>
  );
}
