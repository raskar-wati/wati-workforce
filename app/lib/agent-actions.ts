import type { HandoffCtaAction } from "./agents";

/**
 * How an action gets approved, per the Skills Expansion doc §1:
 * - "autonomous"      — reads, notes, tests. No human in the loop.
 * - "conversational"  — data writes (segment, attribute, tag, routing).
 *                       The CTA tap is the one-tap approval.
 * - "draft-first"     — builder writes (template, automation, chatbot).
 *                       The agent creates the object in draft / disabled /
 *                       unsubmitted state; activating it is a separate,
 *                       human-approved step.
 * - "gated"           — sends and activations (campaign, bulk message,
 *                       template submit, armed broadcast). Human confirms
 *                       every occurrence, so these are excluded from the
 *                       "Always do this" auto-action toggle.
 */
export type ActionApproval =
  | "autonomous"
  | "conversational"
  | "draft-first"
  | "gated";

export type AgentActionScript = {
  /** Title shown while the run is in flight, e.g. "Creating segments by topic". */
  runTitle: string;
  /** Status-indicator lines, cycled while the run is in flight. */
  steps: readonly string[];
  /** Headline of the result card, e.g. "Segment created under Contacts". */
  resultLabel: string;
  /** Where the user can find the result in Wati, e.g. "Contacts → Segments". */
  resultDestination: string;
  /** Label of the (non-clickable) view CTA on the result card. */
  resultCtaLabel: string;
  /** Approval class — drives the result-card state and auto-action gating. */
  approval: ActionApproval;
};

const CREATE_SEGMENT: AgentActionScript = {
  runTitle: "Creating segment in Contacts",
  steps: [
    "Reviewing matched conversations",
    "Grouping contacts by topic",
    "Writing segment to Wati Contacts",
    "Tagging matched contacts",
  ],
  resultLabel: "Segment created under Contacts",
  resultDestination: "Wati → Contacts → Segments",
  resultCtaLabel: "View segment",
  approval: "conversational",
};

const SEND_CAMPAIGN: AgentActionScript = {
  runTitle: "Launching campaign in Broadcasts",
  steps: [
    "Drafting campaign copy",
    "Selecting target audience",
    "Validating WhatsApp template",
    "Scheduling broadcast",
  ],
  resultLabel: "Campaign queued in Broadcasts",
  resultDestination: "Wati → Broadcasts → Scheduled",
  resultCtaLabel: "View campaign",
  approval: "gated",
};

const SEND_BULK_MESSAGE: AgentActionScript = {
  runTitle: "Preparing bulk message",
  steps: [
    "Drafting message",
    "Selecting recipients",
    "Validating WhatsApp template",
    "Sending via Wati",
  ],
  resultLabel: "Bulk message sent",
  resultDestination: "Wati → Broadcasts → Bulk messages",
  resultCtaLabel: "View delivery",
  approval: "gated",
};

const CREATE_INBOX_FILTER: AgentActionScript = {
  runTitle: "Creating filter in Team Inbox",
  steps: [
    "Reviewing matched conversations",
    "Building filter rules",
    "Applying filter to Team Inbox",
    "Activating filter",
  ],
  resultLabel: "Filter active in Team Inbox",
  resultDestination: "Wati → Team Inbox → Filters",
  resultCtaLabel: "View filter",
  approval: "conversational",
};

const CREATE_TEMPLATE: AgentActionScript = {
  runTitle: "Drafting WhatsApp template",
  steps: [
    "Writing template copy",
    "Adding variables and buttons",
    "Setting category and language",
    "Saving as unsubmitted draft",
  ],
  resultLabel: "Template drafted — not yet submitted",
  resultDestination: "Wati → Broadcasts → Templates",
  resultCtaLabel: "Review draft",
  approval: "draft-first",
};

const SUBMIT_TEMPLATE: AgentActionScript = {
  runTitle: "Submitting template to WhatsApp",
  steps: [
    "Validating against WhatsApp template rules",
    "Submitting for approval",
    "Tracking approval status",
  ],
  resultLabel: "Template submitted — awaiting WhatsApp approval",
  resultDestination: "Wati → Broadcasts → Templates",
  resultCtaLabel: "View status",
  approval: "gated",
};

const SCHEDULE_BROADCAST: AgentActionScript = {
  runTitle: "Scheduling broadcast",
  steps: [
    "Selecting target segment",
    "Estimating recipient count and cost",
    "Confirming send window",
    "Arming schedule",
  ],
  resultLabel: "Broadcast scheduled",
  resultDestination: "Wati → Broadcasts → Scheduled",
  resultCtaLabel: "View schedule",
  approval: "gated",
};

const CREATE_KEYWORD_REPLY: AgentActionScript = {
  runTitle: "Creating keyword auto-reply",
  steps: [
    "Choosing trigger keywords",
    "Writing the auto-reply",
    "Saving keyword action as disabled",
  ],
  resultLabel: "Keyword reply created — disabled until you enable it",
  resultDestination: "Wati → Automations → Keyword actions",
  resultCtaLabel: "Review rule",
  approval: "draft-first",
};

