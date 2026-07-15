"use client";

import { motion } from "motion/react";
import { AlertTriangle, Check, OctagonX } from "lucide-react";
import type { ReactNode } from "react";

/**
 * The typed-card chassis from PRD sub-page 6 ("Component family rule"):
 * answer, draft, confirmation, receipt, waiting-state, diagnostic,
 * plan/partial-state, denial, scope, and run cards are all variants of one
 * chassis — one header grammar (icon + title + state pill), one evidence-row
 * grammar, one action-row grammar.
 */

/* ---------------------------------------------------------------- StatePill */

export type ObjectState = "draft" | "live" | "pending-meta" | "armed" | "failed";

const STATE_STYLES: Record<ObjectState, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "bg-wati-state-draft-bg text-wati-state-draft-text",
  },
  live: {
    label: "Live",
    className: "bg-wati-state-live-bg text-wati-state-live-text",
  },
  "pending-meta": {
    label: "Pending Meta",
    className: "bg-wati-state-pending-bg text-wati-state-pending-text",
  },
  armed: {
    label: "Armed",
    className: "bg-wati-state-armed-bg text-wati-state-armed-text",
  },
  failed: {
    label: "Failed",
    className: "bg-wati-state-danger-bg text-wati-state-danger-text",
  },
};

export function StatePill({
  state,
  label,
}: {
  state: ObjectState;
  /** Override the default label, e.g. "Rejected" on a failed template. */
  label?: string;
}) {
  const style = STATE_STYLES[state];
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.02em] ${style.className}`}
    >
      {label ?? style.label}
    </span>
  );
}

/* -------------------------------------------------------------- EvidenceRow */

export type Verdict = "ok" | "warn" | "blocker" | "info";

const VERDICT_ICONS: Record<Verdict, ReactNode> = {
  ok: <Check size={12} strokeWidth={2.5} className="text-wati-green-text" />,
  warn: (
    <AlertTriangle size={12} strokeWidth={2.5} className="text-wati-state-draft-text" />
  ),
  blocker: (
    <OctagonX size={12} strokeWidth={2.5} className="text-wati-state-danger-text" />
  ),
  info: <span className="h-1 w-1 rounded-full bg-black/30" />,
};

export function EvidenceRow({
  verdict = "info",
  metric,
  children,
}: {
  verdict?: Verdict;
  /** Right-aligned evidence metric, e.g. "38 msgs/wk" or "₹4,120". */
  metric?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 text-[13px] leading-[18px] tracking-[-0.078px]">
      <span className="flex h-[18px] w-3.5 shrink-0 items-center justify-center">
        {VERDICT_ICONS[verdict]}
      </span>
      <span className="min-w-0 flex-1 text-black/70">{children}</span>
      {metric && (
        <span className="shrink-0 font-medium tabular-nums text-black/50">{metric}</span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ WorkforceCard */

export type CardTone = "success" | "draft" | "info" | "danger" | "neutral";

const TONE_CHIP: Record<CardTone, string> = {
  success: "bg-wati-green-soft text-wati-green-text",
  draft: "bg-wati-state-draft-bg text-wati-state-draft-text",
  info: "bg-wati-state-pending-bg text-wati-state-pending-text",
  danger: "bg-wati-state-danger-bg text-wati-state-danger-text",
  neutral: "bg-wati-chip-bg text-black/55",
};

export function WorkforceCard({
  icon,
  tone = "neutral",
  title,
  subtitle,
  note,
  state,
  stateLabel,
  children,
  actions,
}: {
  /** Bare lucide icon; the chassis wraps it in the tone chip. */
  icon?: ReactNode;
  tone?: CardTone;
  title: string;
  subtitle?: string;
  /** Tone-colored line under the subtitle, e.g. the draft-approval notice. */
  note?: string;
  state?: ObjectState;
  stateLabel?: string;
  /** Card body — evidence rows, tables, previews. */
  children?: ReactNode;
  /** Action row — CTA chips, approve/undo affordances. */
  actions?: ReactNode;
}) {
  const noteColor =
    tone === "danger" ? "text-wati-state-danger-text" : "text-wati-state-draft-text";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
      className="flex flex-col gap-3 rounded-2xl border border-wati-border bg-white px-5 py-4"
    >
      <div className="flex items-start gap-3">
        {icon && (
          <span
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${TONE_CHIP[tone]}`}
          >
            {icon}
          </span>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <p className="min-w-0 flex-1 text-[13px] font-medium tracking-[-0.078px] text-[#0a0a0a]">
              {title}
            </p>
            {state && <StatePill state={state} label={stateLabel} />}
          </div>
          {subtitle && (
            <p className="text-[12px] tracking-[-0.06px] text-black/50">{subtitle}</p>
          )}
          {note && <p className={`text-[12px] tracking-[-0.06px] ${noteColor}`}>{note}</p>}
        </div>
      </div>
      {children && <div className="flex flex-col gap-2">{children}</div>}
      {actions && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">{actions}</div>
      )}
    </motion.div>
  );
}

/* ------------------------------------------------------------- CardCtaChip */

/** The pill-shaped CTA used in card action rows (deep links, approvals). */
export function CardCtaChip({
  children,
  primary = false,
  onClick,
}: {
  children: ReactNode;
  primary?: boolean;
  onClick?: () => void;
}) {
  const className = primary
    ? "inline-flex items-center gap-1.5 rounded-full bg-wati-green px-3 py-1.5 text-[13px] tracking-[-0.078px] text-white hover:bg-wati-green-hover"
    : "inline-flex items-center gap-1.5 rounded-full border border-wati-border bg-white px-3 py-1.5 text-[13px] tracking-[-0.078px] text-[#0a0a0a] hover:bg-black/[0.03]";
  if (!onClick) {
    return (
      <span aria-hidden className={className}>
        {children}
      </span>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
}
