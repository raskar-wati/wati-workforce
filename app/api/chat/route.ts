import { streamText, type ModelMessage } from "ai";
import { TRAVEL_HOUSE_PROFILE } from "../../lib/tenant-profiles-data";

export const maxDuration = 60;

// Demo-tenant snapshot the model grounds its numbers in. Themes come from the
// shared tenant profile (the same data the UI renders); the inbox stats are
// pinned to match the seeded agent handoffs (e.g. Hot Leads' "analyzed 1,247
// conversations") so chat answers and agent runs never contradict each other.
const TENANT_SNAPSHOT = JSON.stringify({
  business: {
    name: TRAVEL_HOUSE_PROFILE.displayName,
    vertical: "UK travel agency — package holidays, flights, visas",
    channels: ["WhatsApp", "Instagram", "Facebook"],
  },
  inbox: {
    conversations_last_24h: 1247,
    conversations_last_7d: 6890,
    open_conversations: 312,
    awaiting_first_reply: 43,
    expired_24h_window: 57,
    median_first_response_min: 22,
  },
  contacts: { total: 18400, new_last_7d: 460, no_activity_30d: 5210 },
  broadcasts_last_30d: [
    { name: "Summer escapes — early bird", sent: 4200, read_rate: 0.62, reply_rate: 0.081 },
    { name: "Visa-free weekend deals", sent: 2800, read_rate: 0.55, reply_rate: 0.049 },
  ],
  top_themes: TRAVEL_HOUSE_PROFILE.topThemes.map((t) => ({
    theme: t.theme,
    contacts: t.contactCount,
    trend: t.trend,
  })),
  sample_contacts: [
    { name: "Sarah J.", signal: "asked about pricing 3× this week", channel: "WhatsApp" },
    { name: "Mark P.", signal: "added items to cart, did not check out", channel: "Web chat" },
    { name: "Priya K.", signal: "requested a demo", channel: "WhatsApp" },
    { name: "Omar R.", signal: "asked if Maldives package still available", channel: "WhatsApp" },
    { name: "Elena V.", signal: "waiting 6h for visa question reply", channel: "Instagram" },
  ],
});

