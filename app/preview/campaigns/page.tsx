"use client";

import { useState } from "react";
import { AskWatiDrawer } from "../../components/AskWatiDrawer";
import { MainSidebar } from "../../components/MainSidebar";
import { CampaignCalendar } from "../../components/campaigns/CampaignCalendar";
import { CampaignsNav } from "../../components/campaigns/CampaignsNav";
import { RecommendedCampaignPreview } from "../../components/campaigns/RecommendedCampaignPreview";
import { useAskWatiDrawer } from "../../lib/ask-wati-drawer";
import type { RecommendedCampaign } from "../../lib/campaigns-data";

export default function CampaignsPage() {
  const [open, setOpen] = useState<RecommendedCampaign | null>(null);
  const { setUpCampaign } = useAskWatiDrawer();
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
        onClose={() => setOpen(null)}
        onEditWithAi={(c) => {
          setOpen(null);
          setUpCampaign(c.id, "edit");
        }}
        onApprove={(c) => {
          setOpen(null);
          setUpCampaign(c.id, "approve");
        }}
      />
    </div>
  );
}
