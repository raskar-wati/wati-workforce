import type { HandoffCtaAction } from "./agents";

/**
 * Governance class per PRD sub-page 3 — every write belongs to one of three
 * classes; reads are autonomous:
 * - "read" — reads, tests, notes (the single autonomous write). No human in
 *   the loop; run starts immediately.
 * - "A"    — draft-first objects (template, rule, keyword action, chatbot,
 *   broadcast). A pre-write draft card offers dual commit: create as draft
 *   (inactive, approve later) or create-and-activate in one confirmation.
 * - "B"    — inert objects (segments, tags, attributes, quick replies).
 *   Created directly; no effect until referenced; receipt says so.
 * - "C"    — immediate-effect actions (sends, assignment, segment update,
 *   default reply). No draft state exists; a confirmation card states the
 *   immediate effect before execution. Never promotable to auto-actions.
 */
export type GovernanceClass = "read" | "A" | "B" | "C";

/** Object states shown on receipt-card pills (PRD sub-page 6). */
export type AgentObjectState =
  | "draft"
  | "live"
  | "pending-meta"
  | "armed"
  /** A draft the human turned down — terminal, the receipt keeps the card. */
  | "rejected"
  /** A draft nobody decided in time — terminal, dropped without effect. */
  | "expired";

export type DraftCheck = {
  verdict: "ok" | "warn" | "blocker" | "info";
  text: string;
  metric?: string;
};

/** Class A pre-write draft card: dependency summary + verdicts + dual commit. */
export type DraftSpec = {
  /** Draft-card headline describing the object to create. */
  title: string;
  /** "Will create: …" dependency line. */
  summary: string;
  /** Evidence rows (shadowing verdict, blockers, context). */
  checks: readonly DraftCheck[];
  /** One-step commit label, e.g. "Create and enable". */
  activateLabel: string;
  /** Object state after the one-step commit (or after later approval). */
  activeState: AgentObjectState;
};

/**
 * PRD §3.2 (wati_schedule_broadcast): recipient count + cost estimate,
 * restated to the human on the draft card and again when arming a schedule.
 */
export type SendEstimateSpec = {
  /** Headline of the arming confirmation, e.g. "Arm the schedule for this broadcast?". */
  confirmTitle: string;
  /** Who receives it, e.g. "Audience · segment from this handoff". */
  audience: string;
  /** Recipient count metric, e.g. "1,284 recipients". */
  recipients: string;
  /** Pricing basis, e.g. "Marketing rate · ₹0.79 per message". */
  rate: string;
  /** Total cost metric, e.g. "₹1,014 est.". */
  cost: string;
  /** Send window line, e.g. "Sends tomorrow, 10:00 AM IST". */
  window: string;
  /** Balance context, e.g. "Credit balance after send: ₹8,406". */
  balanceNote?: string;
};

/** Class C pre-execution confirmation: states the immediate effect. */
export type ConfirmSpec = {
  title: string;
  /** Exactly what happens, and that it is immediate/irreversible. */
  effect: string;
  confirmLabel: string;
  /** Receipt state after execution, when the object has one. */
  resultState?: AgentObjectState;
};

export type AgentActionScript = {
  /** Title shown while the run is in flight, e.g. "Creating segments by topic". */
  runTitle: string;
  /** Status-indicator lines, cycled while the run is in flight. */
  steps: readonly string[];
  /** Headline of the receipt card, e.g. "Segment created under Contacts". */
  resultLabel: string;
  /** Where the user can find the result in Wati, e.g. "Contacts → Segments". */
  resultDestination: string;
  /** Label of the (non-clickable) deep-link CTA on the receipt card. */
  resultCtaLabel: string;
  /** Governance class — drives the card sequence and auto-action gating. */
  governance: GovernanceClass;
  /** Class A only: the pre-write draft card. */
  draft?: DraftSpec;
  /**
   * Broadcast-family Class A only: the send estimate. Shown on the draft card
   * and restated as an arming confirmation before the schedule goes ARMED —
   * both approval surfaces route through it (PRD §3.2).
   */
  sendEstimate?: SendEstimateSpec;
  /** Class C only: the pre-execution confirmation card. */
  confirm?: ConfirmSpec;
  /** Class B only: receipt note, e.g. "Inert until a rule references it". */
  inertNote?: string;
  /** Approve action on a DRAFT receipt (governance handoff matrix). */
  approveLabel?: string;
  /** Undo affordance on an active receipt — maps to a state revert. */
  undoLabel?: string;
  /** Pill label override for the live state, e.g. "Approved" for templates. */
  liveStateLabel?: string;
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
  governance: "B",
  inertNote: "Inert until a broadcast or rule targets it",
};

