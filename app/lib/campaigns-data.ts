import { draftTemplate, fromModelTemplate, type TemplateDraft } from "./template-draft";

/**
 * Demo campaign calendar for the Campaigns page (October 2026, "today" is
 * 28 Oct). Sent and scheduled broadcasts are static; Wati's recommendations
 * carry a full template draft so the chat can pick them up as-is.
 */

export type CampaignStatus = "sent" | "scheduled" | "recommended";

export type CalendarCampaign = {
  id: string;
  name: string;
  /** YYYY-MM-DD */
  date: string;
  status: CampaignStatus;
};

export type RecommendedCampaign = CalendarCampaign & {
  status: "recommended";
  sendTime: string;
  /** Why Wati suggests it, grounded in the account's past sends. */
  reason: string;
  audience: { name: string; contacts: number };
  template: TemplateDraft;
};

const sent = (date: string, names: string[], more = 0): CalendarCampaign[] => [
  ...names.map((name, i) => ({ id: `${date}-s${i}`, name, date, status: "sent" as const })),
  // Hidden overflow — counted into "+N more", never shown.
  ...Array.from({ length: more }, (_, i) => ({
    id: `${date}-x${i}`,
    name: `broadcast_${date}_${i}`,
    date,
    status: "sent" as const,
  })),
];

export const CALENDAR_CAMPAIGNS: CalendarCampaign[] = [
  ...sent("2026-09-30", ["for_drip_click_tracking", "ai_uti_3"], 4),
  ...sent("2026-10-01", ["uti_header", "ai_uti_3"], 3),
  ...sent("2026-10-06", ["pam_testing"]),
  ...sent("2026-10-07", ["utility_followup_20261013_2", "utility_followup_20261013_3"], 10),
  ...sent("2026-10-08", ["utility_followup_20261013_4", "test-rerty-1"], 1),
  ...sent("2026-10-09", ["Festive Picks Re-Engagement", "followup_schedule_segment_2"], 5),
  ...sent("2026-10-10", ["festive_picks_test_2200IST"]),
  ...sent("2026-10-11", ["test_click_121020260054", "uti_oct9_campaign_revamp_1"], 1),
  ...sent("2026-10-12", ["send_pending_template", "utility_campaign_now_121020"]),
  ...sent("2026-10-13", ["pending_template", "new_chat_v1_1791872445917"], 2),
  ...sent("2026-10-14", ["uti_support_ticket_update_1", "uti_support_ticket_update_2"], 3),
  ...sent("2026-10-15", ["return_to_routine_sunscreen", "test_invalid"], 4),
  ...sent("2026-10-16", ["test_pending", "test_pending_2"], 2),
  ...sent("2026-10-21", ["new_chat_v1_1792562729997", "new_chat_v1_1792597563219"], 1),
  ...sent("2026-10-22", ["test_failed_221020261538", "test_paused_221020261553"]),
  ...sent("2026-10-23", ["Testing", "uti_support_ticket_update_3"], 1),
  ...sent("2026-10-26", ["test_retry1"]),
  ...sent("2026-10-27", ["11111tes_271020261411", "test_va_271020261415"], 8),
  { id: "sch-1", name: "Deepavali Begins with Svarnim", date: "2026-11-01", status: "scheduled" },
  { id: "sch-2", name: "test_update", date: "2026-11-04", status: "scheduled" },
  { id: "sch-3", name: "Deepavali Reminder: Discover Svarnim", date: "2026-11-05", status: "scheduled" },
];

/** Fold a recommended template into a full draft, like a model reply. */
function recommended(
  intent: string,
  purpose: Parameters<typeof draftTemplate>[1],
  template: Parameters<typeof fromModelTemplate>[0],
): TemplateDraft {
  return fromModelTemplate(template, draftTemplate(intent, purpose));
}

