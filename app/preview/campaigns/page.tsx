"use client";

import { useEffect, useState } from "react";
import { AskWatiDrawer } from "../../components/AskWatiDrawer";
import { MainSidebar } from "../../components/MainSidebar";
import { CampaignCalendar } from "../../components/campaigns/CampaignCalendar";
import { CampaignsNav } from "../../components/campaigns/CampaignsNav";
import { RecommendedCampaignPreview } from "../../components/campaigns/RecommendedCampaignPreview";
import { useAskWatiDrawer } from "../../lib/ask-wati-drawer";
import { useCampaigns } from "../../lib/campaigns";
import { RECOMMENDED_CAMPAIGNS, withPlan, type RecommendedCampaign } from "../../lib/campaigns-data";
import { useToast } from "../../lib/toast";

const SEND_DATE = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" });

export default function CampaignsPage() {
  const [open, setOpen] = useState<RecommendedCampaign | null>(null);
  const { setUpCampaign } = useAskWatiDrawer();
  const { remove, schedule, drafts, reviewing, clearReview } = useCampaigns();
  const { showToast } = useToast();

  // Back from Save as draft in chat: reopen that recommendation's preview.
  useEffect(() => {
    if (!reviewing) return;
    setOpen(RECOMMENDED_CAMPAIGNS.find((c) => c.id === reviewing) ?? null);
    clearReview();
  }, [reviewing, clearReview]);
  return (
    <div className="relative flex min-h-0 flex-1 overflow-hidden">
      <MainSidebar />
      <main className="m-0 flex min-w-0 flex-1 overflow-hidden rounded-tl-xl rounded-tr-xl border border-[var(--wati-border-default)] bg-white">
        <CampaignsNav />
        <CampaignCalendar onOpenRecommendation={setOpen} />
      </main>
      <AskWatiDrawer />
      {/* Both ways forward continue in the Ask Wati drawer over the calendar. */}
      <RecommendedCampaignPreview
        campaign={open}
        saved={open ? drafts[open.id] : undefined}
        onClose={() => setOpen(null)}
        onEditWithAi={(c, plan) => {
          setOpen(null);
          setUpCampaign(c.id, "edit", plan);
        }}
        onApprove={(c, plan) => {
          // Scheduled straight from the calendar; the chip turns purple.
          setOpen(null);
          const { date, sendTime } = withPlan(c, plan);
          schedule(c.id, { name: c.name, date, time: sendTime, audienceId: plan.audienceId });
          showToast(`${c.name} scheduled for ${SEND_DATE.format(new Date(`${date}T00:00:00`))}, ${sendTime}`);
        }}
        onDelete={(c) => {
          setOpen(null);
          remove(c.id);
        }}
      />
    </div>
  );
}
