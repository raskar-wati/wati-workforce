"use client";

/** On/off switch, 38×22 (or 30×18 when `small`), Wati green when on. */
export function Switch({
  checked,
  onChange,
  label,
  small = false,
  disabled = false,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Accessible name, when no visible label sits next to it. */
  label?: string;
  small?: boolean;
  disabled?: boolean;
}) {
  const track = small ? "h-[18px] w-[30px]" : "h-[22px] w-[38px]";
  const knob = small ? "h-[14px] w-[14px]" : "h-[18px] w-[18px]";
  const on = small ? "translate-x-[14px]" : "translate-x-[18px]";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={`relative inline-flex ${track} shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-wati-green" : "bg-black/20"
      }`}
    >
      <span
        className={`inline-block ${knob} transform rounded-full bg-white shadow transition-transform ${
          checked ? on : "translate-x-[2px]"
        }`}
      />
    </button>
  );
}
