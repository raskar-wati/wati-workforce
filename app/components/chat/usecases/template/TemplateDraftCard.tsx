"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, Loader2, Pencil, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  BUTTON_TYPES,
  CATEGORY_LABEL,
  CHANNEL_LABEL,
  addButtonBlocker,
  TEMPLATE_LANGUAGES,
  canSubmit,
  checkTemplate,
  refineSuggestions,
  withBody,
  type RefineSuggestion,
  type TemplateCategory,
  type TemplateChannel,
  type TemplateDraft,
} from "../../../../lib/template-draft";
import { useTemplates, type TemplateStatus } from "../../../../lib/templates";
import { StatusIndicator } from "../../../agents/StatusIndicator";
import {
  CardCtaChip,
  EvidenceRow,
  WorkforceCard,
  type CardTone,
  type ObjectState,
} from "../../../cards/WorkforceCard";
import { TemplateMessagesIcon } from "../../../icons/TemplateMessagesIcon";
import { TemplatePreview } from "./TemplatePreview";

export type TemplateCardStage = "editing" | "review";

/** How long the "drafting" beat shows before a fresh version appears. */
const DRAFTING_BEAT_MS = 900;

const STATUS_PILL: Record<TemplateStatus, { state: ObjectState; label?: string; tone: CardTone }> = {
  draft: { state: "draft", label: "Saved draft", tone: "draft" },
  "pending-meta": { state: "pending-meta", tone: "info" },
  approved: { state: "live", label: "Approved", tone: "success" },
};

/**
 * One version of a template being made in chat. While editing it offers
 * one-tap refinements; "Looks good" turns the same card into the review step
 * (samples, checks, Submit / Save as draft). Once saved or submitted it
 * tracks the template's status from the templates store.
 */
export function TemplateDraftCard({
  threadId,
  draft,
  version,
  stage,
  templateId,
  fresh,
  onDraftChange,
  onRefine,
  onStageChange,
  onSaved,
  onFollowUp,
}: {
  threadId: string;
  draft: TemplateDraft;
  version: number;
  stage: TemplateCardStage;
  /** Set once saved or submitted. */
  templateId?: string;
  /** Just posted — play the drafting beat first. */
  fresh: boolean;
  /** In-place edits that aren't a new version (facts, samples). */
  onDraftChange: (draft: TemplateDraft) => void;
  /** A refinement chip — same as typing it. */
  onRefine: (text: string) => void;
  onStageChange: (stage: TemplateCardStage) => void;
  onSaved: (templateId: string) => void;
  /** Hand a next step to the composer. */
  onFollowUp: (prompt: string) => void;
}) {
  const { getTemplate, takenNames, saveDraft, submit } = useTemplates();
  const [drafting, setDrafting] = useState(fresh);
  useEffect(() => {
    if (!drafting) return;
    const t = window.setTimeout(() => setDrafting(false), DRAFTING_BEAT_MS);
    return () => window.clearTimeout(t);
  }, [drafting]);

  // The review step adds a few rows under the fold — bring them into view.
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (stage === "review") rootRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [stage]);

  if (drafting) {
    return <StatusIndicator text={version === 1 ? "Drafting your template" : "Updating the draft"} />;
  }

  const saved = templateId ? getTemplate(templateId) : undefined;
  const status = saved?.status;
  const locked = status === "pending-meta" || status === "approved";
  const reviewing = stage === "review" && !locked;
  const checks = checkTemplate(draft, takenNames(templateId));
  const pill = status ? STATUS_PILL[status] : null;

  const doSubmit = () => onSaved(submit(threadId, draft, templateId));
  const doSave = () => onSaved(saveDraft(threadId, draft, templateId));

  return (
    <div ref={rootRef}>
    <WorkforceCard
      icon={<TemplateMessagesIcon size={14} />}
      tone={pill?.tone ?? "neutral"}
      // While editing, the name sits in the editable facts row instead.
      title={locked ? draft.name : "Create Template"}
      subtitle={
        locked ? `${CHANNEL_LABEL[draft.channel ?? "whatsapp"]} template` : undefined
      }
      state={pill?.state}
      stateLabel={pill?.label}
      actions={
        locked ? (
          status === "approved" ? (
            <CardCtaChip onClick={() => onFollowUp(`Send ${draft.name} as a broadcast`)}>
              Use in a broadcast
            </CardCtaChip>
          ) : null
        ) : reviewing ? (
          <>
            <CardCtaChip primary disabled={!canSubmit(checks)} onClick={doSubmit}>
              Submit to Meta
            </CardCtaChip>
            <CardCtaChip onClick={doSave}>
              {status === "draft" ? "Update draft" : "Save as draft"}
            </CardCtaChip>
            <TextAction onClick={() => onStageChange("editing")}>Keep editing</TextAction>
          </>
        ) : (
          <CardCtaChip primary onClick={() => onStageChange("review")}>
            Looks good
          </CardCtaChip>
        )
      }
    >
      {!locked && <TemplateFacts draft={draft} onChange={onDraftChange} />}
      <TemplatePreview
        draft={draft}
        onButtonsChange={locked ? undefined : (buttons) => onDraftChange({ ...draft, buttons })}
        onReorder={
          locked ? undefined : (quickRepliesFirst) => onDraftChange({ ...draft, quickRepliesFirst })
        }
        onBodyChange={locked ? undefined : (body) => onDraftChange(withBody(draft, body))}
        onHeaderChange={locked ? undefined : (header) => onDraftChange({ ...draft, header })}
      />

      {!locked && !reviewing && (
        <RefineChips draft={draft} suggestions={refineSuggestions(draft)} onPick={onRefine} />
      )}

      {reviewing && (
        <div className="flex flex-col gap-3 pt-1">
          <SampleValues draft={draft} onChange={onDraftChange} />
          {checks.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {checks.map((c) => (
                <EvidenceRow key={c.text} verdict={c.verdict}>
                  {c.text}
                </EvidenceRow>
              ))}
            </div>
          )}
        </div>
      )}

      {status === "pending-meta" && (
        <div className="flex items-center gap-2 text-[13px] text-black/60">
          <Loader2 size={13} className="animate-spin text-wati-state-pending-text" />
          Meta is reviewing it — usually minutes, at most 48 hours. I&apos;ll ping you
          when it&apos;s done.
        </div>
      )}
      {status === "approved" && (
        <EvidenceRow verdict="ok">Approved — ready to use in broadcasts and automations</EvidenceRow>
      )}
      {status === "draft" && !reviewing && (
        <EvidenceRow verdict="info">Saved to Templates as a draft</EvidenceRow>
      )}
    </WorkforceCard>
    </div>
  );
}

