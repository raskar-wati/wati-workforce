"use client";

/** Small inline number input for sentence-style settings ("older than [100] days"). */
export function NumberField({
  value,
  onChange,
  label,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <input
      type="number"
      min={1}
      aria-label={label}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(Math.max(1, Number(e.target.value) || 1))}
      className="h-7 w-16 rounded-lg border border-[var(--wati-border-default)] bg-white px-2 text-[13px] text-[#0a0a0a] outline-none focus:border-[#1570EF] disabled:opacity-50"
    />
  );
}
