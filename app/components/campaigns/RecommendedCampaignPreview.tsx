"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, Megaphone, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  AUDIENCE_SEGMENTS,
  CALENDAR_TODAY,
  DAILY_MESSAGING_LIMIT,
  SEND_TIMES,
  planFor,
  type CampaignPlan,
  type RecommendedCampaign,
} from "../../lib/campaigns-data";
import { CATEGORY_LABEL } from "../../lib/template-draft";
import { DateChip, FACT_VALUE_LG, FactSection, SelectChip } from "../chat/FactChips";
import { ConfirmDialog } from "../ConfirmDialog";
import { AskWatiIcon } from "../icons/AskWatiIcon";
import { WhatsAppPhonePreview } from "./WhatsAppPhonePreview";

/**
 * A Wati-recommended campaign, opened from the calendar: why Wati suggests
 * it, who it goes to and when (both changeable here), the template as the
 * customer will see it, and the two ways forward. The picks carry into chat.
 */
export function RecommendedCampaignPreview({
  campaign,
  onClose,
  onEditWithAi,
  onApprove,
  onDelete,
}: {
  campaign: RecommendedCampaign | null;
  onClose: () => void;
  /** Change the template in the Ask Wati chat before it goes for approval. */
  onEditWithAi?: (campaign: RecommendedCampaign, plan: CampaignPlan) => void;
  /** Take the template as it is and move on to setting up the campaign. */
  onApprove?: (campaign: RecommendedCampaign, plan: CampaignPlan) => void;
  /** Drop the recommendation; it leaves the calendar. */
  onDelete?: (campaign: RecommendedCampaign) => void;
}) {
  useEffect(() => {
    if (!campaign) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [campaign, onClose]);

  return (
    <AnimatePresence>
      {campaign && (
        <motion.div
          key="scrim"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-6"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="recommended-campaign-title"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-full w-full max-w-[820px] overflow-y-auto rounded-2xl bg-white shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close preview"
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-md text-black/50 hover:bg-black/[0.05] hover:text-black/80"
            >
              <X size={16} />
            </button>
            {/* Keyed so each opened recommendation starts from Wati's picks. */}
            <CampaignPlanForm
              key={campaign.id}
              campaign={campaign}
              onEditWithAi={onEditWithAi}
              onApprove={onApprove}
              onDelete={onDelete}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CampaignPlanForm({
  campaign,
  onEditWithAi,
  onApprove,
  onDelete,
}: {
  campaign: RecommendedCampaign;
  onEditWithAi?: (campaign: RecommendedCampaign, plan: CampaignPlan) => void;
  onApprove?: (campaign: RecommendedCampaign, plan: CampaignPlan) => void;
  onDelete?: (campaign: RecommendedCampaign) => void;
}) {
  const [plan, setPlan] = useState(() => planFor(campaign));
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const audience = AUDIENCE_SEGMENTS.find((s) => s.id === plan.audienceId) ?? AUDIENCE_SEGMENTS[0];
  const overLimit = audience.contacts > DAILY_MESSAGING_LIMIT;
  const times = SEND_TIMES.includes(plan.time) ? SEND_TIMES : [plan.time, ...SEND_TIMES];

  return (
    <>
      <div className="flex min-w-0 flex-1 flex-col p-8">
        <p className="flex items-center gap-1.5 text-[12px] font-medium text-wati-green-text">
          <AskWatiIcon size={14} />
          Wati recommends
        </p>
        <h2
          id="recommended-campaign-title"
          className="mt-2 text-[20px] font-semibold tracking-[-0.2px] text-[#0a0a0a]"
        >
          {campaign.name}
        </h2>
        <p className="mt-2.5 text-[14px] leading-[21px] text-black/75">{campaign.reason}</p>
        <p className="mt-1.5 text-[12px] text-black/50">Based on your campaign history</p>

        <dl className="mt-7 flex flex-col gap-5 border-t border-wati-border pt-6">
          <FactSection
            size="lg"
            label="Audience"
            detail={
              <>
                {audience.contacts.toLocaleString("en-IN")} contacts
                {overLimit && (
                  <span className="text-wati-state-draft-text">
                    {" "}
                    · {(audience.contacts - DAILY_MESSAGING_LIMIT).toLocaleString("en-IN")} over your daily limit
                  </span>
                )}
              </>
            }
          >
            <SelectChip
              label="Audience"
              value={plan.audienceId}
              options={AUDIENCE_SEGMENTS.map((s) => ({ value: s.id, label: s.name }))}
              onChange={(audienceId) => setPlan({ ...plan, audienceId })}
              className={FACT_VALUE_LG}
            />
          </FactSection>
          <FactSection size="lg" label="Send">
            <DateChip
              label="Send date"
              value={plan.date}
              min={CALENDAR_TODAY}
              onChange={(date) => setPlan({ ...plan, date })}
              className={FACT_VALUE_LG}
              showIcon={false}
            />
            at
            <SelectChip
              label="Send time"
              value={plan.time}
              options={times.map((t) => ({ value: t, label: t }))}
              onChange={(time) => setPlan({ ...plan, time })}
              className={FACT_VALUE_LG}
            />
          </FactSection>
          <FactSection
            size="lg"
            label="Template"
            detail={`${CATEGORY_LABEL[campaign.template.category]} · ${campaign.template.language}`}
          >
            <span className="text-[16px] font-medium text-[#0a0a0a]">{campaign.template.name}</span>
          </FactSection>
        </dl>

        <div className="mt-auto flex items-center justify-end gap-2 pt-10">
          <button
            type="button"
            onClick={() => onApprove?.(campaign, plan)}
            className="rounded-lg bg-wati-green px-4 py-2 text-[13px] font-medium text-white hover:bg-wati-green-hover"
          >
            Schedule campaign
          </button>
          <EditTemplateMenu onEditWithAi={() => onEditWithAi?.(campaign, plan)} />
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            title="Delete and remove from calendar"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium text-black/55 hover:bg-black/[0.04] hover:text-black/80"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-center gap-2 rounded-r-2xl bg-[#f7f7f8] px-8 pb-8 pt-6">
        <p className="text-[13px] font-medium text-black/50">Preview</p>
        <WhatsAppPhonePreview draft={campaign.template} />
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete this campaign?"
        confirmLabel="Delete"
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={() => onDelete?.(campaign)}
      >
        {campaign.name} will be removed from your calendar.
      </ConfirmDialog>
    </>
  );
}

/**
 * "Edit template" opens two ways to edit, right above the button: the
 * Campaigns editor (not part of this prototype) or Ask Wati.
 */
function EditTemplateMenu({ onEditWithAi }: { onEditWithAi: () => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  const item =
    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] text-[#0a0a0a] hover:bg-black/[0.04]";
  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-lg border border-wati-border bg-white px-4 py-2 text-[13px] font-medium text-[#0a0a0a] hover:bg-black/[0.03]"
      >
        Edit template
        <ChevronDown size={14} className={open ? "rotate-180 text-black/45" : "text-black/45"} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute bottom-full right-0 z-10 mb-2 w-[248px] rounded-xl border border-wati-border bg-white p-1 shadow-[0_8px_24px_rgba(0,0,0,0.1)]"
        >
          <button type="button" role="menuitem" onClick={() => setOpen(false)} className={item}>
            <Megaphone size={14} className="text-black/50" />
            Edit in Campaigns
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onEditWithAi();
            }}
            className={item}
          >
            <AskWatiIcon size={14} />
            Edit with AI
            <span className="ml-auto rounded-full bg-[#e9ebf8] px-2 py-0.5 text-[11px] font-medium text-[#1e2a8a]">
              Recommended
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
