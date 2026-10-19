import {
  BODY_LIMIT,
  BUTTON_TEXT_LIMIT,
  COUPON_CODE_LIMIT,
  FOOTER_LIMIT,
  MAX_BUTTONS,
  TEMPLATE_LANGUAGES,
  type ModelTemplate,
  type TemplatePurpose,
} from "../../lib/template-draft";

/**
 * Template drafting on an open-weight model. Speaks the OpenAI chat API, so
 * any compatible provider works; defaults to Qwen3.8-27B on Hugging Face
 * Inference Providers.
 *
 *   TEMPLATE_LLM_API_KEY   provider key (falls back to HF_TOKEN)
 *   TEMPLATE_LLM_BASE_URL  default https://router.huggingface.co/v1
 *   TEMPLATE_LLM_MODEL     default Qwen/Qwen3.8-27B
 *
 * Failures come back as 200 { ok: false, reason } so the chat can fall back
 * to the scripted drafter instead of erroring.
 */

export const maxDuration = 60;

const API_KEY = process.env.TEMPLATE_LLM_API_KEY ?? process.env.HF_TOKEN;
const BASE_URL = (process.env.TEMPLATE_LLM_BASE_URL ?? "https://router.huggingface.co/v1").replace(/\/$/, "");
const MODEL = process.env.TEMPLATE_LLM_MODEL ?? "Qwen/Qwen3.8-27B";

export type TemplateAiRequest =
  | { mode: "draft"; intent: string; purpose: TemplatePurpose; channel: string; language: string }
  | { mode: "refine"; template: ModelTemplate; instruction: string }
  | { mode: "enhance"; body: string; template: ModelTemplate };

export type TemplateAiResponse =
  | { ok: true; template?: ModelTemplate; body?: string; model: string }
  | { ok: false; reason: "no-key" | "no-credits" | "bad-output" | "error"; detail?: string };

const SCHEMA = `{
  "purpose": "promotion" | "order-update" | "delay" | "reminder" | "general",
  "name": "lowercase_snake_case, max 48 chars, specific to this message",
  "category": "marketing" | "utility",
  "language": one of ${JSON.stringify(TEMPLATE_LANGUAGES)},
  "header": null | {"kind": "image"} | {"kind": "text", "text": "max 60 chars"},
  "body": "max ${BODY_LIMIT} chars, written in the template language",
  "footer": null | "max ${FOOTER_LIMIT} chars",
  "buttons": [
    {"kind": "url", "text": "...", "url": "https://..."} |
    {"kind": "phone", "text": "...", "phone": "+..."} |
    {"kind": "copy-code", "code": "max ${COUPON_CODE_LIMIT} chars, no spaces"} |
    {"kind": "voice-call" | "request-contact" | "quick-reply" | "flow", "text": "..."}
  ],
  "samples": {"variable_name": "realistic example value"}
}`;

const RULES = `Rules for a template Meta will approve:
- Variables are named placeholders like {{name}} or {{order_id}}. Never start or end the body with a variable.
- Every variable in the body has a realistic sample in "samples", and samples has no other keys.
- marketing = promotions, offers, announcements. utility = order, account or appointment updates; utility copy must not sell or promote.
- Keep it scannable: 2–4 short sentences, at most one emoji, no ALL CAPS, no spammy punctuation.
- Marketing templates get an opt-out footer such as "Reply STOP to unsubscribe".
- Buttons only when they help the customer act. Button text max ${BUTTON_TEXT_LIMIT} chars. Max ${MAX_BUTTONS} buttons; at most 2 url, 1 phone, 1 copy-code, 1 voice-call, 1 request-contact, 1 flow.
- Use the exact coupon code, discount, dates and links the user gives; invent nothing that changes the offer.`;

const SYSTEM = `You write WhatsApp Business message templates for Wati users, ready for Meta review.
Reply with ONLY one JSON object matching this shape — no prose, no markdown:
${SCHEMA}

${RULES}`;

function messagesFor(req: TemplateAiRequest) {
  switch (req.mode) {
    case "draft":
      return [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `Channel: ${req.channel}\nLanguage: ${req.language}\nLikely purpose: ${req.purpose}\nWhat the business wants to send: ${req.intent}`,
        },
      ];
    case "refine":
      return [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `Current template:\n${JSON.stringify(req.template)}\n\nApply this change and return the full updated template. Keep everything the change doesn't touch exactly as it is.\nChange: ${req.instruction}`,
        },
      ];
    case "enhance":
      return [
        {
          role: "system",
          content: `You polish WhatsApp template bodies. Keep the meaning, language, every {{variable}} and every concrete detail (codes, dates, amounts, links). Fix grammar, spacing and repetition; make it clearer and more scannable. Max ${BODY_LIMIT} characters. Reply with ONLY {"body": "..."}.`,
        },
        {
          role: "user",
          content: `Template category: ${req.template.category}\nBody to polish:\n${req.body}`,
        },
      ];
  }
}

/** The JSON object in a reply, tolerating think blocks and code fences. */
function extractJson(text: string): unknown {
  const cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  const fenced = cleaned.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
  const src = fenced ? fenced[1] : cleaned;
  const start = src.indexOf("{");
  const end = src.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("no JSON object in reply");
  return JSON.parse(src.slice(start, end + 1));
}

async function callModel(messages: { role: string; content: string }[], qwenExtras: boolean) {
  return fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
    signal: AbortSignal.timeout(45_000),
    body: JSON.stringify({
      model: MODEL,
      messages,
      max_tokens: 1200,
      // Qwen's recommended non-thinking sampling.
      temperature: 0.7,
      top_p: 0.8,
      // Thinking adds latency and nothing for short structured output.
      ...(qwenExtras ? { top_k: 20, chat_template_kwargs: { enable_thinking: false } } : {}),
    }),
  });
}

function reply(body: TemplateAiResponse) {
  return Response.json(body);
}

export async function GET() {
  return Response.json({ enabled: Boolean(API_KEY), model: MODEL });
}

export async function POST(request: Request) {
  if (!API_KEY) return reply({ ok: false, reason: "no-key" });
  let req: TemplateAiRequest;
  try {
    req = (await request.json()) as TemplateAiRequest;
  } catch {
    return reply({ ok: false, reason: "error", detail: "bad request body" });
  }

  try {
    const messages = messagesFor(req);
    let res = await callModel(messages, true);
    // Some providers reject the Qwen-specific params; retry plain once.
    if (res.status === 400 || res.status === 422) res = await callModel(messages, false);
    if (res.status === 402) return reply({ ok: false, reason: "no-credits" });
    if (res.status === 401 || res.status === 403) return reply({ ok: false, reason: "no-key", detail: `HTTP ${res.status}` });
    if (!res.ok) return reply({ ok: false, reason: "error", detail: `HTTP ${res.status}` });

    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content ?? "";
    let parsed: Record<string, unknown>;
    try {
      parsed = extractJson(content) as Record<string, unknown>;
    } catch (e) {
      return reply({ ok: false, reason: "bad-output", detail: String(e) });
    }
    if (req.mode === "enhance") {
      const body = typeof parsed.body === "string" ? parsed.body.trim() : "";
      if (!body) return reply({ ok: false, reason: "bad-output", detail: "no body" });
      return reply({ ok: true, body, model: MODEL });
    }
    return reply({ ok: true, template: parsed as ModelTemplate, model: MODEL });
  } catch (e) {
    return reply({ ok: false, reason: "error", detail: String(e) });
  }
}
