/**
 * Scripted WhatsApp template drafting for the Ask Wati "create a template"
 * flow. Deterministic on purpose: chat replies can't reach the model yet, and
 * a demo needs the same draft every time. Once the model drafts templates it
 * produces this same `TemplateDraft`, so the cards don't change.
 *
 * v1 covers Meta's Standard template only — header (text or image), body,
 * footer and buttons.
 */

export type TemplateCategory = "marketing" | "utility";
export type TemplateChannel = "whatsapp" | "rcs" | "sms" | "email";
export type TemplatePurpose =
  | "promotion"
  | "order-update"
  | "delay"
  | "reminder"
  | "general";
export type TemplateTone = "friendly" | "formal";
export type TemplateLength = "standard" | "short";

export type TemplateHeader =
  | {
      kind: "image";
      fileName?: string;
      /** Small downscaled data URL for the preview — survives reloads. */
      previewUrl?: string;
    }
  | { kind: "text"; text: string };

export type TemplateButton =
  | { kind: "url"; text: string; url: string }
  | { kind: "phone"; text: string; phone: string }
  | { kind: "copy-code"; code: string }
  | { kind: "voice-call"; text: string }
  | { kind: "request-contact"; text: string }
  | { kind: "quick-reply"; text: string }
  | { kind: "flow"; text: string };

export type ButtonKind = TemplateButton["kind"];

/**
 * Every button type Wati offers, in the template form's order. WhatsApp
 * shows call-to-action buttons and quick replies as two groups; `max` is the
 * per-type cap.
 */
export const BUTTON_TYPES: {
  kind: ButtonKind;
  label: string;
  group: "cta" | "quick-reply";
  max: number;
  /** Posted to the chat when picked, so picking reads like typing. */
  prompt: string;
}[] = [
  { kind: "url", label: "Visit website", group: "cta", max: 2, prompt: "Add a Visit website button" },
  { kind: "phone", label: "Call phone number", group: "cta", max: 1, prompt: "Add a Call phone number button" },
  { kind: "copy-code", label: "Copy offer code", group: "cta", max: 1, prompt: "Add a Copy offer code button" },
  { kind: "voice-call", label: "WA voice call", group: "cta", max: 1, prompt: "Add a WA voice call button" },
  { kind: "request-contact", label: "Request contact info", group: "cta", max: 1, prompt: "Add a Request contact info button" },
  { kind: "quick-reply", label: "Quick reply", group: "quick-reply", max: 10, prompt: "Add a quick reply button" },
  { kind: "flow", label: "Complete flow", group: "quick-reply", max: 1, prompt: "Add a Complete flow button" },
];

export const MAX_BUTTONS = 10;

export function isQuickReply(b: TemplateButton): boolean {
  return b.kind === "quick-reply" || b.kind === "flow";
}

export function buttonLabel(b: TemplateButton): string {
  // WhatsApp labels it "Copy offer code"; the code itself is what gets copied.
  return b.kind === "copy-code" ? "Copy offer code" : b.text;
}

export const COUPON_CODE_LIMIT = 15;

/**
 * A coupon code given in the message ("code DIWALI20", "coupon SAVE"), or
 * null. Codes need a digit or be all caps, so "code button" isn't read as one.
 */
export function parseCouponCode(text: string): string | null {
  const m = text.match(/\b(?:code|coupon)\s+(?:is\s+|of\s+|=\s*)?([A-Za-z0-9_-]{3,15})\b/i);
  if (!m) return null;
  const code = m[1];
  return /\d/.test(code) || /^[A-Z0-9_-]+$/.test(code) ? code : null;
}

/** Why another button of this kind can't be added, or null if it can. */
export function addButtonBlocker(d: TemplateDraft, kind: ButtonKind): string | null {
  if (d.buttons.length >= MAX_BUTTONS) return `WhatsApp allows up to ${MAX_BUTTONS} buttons`;
  const type = BUTTON_TYPES.find((t) => t.kind === kind)!;
  const count = d.buttons.filter((b) => b.kind === kind).length;
  if (count >= type.max) {
    return type.max === 1
      ? `WhatsApp allows one ${type.label} button`
      : `WhatsApp allows up to ${type.max} ${type.label} buttons`;
  }
  return null;
}

/** Buttons in display order — the two groups, quick replies where the user put them. */
export function orderedButtons(d: TemplateDraft): { button: TemplateButton; index: number }[] {
  const all = d.buttons.map((button, index) => ({ button, index }));
  const cta = all.filter((x) => !isQuickReply(x.button));
  const qr = all.filter((x) => isQuickReply(x.button));
  return d.quickRepliesFirst ? [...qr, ...cta] : [...cta, ...qr];
}

