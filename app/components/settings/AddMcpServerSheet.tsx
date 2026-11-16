"use client";

import { TriangleAlert, X } from "lucide-react";
import { useState } from "react";
import { useAskWatiSettings } from "../../lib/ask-wati-settings";
import type { Connector } from "../../lib/connectors-data";
import { BTN, BTN_PRIMARY, HINT, INPUT } from "./settings-styles";

/**
 * Add (or edit) a custom MCP server. Covers the whole settings surface it
 * opens from. Adding needs an HTTPS URL and an explicit risk consent.
 */
export function AddMcpServerSheet({
  editing,
  onClose,
  onSaved,
}: {
  editing?: Connector;
  onClose: () => void;
  onSaved: (id: string) => void;
}) {
  const { addCustomServer, updateCustomServer } = useAskWatiSettings();
  const [name, setName] = useState(editing?.name ?? "");
  const [description, setDescription] = useState(
    editing && editing.summary !== "Custom MCP server" ? editing.summary : "",
  );
  const [url, setUrl] = useState(editing ? `https://${editing.host}/mcp` : "");
  const [consent, setConsent] = useState(Boolean(editing));

  const urlOk = /^https:\/\/[^\s/]+\.[^\s]+/.test(url.trim());
  const canSave = name.trim().length > 0 && urlOk && consent;

  const save = () => {
    if (!canSave) return;
    const input = { name: name.trim(), description: description.trim(), url: url.trim() };
    if (editing) {
      updateCustomServer(editing.id, input);
      onSaved(editing.id);
    } else {
      onSaved(addCustomServer(input).id);
    }
  };

  return (
    <div
      role="dialog"
      aria-label={editing ? "Edit MCP server" : "Add custom MCP server"}
      className="absolute inset-0 z-10 flex flex-col bg-white"
    >
      <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
        <h2 className="text-[16px] font-medium tracking-[-0.096px] text-[#0a0a0a]">
          {editing ? "Edit MCP server" : "Add custom MCP server"}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-7 w-7 items-center justify-center rounded-full text-black/55 hover:bg-black/[0.04] hover:text-[#0a0a0a]"
        >
          <X size={16} strokeWidth={1.75} />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-[18px] overflow-y-auto px-5 py-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-[#0a0a0a]">Name</span>
          <input
            className={INPUT}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Order lookup"
            autoFocus
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-[#0a0a0a]">
            Description <span className="font-normal text-black/45">(optional)</span>
          </span>
          <input
            className={INPUT}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What it does, in a few words"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-[#0a0a0a]">Server URL</span>
          <input
            className={INPUT}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/mcp"
            inputMode="url"
          />
          <span className={HINT}>
            The server must be reachable over HTTPS. Wati AI reads its description and tools
            when you save.
          </span>
        </label>

        {!editing && (
          <>
            <div className="flex items-start gap-2 rounded-[10px] border border-[#f2dcb3] bg-[#fffbeb] px-3 py-2.5 text-[12px] text-[#8a5a12]">
              <TriangleAlert size={15} strokeWidth={1.75} className="mt-px shrink-0 text-[#b7791f]" />
              <span>Custom MCP servers carry risk. Only connect servers you trust.</span>
            </div>

            <label className="flex cursor-pointer gap-2.5 rounded-xl border border-[var(--wati-border-default)] bg-[#fafafa] p-3">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 h-[15px] w-[15px] shrink-0 accent-[var(--wati-green)]"
              />
              <span>
                <span className="block text-[13px] font-medium text-[#0a0a0a]">
                  I understand and want to continue
                </span>
                <span className="mt-0.5 block text-[12px] leading-[1.45] text-black/55">
                  An untrusted server may read information shared with it, or trick Wati AI
                  into using tools in ways you didn&apos;t intend, including changing or
                  deleting data.
                </span>
              </span>
            </label>
          </>
        )}
      </div>

      <div className="flex justify-end gap-2 border-t border-black/[0.06] px-5 py-3">
        <button type="button" className={BTN} onClick={onClose}>
          Cancel
        </button>
        <button type="button" className={BTN_PRIMARY} disabled={!canSave} onClick={save}>
          {editing ? "Save changes" : "Add server"}
        </button>
      </div>
    </div>
  );
}