const SEND_CAMPAIGN: AgentActionScript = {
  runTitle: "Preparing campaign in Broadcasts",
  steps: [
    "Drafting campaign copy",
    "Selecting target audience",
    "Validating WhatsApp template",
    "Saving campaign",
  ],
  resultLabel: "Campaign created",
  resultDestination: "Wati → Broadcasts → Campaigns",
  resultCtaLabel: "View campaign",
  governance: "A",
  draft: {
    title: "Campaign: re-engage the matched contacts",
    summary: "Will create: campaign draft · audience from this handoff · template mapping",
    checks: [
      { verdict: "ok", text: "Template approved and variable mapping complete" },
    ],
    activateLabel: "Create and schedule",
    activeState: "armed",
  },
  sendEstimate: {
    confirmTitle: "Arm the schedule for this campaign?",
    audience: "Audience · matched contacts from this handoff",
    recipients: "312 recipients",
    rate: "Marketing rate · ₹0.79 per message",
    cost: "₹246 est.",
    window: "Sends tomorrow, 10:00 AM IST",
    balanceNote: "Credit balance after send: ₹9,174",
  },
  approveLabel: "Confirm & schedule",
  undoLabel: "Disarm",
};

const SEND_BULK_MESSAGE: AgentActionScript = {
  runTitle: "Sending bulk message",
  steps: [
    "Drafting message",
    "Selecting recipients",
    "Validating WhatsApp template",
    "Sending via Wati",
  ],
  resultLabel: "Bulk message sent",
  resultDestination: "Wati → Broadcasts → Bulk messages",
  resultCtaLabel: "View delivery",
  governance: "C",
  confirm: {
    title: "Send a bulk message to the matched contacts?",
    effect: "Sends immediately via WhatsApp — sent messages can't be recalled",
    confirmLabel: "Confirm & send",
  },
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
  governance: "C",
  confirm: {
    title: "Activate this Team Inbox filter?",
    effect: "Applies immediately to every operator's inbox view",
    confirmLabel: "Confirm & activate",
    resultState: "live",
  },
  undoLabel: "Disable",
};

const CREATE_TEMPLATE: AgentActionScript = {
  runTitle: "Drafting WhatsApp template",
  steps: [
    "Writing template copy",
    "Adding variables and buttons",
    "Setting category and language",
    "Saving template",
  ],
  resultLabel: "WhatsApp template created",
  resultDestination: "Wati → Broadcasts → Templates",
  resultCtaLabel: "Review template",
  governance: "A",
  draft: {
    title: "WhatsApp template for this reply",
    summary: "Will create: message template · category and language set · unsubmitted",
    checks: [
      { verdict: "ok", text: "Name and variables pass Meta format rules" },
      { verdict: "warn", text: "Meta review is required before anything can send it" },
    ],
    activateLabel: "Create and submit to Meta",
    activeState: "pending-meta",
  },
  approveLabel: "Submit to Meta",
  liveStateLabel: "Approved",
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
  governance: "C",
  confirm: {
    title: "Submit this template to Meta for review?",
    effect: "Submission is irreversible — Meta typically reviews within 48 hours",
    confirmLabel: "Submit to Meta",
    resultState: "pending-meta",
  },
  liveStateLabel: "Approved",
};

const SCHEDULE_BROADCAST: AgentActionScript = {
  runTitle: "Preparing broadcast",
  steps: [
    "Selecting target segment",
    "Estimating recipient count and cost",
    "Confirming send window",
    "Saving broadcast",
  ],
  resultLabel: "Broadcast created",
  resultDestination: "Wati → Broadcasts → Scheduled",
  resultCtaLabel: "View schedule",
  governance: "A",
  draft: {
    title: "Broadcast to the matched segment",
    summary: "Will create: broadcast draft · audience resolved · send window set",
    checks: [
      { verdict: "ok", text: "Template approved · audience has recipients" },
    ],
    activateLabel: "Create and schedule",
    activeState: "armed",
  },
  sendEstimate: {
    confirmTitle: "Arm the schedule for this broadcast?",
    audience: "Audience · segment from this handoff",
    recipients: "1,284 recipients",
    rate: "Marketing rate · ₹0.79 per message",
    cost: "₹1,014 est.",
    window: "Sends tomorrow, 10:00 AM IST",
    balanceNote: "Credit balance after send: ₹8,406",
  },
  approveLabel: "Confirm & schedule",
  undoLabel: "Disarm",
};

