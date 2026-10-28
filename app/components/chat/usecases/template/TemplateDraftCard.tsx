"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, Loader2, Pencil, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  AUTH_SAMPLE_LIMIT,
  BUTTON_TYPES,
  CATEGORY_LABEL,
  OFFER_TITLE_LIMIT,
  ORDER_STATUS_LABEL,
  TEMPLATE_TYPES,
  TEMPLATE_TYPE_LABEL,
  allowsCustomButtons,
  withCategory,
  withType,
  type OrderStatus,
  type TemplateType,
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
import { modelLabel } from "../../../../lib/template-ai";
import { SelectChip, TextChip } from "../../FactChips";
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
  pending = false,
  drafter,
  canRewrite = false,
  onEnhance,
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
  /** Waiting on the model's draft. */
  pending?: boolean;
  /** Model id when the model wrote this draft, e.g. "Qwen/Qwen3.8-27B". */
  drafter?: string;
  /** The model is on, so rewrites apply to the user's own copy too. */
  canRewrite?: boolean;
  onEnhance?: (body: string) => Promise<string | null>;
  /** In-place edits that aren't a new version (facts, samples). */
  onDraftChange: (draft: TemplateDraft) => void;
  /** A refinement chip — same as typing it. */
  onRefine: (text: string) => void;
  onStageChange: (stage: TemplateCardStage) => void;
  /** After Save as draft or Submit to Meta, with the status it moved to. */
  onSaved: (templateId: string, status: "draft" | "pending-meta") => void;
  /** Hand a next step to the composer. Absent when the next step is
   *  already in the thread (a campaign's broadcast set-up). */
  onFollowUp?: (prompt: string) => void;
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

  if (drafting || pending) {
    return <StatusIndicator text={version === 1 ? "Drafting your template" : "Updating the draft"} />;
  }

  const saved = templateId ? getTemplate(templateId) : undefined;
  const status = saved?.status;
  const locked = status === "pending-meta" || status === "approved";
  const reviewing = stage === "review" && !locked;
  const isAuth = draft.category === "authentication";
  const suggestions = refineSuggestions(draft, canRewrite).filter(
    // Carousel cards carry their own images; the message has no header.
    (s) => !(s.label === "Image header" && draft.templateType === "carousel"),
  );
  const checks = checkTemplate(draft, takenNames(templateId));
  const pill = status ? STATUS_PILL[status] : null;

  const doSubmit = () => onSaved(submit(threadId, draft, templateId), "pending-meta");
  const doSave = () => onSaved(saveDraft(threadId, draft, templateId), "draft");

  return (
    <div ref={rootRef}>
    <WorkforceCard
      icon={<TemplateMessagesIcon size={14} />}
      tone={pill?.tone ?? "neutral"}
      // While editing, the name sits in the editable facts row instead.
      title={locked ? draft.name : "Create Template"}
      subtitle={
        locked
          ? `${CHANNEL_LABEL[draft.channel ?? "whatsapp"]} template`
          : drafter
            ? `Drafted with ${modelLabel(drafter)}`
            : undefined
      }
      state={pill?.state}
      stateLabel={pill?.label}
      actions={
        locked ? (
          status === "approved" && onFollowUp ? (
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
      {!locked && <FormatDetails draft={draft} onChange={onDraftChange} />}
      <TemplatePreview
        draft={draft}
        onButtonsChange={locked ? undefined : (buttons) => onDraftChange({ ...draft, buttons })}
        onReorder={
          locked ? undefined : (quickRepliesFirst) => onDraftChange({ ...draft, quickRepliesFirst })
        }
        onBodyChange={locked ? undefined : (body) => onDraftChange(withBody(draft, body))}
        onEnhance={locked ? undefined : onEnhance}
        onHeaderChange={locked ? undefined : (header) => onDraftChange({ ...draft, header })}
        onCardsChange={locked ? undefined : (cards) => onDraftChange({ ...draft, cards })}
      />

      {!locked && !reviewing && !isAuth && (
        <RefineChips draft={draft} suggestions={suggestions} onPick={onRefine} />
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
    {!locked && !reviewing && !isAuth && (
      <SuggestedReplies suggestions={suggestions} onPick={onRefine} />
    )}
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
 * Inside the card: "+ field" chips that add a part of the template and the
 * button menu. Copy rewrites sit outside, as replies.
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
  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-1">
      {fields.map((s) => (
        <button key={s.label} type="button" onClick={() => onPick(s.prompt)} className={FIELD_CHIP}>
          <Plus size={11} strokeWidth={2.25} className="text-black/45" />
          {s.label}
        </button>
      ))}
      {allowsCustomButtons(draft) && <AddButtonMenu draft={draft} onPick={onPick} />}
    </div>
  );
}

/**
 * Below the card: copy rewrites offered as suggested replies — tapping one
 * sends it as the user's next message.
 */
function SuggestedReplies({
  suggestions,
  onPick,
}: {
  suggestions: RefineSuggestion[];
  onPick: (prompt: string) => void;
}) {
  const rewrites = suggestions.filter((s) => s.kind === "rewrite");
  if (rewrites.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 pt-2.5">
      {rewrites.map((s) => (
        <button
          key={s.label}
          type="button"
          onClick={() => onPick(s.prompt)}
          className="rounded-full bg-black/[0.05] px-3 py-1.5 text-[13px] text-black/70 transition-colors hover:bg-black/[0.08] hover:text-black/85"
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
      />
      <TextChip
        label="Template name"
        value={draft.name}
        normalize={(v) => v.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_")}
        onChange={(name) => onChange({ ...draft, name })}
      />
      <SelectChip
        label="Category"
        value={draft.category}
        options={(Object.keys(CATEGORY_LABEL) as TemplateCategory[]).map((c) => ({
          value: c,
          label: CATEGORY_LABEL[c],
        }))}
        onChange={(category) => onChange(withCategory(draft, category as TemplateCategory))}
      />
      {TEMPLATE_TYPES[draft.category].length > 0 && (
        <SelectChip
          label="Template type"
          value={draft.templateType ?? "standard"}
          options={TEMPLATE_TYPES[draft.category].map((t) => ({
            value: t,
            label: TEMPLATE_TYPE_LABEL[t],
          }))}
          onChange={(type) => onChange(withType(draft, type as TemplateType))}
          />
      )}
      <SelectChip
        label="Language"
        value={draft.language}
        options={TEMPLATE_LANGUAGES.map((l) => ({ value: l, label: l }))}
        onChange={(language) => onChange({ ...draft, language })}
      />
    </div>
  );
}


/* ------------------------------------------------------------ Format */

const FORM_INPUT =
  "min-w-0 flex-1 rounded-lg border border-wati-border bg-white px-2.5 py-1.5 text-[13px] outline-none focus:border-[#1570EF]";

/** What the chosen format needs beyond the message itself. */
function FormatDetails({
  draft,
  onChange,
}: {
  draft: TemplateDraft;
  onChange: (draft: TemplateDraft) => void;
}) {
  if (draft.category === "authentication") {
    const sample = draft.samples["1"] ?? "";
    return (
      <div className="flex flex-col gap-1.5">
        <p className="text-[13px] font-medium text-[#0a0a0a]">Sample content</p>
        <p className="text-[12px] text-black/55">Just enter sample content here (it doesn&apos;t need to be exact!)</p>
        <div className="relative">
          <input
            value={sample}
            onChange={(e) =>
              onChange({ ...draft, samples: { ...draft.samples, "1": e.target.value } })
            }
            maxLength={AUTH_SAMPLE_LIMIT}
            placeholder="Enter content for {{1}}"
            aria-label="Sample content for {{1}}"
            className={`${FORM_INPUT} w-full pr-14`}
          />
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] tabular-nums text-black/40">
            {sample.length}/{AUTH_SAMPLE_LIMIT}
          </span>
        </div>
        <p className="text-[12px] text-black/55">
          Don&apos;t include any real user or customer information — sample content only.
        </p>
        <label className="flex items-center gap-2 pt-1 text-[12px] text-black/60">
          Code expires in
          <select
            value={draft.codeExpiryMinutes ?? 10}
            onChange={(e) => {
              const m = Number(e.target.value);
              onChange({ ...draft, codeExpiryMinutes: m, footer: `This code expires in ${m} minutes.` });
            }}
            className="rounded-md border border-wati-border bg-white px-1.5 py-1 text-[12px] outline-none"
          >
            {[1, 5, 10, 15, 30, 60, 90].map((m) => (
              <option key={m} value={m}>
                {m} minutes
              </option>
            ))}
          </select>
        </label>
      </div>
    );
  }
  if (draft.templateType === "limited-offer") {
    const title = draft.offerTitle ?? "";
    return (
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <input
            value={title}
            onChange={(e) => onChange({ ...draft, offerTitle: e.target.value })}
            maxLength={OFFER_TITLE_LIMIT}
            placeholder="Offer title"
            aria-label="Offer title"
            className={`${FORM_INPUT} w-full pr-12`}
          />
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] tabular-nums text-black/40">
            {title.length}/{OFFER_TITLE_LIMIT}
          </span>
        </div>
        <label className="flex items-center gap-1.5 text-[12px] text-black/60">
          Ends
          <input
            type="date"
            value={draft.offerEndsAt ?? ""}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => onChange({ ...draft, offerEndsAt: e.target.value })}
            aria-label="Offer end date"
            className={FORM_INPUT}
          />
        </label>
      </div>
    );
  }
  if (draft.templateType === "order-status") {
    return (
      <label className="flex items-center gap-2 text-[12px] text-black/60">
        Status shown
        <select
          value={draft.orderStatus ?? "shipped"}
          onChange={(e) => onChange({ ...draft, orderStatus: e.target.value as OrderStatus })}
          className="rounded-md border border-wati-border bg-white px-1.5 py-1 text-[12px] outline-none"
        >
          {(Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]).map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </label>
    );
  }
  return null;
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
  // Authentication's {{1}} sample has its own field above the preview.
  const entries = Object.entries(draft.samples).filter(
    ([key]) => !(draft.category === "authentication" && key === "1"),
  );
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
