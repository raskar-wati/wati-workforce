"use client";

import { ChevronLeft, ChevronRight, LayoutGrid, Settings } from "lucide-react";
import { useAskWatiSettings } from "../../lib/ask-wati-settings";
import { Switch } from "../ui/Switch";
import { ConnectorTile } from "./ConnectorTile";

/**
 * "Composer + menu" placement. The row goes in the + menu's main list and
 * opens the submenu: quick on/off switches per connector, plus a way into
 * the full settings.
 */
export function ConnectorsMenuItem({ onOpen }: { onOpen: () => void }) {
  const { expiredCount } = useAskWatiSettings();
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onOpen}
      className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-black/[0.03]"
    >
      <LayoutGrid size={15} strokeWidth={2} className="shrink-0 text-[#0a0a0a]" />
      <span className="flex-1 text-[13px] font-medium tracking-[-0.078px] text-[#0a0a0a]">
        Connectors
      </span>
      {expiredCount > 0 && (
        <span className="whitespace-nowrap rounded-full bg-red-50 px-1.5 py-px text-[10px] font-medium text-red-600">
          {expiredCount} to reconnect
        </span>
      )}
      <ChevronRight size={14} strokeWidth={2} className="shrink-0 text-black/40" />
    </button>
  );
}

export function ConnectorsSubmenu({
  onBack,
  onDone,
}: {
  onBack: () => void;
  /** Called after an action that leaves the menu (opening settings). */
  onDone: () => void;
}) {
  const { connectors, setEnabled, reconnect, openSettings } = useAskWatiSettings();
  return (
    <div>
      <div className="flex items-center gap-1 px-2 pb-1 pt-1.5">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="flex h-6 w-6 items-center justify-center rounded text-black/55 hover:bg-black/[0.04]"
        >
          <ChevronLeft size={14} strokeWidth={2} />
        </button>
        <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-black/55">
          Connectors
        </span>
      </div>
      <div className="max-h-[260px] overflow-y-auto">
        {connectors.map((c) => (
          <div key={c.id} className="flex items-center gap-2 px-3 py-1.5">
            <ConnectorTile name={c.name} logo={c.logo} custom={c.custom} expired={c.expired} size="sm" />
            <span className="min-w-0 flex-1">
              <span
                className={`block truncate text-[13px] tracking-[-0.078px] ${
                  c.enabled || c.expired ? "text-[#0a0a0a]" : "text-black/45"
                }`}
              >
                {c.name}
              </span>
            </span>
            {c.expired ? (
              <button
                type="button"
                onClick={() => reconnect(c.id)}
                className="rounded-full px-2 py-0.5 text-[12px] font-medium text-red-600 hover:bg-red-50"
              >
                Reconnect
              </button>
            ) : (
              <Switch
                small
                checked={c.enabled}
                onChange={(v) => setEnabled(c.id, v)}
                label={`Use ${c.name} in chats`}
              />
            )}
          </div>
        ))}
      </div>
      <div role="separator" className="my-1 h-px bg-[var(--wati-border-default)]" />
      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onDone();
          openSettings("connectors");
        }}
        className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-black/[0.03]"
      >
        <Settings size={15} strokeWidth={2} className="shrink-0 text-[#0a0a0a]" />
        <span className="text-[13px] font-medium tracking-[-0.078px] text-[#0a0a0a]">
          Manage connectors
        </span>
      </button>
    </div>
  );
}
