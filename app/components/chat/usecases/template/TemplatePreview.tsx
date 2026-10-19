"use client";

import {
  ArrowDown,
  ArrowUp,
  Contact,
  Copy,
  ExternalLink,
  ImageIcon,
  Pencil,
  Phone,
  PhoneCall,
  Reply,
  Workflow,
  X,
  type LucideIcon,
} from "lucide-react";
import { Fragment, useState } from "react";
import {
  buttonLabel,
  isQuickReply,
  orderedButtons,
  type ButtonKind,
  type TemplateButton,
  type TemplateDraft,
} from "../../../../lib/template-draft";

/**
 * How the template lands in a customer's WhatsApp: header, body with its
 * variables marked, footer, then the buttons as tappable rows. Pass
 * `onButtonsChange` to let the user edit or remove buttons in place, and
 * `onReorder` to let them move the quick-reply group above or below the
 * call-to-action group.
 */
export function TemplatePreview({
  draft,
  onButtonsChange,
  onReorder,
}: {
  draft: TemplateDraft;
  onButtonsChange?: (buttons: TemplateButton[]) => void;
  onReorder?: (quickRepliesFirst: boolean) => void;
}) {
  const rows = orderedButtons(draft);
  const bothGroups =
    draft.buttons.some(isQuickReply) && draft.buttons.some((b) => !isQuickReply(b));
  const firstQuickReply = rows.find((r) => isQuickReply(r.button))?.index;
  return (
    <div className="rounded-xl bg-[#efe9e1] p-3">
      <div className="max-w-[340px] overflow-hidden rounded-lg rounded-tl-none bg-white shadow-[0_1px_0.5px_rgba(0,0,0,0.13)]">
        {draft.header?.kind === "image" && (
          <div className="p-1 pb-0">
            <div className="flex h-[120px] flex-col items-center justify-center gap-1 rounded-md bg-black/[0.05] text-black/40">
              <ImageIcon size={20} strokeWidth={1.75} />
              <span className="max-w-[90%] truncate text-[11px]">
                {draft.header.fileName ?? "Header image"}
              </span>
            </div>
          </div>
        )}
        <div className="flex flex-col gap-1 px-2.5 pb-1.5 pt-2">
          {draft.header?.kind === "text" && (
            <p className="text-[13px] font-semibold text-[#111b21]">{draft.header.text}</p>
          )}
          <p className="whitespace-pre-line text-[13px] leading-[18px] text-[#111b21]">
            <BodyText body={draft.body} />
          </p>
          <div className="flex items-end justify-between gap-3">
            <span className="text-[11px] text-black/45">{draft.footer ?? ""}</span>
            <span className="shrink-0 text-[10px] text-black/40">10:24</span>
          </div>
        </div>
        {rows.map(({ button: b, index: i }) =>
          onButtonsChange ? (
            <EditableButtonRow
              key={i}
              button={b}
              onChange={(next) =>
                onButtonsChange(draft.buttons.map((x, j) => (j === i ? next : x)))
              }
              onRemove={() => onButtonsChange(draft.buttons.filter((_, j) => j !== i))}
              reorder={
                onReorder && bothGroups && i === firstQuickReply
                  ? {
                      up: !draft.quickRepliesFirst,
                      onClick: () => onReorder(!draft.quickRepliesFirst),
                    }
                  : undefined
              }
            />
          ) : (
            <ButtonRow key={i} button={b} />
          ),
        )}
      </div>
    </div>
  );
}

