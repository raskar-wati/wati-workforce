"use client";

import {
  ArrowDown,
  ArrowUp,
  CircleCheck,
  Contact,
  Copy,
  ExternalLink,
  ImageIcon,
  Pencil,
  Package,
  Phone,
  PhoneCall,
  Plus,
  Reply,
  ShoppingCart,
  Tag,
  Trash2,
  Workflow,
  X,
  type LucideIcon,
} from "lucide-react";
import { Fragment, useRef, useState } from "react";
import { AskWatiIcon } from "../../../icons/AskWatiIcon";
import {
  BODY_LIMIT,
  CAROUSEL_TEXT_LIMIT,
  COUPON_CODE_LIMIT,
  MAX_CAROUSEL_CARDS,
  ORDER_STATUS_LABEL,
  allowsCustomButtons,
  buttonLabel,
  fixedButtonLabel,
  enhanceBody,
  isQuickReply,
  orderedButtons,
  type ButtonKind,
  type CarouselCard,
  type TemplateButton,
  type TemplateDraft,
  type TemplateHeader,
} from "../../../../lib/template-draft";

/**
 * How the template lands in a customer's WhatsApp: header, body with its
 * variables marked, footer, then the buttons as tappable rows. Pass
 * `onButtonsChange` to let the user edit or remove buttons in place, and
 * `onReorder` to let them move the quick-reply group above or below the
 * call-to-action group. `onBodyChange` and `onHeaderChange` make the body
 * and the image header editable on hover, `onCardsChange` the carousel cards.
 *
 * The template's format shapes the message: Authentication shows Meta's
 * fixed copy, Limited time offer an offer strip, Orders details and status
 * an order block, Carousel a row of cards, and Catalog / Orders details /
 * Checkout / Authentication their one fixed button.
 */
export function TemplatePreview({
  draft,
  onButtonsChange,
  onReorder,
  onBodyChange,
  onHeaderChange,
  onEnhance,
  onCardsChange,
}: {
  draft: TemplateDraft;
  onButtonsChange?: (buttons: TemplateButton[]) => void;
  onReorder?: (quickRepliesFirst: boolean) => void;
  onBodyChange?: (body: string) => void;
  /** Rewrites the body for Enhance; null means fall back to local polish. */
  onEnhance?: (body: string) => Promise<string | null>;
  onHeaderChange?: (header: TemplateHeader | null) => void;
  onCardsChange?: (cards: CarouselCard[]) => void;
}) {
  const isAuth = draft.category === "authentication";
  const type = draft.templateType ?? "standard";
  const fixedButton = fixedButtonLabel(draft);
  const custom = allowsCustomButtons(draft);
  // Authentication and Carousel messages carry no header.
  const headerAllowed = !isAuth && type !== "carousel";
  const rows = custom ? orderedButtons(draft) : [];
  const bothGroups =
    draft.buttons.some(isQuickReply) && draft.buttons.some((b) => !isQuickReply(b));
  const firstQuickReply = rows.find((r) => isQuickReply(r.button))?.index;
  return (
    <div className="rounded-xl bg-[#efe9e1] p-3">
      <div className="group/bubble relative max-w-[340px] overflow-hidden rounded-lg rounded-tl-none bg-white shadow-[0_1px_0.5px_rgba(0,0,0,0.13)]">
        {/* Adding a header is the "+ Image header" chip's job; the preview
            only edits one that exists. */}
        {headerAllowed && draft.header?.kind === "image" && (
          <ImageHeader header={draft.header} onChange={onHeaderChange} />
        )}
        {type === "limited-offer" && <OfferStrip draft={draft} />}
        <div className="flex flex-col gap-1 px-2.5 pb-1.5 pt-2">
          {headerAllowed && draft.header?.kind === "text" && (
            <p className="text-[13px] font-semibold text-[#111b21]">{draft.header.text}</p>
          )}
          {onBodyChange && !isAuth ? (
            <EditableBody body={draft.body} onChange={onBodyChange} onEnhance={onEnhance} />
          ) : (
            <p className="whitespace-pre-line text-[13px] leading-[18px] text-[#111b21]">
              <BodyText body={draft.body} />
            </p>
          )}
          {type === "order-details" && <OrderSummary />}
          {type === "order-status" && draft.orderStatus && (
            <p className="flex items-center gap-1.5 rounded-md bg-black/[0.04] px-2 py-1.5 text-[12px] text-[#111b21]">
              <CircleCheck size={13} className="text-wati-green-text" />
              {ORDER_STATUS_LABEL[draft.orderStatus]}
            </p>
          )}
          <div className="flex items-end justify-between gap-3">
            <span className="text-[11px] text-black/45">{draft.footer ?? ""}</span>
            <span className="shrink-0 text-[10px] text-black/40">10:24</span>
          </div>
        </div>
        {fixedButton && <FixedButton label={fixedButton} />}
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
      {type === "carousel" && <CarouselCards cards={draft.cards ?? []} onChange={onCardsChange} />}
    </div>
  );
}