/** Collapsed stand-in for a version that a newer one replaced. */
export function SupersededTemplateCard({
  draft,
  version,
}: {
  draft: TemplateDraft;
  version: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 self-start rounded-full px-1 text-[12px] text-black/45 hover:text-black/70"
      >
        <TemplateMessagesIcon size={13} />
        Earlier draft of {draft.name}
        <ChevronDown size={12} className={open ? "rotate-180 transition-transform" : "transition-transform"} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden opacity-70"
          >
            <TemplatePreview draft={draft} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------ Refine */

/**
 * Two groups, read differently: "+ field" chips add a part of the template;
 * grey secondary chips rewrite the copy, set apart after a divider.
 */
const FIELD_CHIP =
  "inline-flex items-center gap-1 rounded-full border border-dashed border-black/20 bg-white px-2.5 py-1 text-[12px] text-black/65 transition-colors hover:border-black/35 hover:bg-black/[0.03] hover:text-black/85";

function RefineChips({
  draft,
  suggestions,
  onPick,
}: {
  draft: TemplateDraft;
  suggestions: RefineSuggestion[];
  onPick: (prompt: string) => void;
}) {
  const fields = suggestions.filter((s) => s.kind === "field");
  const rewrites = suggestions.filter((s) => s.kind === "rewrite");
  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-1">
      {fields.map((s) => (
        <button key={s.label} type="button" onClick={() => onPick(s.prompt)} className={FIELD_CHIP}>
          <Plus size={11} strokeWidth={2.25} className="text-black/45" />
          {s.label}
        </button>
      ))}
      <AddButtonMenu draft={draft} onPick={onPick} />
      {rewrites.length > 0 && (
        <span aria-hidden className="mx-1 h-4 w-px bg-black/10" />
      )}
      {rewrites.map((s) => (
        <button
          key={s.label}
          type="button"
          onClick={() => onPick(s.prompt)}
          className="rounded-full bg-black/[0.05] px-2.5 py-1 text-[12px] text-black/70 transition-colors hover:bg-black/[0.08] hover:text-black/85"
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

/**
 * "+ Button" opens every button type Wati offers, grouped as WhatsApp shows
 * them. Types at their limit stay listed but disabled, with the reason.
 */
function AddButtonMenu({
  draft,
  onPick,
}: {
  draft: TemplateDraft;
  onPick: (prompt: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const groups = [
    { title: "Call to action", types: BUTTON_TYPES.filter((t) => t.group === "cta") },
    { title: "Quick reply", types: BUTTON_TYPES.filter((t) => t.group === "quick-reply") },
  ];
  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={FIELD_CHIP}
      >
        <Plus size={11} strokeWidth={2.25} className="text-black/45" />
        Button
      </button>
      {open && (
        <div
          role="menu"
          className="absolute bottom-full left-0 z-20 mb-1 w-[240px] rounded-xl border border-wati-border bg-white p-1 shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
        >
          {groups.map((g) => (
            <div key={g.title} className="flex flex-col py-0.5">
              <p className="px-2.5 pb-0.5 pt-1.5 text-[11px] font-medium text-black/40">{g.title}</p>
              {g.types.map((t) => {
                const blocker = addButtonBlocker(draft, t.kind);
                return (
                  <button
                    key={t.kind}
                    type="button"
                    role="menuitem"
                    disabled={blocker !== null}
                    title={blocker ?? undefined}
                    onClick={() => {
                      setOpen(false);
                      onPick(t.prompt);
                    }}
                    className="flex flex-col items-start rounded-lg px-2.5 py-1.5 text-left text-[13px] text-black/80 hover:bg-black/[0.04] disabled:cursor-not-allowed disabled:text-black/30 disabled:hover:bg-transparent"
                  >
                    {t.label}
                    {blocker && <span className="text-[11px] text-black/35">{blocker}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ Facts */

/** Channel, name, category and language — set for the user, editable in place. */
function TemplateFacts({
  draft,
  onChange,
}: {
  draft: TemplateDraft;
  onChange: (draft: TemplateDraft) => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const chip =
    "inline-flex items-center gap-1 rounded-full bg-black/[0.04] px-2.5 py-1 text-[12px] text-black/70 hover:bg-black/[0.07]";
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <SelectChip
        label="Channel"
        value={draft.channel ?? "whatsapp"}
        options={(Object.keys(CHANNEL_LABEL) as TemplateChannel[]).map((c) => ({
          value: c,
          label: CHANNEL_LABEL[c],
        }))}
        onChange={(channel) => onChange({ ...draft, channel: channel as TemplateChannel })}
        className={chip}
      />
      {editingName ? (
        <input
          autoFocus
          defaultValue={draft.name}
          onBlur={(e) => {
            const name = e.target.value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
            if (name) onChange({ ...draft, name });
            setEditingName(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") setEditingName(false);
          }}
          aria-label="Template name"
          className="w-[200px] rounded-full border border-[#1570EF] bg-white px-2.5 py-1 text-[12px] outline-none"
        />
      ) : (
        <button type="button" onClick={() => setEditingName(true)} className={chip}>
          {draft.name}
          <Pencil size={10} className="text-black/40" />
        </button>
      )}
      <SelectChip
        label="Category"
        value={draft.category}
        options={(Object.keys(CATEGORY_LABEL) as TemplateCategory[]).map((c) => ({
          value: c,
          label: CATEGORY_LABEL[c],
        }))}
        onChange={(category) => onChange({ ...draft, category: category as TemplateCategory })}
        className={chip}
      />
      <SelectChip
        label="Language"
        value={draft.language}
        options={TEMPLATE_LANGUAGES.map((l) => ({ value: l, label: l }))}
        onChange={(language) => onChange({ ...draft, language })}
        className={chip}
      />
    </div>
  );
}

function SelectChip({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  className: string;
}) {
  return (
    <label className={`${className} relative cursor-pointer`}>
      {options.find((o) => o.value === value)?.label ?? value}
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

/* ------------------------------------------------------------ Samples */

/** Meta needs an example for every variable; prefilled, so usually a glance. */
function SampleValues({
  draft,
  onChange,
}: {
  draft: TemplateDraft;
  onChange: (draft: TemplateDraft) => void;
}) {
  const entries = Object.entries(draft.samples);
  if (entries.length === 0) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[12px] text-black/50">Sample values for Meta&apos;s review</p>
      {entries.map(([key, value]) => (
        <label key={key} className="flex items-center gap-2">
          <span className="w-[120px] shrink-0 truncate font-mono text-[12px] text-wati-green-text">
            {`{{${key}}}`}
          </span>
          <input
            value={value}
            onChange={(e) =>
              onChange({ ...draft, samples: { ...draft.samples, [key]: e.target.value } })
            }
            placeholder="Example value"
            className="min-w-0 flex-1 rounded-lg border border-wati-border bg-white px-2.5 py-1.5 text-[13px] outline-none focus:border-[#1570EF]"
          />
        </label>
      ))}
    </div>
  );
}

function TextAction({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[13px] tracking-[-0.078px] text-black/55 hover:text-black/80"
    >
      {children}
    </button>
  );
}