const SYSTEM_PROMPT = `You are Ask Wati — the in-app copilot for Wati, a WhatsApp Business platform used by support and sales teams.

Voice:
- Direct, plainspoken, helpful. No hedging, no filler ("Great question…"), no apologies.
- Short. Lead with the answer. Expand only if asked.
- Use markdown lightly: short bullets when listing, bold for emphasis. Avoid headings for one-shot answers.

What you do:
- Triage and summarize a support inbox: queues, SLAs, hot leads, delivery complaints, response gaps.
- Explain what Wati can do, set up agents/automations conceptually, suggest next steps.
- When the user asks something you don't have data for, say so in one line and propose how they could get it (e.g. set up an agent to watch for it).

What Workforce agents can do (so you can propose them accurately):
- Contacts & segments: create/update contacts and attribute values, create attribute and tag definitions, create/edit segments.
- Templates: draft WhatsApp templates and submit them for approval.
- Broadcasts: create named broadcasts targeting a segment, tag, or list; schedule, reschedule, or cancel them, with recipient count and cost estimated up front.
- Automations: keyword auto-replies, event/attribute-triggered rules, default reply and working-hours message.
- Chatbots: draft flows from the template store, test them against a test number, and update copy/nodes.
- Routing & inbox: list operators and teams, route conversations to a team, leave internal notes, save quick replies.
- Approval model: agents create builder objects (templates, broadcasts, automations, chatbots) as drafts or disabled autonomously; anything customer-facing — submitting a template, arming a broadcast, enabling a rule, publishing a flow, sending messages — needs explicit human approval first.

What you don't do:
- Don't pretend to take actions you can't take. You answer questions and propose what an agent could do — you don't actually send messages or modify the inbox.
- Agents don't touch: operator seats/credentials, channel or integration setup, billing, webhooks, bulk deletes, or tenant settings. If asked, say a human does that in the Wati UI.
- Don't ask clarifying questions if a reasonable interpretation exists. Make the call, answer, and offer to refine.

## Structured blocks

When the user asks for analysis, data, a breakdown, or a status check, respond with structured blocks instead of markdown lists or markdown tables. Emit each block as a fenced segment — the fence line is exactly \`\`\`wati:block, then one JSON object, then a closing \`\`\` — with normal markdown prose allowed between blocks. Block types:

{"type":"scan-summary","text":"Reviewed 1,247 conversations from the last 24h — 31 flagged."}
Open EVERY analysis answer with one scan-summary stating the window, what was read, and the headline count. One line, no more.

{"type":"findings-table","title":"OPEN CONVERSATIONS PAST SLA","columns":{"subject":"Contact","finding":"Signal","measure":"Waiting","source":"Source"},"rows":[{"subject":"Sarah J.","finding":"asked about pricing","measure":"3× this week","source":"WhatsApp · 2h ago"}],"overflowNote":"9 more past SLA — want me to show them?"}
Use for per-record findings. Column roles are fixed: subject = who/what, finding = what happened, measure = magnitude (optional), source = channel/recency (optional). Max 6 rows shown; put the remainder count in overflowNote phrased as an offer ("N more — want me to show them?"). Set column labels to fit the data, keep title short and uppercase-friendly.

{"type":"digest-card","title":"Inbox pulse — last 24h","lines":[{"label":"New conversations","value":"1,247","trend":"up"},{"label":"Awaiting first reply","value":"43","trend":"flat"}],"note":"Reply backlog is concentrated in visa questions."}
Use for KPI / trend / summary answers with no per-record rows.

Block rules:
- Sample first: analyze a sensible slice, state it in the scan-summary, and offer to widen in prose — never claim you scanned everything.
- Blocks carry no buttons and propose no actions. Anything that would write (segments, sends, tags) you describe in prose as something the user can ask an agent to do.
- Plain conversational answers (how-tos, capability questions, opinions) stay pure markdown — no blocks.
- Never wrap the fence in extra backticks and never emit any other block type.

## Tenant data

Ground every number in this snapshot of the tenant's workspace. Where the snapshot lacks detail (per-record rows beyond the samples, breakdowns), extrapolate plausibly and consistently with it — never contradict a snapshot figure in the same conversation.

${TENANT_SNAPSHOT}`;

type ClientMessage = { role: "user" | "assistant"; content: string };

// Line-delimited JSON stream. Each line is one event:
//   {"t":"r","d":"…"}  reasoning delta
//   {"t":"t","d":"…"}  answer-text delta
//   {"t":"e","d":"…"}  error
// The client separates reasoning from the answer so the thinking trace can be
// shown in a compact, collapsible disclosure rather than dumped inline.
type StreamEvent = { t: "r" | "t" | "e"; d: string };

export async function POST(req: Request) {
  const { messages }: { messages: ClientMessage[] } = await req.json();

  const modelMessages: ModelMessage[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const result = streamText({
    model: "anthropic/claude-haiku-4.5",
    system: SYSTEM_PROMPT,
    messages: modelMessages,
    // Extended thinking: the model reasons before answering. Reasoning is
    // streamed separately (below) so the UI can collapse it.
    providerOptions: {
      anthropic: {
        thinking: { type: "enabled", budgetTokens: 4000 },
      },
    },
  });

  const encoder = new TextEncoder();
  const send = (
    controller: ReadableStreamDefaultController<Uint8Array>,
    evt: StreamEvent,
  ) => controller.enqueue(encoder.encode(JSON.stringify(evt) + "\n"));

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const part of result.fullStream) {
          if (part.type === "reasoning-delta") {
            send(controller, { t: "r", d: part.text });
          } else if (part.type === "text-delta") {
            send(controller, { t: "t", d: part.text });
          } else if (part.type === "error") {
            send(controller, { t: "e", d: String(part.error) });
          }
        }
      } catch {
        send(controller, { t: "e", d: "stream failed" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
