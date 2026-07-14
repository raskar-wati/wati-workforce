import { streamText, type ModelMessage } from "ai";

export const maxDuration = 60;

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
- Don't ask clarifying questions if a reasonable interpretation exists. Make the call, answer, and offer to refine.`;

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
