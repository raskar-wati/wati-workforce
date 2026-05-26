"use client";

/**
 * Right-column placeholder when the list has items but none is selected.
 * In practice the inbox auto-selects the first item, so this is rarely seen —
 * but it covers the edge case where the user deselects.
 */
export function HandoffInboxPlaceholder() {
  return (
    <div className="flex h-full flex-1 items-center justify-center text-[13px] tracking-[-0.078px] text-black/40">
      Select a handoff to view its details
    </div>
  );
}
