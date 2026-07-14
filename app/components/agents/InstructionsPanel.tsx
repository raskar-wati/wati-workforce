"use client";

import { Pencil, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * Inline instructions panel for an agent. Click the body to edit; Save/Cancel
 * appear once dirty. Lives in the chat surface — there is no separate page.
 */
export function InstructionsPanel({
  instructions,
  onSave,
  onClose,
}: {
  instructions: string;
  onSave: (next: string) => void;
  onClose?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(instructions);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) setDraft(instructions);
  }, [instructions, editing]);

  useEffect(() => {
    if (editing && textareaRef.current) {
      const el = textareaRef.current;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [editing]);

  const dirty = editing && draft !== instructions;

  const startEdit = () => {
    setDraft(instructions);
    setEditing(true);
  };

  const cancel = () => {
    setDraft(instructions);
    setEditing(false);
  };

  const save = () => {
    onSave(draft);
    setEditing(false);
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#e5e5e5] bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.5px] text-black/45">
            Instructions
          </p>
          {!editing && (
            <button
              type="button"
              onClick={startEdit}
              aria-label="Edit instructions"
              className="flex h-6 w-6 items-center justify-center rounded-full text-black/45 hover:bg-black/[0.04] hover:text-[#0a0a0a]"
            >
              <Pencil size={12} strokeWidth={1.75} />
            </button>
          )}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close instructions"
            className="flex h-6 w-6 items-center justify-center rounded-full text-black/45 hover:bg-black/[0.04] hover:text-[#0a0a0a]"
          >
            <X size={14} strokeWidth={1.75} />
          </button>
        )}
      </div>

      {editing ? (
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={Math.min(20, Math.max(6, draft.split("\n").length + 1))}
          className="w-full resize-y rounded-xl border border-[#e5e5e5] bg-white px-3 py-2.5 text-[13px] leading-[20px] tracking-[-0.078px] text-[#0a0a0a] outline-none focus:border-[#1570EF]"
        />
      ) : (
        <button
          type="button"
          onClick={startEdit}
          className="-mx-2 rounded-xl px-2 py-1.5 text-left text-[13px] leading-[20px] tracking-[-0.078px] text-[#0a0a0a]/85 hover:bg-black/[0.03]"
        >
          <pre className="whitespace-pre-wrap font-sans">{instructions}</pre>
        </button>
      )}

      {dirty && (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={cancel}
            className="rounded-full px-3 py-1.5 text-[13px] tracking-[-0.078px] text-black/70 hover:bg-black/[0.04]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            className="rounded-full bg-[#0a0a0a] px-3 py-1.5 text-[13px] tracking-[-0.078px] text-white hover:bg-[#0a0a0a]/90"
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}
