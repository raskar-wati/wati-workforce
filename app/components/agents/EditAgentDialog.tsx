"use client";

import { Archive, Check, ChevronDown, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  DEFAULT_LLM_ID,
  LLM_OPTIONS,
  getLLMById,
  groupLLMsByProvider,
} from "../../lib/llm-models";
import { AvatarShufflePicker } from "./AvatarShufflePicker";

export type SchedulePreset = "daily" | "weekly" | "every-other-day";

const SCHEDULE_LABEL: Record<SchedulePreset, string> = {
  daily: "Daily",
  weekly: "Weekly",
  "every-other-day": "Every other day",
};

export type EditAgentValues = {
  name: string;
  description: string;
  avatarPath: string;
  instructions: string;
  schedulePreset: SchedulePreset;
  scheduleTime: string;
  model: string;
  active: boolean;
};

/**
 * Single edit surface for an agent. Triggered by "View Instructions" on
 * every agent card. Holds form state locally and only commits via onSave —
 * Cancel discards.
 */
export function EditAgentDialog({
  open,
  initial,
  archiveLabel = "Archive agent",
  onSave,
  onArchive,
  onClose,
}: {
  open: boolean;
  initial: EditAgentValues;
  archiveLabel?: string;
  onSave: (next: EditAgentValues) => void;
  onArchive: () => void;
  onClose: () => void;
}) {
  const [values, setValues] = useState<EditAgentValues>(initial);

  useEffect(() => {
    if (open) setValues(initial);
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const update = <K extends keyof EditAgentValues>(
    key: K,
    value: EditAgentValues[K],
  ) => setValues((v) => ({ ...v, [key]: value }));

  const save = () => onSave(values);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[88vh] w-full max-w-[560px] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
        <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
          <h2 className="text-[16px] font-medium tracking-[-0.096px] text-[#0a0a0a]">
            Edit agent
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

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
          <StatusRow
            active={values.active}
            onChange={(active) => update("active", active)}
          />

          <Field label="Name">
            <input
              value={values.name}
              onChange={(e) => update("name", e.target.value)}
              className={INPUT_CLASS}
              placeholder="Agent name"
            />
          </Field>

          <Field label="Description">
            <input
              value={values.description}
              onChange={(e) => update("description", e.target.value)}
              className={INPUT_CLASS}
              placeholder="One-line description of what this agent does"
            />
          </Field>

          <Field label="Avatar">
            <AvatarShufflePicker
              value={values.avatarPath}
              onChange={(path) => update("avatarPath", path)}
            />
          </Field>

          <Field label="Instructions">
            <textarea
              value={values.instructions}
              onChange={(e) => update("instructions", e.target.value)}
              rows={9}
              className={`${INPUT_CLASS} font-sans leading-[20px]`}
              placeholder="What this agent should do on each run"
            />
          </Field>

          <Field label="Schedule">
            <div className="flex flex-wrap gap-2">
              <select
                value={values.schedulePreset}
                onChange={(e) =>
                  update("schedulePreset", e.target.value as SchedulePreset)
                }
                className={`${SELECT_CLASS} min-w-[160px]`}
              >
                {(Object.keys(SCHEDULE_LABEL) as SchedulePreset[]).map((p) => (
                  <option key={p} value={p}>
                    {SCHEDULE_LABEL[p]}
                  </option>
                ))}
              </select>
              <input
                type="time"
                value={values.scheduleTime}
                onChange={(e) => update("scheduleTime", e.target.value)}
                className={`${SELECT_CLASS} w-[120px]`}
              />
            </div>
          </Field>

          <Field label="Model">
            <ModelPicker
              value={values.model}
              onChange={(id) => update("model", id)}
            />
          </Field>
        </div>

        <div className="flex items-center justify-between border-t border-black/[0.06] px-5 py-3">
          <button
            type="button"
            onClick={onArchive}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] tracking-[-0.078px] text-black/65 hover:bg-black/[0.04] hover:text-[#0a0a0a]"
          >
            <Archive size={14} strokeWidth={1.75} />
            {archiveLabel}
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
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
        </div>
      </div>
    </div>
  );
}

const INPUT_CLASS =
  "w-full rounded-xl border border-[#e5e5e5] bg-white px-3 py-2.5 text-[13px] tracking-[-0.078px] text-[#0a0a0a] outline-none focus:border-[#1570EF]";

const SELECT_CLASS =
  "rounded-xl border border-[#e5e5e5] bg-white px-3 py-2 text-[13px] tracking-[-0.078px] text-[#0a0a0a] outline-none focus:border-[#1570EF]";

function StatusRow({
  active,
  onChange,
}: {
  active: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[#e5e5e5] bg-[#fafafa] px-3 py-2.5">
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className={`h-2 w-2 rounded-full ${active ? "bg-emerald-500" : "bg-amber-500"}`}
        />
        <span className="text-[13px] font-medium tracking-[-0.078px] text-[#0a0a0a]">
          {active ? "Active" : "Inactive"}
        </span>
        <span className="text-[12px] tracking-[-0.06px] text-black/55">
          {active
            ? "Runs on the schedule below"
            : "Paused — runs are skipped"}
        </span>
      </div>
      <Switch checked={active} onChange={onChange} />
    </div>
  );
}

function Switch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-[22px] w-[38px] shrink-0 items-center rounded-full transition-colors ${
        checked ? "bg-emerald-500" : "bg-black/20"
      }`}
    >
      <span
        className={`inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[18px]" : "translate-x-[2px]"
        }`}
      />
    </button>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-medium tracking-[-0.06px] text-black/60">
        {label}
      </span>
      {children}
    </label>
  );
}

/**
 * Mirrors the composer's grouped model dropdown so the modal picker reads
 * as the same control. Shares LLM_OPTIONS data with Composer.
 */
function ModelPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const selected = getLLMById(value || DEFAULT_LLM_ID);
  const groups = groupLLMsByProvider();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-xl border border-[#e5e5e5] bg-white px-3 py-2.5 text-[13px] tracking-[-0.078px] text-[#0a0a0a] hover:border-black/30"
      >
        <span>{selected.name}</span>
        <ChevronDown size={14} className="text-black/55" />
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute bottom-full left-0 right-0 z-10 mb-1 max-h-[280px] overflow-y-auto rounded-2xl border border-[#e5e5e5] bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.1)]"
        >
          {groups.map(([provider, models], gi) => (
            <div key={provider}>
              {gi > 0 && <div className="mx-3 border-t border-[#f0f0f0]" />}
              <div className="px-3 pb-1 pt-2.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.8px] text-black/30">
                  {provider}
                </span>
              </div>
              {models.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  role="option"
                  aria-selected={selected.id === m.id}
                  onClick={() => {
                    onChange(m.id);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-black/[0.03]"
                >
                  <span className="flex-1 text-[13px] tracking-[-0.078px] text-[#0a0a0a]">
                    {m.name}
                  </span>
                  {selected.id === m.id && (
                    <Check size={12} className="text-[#0a0a0a]" />
                  )}
                </button>
              ))}
            </div>
          ))}
          {LLM_OPTIONS.length === 0 && (
            <div className="px-3 py-2 text-[12px] text-black/55">
              No models available
            </div>
          )}
        </div>
      )}
    </div>
  );
}