export type TemplateDraft = {
  /** Optional only for drafts saved before channels existed — read as WhatsApp. */
  channel?: TemplateChannel;
  name: string;
  category: TemplateCategory;
  language: string;
  purpose: TemplatePurpose;
  tone: TemplateTone;
  length: TemplateLength;
  /** Greets by `{{name}}` instead of a generic hello. */
  personal: boolean;
  /** Offer wording pulled from the ask, e.g. "Diwali Sale" / "20%". */
  offer: string;
  discount: string;
  header: TemplateHeader | null;
  body: string;
  /** The user's own wording for the body. While set, it is the body as-is
   *  and the scripted copy (tone, length, offer) no longer applies. */
  customBody?: string;
  footer: string | null;
  buttons: TemplateButton[];
  /** Quick replies above the call-to-action buttons instead of below. */
  quickRepliesFirst?: boolean;
  /** Sample value per body variable — Meta rejects templates without them. */
  samples: Record<string, string>;
};

export const TEMPLATE_LANGUAGES = [
  "English",
  "Hindi",
  "Spanish",
  "Portuguese (BR)",
  "Arabic",
  "Indonesian",
] as const;

export const CHANNEL_LABEL: Record<TemplateChannel, string> = {
  whatsapp: "WhatsApp",
  rcs: "RCS",
  sms: "SMS",
  email: "Email",
};

export const CATEGORY_LABEL: Record<TemplateCategory, string> = {
  marketing: "Marketing",
  utility: "Utility",
};

export const BODY_LIMIT = 550;
export const FOOTER_LIMIT = 60;

/* ------------------------------------------------------------ Intent */

/** Does this message ask for a new template? */
/**
 * Asks for a separate, new template ("create a template for …", "new
 * template") — stricter than isTemplateRequest, so edits to an open draft
 * like "update the template draft to …" don't start a new one.
 */
export function isNewTemplateRequest(text: string): boolean {
  return (
    /\bnew template\b/i.test(text) ||
    /\b(?:create|make|build|write|set up|design|start|need|want)\s+(?:me\s+)?(?:a|an|another)\s+(?:new\s+)?(?:\w+\s+)?template\b/i.test(text)
  );
}

export function isTemplateRequest(text: string): boolean {
  return (
    /\btemplates?\b/i.test(text) &&
    /\b(create|make|draft|build|write|new|need|set up|design|want)\b/i.test(text)
  );
}

const PURPOSE_HINTS: [TemplatePurpose, RegExp][] = [
  ["delay", /\b(delay|delayed|late|running behind)\b/i],
  [
    "promotion",
    /\b(sale|offer|discount|promo|promotion|deal|launch|coupon|festive|diwali|black friday|campaign)\b/i,
  ],
  ["order-update", /\b(order|ship|shipped|shipping|deliver|delivery|track|dispatch)\b/i],
  ["reminder", /\b(remind|reminder|appointment|booking|renewal|payment due)\b/i],
];

/** The template's job, or null when the ask is too vague to draft from. */
export function detectPurpose(text: string): TemplatePurpose | null {
  for (const [purpose, re] of PURPOSE_HINTS) {
    if (re.test(text)) return purpose;
  }
  return null;
}

export const PURPOSE_CHOICES: { purpose: TemplatePurpose; label: string }[] = [
  { purpose: "promotion", label: "Promotion or offer" },
  { purpose: "order-update", label: "Order update" },
  { purpose: "reminder", label: "Reminder" },
  { purpose: "general", label: "General update" },
];

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function detectOffer(text: string): string {
  const named = text.match(/\b([a-z]+(?:\s+[a-z]+)?)\s+(sale|offer)\b/i);
  if (named) {
    const words = named[1]
      .split(/\s+/)
      .filter((w) => !/^(a|an|the|our|my|for|this|new|upcoming)$/i.test(w));
    if (words.length > 0) return titleCase(`${words.join(" ")} ${named[2]}`);
  }
  return "Big Sale";
}

function detectDiscount(text: string): string | null {
  const pct = text.match(/(\d{1,2})\s*%/);
  return pct ? `${pct[1]}%` : null;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
}

/* ------------------------------------------------------------ Body */

const SAMPLE_DEFAULTS: Record<string, string> = {
  name: "Priya",
  end_date: "31 Oct",
  order_id: "#10234",
  delivery_date: "18 Oct",
  date: "20 Oct",
  time: "4:30 PM",
  topic: "your account",
};