/* ------------------------------------------------------------ Formats */

/** Limited time offer: Meta's offer strip above the body, with the countdown. */
function OfferStrip({ draft }: { draft: TemplateDraft }) {
  const ends = draft.offerEndsAt ? new Date(`${draft.offerEndsAt}T23:59:59`) : null;
  const days = ends ? Math.ceil((ends.getTime() - Date.now()) / 86_400_000) : null;
  const when =
    !ends || days === null
      ? "Set when the offer ends"
      : days < 0
        ? "Offer has ended"
        : days === 0
          ? "Offer ends today"
          : `Offer ends in ${days} day${days === 1 ? "" : "s"}`;
  return (
    <div className="mx-1 mt-1 flex items-center gap-2 rounded-md bg-[#f6f6f6] px-2.5 py-2">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-wati-green-soft text-wati-green-text">
        <Tag size={14} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-semibold text-[#111b21]">
          {draft.offerTitle || "Offer title"}
        </span>
        <span className={`block text-[11px] ${ends ? "text-black/55" : "text-wati-state-draft-text"}`}>
          {when}
        </span>
      </span>
    </div>
  );
}

/** Orders details: the order block customers review before paying. */
function OrderSummary() {
  return (
    <div className="flex items-center gap-2 rounded-md bg-black/[0.04] px-2 py-1.5 text-[12px] text-[#111b21]">
      <Package size={14} className="shrink-0 text-black/50" />
      <span className="min-w-0 flex-1">
        <span className="block font-medium">Order #10234</span>
        <span className="block text-black/55">2 items · Total ₹2,499.00</span>
      </span>
    </div>
  );
}

const FIXED_ICON: Record<string, LucideIcon> = {
  "Copy code": Copy,
  "View catalog": ShoppingCart,
  "Review and pay": ExternalLink,
  Checkout: ShoppingCart,
};

/** The one button Meta fixes for the format; not editable. */
function FixedButton({ label }: { label: string }) {
  const Icon = FIXED_ICON[label] ?? ExternalLink;
  return (
    <div className="flex items-center justify-center gap-1.5 border-t border-black/[0.08] py-2 text-[13px] text-[#0b8ad6]">
      <Icon size={13} strokeWidth={2} />
      {label}
    </div>
  );
}

/** Carousel: a swipeable row of cards, each with image, text and button. */
function CarouselCards({
  cards,
  onChange,
}: {
  cards: CarouselCard[];
  onChange?: (cards: CarouselCard[]) => void;
}) {
  const update = (i: number, patch: Partial<CarouselCard>) =>
    onChange?.(cards.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  return (
    <div className="mt-2 flex max-w-full gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
      {cards.map((card, i) => (
        <CarouselCardView
          key={i}
          card={card}
          onChange={onChange ? (patch) => update(i, patch) : undefined}
          onRemove={onChange && cards.length > 2 ? () => onChange(cards.filter((_, j) => j !== i)) : undefined}
        />
      ))}
      {onChange && cards.length < MAX_CAROUSEL_CARDS && (
        <button
          type="button"
          onClick={() => onChange([...cards, { text: "", button: "Shop now" }])}
          className="flex w-[168px] shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-black/20 bg-white/60 text-[12px] text-black/55 hover:bg-white"
        >
          <Plus size={14} />
          Add card
        </button>
      )}
    </div>
  );
}

function CarouselCardView({
  card,
  onChange,
  onRemove,
}: {
  card: CarouselCard;
  onChange?: (patch: Partial<CarouselCard>) => void;
  onRemove?: () => void;
}) {
  const picker = useImagePicker((h) => {
    if (h.kind === "image") onChange?.({ image: { fileName: h.fileName, previewUrl: h.previewUrl } });
  });
  const field =
    "w-full bg-transparent outline-none placeholder:text-black/35 focus:rounded focus:bg-black/[0.03]";
  return (
    <div className="group/card relative flex w-[168px] shrink-0 flex-col overflow-hidden rounded-lg bg-white shadow-[0_1px_0.5px_rgba(0,0,0,0.13)]">
      {onChange && picker.input}
      <button
        type="button"
        onClick={onChange ? picker.open : undefined}
        disabled={!onChange}
        aria-label={card.image?.fileName ? "Replace card image" : "Add card image"}
        className="m-1 mb-0 flex h-[92px] items-center justify-center overflow-hidden rounded-md bg-black/[0.05] text-[11px] text-black/40"
      >
        {card.image?.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- local data URL
          <img src={card.image.previewUrl} alt={card.image.fileName ?? ""} className="h-full w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1">
            <ImageIcon size={16} />
            {card.image?.fileName ?? (onChange ? "Add image" : "Image")}
          </span>
        )}
      </button>
      {picker.error && <p className="px-2 pt-1 text-[11px] text-wati-state-danger-text">{picker.error}</p>}
      {onChange ? (
        <textarea
          value={card.text}
          onChange={(e) => onChange({ text: e.target.value })}
          maxLength={CAROUSEL_TEXT_LIMIT}
          rows={2}
          placeholder="Card text"
          aria-label="Card text"
          className={`${field} resize-none px-2 py-1.5 text-[12px] leading-[16px] text-[#111b21]`}
        />
      ) : (
        <p className="px-2 py-1.5 text-[12px] leading-[16px] text-[#111b21]">{card.text}</p>
      )}
      <div className="flex items-center justify-center gap-1 border-t border-black/[0.08] py-1.5 text-[12px] text-[#0b8ad6]">
        <ExternalLink size={12} />
        {onChange ? (
          <input
            value={card.button}
            onChange={(e) => onChange({ button: e.target.value })}
            maxLength={25}
            placeholder="Button"
            aria-label="Card button text"
            // Sized to its text so the icon sits beside the label, as in WhatsApp.
            style={{ width: `${Math.max(card.button.length, 6) + 1}ch` }}
            className={`${field} min-w-0 max-w-[130px] text-[#0b8ad6]`}
          />
        ) : (
          card.button
        )}
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove card"
          className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-black/60 opacity-0 transition-opacity hover:text-black/85 group-hover/card:opacity-100"
        >
          <X size={12} />
        </button>
      )}
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

/* ------------------------------------------------------------ Header */

/** WhatsApp's cap for an image header. */
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Downscale to a small JPEG data URL so the preview survives a reload. */
async function previewDataUrl(file: File): Promise<string | undefined> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 480 / bitmap.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.75);
  } catch {
    return undefined;
  }
}

