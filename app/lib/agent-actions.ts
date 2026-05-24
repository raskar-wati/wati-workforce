import type { HandoffCtaAction } from "./agents";

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
};

const SCRIPTS: Record<HandoffCtaAction, AgentActionScript> = {
  "create-segment": CREATE_SEGMENT,
  "send-campaign": SEND_CAMPAIGN,
  "send-bulk-message": SEND_BULK_MESSAGE,
  "create-inbox-filter": CREATE_INBOX_FILTER,
};

export function getActionScript(action: HandoffCtaAction): AgentActionScript {
  return SCRIPTS[action];
}