function composeBody(d: Omit<TemplateDraft, "body" | "samples">): string {
  const formal = d.tone === "formal";
  const short = d.length === "short";
  const hi = formal
    ? d.personal ? "Dear {{name}}, " : "Dear customer, "
    : d.personal ? "Hi {{name}}, " : "Hi there, ";
  switch (d.purpose) {
    case "promotion":
      if (formal) {
        return short
          ? `${hi}our ${d.offer} offers ${d.discount} off until {{end_date}}.`
          : `${hi}we're pleased to announce our ${d.offer}. Enjoy ${d.discount} off all products until {{end_date}}. Visit our store to take advantage of this offer.`;
      }
      return short
        ? `${hi}the ${d.offer} is live — ${d.discount} off until {{end_date}}. 🛍️`
        : `${hi}our ${d.offer} is here! 🎉 Get ${d.discount} off sitewide until {{end_date}}. Tap below to shop before it ends.`;
    case "order-update":
      if (formal) {
        return short
          ? `${hi}order {{order_id}} has shipped and will arrive by {{delivery_date}}.`
          : `${hi}your order {{order_id}} has been dispatched and is expected to arrive by {{delivery_date}}. You can track its progress using the link below.`;
      }
      return short
        ? `${hi}order {{order_id}} is on its way — arriving by {{delivery_date}}. 📦`
        : `${hi}good news! Your order {{order_id}} has shipped and should reach you by {{delivery_date}}. Track it anytime using the button below.`;
    case "delay":
      if (formal) {
        return short
          ? `${hi}order {{order_id}} is delayed. The new delivery date is {{delivery_date}}.`
          : `${hi}we regret to inform you that order {{order_id}} has been delayed. The revised delivery date is {{delivery_date}}. We apologise for the inconvenience.`;
      }
      return short
        ? `${hi}sorry — order {{order_id}} is running late. New delivery date: {{delivery_date}}.`
        : `${hi}we're sorry — your order {{order_id}} is running late. The new expected delivery date is {{delivery_date}}. Thanks for your patience, and reply here if you need anything.`;
    case "reminder":
      if (formal) {
        return short
          ? `${hi}this is a reminder of your appointment on {{date}} at {{time}}.`
          : `${hi}this is a reminder of your appointment on {{date}} at {{time}}. Please confirm your attendance or reschedule using the options below.`;
      }
      return short
        ? `${hi}see you on {{date}} at {{time}}! ⏰`
        : `${hi}just a reminder about your appointment on {{date}} at {{time}}. Tap Confirm if you're coming, or Reschedule to pick a new slot.`;
    case "general":
      return short
        ? `${hi}there's an update about {{topic}}.`
        : `${hi}we have an update about {{topic}}. Reply to this message if you have any questions — we're happy to help.`;
  }
}

/** Variables in body order, without braces. */
export function bodyVariables(body: string): string[] {
  const seen: string[] = [];
  for (const m of body.matchAll(/\{\{(\w+)\}\}/g)) {
    if (!seen.includes(m[1])) seen.push(m[1]);
  }
  return seen;
}

/** Recompose the body and keep a sample for every variable it uses. */
/**
 * Quick local polish for the body editor's Enhance: spacing after sentence
 * ends, a repeated greeting dropped, sentences capitalised, closing
 * punctuation. Stands in until the model does real rewriting.
 */
