/**
 * Page-aware starter asks for Ask Wati. One list per module page, shared by
 * the drawer's hero and the header Wati AI bar so both offer the same asks.
 * The drawer knows its page from the module's context provider; the bar sits
 * in the shell above those providers, so it reads the route instead.
 */

export type AskWatiPage = "inbox" | "contacts" | "shopify" | "analytics";

const PROMPTS: Record<AskWatiPage | "default", readonly string[]> = {
  analytics: [
    "Conversation trend",
    "Incoming message trend",
    "Which operator performs best?",
  ],
  shopify: [
    "Show conversion trend",
    "Show CSAT trend",
    "Show which operator performs best",
  ],
  contacts: [
    "Find my top spenders this month",
    "Which contacts haven't been messaged in 30 days?",
    "What can you do?",
  ],
  inbox: [
    "Summarize my inbox queue",
    "Which conversations need a response now?",
    "What can you do?",
  ],
  default: [
    "Find customers ready to book",
    "Show me delivery complaints today",
    "Create a template for our Diwali sale",
  ],
};

/** Starter asks for a page; pages without their own set get the default. */
export function getStarterPrompts(page: AskWatiPage | null): readonly string[] {
  return PROMPTS[page ?? "default"];
}

const PAGE_BY_PATH: Record<string, AskWatiPage> = {
  "/preview": "inbox",
  "/preview/contacts": "contacts",
  "/preview/shopify": "shopify",
  "/preview/analytics": "analytics",
};

/** The module page a route belongs to, or null (e.g. the Ask Wati page). */
export function pageForPath(pathname: string): AskWatiPage | null {
  return PAGE_BY_PATH[pathname.replace(/\/$/, "") || "/"] ?? null;
}