function BodyText({ body }: { body: string }) {
  const parts = body.split(/(\{\{\w+\}\})/g);
  return (
    <>
      {parts.map((part, i) =>
        /^\{\{\w+\}\}$/.test(part) ? (
          <span
            key={i}
            className="rounded bg-wati-green-soft px-1 font-medium text-wati-green-text"
          >
            {part}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

const BUTTON_ICON: Record<ButtonKind, LucideIcon> = {
  url: ExternalLink,
  phone: Phone,
  "copy-code": Copy,
  "voice-call": PhoneCall,
  "request-contact": Contact,
  "quick-reply": Reply,
  flow: Workflow,
};

function ButtonRow({ button }: { button: TemplateButton }) {
  const Icon = BUTTON_ICON[button.kind];
  const label = buttonLabel(button);
  return (
    <div className="flex items-center justify-center gap-1.5 border-t border-black/[0.08] py-2 text-[13px] text-[#0b8ad6]">
      <Icon size={13} strokeWidth={2} />
      {label}
    </div>
  );
}

/**
 * A button row that opens into inputs on click: the label (or the code, for a
 * copy-code button) and, for a link, its URL. Enter or leaving the row saves;
 * Escape cancels.
 */
function EditableButtonRow({
  button,
  onChange,
  onRemove,
  reorder,
}: {
  button: TemplateButton;
  onChange: (button: TemplateButton) => void;
  onRemove: () => void;
  /** On the first quick reply: move the quick-reply group up or down. */
  reorder?: { up: boolean; onClick: () => void };
}) {
  const [editing, setEditing] = useState(false);
  const [primary, setPrimary] = useState("");
  const [url, setUrl] = useState("");

  const open = () => {
    setPrimary(button.kind === "copy-code" ? button.code : button.text);
    setUrl(button.kind === "url" ? button.url : button.kind === "phone" ? button.phone : "");
    setEditing(true);
  };
  const save = () => {
    const value = primary.trim();
    if (value) {
      if (button.kind === "copy-code") onChange({ ...button, code: value.toUpperCase() });
      else if (button.kind === "url") onChange({ ...button, text: value, url: url.trim() || button.url });
      else if (button.kind === "phone") onChange({ ...button, text: value, phone: url.trim() || button.phone });
      else onChange({ ...button, text: value });
    }
    setEditing(false);
  };

  if (editing) {
    const field =
      "w-full rounded-md border border-black/15 bg-white px-2 py-1 text-[12px] text-[#111b21] outline-none focus:border-[#1570EF]";
    return (
      <div
        className="flex flex-col gap-1.5 border-t border-black/[0.08] px-2.5 py-2"
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) save();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") setEditing(false);
        }}
      >
        <input
          autoFocus
          value={primary}
          onChange={(e) => setPrimary(e.target.value)}
          aria-label={button.kind === "copy-code" ? "Coupon code" : "Button text"}
          placeholder={button.kind === "copy-code" ? "Coupon code" : "Button text"}
          maxLength={button.kind === "copy-code" ? 15 : undefined}
          className={field}
        />
        {(button.kind === "url" || button.kind === "phone") && (
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            aria-label={button.kind === "url" ? "Button link" : "Phone number"}
            placeholder={button.kind === "url" ? "https://" : "+91 98765 43210"}
            className={field}
          />
        )}
      </div>
    );
  }

  const Icon = BUTTON_ICON[button.kind];
  const label = buttonLabel(button);
  const ReorderIcon = reorder?.up ? ArrowUp : ArrowDown;
  return (
    <div className="group relative flex items-center border-t border-black/[0.08]">
      {reorder && (
        <button
          type="button"
          onClick={reorder.onClick}
          aria-label={reorder.up ? "Move quick replies to the top" : "Move quick replies to the bottom"}
          title={reorder.up ? "Move quick replies to the top" : "Move quick replies to the bottom"}
          className="absolute left-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-md text-black/45 hover:bg-black/[0.05] hover:text-black/75"
        >
          <ReorderIcon size={13} />
        </button>
      )}
      <button
        type="button"
        onClick={open}
        aria-label={`Edit button ${label}`}
        className="flex flex-1 items-center justify-center gap-1.5 py-2 text-[13px] text-[#0b8ad6] hover:bg-black/[0.02]"
      >
        <Icon size={13} strokeWidth={2} />
        {label}
        <Pencil size={11} className="text-black/30 opacity-0 transition-opacity group-hover:opacity-100" />
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove button ${label}`}
        className="absolute right-1.5 flex h-6 w-6 items-center justify-center rounded-md text-black/35 opacity-0 transition-opacity hover:bg-black/[0.05] hover:text-black/70 group-hover:opacity-100 focus:opacity-100"
      >
        <X size={12} />
      </button>
    </div>
  );
}
