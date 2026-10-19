"use client";

import { Copy, ExternalLink, ImageIcon, Reply } from "lucide-react";
import { Fragment } from "react";
import type { TemplateButton, TemplateDraft } from "../../../../lib/template-draft";

/**
 * How the template lands in a customer's WhatsApp: header, body with its
 * variables marked, footer, then the buttons as tappable rows.
 */
export function TemplatePreview({ draft }: { draft: TemplateDraft }) {
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
        {draft.buttons.map((b, i) => (
          <ButtonRow key={i} button={b} />
        ))}
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

const BUTTON_ICON = {
  url: ExternalLink,
  "copy-code": Copy,
  "quick-reply": Reply,
} as const;

function ButtonRow({ button }: { button: TemplateButton }) {
  const Icon = BUTTON_ICON[button.kind];
  const label = button.kind === "copy-code" ? `Copy code ${button.code}` : button.text;
  return (
    <div className="flex items-center justify-center gap-1.5 border-t border-black/[0.08] py-2 text-[13px] text-[#0b8ad6]">
      <Icon size={13} strokeWidth={2} />
      {label}
    </div>
  );
}
