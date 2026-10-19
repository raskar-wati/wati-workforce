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
export type TemplatePurpose =
  | "promotion"
  | "order-update"
  | "delay"
  | "reminder"
  | "general";
export type TemplateTone = "friendly" | "formal";
export type TemplateLength = "standard" | "short";

export type TemplateHeader =
  | { kind: "image"; fileName?: string }
  | { kind: "text"; text: string };

export type TemplateButton =
  | { kind: "url"; text: string; url: string }
  | { kind: "copy-code"; code: string }
  | { kind: "quick-reply"; text: string };

export type TemplateDraft = {
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
  footer: string | null;
  buttons: TemplateButton[];
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

export const CATEGORY_LABEL: Record<TemplateCategory, string> = {
  marketing: "Marketing",
  utility: "Utility",
};

export const BODY_LIMIT = 550;
export const FOOTER_LIMIT = 60;

/* ------------------------------------------------------------ Intent */

/** Does this message ask for a new template? */
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
function finish(d: Omit<TemplateDraft, "body" | "samples"> & { samples?: Record<string, string> }): TemplateDraft {
  const body = composeBody(d);
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
  const code = intent.match(/\bcode\s+([A-Z0-9]{3,})\b/i)?.[1];
  const buttons = [...DEFAULT_BUTTONS[purpose]];
  if (code) buttons.push({ kind: "copy-code", code: code.toUpperCase() });
  const base =
    purpose === "promotion" ? slugify(offer) : DEFAULT_NAME[purpose];
  return finish({
    name: uniqueName(base, takenNames),
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

export function refineSuggestions(d: TemplateDraft): RefineSuggestion[] {
  const fields: RefineSuggestion[] = [];
  const field = (label: string, prompt: string) =>
    fields.push({ kind: "field", label, prompt });
  if (!d.header) field("Image header", "Add image header");
  if (d.purpose === "promotion" && !d.buttons.some((b) => b.kind === "copy-code")) {
    field("Coupon code", "Add a coupon code");
  }
  if (!d.personal) field("Name variable", "Greet by name");
  if (d.buttons.length === 0) field("Button", "Add a button");

  const rewrite = (label: string, prompt: string): RefineSuggestion => ({
    kind: "rewrite",
    label,
    prompt,
  });
  return [
    ...fields,
    d.length === "short"
      ? rewrite("Longer", "Make it longer")
      : rewrite("Shorter", "Make it shorter"),
    d.tone === "formal"
      ? rewrite("Friendlier", "Make it friendlier")
      : rewrite("More formal", "Make it more formal"),
  ];
}

export type RefineResult = { draft: TemplateDraft; changes: string[] };

/**
 * Apply every change the message asks for. Returns null when nothing in it
 * maps to a change this flow can make, so the caller can say so.
 */
export function refineTemplate(d: TemplateDraft, text: string): RefineResult | null {
  const t = text.toLowerCase();
  const next = { ...d, buttons: [...d.buttons] };
  const changes: string[] = [];
  const removing = /\b(remove|drop|delete|no|without)\b/.test(t);

  if (/\b(shorter|short|concise|brief|trim)\b/.test(t)) {
    next.length = "short";
    changes.push("Shorter");
  } else if (/\b(longer|more detail|expand)\b/.test(t)) {
    next.length = "standard";
    changes.push("Longer");
  }

  if (/\b(formal|professional)\b/.test(t)) {
    next.tone = "formal";
    changes.push("More formal");
  } else if (/\b(friendl\w*|casual|warm\w*)\b/.test(t)) {
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
    if (!next.personal) {
      next.personal = true;
      changes.push("Greets by name");
    }
  }

  const discount = detectDiscount(text);
  if (discount && discount !== next.discount) {
    next.discount = discount;
    changes.push(`Discount ${discount}`);
  }

  if (/\b(coupon|code)\b/.test(t)) {
    const code = text.match(/\b(?:code|coupon)\s+([A-Z0-9]{3,})\b/i)?.[1]?.toUpperCase();
    next.buttons = next.buttons.filter((b) => b.kind !== "copy-code");
    if (removing && !code) {
      changes.push("Removed coupon code");
    } else {
      next.buttons.push({ kind: "copy-code", code: code ?? "SAVE20" });
      changes.push(`Copy-code button (${code ?? "SAVE20"})`);
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

  const quoted = text.match(/["“']([^"”']{1,25})["”']/)?.[1];
  if (/\bquick repl(y|ies)\b/.test(t) || (/\bbutton\b/.test(t) && !removing && changes.every((c) => !/button/i.test(c)))) {
    next.buttons.push({ kind: "quick-reply", text: quoted ?? "I'm interested" });
    changes.push(`Quick reply "${quoted ?? "I'm interested"}"`);
  } else if (removing && /\bbuttons?\b/.test(t) && !/\b(coupon|code)\b/.test(t)) {
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