const CREATE_AUTOMATION_RULE: AgentActionScript = {
  runTitle: "Creating automation rule",
  steps: [
    "Reading trigger schema",
    "Building condition and action",
    "Saving rule as disabled",
  ],
  resultLabel: "Automation rule created — disabled until you enable it",
  resultDestination: "Wati → Automations → Rules",
  resultCtaLabel: "Review rule",
  approval: "draft-first",
};

const SET_DEFAULT_REPLY: AgentActionScript = {
  runTitle: "Updating default reply",
  steps: [
    "Drafting fallback message",
    "Checking working hours",
    "Applying default reply",
  ],
  resultLabel: "Default reply updated",
  resultDestination: "Wati → Automations → Default reply",
  resultCtaLabel: "View reply",
  approval: "conversational",
};

const CREATE_CHATBOT: AgentActionScript = {
  runTitle: "Drafting chatbot flow",
  steps: [
    "Picking a starting template from the flow store",
    "Laying out flow nodes",
    "Writing message copy",
    "Saving as unpublished draft",
  ],
  resultLabel: "Chatbot drafted — unpublished",
  resultDestination: "Wati → Chatbots",
  resultCtaLabel: "Open in flow builder",
  approval: "draft-first",
};

const TEST_CHATBOT: AgentActionScript = {
  runTitle: "Testing chatbot flow",
  steps: [
    "Sending test message to the flow",
    "Walking conversation branches",
    "Collecting transcript",
  ],
  resultLabel: "Test transcript ready",
  resultDestination: "Wati → Chatbots → Test runs",
  resultCtaLabel: "View transcript",
  approval: "autonomous",
};

const CREATE_ATTRIBUTE: AgentActionScript = {
  runTitle: "Creating contact attribute",
  steps: [
    "Checking attribute plan limit",
    "Defining attribute name and type",
    "Adding to the contact schema",
  ],
  resultLabel: "Attribute added to contact schema",
  resultDestination: "Wati → Contacts → Attributes",
  resultCtaLabel: "View attribute",
  approval: "conversational",
};

const CREATE_TAG: AgentActionScript = {
  runTitle: "Creating tag",
  steps: ["Checking existing tags", "Creating tag definition"],
  resultLabel: "Tag created",
  resultDestination: "Wati → Contacts → Tags",
  resultCtaLabel: "View tag",
  approval: "conversational",
};

const UPDATE_SEGMENT: AgentActionScript = {
  runTitle: "Updating segment",
  steps: [
    "Loading segment filter",
    "Applying new conditions",
    "Re-evaluating membership",
  ],
  resultLabel: "Segment filter updated",
  resultDestination: "Wati → Contacts → Segments",
  resultCtaLabel: "View segment",
  approval: "conversational",
};

const ASSIGN_TEAM: AgentActionScript = {
  runTitle: "Routing conversations to team",
  steps: [
    "Listing teams and availability",
    "Matching conversation topic to team",
    "Assigning conversations",
  ],
  resultLabel: "Conversations routed to team",
  resultDestination: "Wati → Team Inbox",
  resultCtaLabel: "View assignments",
  approval: "conversational",
};

const ADD_NOTE: AgentActionScript = {
  runTitle: "Adding internal notes",
  steps: [
    "Summarizing context for the human picking this up",
    "Attaching note to conversation",
  ],
  resultLabel: "Note added to conversation",
  resultDestination: "Wati → Team Inbox → Notes",
  resultCtaLabel: "View note",
  approval: "autonomous",
};

const CREATE_QUICK_REPLY: AgentActionScript = {
  runTitle: "Saving quick reply",
  steps: ["Polishing approved draft", "Saving as canned response"],
  resultLabel: "Quick reply saved",
  resultDestination: "Wati → Team Inbox → Quick replies",
  resultCtaLabel: "View quick reply",
  approval: "conversational",
};

const SCRIPTS: Record<HandoffCtaAction, AgentActionScript> = {
  "create-segment": CREATE_SEGMENT,
  "send-campaign": SEND_CAMPAIGN,
  "send-bulk-message": SEND_BULK_MESSAGE,
  "create-inbox-filter": CREATE_INBOX_FILTER,
  "create-template": CREATE_TEMPLATE,
  "submit-template": SUBMIT_TEMPLATE,
  "schedule-broadcast": SCHEDULE_BROADCAST,
  "create-keyword-reply": CREATE_KEYWORD_REPLY,
  "create-automation-rule": CREATE_AUTOMATION_RULE,
  "set-default-reply": SET_DEFAULT_REPLY,
  "create-chatbot": CREATE_CHATBOT,
  "test-chatbot": TEST_CHATBOT,
  "create-attribute": CREATE_ATTRIBUTE,
  "create-tag": CREATE_TAG,
  "update-segment": UPDATE_SEGMENT,
  "assign-team": ASSIGN_TEAM,
  "add-note": ADD_NOTE,
  "create-quick-reply": CREATE_QUICK_REPLY,
};

export function getActionScript(action: HandoffCtaAction): AgentActionScript {
  return SCRIPTS[action];
}

/**
 * Gated actions need a human confirmation per occurrence, so they can never
 * be promoted to an agent's auto-actions ("Always do this").
 */
export function canAutoRun(action: HandoffCtaAction): boolean {
  return getActionScript(action).approval !== "gated";
}
