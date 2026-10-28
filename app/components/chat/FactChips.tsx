"use client";

import { CalendarDays, ChevronDown, Pencil } from "lucide-react";
import { useState, type ReactNode } from "react";

/**
 * Editable fact chips: the settings Wati inferred for an object in chat
 * (template name, category, a broadcast's audience or date), shown as
 * chips the user can change in place. Shared across chat use cases.
 */

export const FACT_CHIP =
  "inline-flex items-center gap-1 rounded-full bg-black/[0.04] px-2.5 py-1 text-[12px] text-black/70 hover:bg-black/[0.07]";

/** A chip over a native select: the label shows, the menu does the work. */
export function SelectChip({
  label,
  value,
  options,
  onChange,
  icon,
  className = FACT_CHIP,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <label className={`${className} relative cursor-pointer`}>
      {icon}
      {options.find((o) => o.value === value)?.label ?? value}
      <ChevronDown size={11} className="text-black/40" />
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Free text in a chip: click to edit, Enter or leaving saves, Escape cancels. */
export function TextChip({
  label,
  value,
  onChange,
  normalize = (v) => v.trim(),
  width = 200,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Clean the typed value before saving, e.g. snake_case a template name. */
  normalize?: (value: string) => string;
  width?: number;
}) {
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <input
        autoFocus
        defaultValue={value}
        onBlur={(e) => {
          const next = normalize(e.target.value);
          if (next) onChange(next);
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") setEditing(false);
        }}
        aria-label={label}
        style={{ width }}
        className="rounded-full border border-[#1570EF] bg-white px-2.5 py-1 text-[12px] outline-none"
      />
    );
  }
  return (
    <button type="button" onClick={() => setEditing(true)} aria-label={`Edit ${label.toLowerCase()}`} className={FACT_CHIP}>
      {value}
      <Pencil size={10} className="text-black/40" />
    </button>
  );
}

const DATE_LABEL = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" });

/** A date (YYYY-MM-DD) in a chip; clicking opens the browser's date picker. */
export function DateChip({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: string;
  min?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className={`${FACT_CHIP} relative cursor-pointer`}>
      <CalendarDays size={11} className="text-black/45" />
      {value ? DATE_LABEL.format(new Date(`${value}T00:00:00`)) : "Pick a date"}
      <input
        type="date"
        aria-label={label}
        value={value}
        min={min}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        onClick={(e) => e.currentTarget.showPicker?.()}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
    </label>
  );
}