/** Hidden file input plus a function that opens it and hands back a header. */
function useImagePicker(onPicked: (header: TemplateHeader) => void) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const input = (
    <input
      ref={inputRef}
      type="file"
      accept="image/jpeg,image/png"
      className="hidden"
      onChange={async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        if (file.size > MAX_IMAGE_BYTES) {
          setError("Images must be 5 MB or smaller");
          return;
        }
        setError(null);
        onPicked({ kind: "image", fileName: file.name, previewUrl: await previewDataUrl(file) });
      }}
    />
  );
  return { input, open: () => inputRef.current?.click(), error };
}

function ImageHeader({
  header,
  onChange,
}: {
  header: Extract<TemplateHeader, { kind: "image" }>;
  onChange?: (header: TemplateHeader | null) => void;
}) {
  const picker = useImagePicker((h) => onChange?.(h));
  return (
    <div className="group/header relative p-1 pb-0">
      {header.previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- local data URL
        <img
          src={header.previewUrl}
          alt={header.fileName ?? "Header image"}
          className="h-[140px] w-full rounded-md object-cover"
        />
      ) : (
        <div className="flex h-[120px] flex-col items-center justify-center gap-1 rounded-md bg-black/[0.05] text-black/40">
          <ImageIcon size={20} strokeWidth={1.75} />
          <span className="max-w-[90%] truncate text-[11px]">
            {header.fileName ?? "Header image"}
          </span>
        </div>
      )}
      {onChange && (
        <>
          {picker.input}
          <div className="absolute inset-1 bottom-0 flex items-center justify-center gap-1.5 rounded-md bg-black/35 opacity-0 transition-opacity group-hover/header:opacity-100 focus-within:opacity-100">
            <button
              type="button"
              onClick={picker.open}
              className="rounded-full bg-white px-3 py-1 text-[12px] font-medium text-black/80 hover:bg-white/90"
            >
              {header.fileName ? "Replace image" : "Upload image"}
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              aria-label="Remove image header"
              className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-white text-black/70 hover:bg-white/90"
            >
              <Trash2 size={12} />
            </button>
          </div>
          {picker.error && (
            <p className="px-1 pt-1 text-[11px] text-wati-state-danger-text">{picker.error}</p>
          )}
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ Body */

/**
 * The body, editable in place: hover shows a pencil, click turns it into a
 * textarea. Enter or leaving saves, Shift+Enter adds a line, Escape cancels.
 */
function EditableBody({
  body,
  onChange,
  onEnhance,
}: {
  body: string;
  onChange: (body: string) => void;
  onEnhance?: (body: string) => Promise<string | null>;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(body);
  const [enhancing, setEnhancing] = useState(false);

  // The model rewrites when it's connected; otherwise a local polish after a
  // brief beat. Either way the editor stays open so the user can check it.
  const enhance = async () => {
    if (enhancing || !value.trim()) return;
    setEnhancing(true);
    const rewritten = onEnhance ? await onEnhance(value) : null;
    if (!rewritten) await new Promise((r) => window.setTimeout(r, 600));
    setValue((rewritten ?? enhanceBody(value)).slice(0, BODY_LIMIT));
    setEnhancing(false);
  };

  const save = () => {
    const next = value.trim();
    if (next && next !== body) onChange(next);
    setEditing(false);
  };

  if (editing) {
    return (
      // The box grows with the text and can be dragged taller; the toolbar
      // sits in its own row below, so it never covers the message.
      <div className="flex flex-col rounded-md border border-[#1570EF] bg-white">
        <textarea
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              save();
            }
            if (e.key === "Escape") setEditing(false);
          }}
          onFocus={(e) => e.currentTarget.setSelectionRange(value.length, value.length)}
          maxLength={BODY_LIMIT}
          aria-label="Message body"
          className="block min-h-[72px] w-full resize-y rounded-t-md bg-transparent px-2 pt-1.5 text-[13px] leading-[18px] text-[#111b21] outline-none [field-sizing:content]"
        />
        <div className="flex items-center justify-between px-[5px] pb-[5px] pr-[9px] pt-1">
          <button
            type="button"
            // Keep focus in the textarea — a blur would save and close it.
            onMouseDown={(e) => e.preventDefault()}
            onClick={enhance}
            disabled={enhancing}
            className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-[11px] font-medium text-black/65 hover:bg-black/[0.04] hover:text-black/85 disabled:opacity-60"
          >
            <AskWatiIcon size={12} variant="solid" />
            {enhancing ? "Enhancing…" : "Enhance"}
          </button>
          <span className="text-[10px] tabular-nums text-black/40">
            {value.length}/{BODY_LIMIT}
          </span>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setValue(body);
        setEditing(true);
      }}
      aria-label="Edit message body"
      className="group/body relative -mx-1 rounded-md px-1 py-0.5 text-left hover:bg-black/[0.03]"
    >
      <span className="block whitespace-pre-line text-[13px] leading-[18px] text-[#111b21]">
        <BodyText body={body} />
      </span>
      <Pencil
        size={11}
        className="absolute right-1 top-1 text-black/35 opacity-0 transition-opacity group-hover/body:opacity-100"
      />
    </button>
  );
}