export const RECOMMENDED_CAMPAIGNS: RecommendedCampaign[] = [
  {
    id: "rec-midweek",
    name: "Midweek Svarnim Discount",
    date: "2026-10-28",
    status: "recommended",
    sendTime: "6:30 PM",
    reason:
      "Your last 4 midweek offers averaged a 46% read rate, well above your 31% weekend average.",
    audience: { name: "Engaged buyers (90 days)", contacts: 2340 },
    template: recommended("Midweek discount on Svarnim jewellery", "promotion", {
      purpose: "promotion",
      name: "midweek_svarnim_discount",
      category: "marketing",
      language: "English",
      header: null,
      body:
        "Hi {{name}},\n\nMidweek treat from Svarnim! 💍 Enjoy 15% off our handcrafted gold and silver collection until {{end_date}}.\n\nUse code MIDWEEK15 at checkout, or tap below to browse the new arrivals.\n\nThanks for choosing Svarnim!",
      footer: "Reply STOP to unsubscribe",
      buttons: [
        { kind: "url", text: "Shop the collection", url: "https://svarnim.in/collection" },
        { kind: "copy-code", code: "MIDWEEK15" },
      ],
      samples: { name: "Priya", end_date: "31 Oct" },
    }),
  },
  {
    id: "rec-rediscover",
    name: "Rediscover Svarnim",
    date: "2026-10-29",
    status: "recommended",
    sendTime: "11:00 AM",
    reason:
      "1,180 customers haven't ordered in 60 days. Win-back messages you sent in August brought 9% of them back.",
    audience: { name: "Lapsed customers (60+ days)", contacts: 1180 },
    template: recommended("Win back lapsed Svarnim customers", "promotion", {
      purpose: "promotion",
      name: "rediscover_svarnim",
      category: "marketing",
      language: "English",
      header: null,
      body:
        "Hi {{name}},\n\nIt's been a while! We've added new pieces to Svarnim since your last visit, from everyday studs to festive sets.\n\nHere's ₹500 off your next order with code COMEBACK500, valid until {{end_date}}.\n\nWe'd love to see you again.",
      footer: "Reply STOP to unsubscribe",
      buttons: [
        { kind: "url", text: "See what's new", url: "https://svarnim.in/new" },
        { kind: "quick-reply", text: "Not interested" },
      ],
      samples: { name: "Ananya", end_date: "5 Nov" },
    }),
  },
  {
    id: "rec-dhanteras",
    name: "Dhanteras Gold Preview",
    date: "2026-11-06",
    status: "recommended",
    sendTime: "10:00 AM",
    reason:
      "Gold coin enquiries doubled in the week before Dhanteras last year. Sending early catches buyers before they compare prices.",
    audience: { name: "Gold buyers", contacts: 860 },
    template: recommended("Dhanteras gold coin preview for Svarnim", "promotion", {
      purpose: "promotion",
      name: "dhanteras_gold_preview",
      category: "marketing",
      language: "English",
      header: null,
      body:
        "Hi {{name}},\n\nDhanteras is almost here. Reserve 24K gold coins and festive jewellery at Svarnim before prices change on {{end_date}}.\n\nTap below to reserve yours, or reply to talk to our team.",
      footer: "Reply STOP to unsubscribe",
      buttons: [
        { kind: "url", text: "Reserve now", url: "https://svarnim.in/dhanteras" },
        { kind: "quick-reply", text: "Talk to us" },
      ],
      samples: { name: "Rohan", end_date: "7 Nov" },
    }),
  },
];

/** "Today" for the demo calendar. */
export const CALENDAR_TODAY = "2026-10-28";

/* ------------------------------------------------------------ Audiences */

export type AudienceSegment = { id: string; name: string; contacts: number };

/** Segments offered when setting up a broadcast. */
export const AUDIENCE_SEGMENTS: AudienceSegment[] = [
  { id: "all", name: "All Contacts", contacts: 124801 },
  { id: "engaged-90", name: "Engaged buyers (90 days)", contacts: 2340 },
  { id: "lapsed-60", name: "Lapsed customers (60+ days)", contacts: 1180 },
  { id: "gold-buyers", name: "Gold buyers", contacts: 860 },
  { id: "diwali-enquiries", name: "Diwali enquiries", contacts: 412 },
  { id: "vip", name: "VIP customers", contacts: 96 },
];

/** The account's messaging tier: unique contacts per day. */
export const DAILY_MESSAGING_LIMIT = 1000;

export function segmentFor(name: string): AudienceSegment {
  return AUDIENCE_SEGMENTS.find((s) => s.name === name) ?? AUDIENCE_SEGMENTS[0];
}
