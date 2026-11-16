import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";

/**
 * Compact native select with our own chevron, so the arrow sits a fixed
 * 10px from the right edge instead of wherever the browser puts it.
 */
export function Select({ className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className={`relative inline-flex ${className}`}>
      <select
        {...props}
        className="w-full cursor-pointer appearance-none rounded-lg border border-[var(--wati-border-default)] bg-white py-1 pl-2.5 pr-8 text-[12px] text-[#0a0a0a] outline-none hover:border-black/20 focus:border-[#1570EF]"
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        size={13}
        strokeWidth={2}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-black/50"
      />
    </span>
  );
}
