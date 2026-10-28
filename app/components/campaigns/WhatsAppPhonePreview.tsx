"use client";

import {
  BadgeCheck,
  BatteryFull,
  Camera,
  ChevronLeft,
  Contact,
  Copy,
  ExternalLink,
  Info,
  Mic,
  MoreVertical,
  Phone,
  PhoneCall,
  Plus,
  Reply,
  ShoppingCart,
  Signal,
  Sticker,
  Store,
  Wifi,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import {
  allowsCustomButtons,
  buttonLabel,
  fixedButtonLabel,
  orderedButtons,
  type ButtonKind,
  type TemplateDraft,
} from "../../lib/template-draft";

const BUTTON_ICON: Record<ButtonKind, LucideIcon> = {
  url: ExternalLink,
  phone: Phone,
  "copy-code": Copy,
  "voice-call": PhoneCall,
  "request-contact": Contact,
  "quick-reply": Reply,
  flow: Workflow,
};

/**
 * A template as the customer's phone shows it: status bar, the business's
 * chat header, Meta's notice, the message, then the composer. Read-only;
 * the body scrolls inside the screen like a real chat.
 */
export function WhatsAppPhonePreview({
  draft,
  businessName = "Wati",
  time = "20:18",
}: {
  draft: TemplateDraft;
  businessName?: string;
  time?: string;
}) {
  const fixed = fixedButtonLabel(draft);
  const buttons = allowsCustomButtons(draft) ? orderedButtons(draft).map((r) => r.button) : [];
  return (
    <div className="flex w-[300px] flex-col overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
      {/* Status bar */}
      <div className="flex items-center justify-end gap-1 px-5 pt-2.5 pb-1 text-[10px] text-black/70">
        <Signal size={12} />
        <Wifi size={12} />
        <BatteryFull size={15} />
      </div>
      {/* Chat header */}
      <div className="flex items-center gap-2 border-b border-black/[0.06] px-3 pb-2">
        <ChevronLeft size={18} className="text-black/70" />
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-wati-green text-[11px] font-bold text-white">
          W
        </span>
        <span className="text-[14px] font-semibold text-[#111b21]">{businessName}</span>
        <BadgeCheck size={14} className="fill-[#1d9bf0] text-white" />
        <span className="ml-auto flex items-center gap-2 text-black/60">
          <Store size={15} />
          <MoreVertical size={15} />
        </span>
      </div>
      {/* Conversation */}
      <div className="h-[420px] overflow-y-auto bg-[#f5f5f4] px-3 py-3">
        <p className="mb-3 flex items-start gap-1.5 rounded-lg bg-[#d9f2ec] px-2.5 py-1.5 text-[11px] leading-[15px] text-black/55">
          <Info size={12} className="mt-0.5 shrink-0" />
          This business uses a secure service from Meta to manage this chat. Tap to learn more
        </p>
        <div className="overflow-hidden rounded-xl bg-white">
          {draft.header?.kind === "text" && (
            <p className="px-3 pt-3 text-[14px] font-semibold text-[#111b21]">{draft.header.text}</p>
          )}
          <p className="whitespace-pre-line px-3 pt-3 text-[14px] leading-[21px] text-[#111b21]">
            {draft.body}
          </p>
          <div className="flex items-end justify-between gap-3 px-3 pb-2 pt-2">
            <span className="text-[12px] text-black/50">{draft.footer ?? ""}</span>
            <span className="shrink-0 text-[11px] text-black/45">{time}</span>
          </div>
          {buttons.map((b, i) => {
            const Icon = BUTTON_ICON[b.kind];
            return (
              <div
                key={i}
                className="flex items-center justify-center gap-1.5 border-t border-black/[0.06] py-2.5 text-[13px] text-[#0b8ad6]"
              >
                <Icon size={13} />
                {buttonLabel(b)}
              </div>
            );
          })}
          {fixed && (
            <div className="flex items-center justify-center gap-1.5 border-t border-black/[0.06] py-2.5 text-[13px] text-[#0b8ad6]">
              <ShoppingCart size={13} />
              {fixed}
            </div>
          )}
        </div>
      </div>
      {/* Composer */}
      <div className="flex items-center gap-2 border-t border-black/[0.06] px-3 py-2.5 text-black/60">
        <Plus size={16} />
        <span className="flex h-7 flex-1 items-center justify-end rounded-full border border-black/15 px-2">
          <Sticker size={13} />
        </span>
        <Camera size={16} />
        <Mic size={16} />
      </div>
    </div>
  );
}
