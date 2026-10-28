"use client";

import { AnimatePresence, motion } from "motion/react";
import { CalendarClock, ChevronDown, Megaphone, Users, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { RecommendedCampaign } from "../../lib/campaigns-data";
import { CATEGORY_LABEL } from "../../lib/template-draft";
import { AskWatiIcon } from "../icons/AskWatiIcon";
import { WhatsAppPhonePreview } from "./WhatsAppPhonePreview";

const DATE_FMT = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" });

/**
 * A Wati-recommended broadcast, opened from the calendar: the template as the
 * customer will see it, why Wati suggests it, and the two ways forward.
 */
export function RecommendedCampaignPreview({
  campaign,
  onClose,
  onEditWithAi,
  onApprove,
}: {
  campaign: RecommendedCampaign | null;
  onClose: () => void;
  /** Change the template in the Ask Wati chat before it goes for approval. */
  onEditWithAi?: (campaign: RecommendedCampaign) => void;
  /** Take the template as it is and move on to setting up the campaign. */
  onApprove?: (campaign: RecommendedCampaign) => void;
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
            className="relative flex max-h-full w-full max-w-[760px] gap-8 overflow-y-auto rounded-2xl bg-white p-6 shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close preview"
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-md text-black/50 hover:bg-black/[0.05] hover:text-black/80"
            >
              <X size={16} />
            </button>

            <div className="flex shrink-0 flex-col items-center gap-2">
              <p className="text-[13px] font-medium text-black/50">Preview</p>
              <WhatsAppPhonePreview draft={campaign.template} />
            </div>

            <div className="flex min-w-0 flex-1 flex-col pt-7">
              <p className="flex items-center gap-1.5 text-[12px] font-medium text-[#1e2a8a]">
                <AskWatiIcon size={14} />
                Wati recommends
              </p>
              <h2
                id="recommended-campaign-title"
                className="mt-1.5 text-[18px] font-semibold tracking-[-0.2px] text-[#0a0a0a]"
              >
                {campaign.name}
              </h2>
              <p className="mt-2 text-[13px] leading-[19px] text-black/65">{campaign.reason}</p>

              <dl className="mt-5 flex flex-col gap-3 text-[13px]">
                <Fact icon={<CalendarClock size={14} />} label="When">
                  {DATE_FMT.format(new Date(`${campaign.date}T00:00:00`))} · {campaign.sendTime}
                </Fact>
                <Fact icon={<Users size={14} />} label="Audience">
                  {campaign.audience.name} · {campaign.audience.contacts.toLocaleString("en-IN")} contacts
                </Fact>
              </dl>

              <div className="mt-4 flex flex-wrap gap-1.5">
                <Chip>{campaign.template.name}</Chip>
                <Chip>{CATEGORY_LABEL[campaign.template.category]}</Chip>
                <Chip>{campaign.template.language}</Chip>
              </div>

              <div className="mt-auto flex items-center justify-end gap-2 pt-8">
                <EditTemplateMenu onEditWithAi={() => onEditWithAi?.(campaign)} />
                <button
                  type="button"
                  onClick={() => onApprove?.(campaign)}
                  className="rounded-lg bg-wati-green px-4 py-2 text-[13px] font-medium text-white hover:bg-wati-green-hover"
                >
                  Approve and proceed
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Fact({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 text-black/40">{icon}</span>
      <div>
        <dt className="text-[12px] text-black/45">{label}</dt>
        <dd className="text-[#0a0a0a]">{children}</dd>
      </div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-black/[0.04] px-2.5 py-1 text-[12px] text-black/65">{children}</span>
  );
}

/**
 * "Edit template" opens two ways to edit, right above the button: the
 * Broadcast editor (not part of this prototype) or Ask Wati.
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
          className="absolute bottom-full right-0 z-10 mb-2 w-[200px] rounded-xl border border-wati-border bg-white p-1 shadow-[0_8px_24px_rgba(0,0,0,0.1)]"
        >
          <button type="button" role="menuitem" onClick={() => setOpen(false)} className={item}>
            <Megaphone size={14} className="text-black/50" />
            Edit in Broadcast
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
          </button>
        </div>
      )}
    </div>
  );
}