/* ------------------------------------------------------------ Buttons */

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
 * A button row that opens into inputs on click: the label (or the coupon
 * code, for Copy offer code) and, for a link or phone button, its URL or
 * number. Enter or leaving the row saves; Escape cancels. A Copy offer code
 * button with no code yet starts open, since the code is required.
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
  const [editing, setEditing] = useState(
    () => button.kind === "copy-code" && !button.code,
  );
  const [primary, setPrimary] = useState("");
  const [url, setUrl] = useState("");

  const open = () => {
    setPrimary(button.kind === "copy-code" ? button.code : button.text);
    setUrl(button.kind === "url" ? button.url : button.kind === "phone" ? button.phone : "");
    setEditing(true);
  };
  const save = () => {
    const value = primary.trim();
    if (button.kind === "copy-code") {
      // Codes are copied verbatim, so keep case; spaces never belong in one.
      onChange({ ...button, code: value.replace(/\s+/g, "") });
    } else if (value) {
      if (button.kind === "url") onChange({ ...button, text: value, url: url.trim() || button.url });
      else if (button.kind === "phone") onChange({ ...button, text: value, phone: url.trim() || button.phone });
      else onChange({ ...button, text: value });
    }
    setEditing(false);
  };

  if (editing) {
    const field =
      "w-full rounded-md border border-black/15 bg-white px-2 py-1 text-[12px] text-[#111b21] outline-none focus:border-[#1570EF]";
    if (button.kind === "copy-code") {
      return (
        <div
          className="flex items-center gap-1.5 border-t border-black/[0.08] px-2.5 py-2"
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) save();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") setEditing(false);
          }}
        >
          <div className="relative min-w-0 flex-1">
            <input
              autoFocus
              value={primary}
              onChange={(e) => setPrimary(e.target.value.replace(/\s+/g, ""))}
              aria-label="Coupon code"
              placeholder="Enter coupon code to copy"
              maxLength={COUPON_CODE_LIMIT}
              className={`${field} pr-11`}
            />
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11px] tabular-nums text-black/40">
              {primary.length}/{COUPON_CODE_LIMIT}
            </span>
          </div>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onRemove}
            aria-label="Remove Copy offer code button"
            className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-md border border-black/15 text-black/55 hover:bg-black/[0.04] hover:text-black/80"
          >
            <Trash2 size={13} />
          </button>
        </div>
      );
    }
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
          aria-label="Button text"
          placeholder="Button text"
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
        {button.kind === "copy-code" &&
          (button.code ? (
            <span className="text-[11px] text-black/40">· {button.code}</span>
          ) : (
            <span className="text-[11px] text-wati-state-draft-text">· add code</span>
          ))}
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
