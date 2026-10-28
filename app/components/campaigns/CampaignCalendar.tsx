"use client";

import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import {
  CALENDAR_CAMPAIGNS,
  CALENDAR_TODAY,
  RECOMMENDED_CAMPAIGNS,
  type CalendarCampaign,
  type RecommendedCampaign,
} from "../../lib/campaigns-data";
import { useCampaigns } from "../../lib/campaigns";
import { AskWatiIcon } from "../icons/AskWatiIcon";

/** Entries shown per day before "+N more". */
const VISIBLE_PER_DAY = 2;

const STATUS_STYLE = {
  sent: { chip: "bg-[#e7f6ee]", dot: "bg-wati-green" },
  scheduled: { chip: "bg-[#f3e4f3]", dot: "bg-[#8b1d8f]" },
  recommended: { chip: "bg-[#e9ebf8] hover:bg-[#dfe2f6]", dot: "" },
} as const;

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Six Monday-first weeks covering the month, like the Campaigns calendar. */
function monthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(1 - ((first.getDay() + 6) % 7));
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

/**
 * The Campaigns calendar: sent (green) and scheduled (purple) broadcasts,
 * plus broadcasts Wati recommends for upcoming dates, marked with the Ask
 * Wati logo. Only recommendations are interactive in this prototype.
 */
export function CampaignCalendar({
  onOpenRecommendation,
}: {
  onOpenRecommendation: (campaign: RecommendedCampaign) => void;
}) {
  const year = 2026;
  const month = 9; // October
  const days = monthGrid(year, month);
  const { scheduled, removed } = useCampaigns();
  // A recommendation the user scheduled shows as a scheduled broadcast, on
  // the date and under the name they chose; one they removed is gone.
  const recommendations = RECOMMENDED_CAMPAIGNS.filter((c) => !removed.includes(c.id)).map(
    (c): CalendarCampaign | RecommendedCampaign =>
      scheduled[c.id]
        ? { id: c.id, name: scheduled[c.id].name, date: scheduled[c.id].date, status: "scheduled" }
        : c,
  );
  const byDate = new Map<string, (CalendarCampaign | RecommendedCampaign)[]>();
  // Recommendations lead their day so they're never hidden behind "+N more".
  for (const c of [...recommendations, ...CALENDAR_CAMPAIGNS]) {
    byDate.set(c.date, [...(byDate.get(c.date) ?? []), c]);
  }
  const monthLabel = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(
    new Date(year, month, 1),
  );

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-4 px-5 py-3">
        <div className="flex items-center gap-1 text-[15px] font-medium text-[#0a0a0a]">
          <ChevronLeft size={16} className="text-black/50" aria-hidden />
          <span className="px-1">{monthLabel}</span>
          <ChevronRight size={16} className="text-black/50" aria-hidden />
        </div>
        <div className="ml-auto flex items-center gap-4 text-[12px] text-black/70">
          <Legend swatch={<span className="h-2.5 w-2.5 rounded-[2px] bg-[#8b1d8f]" />}>Scheduled</Legend>
          <Legend swatch={<span className="h-2.5 w-2.5 rounded-[2px] bg-wati-green" />}>Sent</Legend>
          <Legend swatch={<AskWatiIcon size={13} />}>Wati Recommended</Legend>
        </div>
        <span className="flex items-center gap-6 rounded-lg border border-wati-border px-3 py-1.5 text-[13px] text-black/70">
          All Campaigns
          <ChevronDown size={14} className="text-black/45" />
        </span>
        <span className="rounded-lg bg-wati-green px-4 py-1.5 text-[13px] font-medium text-white">
          Create New
        </span>
      </div>

      <div className="grid shrink-0 grid-cols-7 border-y border-wati-border text-[12px] text-black/50">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="px-3 py-1.5">
            {d}
          </div>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6 overflow-y-auto">
        {days.map((day) => {
          const key = iso(day);
          const inMonth = day.getMonth() === month;
          const isToday = key === CALENDAR_TODAY;
          const entries = byDate.get(key) ?? [];
          const hidden = entries.length - VISIBLE_PER_DAY;
          return (
            <div
              key={key}
              className={`flex min-h-[112px] flex-col gap-1.5 border-b border-r border-wati-border p-2 [&:nth-child(7n)]:border-r-0 ${
                inMonth ? "bg-white" : "bg-[#f7f7f8]"
              }`}
            >
              <div className="flex justify-end">
                <span
                  className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] ${
                    isToday ? "bg-wati-green font-semibold text-white" : "text-black/50"
                  }`}
                >
                  {day.getDate()}
                </span>
              </div>
              {entries.slice(0, VISIBLE_PER_DAY).map((c) =>
                c.status === "recommended" ? (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onOpenRecommendation(c as RecommendedCampaign)}
                    title={`Wati recommends: ${c.name}`}
                    className={`flex min-w-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-[12px] text-[#1e2a8a] transition-colors ${STATUS_STYLE.recommended.chip}`}
                  >
                    <AskWatiIcon size={13} className="shrink-0" />
                    <span className="truncate font-medium">{c.name}</span>
                  </button>
                ) : (
                  <div
                    key={c.id}
                    className={`flex min-w-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] text-black/75 ${STATUS_STYLE[c.status].chip}`}
                  >
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-[2px] ${STATUS_STYLE[c.status].dot}`} />
                    <span className="truncate">{c.name}</span>
                  </div>
                ),
              )}
              {hidden > 0 && <span className="px-1 text-[11px] text-[#1570EF]">+{hidden} more</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Legend({ swatch, children }: { swatch: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      {swatch}
      {children}
    </span>
  );
}