const CREATE_KEYWORD_REPLY: AgentActionScript = {
  runTitle: "Creating keyword auto-reply",
  steps: [
    "Choosing trigger keywords",
    "Writing the auto-reply",
    "Saving keyword action",
  ],
  resultLabel: "Keyword reply created",
  resultDestination: "Wati → Automations → Keyword actions",
  resultCtaLabel: "Review rule",
  governance: "A",
  draft: {
    title: "Keyword auto-reply for the unhandled topic",
    summary: "Will create: keyword action · reply material",
    checks: [
      { verdict: "ok", text: "Keywords are unclaimed by other rules" },
      { verdict: "warn", text: "Takes priority over your catch-all reply for these keywords" },
    ],
    activateLabel: "Create and enable",
    activeState: "live",
  },
  approveLabel: "Enable action",
  undoLabel: "Disable",
};

const CREATE_AUTOMATION_RULE: AgentActionScript = {
  runTitle: "Creating automation rule",
  steps: [
    "Reading trigger schema",
    "Building condition and action",
    "Saving rule",
  ],
  resultLabel: "Automation rule created",
  resultDestination: "Wati → Automations → Rules",
  resultCtaLabel: "Review rule",
  governance: "A",
  draft: {
    title: "Automation rule for this handoff",
    summary: "Will create: trigger + condition + one action",
    checks: [
      { verdict: "ok", text: "No shadowing conflicts with your active rules" },
      { verdict: "info", text: "Unspecified fields keep their defaults — nothing else changes" },
    ],
    activateLabel: "Create and enable",
    activeState: "live",
  },
  approveLabel: "Enable rule",
  undoLabel: "Disable",
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
  governance: "C",
  confirm: {
    title: "Apply this default reply?",
    effect: "Every unmatched inbound message gets this reply, immediately",
    confirmLabel: "Confirm & apply",
    resultState: "live",
  },
};

const CREATE_CHATBOT: AgentActionScript = {
  runTitle: "Drafting chatbot flow",
  steps: [
    "Picking a starting template from the flow store",
    "Laying out flow nodes",
    "Writing message copy",
    "Saving flow",
  ],
  resultLabel: "Chatbot flow created",
  resultDestination: "Wati → Chatbots",
  resultCtaLabel: "Open in flow builder",
  governance: "A",
  draft: {
    title: "Chatbot flow from a store template",
    summary: "Will create: unpublished flow · nodes wired · copy drafted",
    checks: [
      { verdict: "ok", text: "All branches wired — no dead ends or unreachable nodes" },
      { verdict: "info", text: "Node count is within your plan limit" },
    ],
    activateLabel: "Create and publish",
    activeState: "live",
  },
  approveLabel: "Publish flow",
  undoLabel: "Unpublish",
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
  governance: "read",
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
  governance: "B",
  inertNote: "Inert until a rule or segment references it",
};

const CREATE_TAG: AgentActionScript = {
  runTitle: "Creating tag",
  steps: ["Checking existing tags", "Creating tag definition"],
  resultLabel: "Tag created",
  resultDestination: "Wati → Contacts → Tags",
  resultCtaLabel: "View tag",
  governance: "B",
  inertNote: "Inert until applied to contacts",
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
  governance: "C",
  confirm: {
    title: "Update the segment filter?",
    effect: "Every broadcast and rule targeting this segment changes with it — membership re-evaluates now",
    confirmLabel: "Confirm & update",
  },
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
  governance: "C",
  confirm: {
    title: "Route the matched conversations to this team?",
    effect: "Reassignment takes effect immediately in Team Inbox",
    confirmLabel: "Confirm & assign",
  },
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
  governance: "read",
};

const CREATE_QUICK_REPLY: AgentActionScript = {
  runTitle: "Saving quick reply",
  steps: ["Polishing approved draft", "Saving as canned response"],
  resultLabel: "Quick reply saved",
  resultDestination: "Wati → Team Inbox → Quick replies",
  resultCtaLabel: "View quick reply",
  governance: "B",
  inertNote: "Available to operators — no automated effect",
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
 * Class C actions need a human confirmation per occurrence, so they can never
 * be promoted to an agent's auto-actions ("Always do this"). Class A actions
 * CAN auto-run — the agent creates the object as an inactive draft and the
 * activation stays human-approved (the Tool Registry's "Autonomous (draft)").
 */
export function canAutoRun(action: HandoffCtaAction): boolean {
  return getActionScript(action).governance !== "C";
}