export function enhanceBody(text: string): string {
  let out = text
    .replace(/[ \t]+/g, " ")
    .replace(/\s+([,.!?])/g, "$1")
    .replace(/([.!?])(?=[A-Za-z{])/g, "$1 ")
    .replace(/,(?=[A-Za-z{])/g, ", ")
    .trim();
  // Keep only the first greeting ("Hi {{name}}," / "Hello …," / "Dear …,").
  let seen = false;
  out = out.replace(/\b(?:Hi|Hello|Hey|Dear)\s+(?:\{\{\w+\}\}|there|customer),\s*/gi, (m) => {
    if (!seen) {
      seen = true;
      return m;
    }
    return "";
  });
  out = out.replace(/(^|[.!?]\s+)([a-z])/g, (_, lead: string, c: string) => lead + c.toUpperCase());
  if (!/[.!?)\u{1F300}-\u{1FAFF}]$/u.test(out)) out += ".";
  return out;
}

/** The user's own body text, typed straight into the preview. */
export function withBody(d: TemplateDraft, body: string): TemplateDraft {
  return finish({ ...d, customBody: body });
}

function finish(d: Omit<TemplateDraft, "body" | "samples"> & { samples?: Record<string, string> }): TemplateDraft {
  const body = d.customBody ?? composeBody(d);
  const samples: Record<string, string> = {};
  for (const v of bodyVariables(body)) {
    samples[v] = d.samples?.[v] ?? SAMPLE_DEFAULTS[v] ?? "";
  }
  return { ...d, body, samples };
}

/* ------------------------------------------------------------ Draft */

const DEFAULT_BUTTONS: Record<TemplatePurpose, TemplateButton[]> = {
  promotion: [{ kind: "url", text: "Shop now", url: "https://yourstore.com" }],
  "order-update": [{ kind: "url", text: "Track order", url: "https://yourstore.com/track" }],
  delay: [{ kind: "quick-reply", text: "Talk to support" }],
  reminder: [
    { kind: "quick-reply", text: "Confirm" },
    { kind: "quick-reply", text: "Reschedule" },
  ],
  general: [],
};

const DEFAULT_NAME: Record<TemplatePurpose, string> = {
  promotion: "offer",
  "order-update": "order_shipped_update",
  delay: "order_delay_update",
  reminder: "appointment_reminder",
  general: "general_update",
};

/** Suffix `_2`, `_3`… until the name is free. */
export function uniqueName(base: string, taken: readonly string[]): string {
  if (!taken.includes(base)) return base;
  let n = 2;
  while (taken.includes(`${base}_${n}`)) n++;
  return `${base}_${n}`;
}

export function draftTemplate(
  intent: string,
  purpose: TemplatePurpose,
  takenNames: readonly string[] = [],
): TemplateDraft {
  const offer = detectOffer(intent);
  const code = parseCouponCode(intent);
  const buttons = [...DEFAULT_BUTTONS[purpose]];
  if (code) buttons.push({ kind: "copy-code", code });
  const base =
    purpose === "promotion" ? slugify(offer) : DEFAULT_NAME[purpose];
  return finish({
    name: uniqueName(base, takenNames),
    channel: "whatsapp",
    category: purpose === "promotion" ? "marketing" : "utility",
    language: "English",
    purpose,
    tone: "friendly",
    length: "standard",
    personal: true,
    offer,
    discount: detectDiscount(intent) ?? "up to 30%",
    header: null,
    footer: purpose === "promotion" ? "Reply STOP to unsubscribe" : null,
    buttons,
  });
}

/* ------------------------------------------------------------ Refine */

/**
 * One-tap refinements offered under the draft, in two kinds: `field` adds a
 * part of the template, `rewrite` has AI rework the copy. `prompt` is what
 * posts to the chat, so a tap reads the same as typing it.
 */
export type RefineSuggestion = {
  kind: "field" | "rewrite";
  label: string;
  prompt: string;
};

/**
 * `canRewrite`: the model is on, so the user's own copy can be rewritten too.
 * Without it, rewrites only reshape the scripted copy.
 */
export function refineSuggestions(d: TemplateDraft, canRewrite = false): RefineSuggestion[] {
  const fields: RefineSuggestion[] = [];
  const field = (label: string, prompt: string) =>
    fields.push({ kind: "field", label, prompt });
  if (!d.header) field("Image header", "Add image header");
  const greetsByName = d.customBody ? d.customBody.includes("{{name}}") : d.personal;
  if (!greetsByName) field("Name variable", "Greet by name");

  const rewrite = (label: string, prompt: string): RefineSuggestion => ({
    kind: "rewrite",
    label,
    prompt,
  });
  // Rewrites are offered as suggested replies, so the label is the message
  // that gets sent.
  const reply = (text: string) => rewrite(text, text);
  // Rewriting the user's own copy needs the model — offer no rewrites then.
  if (d.customBody && !canRewrite) return fields;
  return [
    ...fields,
    d.length === "short"
      ? reply("Add a bit more detail to the message")
      : reply("Make it shorter and easier to skim"),
    d.tone === "formal"
      ? reply("Make the tone warmer and friendlier")
      : reply("Make the tone more formal and professional"),
  ];
}

export type RefineResult =
  | { draft: TemplateDraft; changes: string[] }
  /** Understood, but not allowed — e.g. a second voice-call button. */
  | { blocked: string };

/** The button type a message asks to add; a bare "button" means a quick reply. */
function detectButtonKind(t: string): ButtonKind {
  if (/\b(voice call|wa call|whatsapp call)\b/.test(t)) return "voice-call";
  if (/\b(contact info|request contact|share contact)\b/.test(t)) return "request-contact";
  if (/\bflow\b/.test(t)) return "flow";
  if (/\b(phone|call)\b/.test(t)) return "phone";
  if (/\b(coupon|code)\b/.test(t)) return "copy-code";
  if (/\b(website|link|url)\b/.test(t) || /https?:\/\//.test(t)) return "url";
  return "quick-reply";
}

function newButton(kind: ButtonKind, text: string): TemplateButton {
  const quoted = text.match(/["“']([^"”']{1,25})["”']/)?.[1];
  switch (kind) {
    case "url":
      return { kind, text: quoted ?? "Visit website", url: text.match(/https?:\/\/\S+/)?.[0] ?? "https://yourstore.com" };
    case "phone":
      return { kind, text: quoted ?? "Call us", phone: text.match(/\+?\d[\d\s-]{6,}\d/)?.[0] ?? "+91 98765 43210" };
    case "copy-code":
      // No code given: left empty for the user to enter on the card.
      return { kind, code: parseCouponCode(text) ?? "" };
    case "voice-call":
      return { kind, text: quoted ?? "Call us on WhatsApp" };
    case "request-contact":
      return { kind, text: quoted ?? "Share contact info" };
    case "quick-reply":
      return { kind, text: quoted ?? "I'm interested" };
    case "flow":
      return { kind, text: quoted ?? "Book now" };
  }
}

const REWRITE_ASK = /\b(shorter|short|concise|brief|trim|longer|expand|formal|professional|friendl\w*|casual|warm\w*|rewrite|reword|rephrase)\b/i;

/** Asks for an AI rewrite (tone/length) — can't apply to the user's own copy yet. */
export function isRewriteRequest(text: string): boolean {
  return REWRITE_ASK.test(text);
}

/** A message long enough that it's the copy itself, not an instruction. */
const COPY_MIN_WORDS = 20;

/**
 * The body text the user supplied, if this message gives one: "update the
 * draft to …", "body: …", "use this: …", or just a long message.
 */
function providedBody(text: string): string | null {
  const explicit =
    text.match(
      /^\s*(?:please\s+)?(?:update|change|set|replace|make|edit)\s+(?:the\s+)?(?:template\s+)?(?:draft|template|body|message|text|copy)(?:\s+(?:text|copy))?\s+(?:to|with|as)\s*(?:this|the following)?\s*[:\-–—]?\s*([\s\S]+)$/i,
    ) ??
    text.match(/^\s*(?:body|message|copy|text)\s*:\s*([\s\S]+)$/i) ??
    text.match(/^\s*use\s+(?:this|the following)(?:\s+(?:text|copy|instead))?\s*[:\-–—]\s*([\s\S]+)$/i);
  const raw = explicit?.[1] ?? (text.trim().split(/\s+/).length >= COPY_MIN_WORDS ? text : null);
  const cleaned = raw?.trim().replace(/^["“']([\s\S]*)["”']$/, "$1").trim();
  return cleaned ? cleaned : null;
}

export const BUTTON_TEXT_LIMIT = 25;

const ORDINAL: Record<string, number> = { first: 0, second: 1, third: 2 };

/**
 * New label for an existing button: "rename 'Shop now' to 'Buy now'", or
 * "change the (first|last|…) button to …" — the last labelled button when
 * none is named.
 */
function renameButton(
  buttons: TemplateButton[],
  text: string,
): { buttons: TemplateButton[]; label: string } | null {
  const labelled = buttons
    .map((b, i) => ({ b, i }))
    .filter((x) => x.b.kind !== "copy-code");
  if (labelled.length === 0) return null;
  const unquote = (v: string) => v.trim().replace(/^["“']|["”']$/g, "").trim();

  let target: number | undefined;
  let label: string | undefined;
  const named = text.match(
    /\b(?:rename|change|update|replace|make)\s+(?:the\s+)?["“']([^"”']+)["”']\s*(?:button\s+)?(?:to|into|with)\s+(.+)$/i,
  );
  if (named) {
    const old = named[1].trim().toLowerCase();
    target = labelled.find(
      (x) => x.b.kind !== "copy-code" && x.b.text.toLowerCase() === old,
    )?.i;
    label = unquote(named[2]);
  } else {
    const generic = text.match(
      /\b(?:rename|change|update|set|make|call)\s+(?:the\s+)?(?:(first|second|third|last)\s+)?(?:(?:quick[- ]reply|link|url|website|cta)\s+)?button(?:\s+(?:text|copy|label))?\s+(?:to|as|into)\s+(.+)$/i,
    );
    if (!generic) return null;
    const ord = generic[1]?.toLowerCase();
    const pick =
      ord && ord !== "last" ? labelled[ORDINAL[ord]] : labelled[labelled.length - 1];
    target = pick?.i;
    label = unquote(generic[2]);
  }
  if (target === undefined || !label) return null;
  const finalLabel = label;
  return {
    buttons: buttons.map((b, i) =>
      i === target && b.kind !== "copy-code" ? { ...b, text: finalLabel } : b,
    ),
    label: finalLabel,
  };
}

/** Footer text from "footer: …" or "change the footer to …". */
function providedFooter(text: string): string | null {
  const m = text.match(
    /^\s*(?:(?:set|change|update|make)\s+(?:the\s+)?)?footer(?:\s+(?:to|as))?\s*[:\-–—]?\s+(.+)$/i,
  );
  const value = m?.[1].trim().replace(/^["“'](.*)["”']$/, "$1").trim();
  return value ? value : null;
}

/**
 * Apply every change the message asks for. Returns null when nothing in it
 * maps to a change this flow can make, so the caller can say so.
 */
export function refineTemplate(d: TemplateDraft, text: string): RefineResult | null {
  const t = text.toLowerCase();
  const next = { ...d, buttons: [...d.buttons] };
  const changes: string[] = [];
  const removing = /\b(remove|drop|delete|no|without)\b/.test(t);

  // The user's own copy goes in verbatim — and before any keyword parsing,
  // which would otherwise read words inside that copy as commands.
  const body = providedBody(text);
  if (body) {
    return { draft: finish({ ...next, customBody: body }), changes: ["Your text as the body"] };
  }
  const footer = providedFooter(text);
  if (footer && !removing) {
    return { draft: finish({ ...next, footer }), changes: ["New footer"] };
  }
  const renamed = renameButton(next.buttons, text);
  if (renamed) {
    return {
      draft: finish({ ...next, buttons: renamed.buttons }),
      changes: [`Button "${renamed.label}"`],
    };
  }

  if (/\bquick repl/.test(t) && /\b(top|first|above|up|bottom|last|below|down)\b/.test(t) && /\b(move|put|place|show|order)\b/.test(t)) {
    const first = /\b(top|first|above|up)\b/.test(t);
    return {
      draft: finish({ ...next, quickRepliesFirst: first }),
      changes: [first ? "Quick replies on top" : "Quick replies at the bottom"],
    };
  }

  if (!removing && /\b(add|insert|include|another|new|put)\b/.test(t) && /\b(button|quick repl\w*)\b/.test(t)) {
    const kind = detectButtonKind(t);
    const blocker = addButtonBlocker(next, kind);
    if (blocker) return { blocked: `${blocker}.` };
    const button = newButton(kind, text);
    return {
      draft: finish({ ...next, buttons: [...next.buttons, button] }),
      changes: [`Added "${buttonLabel(button)}" button`],
    };
  }

  // Tone, length and offer only shape the scripted copy; the user's own
  // body stays as written (rewriting it needs the model).
  const scripted = !d.customBody;

  if (scripted && /\b(shorter|short|concise|brief|trim)\b/.test(t)) {
    next.length = "short";
    changes.push("Shorter");
  } else if (scripted && /\b(longer|more detail|expand)\b/.test(t)) {
    next.length = "standard";
    changes.push("Longer");
  }

  if (scripted && /\b(formal|professional)\b/.test(t)) {
    next.tone = "formal";
    changes.push("More formal");
  } else if (scripted && /\b(friendl\w*|casual|warm\w*)\b/.test(t)) {
    next.tone = "friendly";
    changes.push("Friendlier");
  }

  if (/\b(image|photo|picture|banner)\b/.test(t)) {
    if (removing) {
      next.header = null;
      changes.push("Removed image header");
    } else if (next.header?.kind !== "image") {
      next.header = { kind: "image" };
      changes.push("Added image header");
    }
  } else if (removing && /\bheader\b/.test(t)) {
    next.header = null;
    changes.push("Removed header");
  }

  if (/\b(by name|greet|personal\w*|their name|first name)\b/.test(t) || /\bvariable\b/.test(t)) {
    if (next.customBody && !next.customBody.includes("{{name}}")) {
      next.customBody = `Hi {{name}}, ${next.customBody}`;
      changes.push("Greets by name");
    } else if (!next.customBody && !next.personal) {
      next.personal = true;
      changes.push("Greets by name");
    }
  }

  const discount = detectDiscount(text);
  if (scripted && discount && discount !== next.discount) {
    next.discount = discount;
    changes.push(`Discount ${discount}`);
  }

  if (/\b(coupon|code)\b/.test(t)) {
    const code = parseCouponCode(text);
    const has = next.buttons.some((b) => b.kind === "copy-code");
    if (removing && !code) {
      next.buttons = next.buttons.filter((b) => b.kind !== "copy-code");
      changes.push("Removed coupon code");
    } else if (code) {
      next.buttons = has
        ? next.buttons.map((b) => (b.kind === "copy-code" ? { ...b, code } : b))
        : [...next.buttons, { kind: "copy-code", code }];
      changes.push(`Coupon code ${code}`);
    } else if (!has) {
      next.buttons.push({ kind: "copy-code", code: "" });
      changes.push("Copy offer code button");
    }
  }


  const url = text.match(/https?:\/\/\S+/)?.[0];
  if (url || /\b(website|link|url|shop now)\b/.test(t)) {
    const existing = next.buttons.find((b) => b.kind === "url");
    if (existing && url) {
      next.buttons = next.buttons.map((b) => (b === existing ? { ...existing, url } : b));
      changes.push("Updated link");
    } else if (!existing) {
      next.buttons.push({ kind: "url", text: "Visit website", url: url ?? "https://yourstore.com" });
      changes.push("Added website button");
    }
  }

  if (removing && /\bbuttons?\b/.test(t) && !/\b(coupon|code)\b/.test(t)) {
    next.buttons = [];
    changes.push("Removed buttons");
  }

  if (/\bfooter\b/.test(t) && removing) {
    next.footer = null;
    changes.push("Removed footer");
  }

  const rename = text.match(/\b(?:call it|name it|rename(?: it)?(?: to)?)\s+([\w\s-]{3,40})/i)?.[1];
  if (rename) {
    next.name = slugify(rename);
    changes.push(`Renamed to ${next.name}`);
  }

  if (/\butility\b/.test(t)) {
    next.category = "utility";
    changes.push("Category Utility");
  } else if (/\bmarketing\b/.test(t)) {
    next.category = "marketing";
    changes.push("Category Marketing");
  }

  const language = TEMPLATE_LANGUAGES.find((l) =>
    new RegExp(`\\b${l.split(" ")[0]}\\b`, "i").test(text),
  );
  if (language && language !== next.language) {
    next.language = language;
    changes.push(`Language ${language}`);
  }

  if (changes.length === 0) return null;
  return { draft: finish(next), changes };
}

/* ------------------------------------------------------------ Checks */

/** Only problems: a blocker stops submit, a warn is a likely Meta flag. */
export type TemplateCheck = {
  verdict: "warn" | "blocker";
  text: string;
};

const MARKETING_WORDS = /\b(sale|offer|discount|off|shop|deal|coupon)\b/i;

export function checkTemplate(
  d: TemplateDraft,
  takenNames: readonly string[],
): TemplateCheck[] {
  const checks: TemplateCheck[] = [];

  if (!/^[a-z0-9_]+$/.test(d.name)) {
    checks.push({ verdict: "blocker", text: "Name can only use lowercase letters, numbers and underscores" });
  } else if (takenNames.includes(d.name)) {
    checks.push({ verdict: "blocker", text: `A template called ${d.name} already exists` });
  }

  const overBody = d.body.length > BODY_LIMIT;
  const overFooter = (d.footer?.length ?? 0) > FOOTER_LIMIT;
  if (overBody || overFooter) {
    checks.push({
      verdict: "blocker",
      text: overBody ? `Body is over ${BODY_LIMIT} characters` : `Footer is over ${FOOTER_LIMIT} characters`,
    });
  }

  const missing = Object.entries(d.samples).filter(([, v]) => !v.trim());
  if (missing.length > 0) {
    checks.push({
      verdict: "blocker",
      text: `Add a sample for ${missing.map(([k]) => `{{${k}}}`).join(", ")}`,
    });
  }

  if (d.buttons.length > MAX_BUTTONS) {
    checks.push({ verdict: "blocker", text: `WhatsApp allows up to ${MAX_BUTTONS} buttons` });
  }
  for (const type of BUTTON_TYPES) {
    if (d.buttons.filter((b) => b.kind === type.kind).length > type.max) {
      checks.push({ verdict: "blocker", text: `Too many ${type.label} buttons — the limit is ${type.max}` });
    }
  }

  if (d.buttons.some((b) => b.kind === "copy-code" && !b.code.trim())) {
    checks.push({ verdict: "blocker", text: "Enter the coupon code for the Copy offer code button" });
  }

  const longButton = d.buttons.find(
    (b) => b.kind !== "copy-code" && b.text.length > BUTTON_TEXT_LIMIT,
  );
  if (longButton && longButton.kind !== "copy-code") {
    checks.push({
      verdict: "blocker",
      text: `Button "${longButton.text}" is over ${BUTTON_TEXT_LIMIT} characters`,
    });
  }

  if (d.header?.kind === "image" && !d.header.fileName) {
    checks.push({ verdict: "blocker", text: "Attach the header image — use the paperclip in the composer" });
  }

  if (d.category === "utility" && MARKETING_WORDS.test(d.body)) {
    checks.push({ verdict: "warn", text: "Reads as promotional — Meta may recategorize this as Marketing" });
  }

  return checks;
}

export function canSubmit(checks: readonly TemplateCheck[]): boolean {
  return checks.every((c) => c.verdict !== "blocker");
}

/* ------------------------------------------------------------ Model I/O */

/**
 * The template as the model reads and writes it — the parts that make up the
 * message, without the prototype's scripted-copy knobs (tone, length, offer).
 */
export type ModelTemplate = {
  purpose: TemplatePurpose;
  name: string;
  category: TemplateCategory;
  language: string;
  header: { kind: "image" } | { kind: "text"; text: string } | null;
  body: string;
  footer: string | null;
  buttons: (
    | { kind: "url"; text: string; url: string }
    | { kind: "phone"; text: string; phone: string }
    | { kind: "copy-code"; code: string }
    | { kind: "voice-call" | "request-contact" | "quick-reply" | "flow"; text: string }
  )[];
  samples: Record<string, string>;
};

export function toModelTemplate(d: TemplateDraft): ModelTemplate {
  return {
    purpose: d.purpose,
    name: d.name,
    category: d.category,
    language: d.language,
    header: d.header?.kind === "image" ? { kind: "image" } : d.header,
    body: d.body,
    footer: d.footer,
    buttons: d.buttons,
    samples: d.samples,
  };
}

const PURPOSES: TemplatePurpose[] = ["promotion", "order-update", "delay", "reminder", "general"];
const KINDS = BUTTON_TYPES.map((t) => t.kind);
const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : fallback);

/**
 * Fold a model reply into a draft, defensively: unknown values fall back to
 * `base`, so a sloppy reply never breaks the card. What the model can't see
 * (channel, an uploaded header image) carries over from `base`.
 */
export function fromModelTemplate(raw: unknown, base: TemplateDraft): TemplateDraft {
  const m = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const body = str(m.body).trim() || base.body;
  const headerIn = m.header as { kind?: string; text?: string } | null | undefined;
  const header: TemplateHeader | null =
    headerIn?.kind === "image"
      ? base.header?.kind === "image"
        ? base.header
        : { kind: "image" }
      : headerIn?.kind === "text" && str(headerIn.text)
        ? { kind: "text", text: str(headerIn.text) }
        : headerIn === null
          ? null
          : base.header;
  const buttons: TemplateButton[] = [];
  for (const b of Array.isArray(m.buttons) ? m.buttons : []) {
    const kind = (b as { kind?: string })?.kind as ButtonKind;
    if (!KINDS.includes(kind)) continue;
    const x = b as Record<string, unknown>;
    if (kind === "copy-code") buttons.push({ kind, code: str(x.code).replace(/\s+/g, "") });
    else if (kind === "url") buttons.push({ kind, text: str(x.text, "Visit website"), url: str(x.url, "https://yourstore.com") });
    else if (kind === "phone") buttons.push({ kind, text: str(x.text, "Call us"), phone: str(x.phone, "+91 98765 43210") });
    else buttons.push({ kind, text: str(x.text, "Reply") } as TemplateButton);
  }
  const samplesIn = (m.samples && typeof m.samples === "object" ? m.samples : {}) as Record<string, unknown>;
  const samples: Record<string, string> = {};
  for (const [k, v] of Object.entries(samplesIn)) samples[k] = str(v);
  const name = str(m.name).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 48);
  return finish({
    ...base,
    purpose: PURPOSES.includes(m.purpose as TemplatePurpose) ? (m.purpose as TemplatePurpose) : base.purpose,
    name: name || base.name,
    category: m.category === "marketing" || m.category === "utility" ? m.category : base.category,
    language: str(m.language) || base.language,
    header,
    customBody: body,
    personal: body.includes("{{name}}"),
    footer: m.footer === null ? null : str(m.footer) || base.footer,
    buttons,
    samples,
  });
}
