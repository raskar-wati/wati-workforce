"use client";

import { useState } from "react";
import { AskWatiDrawer } from "../../components/AskWatiDrawer";
import { MainSidebar } from "../../components/MainSidebar";
import { CampaignCalendar } from "../../components/campaigns/CampaignCalendar";
import { CampaignsNav } from "../../components/campaigns/CampaignsNav";
import { RecommendedCampaignPreview } from "../../components/campaigns/RecommendedCampaignPreview";
import type { RecommendedCampaign } from "../../lib/campaigns-data";

export default function CampaignsPage() {
  const [open, setOpen] = useState<RecommendedCampaign | null>(null);
  return (
    <div className="relative flex min-h-0 flex-1 overflow-hidden">
      <MainSidebar />
      <main className="m-0 flex min-w-0 flex-1 overflow-hidden rounded-tl-xl rounded-tr-xl border border-[var(--wati-border-default)] bg-white">
        <CampaignsNav />
        <CampaignCalendar onOpenRecommendation={setOpen} />
      </main>
      <AskWatiDrawer />
      {/* Edit and Approve lead into the chat set-up flow, built next. */}
      <RecommendedCampaignPreview campaign={open} onClose={() => setOpen(null)} />
    </div>
  );
}
