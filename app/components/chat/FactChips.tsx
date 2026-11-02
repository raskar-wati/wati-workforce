"use client";

import { CalendarDays, ChevronDown, Pencil } from "lucide-react";
import { useState, type ReactNode } from "react";

/**
 * Editable fact chips: the settings Wati inferred for an object in chat
 * (template name, category, a broadcast's audience or date), shown as
 * chips the user can change in place. Shared across chat use cases.
 */

/** A fact that is a decision, shown as its value in plain, larger text. */
export const FACT_VALUE =
  "-mx-1 inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-[14px] font-medium text-[#0a0a0a] hover:bg-black/[0.04]";

/** FACT_VALUE at 16px, for roomier surfaces than a chat card (modals). */
export const FACT_VALUE_LG = FACT_VALUE.replace("text-[14px]", "text-[16px]");

export const FACT_CHIP =
  "inline-flex items-center gap-1 rounded-full bg-black/[0.04] px-2.5 py-1 text-[12px] text-black/70 hover:bg-black/[0.07]";

/** A chip over a native select: the label shows, the menu does the work. */
export function SelectChip({
  label,
  value,
  options,
  onChange,
  icon,
  prefix,
  className = FACT_CHIP,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  icon?: ReactNode;
  /** A muted name before the value ("Format Standard"), so the chip says
   *  what it sets. */
  prefix?: string;
  className?: string;
}) {
  // Beside a muted name, the value goes full strength so it leads.
  const valueLabel = (
    <span className={prefix ? "font-medium text-[#0a0a0a]" : undefined}>
      {options.find((o) => o.value === value)?.label ?? value}
    </span>
  );
  // One option is nothing to choose: show it as a fixed fact, no menu.
  if (options.length <= 1) {
    return (
      <span className={`${className} pointer-events-none`} aria-label={label}>
        {icon}
        {prefix && <span className="text-black/50">{prefix}</span>}
        {valueLabel}
      </span>
    );
  }
  return (
    <label className={`${className} relative cursor-pointer`}>
      {icon}
      {prefix && <span className="text-black/50">{prefix}</span>}
      {valueLabel}
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

/**
 * The card's own name as its title, editable in place: reads as a heading,
 * shows a pencil on hover, and turns into an input on click.
 */
export function EditableTitle({
  label,
  value,
  onChange,
  normalize = (v) => v.trim(),
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Clean the typed value before saving, e.g. snake_case a template name. */
  normalize?: (value: string) => string;
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
        // Typing replaces the name; arrow keys still allow small edits.
        onFocus={(e) => e.currentTarget.select()}
        aria-label={label}
        className="-mx-1 w-full max-w-[320px] rounded-md border border-[#1570EF] bg-white px-1 text-[#0a0a0a] outline-none [font:inherit]"
      />
    );
  }
  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      aria-label={`Rename ${label.toLowerCase()}`}
      className="group/title inline-flex items-center gap-1.5 text-left"
    >
      {value}
      <Pencil size={11} className="text-black/30 opacity-0 transition-opacity group-hover/title:opacity-100" />
    </button>
  );
}

/**
 * One decision on a card: a small label, the value in plain larger text, and
 * a muted line under it for what that value means (counts, problems).
 */
export function FactSection({
  label,
  detail,
  size = "md",
  children,
}: {
  label: string;
  detail?: ReactNode;
  /** "lg" sets values at 16px, for modals; pair with FACT_VALUE_LG. */
  size?: "md" | "lg";
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-[12px] font-medium text-black/65">{label}</dt>
      <dd
        className={`flex flex-wrap items-center gap-x-1 text-black/55 ${size === "lg" ? "text-[16px]" : "text-[14px]"}`}
      >
        {children}
      </dd>
      {detail && <p className="text-[12px] text-black/55">{detail}</p>}
    </div>
  );
}

const DATE_LABEL = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" });

/** A date (YYYY-MM-DD) in a chip; clicking opens the browser's date picker. */
export function DateChip({
  label,
  value,
  min,
  onChange,
  className = FACT_CHIP,
  showIcon = true,
}: {
  label: string;
  value: string;
  min?: string;
  onChange: (value: string) => void;
  className?: string;
  showIcon?: boolean;
}) {
  return (
    <label className={`${className} relative cursor-pointer`}>
      {showIcon && <CalendarDays size={11} className="text-black/45" />}
      {value ? DATE_LABEL.format(new Date(`${value}T00:00:00`)) : "Pick a date"}
      {!showIcon && <ChevronDown size={11} className="text-black/40" />}
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
