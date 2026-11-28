"use client";

import {
  Contact,
  Download,
  FileArchive,
  Image as ImageIcon,
  MessageSquareText,
  Upload,
  X,
  type LucideIcon,
} from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { NumberField } from "../ui/NumberField";
import { Select } from "../ui/Select";
import { Switch } from "../ui/Switch";
import { BTN, BTN_OUTLINE, BTN_PRIMARY, HINT } from "./settings-styles";

type DataKind = "media" | "text" | "contacts";

const AUTO_DELETE: { id: DataKind; icon: LucideIcon; title: string; noun: string }[] = [
  { id: "media", icon: ImageIcon, title: "Media messages", noun: "Images, video, audio and documents" },
  { id: "text", icon: MessageSquareText, title: "Text messages", noun: "Text-only messages" },
  { id: "contacts", icon: Contact, title: "Contacts", noun: "Contacts with no activity" },
];

/** Demo numbers for "Find": roughly what a mid-size workspace would see. */
const estimate = (kind: Exclude<DataKind, "contacts">, days: number) => {
  const count = Math.max(0, Math.round((kind === "media" ? 5200 : 41800) * (365 / Math.max(days, 30)) * 0.35));
  const mb = kind === "media" ? count * 0.9 : count * 0.002;
  return { count, size: mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(1)} MB` };
};

/**
 * Settings > Workspace > Chat Data: back up and restore chats, auto-delete
 * old data, and delete old messages by hand.
 */
export function ChatDataSettings() {
  return (
    <div className="flex max-w-[640px] flex-col gap-6">
      <p className="-mt-5 text-[13px] text-black/60">
        Back up, restore and clean up your workspace&apos;s chat history.
      </p>
      <BackupSection />
      <AutoDeleteSection />
      <ManualDeleteSection />
    </div>
  );
}

function BackupSection() {
  const [exporting, setExporting] = useState<"idle" | "running" | "ready">("idle");
  const [file, setFile] = useState<File | null>(null);
  const [imported, setImported] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const pick = (f: File | undefined) => {
    if (!f) return;
    setFile(f);
    setImported(false);
  };

  return (
    <Section label="Backup & restore">
      <Row
        icon={Download}
        title="Export chats"
        body={
          exporting === "ready"
            ? "Your backup is ready. We've also emailed you a download link."
            : "Download every chat in this workspace as a .zip backup."
        }
        control={
          <button
            type="button"
            disabled={exporting === "running"}
            onClick={() => {
              setExporting("running");
              setTimeout(() => setExporting("ready"), 1200);
            }}
            className={BTN_OUTLINE}
          >
            {exporting === "running" ? "Preparing…" : exporting === "ready" ? "Download .zip" : "Export"}
          </button>
        }
      />
      <Row
        icon={Upload}
        title="Import chats"
        body="Restore chats from a Wati backup (.zip)."
      >
        {file ? (
          <div className="mt-3 flex items-center gap-2.5 rounded-lg border border-[var(--wati-border-default)] bg-white px-3 py-2">
            <FileArchive size={16} strokeWidth={1.75} className="shrink-0 text-black/55" />
            <span className="min-w-0 flex-1 truncate text-[13px] text-[#0a0a0a]">{file.name}</span>
            {imported ? (
              <span className="text-[12px] font-medium text-wati-green">Imported</span>
            ) : (
              <>
                <button type="button" onClick={() => setImported(true)} className={BTN_PRIMARY}>
                  Import
                </button>
                <button
                  type="button"
                  aria-label="Remove file"
                  onClick={() => setFile(null)}
                  className="grid size-7 place-items-center rounded-full text-black/50 hover:bg-black/[0.04]"
                >
                  <X size={14} />
                </button>
              </>
            )}
          </div>
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              pick(e.dataTransfer.files[0]);
            }}
            className={`mt-3 flex items-center justify-center gap-1 rounded-lg border border-dashed px-3 py-4 text-[13px] text-black/60 ${
              dragging ? "border-wati-green bg-[#e4f8f0]" : "border-[#cfd6de] bg-white"
            }`}
          >
            Drag a .zip file here, or
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="font-medium text-[#1570EF] hover:underline"
            >
              browse
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".zip,application/zip"
              className="hidden"
              onChange={(e) => pick(e.target.files?.[0])}
            />
          </div>
        )}
      </Row>
    </Section>
  );
}

function AutoDeleteSection() {
  const [rules, setRules] = useState<Record<DataKind, { on: boolean; days: number }>>({
    media: { on: false, days: 100 },
    text: { on: false, days: 100 },
    contacts: { on: false, days: 100 },
  });
  const set = (id: DataKind, patch: Partial<{ on: boolean; days: number }>) =>
    setRules((r) => ({ ...r, [id]: { ...r[id], ...patch } }));

  return (
    <Section label="Auto-delete" hint="Runs daily. Deleted data can't be recovered.">
      {AUTO_DELETE.map(({ id, icon, title, noun }) => (
        <Row
          key={id}
          icon={icon}
          title={title}
          body={
            <span className="flex flex-wrap items-center gap-1.5">
              {noun} older than
              <NumberField
                value={rules[id].days}
                onChange={(days) => set(id, { days })}
                label={`${title} retention in days`}
                disabled={!rules[id].on}
              />
              days
            </span>
          }
          control={<Switch checked={rules[id].on} onChange={(on) => set(id, { on })} label={`Auto-delete ${title.toLowerCase()}`} />}
        />
      ))}
    </Section>
  );
}

function ManualDeleteSection() {
  const [kind, setKind] = useState<"text" | "media">("text");
  const [days, setDays] = useState(100);
  const [result, setResult] = useState<{ count: number; size: string } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [deleted, setDeleted] = useState<number | null>(null);

  const reset = () => {
    setResult(null);
    setConfirming(false);
    setDeleted(null);
  };

  return (
    <Section label="Delete manually"hint="Find messages to delete now, and see how much space they take.">
      <div className="px-4 py-3.5">
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-[#353735]">
          Find
          <Select
            aria-label="Message type"
            value={kind}
            onChange={(e) => {
              setKind(e.target.value as "text" | "media");
              reset();
            }}
            className="w-[100px]"
          >
            <option value="text">Text</option>
            <option value="media">Media</option>
          </Select>
          messages older than
          <NumberField
            value={days}
            onChange={(v) => {
              setDays(v);
              reset();
            }}
            label="Older than, in days"
          />
          days
          <button
            type="button"
            onClick={() => {
              setResult(estimate(kind, days));
              setConfirming(false);
              setDeleted(null);
            }}
            className={`${BTN_OUTLINE} ml-auto`}
          >
            Find
          </button>
        </div>

        {deleted !== null ? (
          <p className="mt-3 rounded-lg bg-[var(--wati-surface-subtle)] px-3 py-2.5 text-[13px] text-[#353735]">
            Deleted {deleted.toLocaleString()} {kind} messages.
          </p>
        ) : (
          result && (
            <div className="mt-3 flex items-center gap-3 rounded-lg bg-[var(--wati-surface-subtle)] px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-[#0a0a0a]">
                  {result.count.toLocaleString()} messages · {result.size}
                </p>
                <p className={HINT}>
                  {confirming
                    ? "This permanently deletes them. It can't be undone."
                    : `${kind === "media" ? "Media" : "Text"} messages older than ${days} days`}
                </p>
              </div>
              {result.count === 0 ? null : confirming ? (
                <>
                  <button type="button" onClick={() => setConfirming(false)} className={BTN}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleted(result.count)}
                    className="rounded-full bg-[#E5484D] px-3 py-1.5 text-[13px] font-medium text-white hover:bg-[#d13d42]"
                  >
                    Delete permanently
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  className="rounded-full border border-[#f3c2c4] bg-white px-3 py-1.5 text-[13px] font-medium text-[#d13d42] hover:bg-red-50"
                >
                  Delete
                </button>
              )}
            </div>
          )
        )}
      </div>
    </Section>
  );
}

function Section({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <div>
        <h2 className="text-[13px] font-semibold text-[#0a0a0a]">{label}</h2>
        {hint && <p className={HINT}>{hint}</p>}
      </div>
      <div className="overflow-hidden rounded-xl border border-[var(--wati-border-default)]">{children}</div>
    </section>
  );
}

function Row({
  icon: Icon,
  title,
  body,
  control,
  children,
}: {
  icon: LucideIcon;
  title: string;
  body: ReactNode;
  control?: ReactNode;
  /** Extra content under the row's text, full width. */
  children?: ReactNode;
}) {
  return (
    <div className="border-b border-black/[0.06] px-4 py-3.5 last:border-b-0">
      <div className="flex items-center gap-3">
        <span className="grid w-5 shrink-0 place-items-center self-start pt-0.5 text-black/55">
          <Icon size={17} strokeWidth={1.5} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-[#0a0a0a]">{title}</p>
          <div className={`${HINT} mt-0.5`}>{body}</div>
        </div>
        {control}
      </div>
      {children && <div className="pl-8">{children}</div>}
    </div>
  );
}
