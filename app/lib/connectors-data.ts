/**
 * Seed data for Ask Wati connectors: the apps and MCP servers Wati AI can
 * use, and the tools each one brings. Demo-only: nothing here talks to a
 * real server. Sign-in and "reading tools from the server" are simulated.
 */

/** What Wati AI may do with one tool. */
export type ToolPermission = "allow" | "approval" | "block";

/** Read tools only look things up; write tools change something. */
export type ToolKind = "read" | "write";

export type ConnectorTool = {
  name: string;
  kind: ToolKind;
  permission: ToolPermission;
};

export type Connector = {
  id: string;
  name: string;
  /** Short line under the name in lists. */
  summary: string;
  host: string;
  /** What the server says it does, shown on the detail page. */
  description: string;
  tools: ConnectorTool[];
  /** Switched on for chats. Off keeps it connected but unused. */
  enabled: boolean;
  /** Sign-in has expired; it needs reconnecting before it can be used. */
  expired: boolean;
  /** Ships with Wati and can't be edited or disconnected. */
  builtIn?: boolean;
  /** Added by hand as a custom MCP server rather than from Popular apps. */
  custom?: boolean;
  /** Set when it came from Popular apps, so the app shows as connected. */
  appId?: string;
  /** Brand logo under /public/connectors. Custom servers have none. */
  logo?: string;
};

/** One-click apps: connecting one signs in through a pop-up. */
export type PopularApp = {
  id: string;
  name: string;
  logo: string;
  summary: string;
  host: string;
  description: string;
  tools: ConnectorTool[];
};

export const PERMISSION_LABELS: Record<ToolPermission, string> = {
  allow: "Always allow",
  approval: "Needs approval",
  block: "Blocked",
};

export const TOOL_KIND_LABELS: Record<ToolKind, string> = {
  read: "Read-only tools",
  write: "Interactive tools",
};

const read = (name: string): ConnectorTool => ({ name, kind: "read", permission: "allow" });
const write = (name: string): ConnectorTool => ({ name, kind: "write", permission: "approval" });

export const SEED_CONNECTORS: Connector[] = [
  {
    id: "wati",
    logo: "/connectors/wati.svg",
    name: "Wati",
    summary: "Contacts, templates and rules",
    host: "mcp.wati.io",
    description:
      "Wati's own tools. Read contacts, templates, broadcasts and automation rules, or change them with your approval.",
    tools: [
      read("Search contacts"),
      read("List templates"),
      read("Read conversation"),
      write("Create automation rule"),
      write("Update contact"),
    ],
    enabled: true,
    expired: false,
    builtIn: true,
  },
  {
    id: "chargebee",
    logo: "/connectors/chargebee.svg",
    name: "Chargebee",
    summary: "Subscriptions, invoices and refunds",
    host: "mcp.chargebee.com",
    description:
      "Look up customers, subscriptions and invoices, and refund an invoice with your approval.",
    tools: [read("Find customer"), read("List invoices"), write("Refund invoice")],
    enabled: true,
    expired: false,
    appId: "chargebee",
  },
  {
    id: "sheets",
    logo: "/connectors/google-sheets.svg",
    name: "Google Sheets",
    summary: "Spreadsheets",
    host: "sheets.googleapis.com",
    description: "Read ranges and update cells in spreadsheets you can already open.",
    tools: [read("Read range"), write("Update cells")],
    enabled: true,
    expired: false,
  },
  {
    id: "hubspot",
    logo: "/connectors/hubspot.svg",
    name: "HubSpot",
    summary: "Contacts, deals and companies",
    host: "mcp.hubspot.com",
    description:
      "Search contacts, deals and companies, and create or update records with your approval.",
    tools: [
      read("Search contacts"),
      read("Find deal"),
      write("Create contact"),
      write("Update deal stage"),
    ],
    enabled: true,
    expired: false,
    appId: "hubspot",
  },
  {
    id: "slack",
    logo: "/connectors/slack.svg",
    name: "Slack",
    summary: "Channels and messages",
    host: "mcp.slack.com",
    description:
      "Read channels and threads, and post messages on your behalf with your approval.",
    tools: [read("List channels"), read("Read thread"), write("Post message")],
    enabled: false,
    expired: false,
    appId: "slack",
  },
  {
    id: "zendesk",
    logo: "/connectors/zendesk.svg",
    name: "Zendesk",
    summary: "Tickets and help center",
    host: "mcp.zendesk.com",
    description: "Search tickets and help center articles for one customer.",
    tools: [read("Search tickets"), read("Read article")],
    enabled: false,
    expired: true,
  },
];

export const POPULAR_APPS: PopularApp[] = [
  {
    id: "shopify",
    logo: "/connectors/shopify.svg",
    name: "Shopify",
    summary: "Orders, products and customers",
    host: "mcp.shopify.com",
    description:
      "Look up orders, products and customers, and update orders with your approval.",
    tools: [
      read("Find order"),
      read("List products"),
      read("Find customer"),
      write("Cancel order"),
      write("Create discount"),
    ],
  },
  {
    id: "hubspot",
    logo: "/connectors/hubspot.svg",
    name: "HubSpot",
    summary: "Contacts, deals and companies",
    host: "mcp.hubspot.com",
    description:
      "Search contacts, deals and companies, and create or update records with your approval.",
    tools: [
      read("Search contacts"),
      read("Find deal"),
      write("Create contact"),
      write("Update deal stage"),
    ],
  },
  {
    id: "zoho",
    logo: "/connectors/zoho.svg",
    name: "Zoho CRM",
    summary: "Leads, contacts and deals",
    host: "mcp.zoho.com",
    description:
      "Search leads, contacts and deals, and create or update records with your approval.",
    tools: [
      read("Search leads"),
      read("Find deal"),
      write("Create lead"),
      write("Update lead status"),
    ],
  },
  {
    id: "google-calendar",
    logo: "/connectors/google-calendar.svg",
    name: "Google Calendar",
    summary: "Events and availability",
    host: "calendar.googleapis.com",
    description: "Check availability and read events, and book events with your approval.",
    tools: [read("Find free time"), read("List events"), write("Create event")],
  },
];

/** Tools a newly added custom server is assumed to expose (demo). */
export const CUSTOM_SERVER_TOOLS: ConnectorTool[] = [
  read("List resources"),
  read("Read resource"),
  write("Write resource"),
];

/** Letters for the connector's tile: first letter of the first word. */
export function connectorInitial(name: string): string {
  const clean = name.replace(/\[[^\]]*\]/g, "").replace(/[^A-Za-z0-9 ]/g, "").trim();
  return (clean[0] ?? "?").toUpperCase();
}
