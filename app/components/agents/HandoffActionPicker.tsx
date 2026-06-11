"use client";

import { Check } from "lucide-react";
import { ACHIEVEMENTS, type AchievementId } from "../../lib/achievements";

export function HandoffActionPicker({
  value,
  onChange,
}: {
  value: AchievementId[];
  onChange: (next: AchievementId[]) => void;
}) {
  const toggle = (id: AchievementId) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  return (
    <div className="flex flex-col">
      {ACHIEVEMENTS.map((a) => {
        const checked = value.includes(a.id);
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => toggle(a.id)}
            className={`flex items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors ${
              checked ? "bg-black/[0.04]" : "hover:bg-black/[0.02]"
            }`}
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                checked
                  ? "border-[#0a0a0a] bg-[#0a0a0a] text-white"
                  : "border-[#d4d4d4] bg-white text-transparent"
              }`}
              aria-hidden
            >
              <Check size={10} strokeWidth={3} />
            </span>
            <span className="text-[13px] tracking-[-0.078px] text-[#0a0a0a]">
              {a.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
