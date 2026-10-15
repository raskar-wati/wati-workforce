"use client";

import { useEffect } from "react";
import { MainSidebar } from "../../components/MainSidebar";
import { WorkforceMain } from "../../components/WorkforceMain";
import { useAskWatiDrawer } from "../../lib/ask-wati-drawer";
import { BarAnchorScope } from "../../lib/shell-layout";

/**
 * Ask Wati as a full page (nav: Wati AI > Ask Wati), reached from the
 * drawer's expand button. Same surface and stored threads as the drawer,
 * with the thread panel always open and the chat centred at page width.
 */
export default function AskWatiPage() {
  const { setInlineHost, closeDrawer } = useAskWatiDrawer();

  // While this page is up it hosts the chat: header asks land here and the
  // drawer stays shut.
  useEffect(() => {
    setInlineHost(true);
    closeDrawer();
    return () => setInlineHost(false);
  }, [setInlineHost, closeDrawer]);

  return (
    <div className="relative flex min-h-0 flex-1 overflow-hidden">
      <MainSidebar />
      <main className="m-0 flex min-w-0 flex-1 overflow-hidden rounded-tl-xl rounded-tr-xl border border-[var(--wati-border-default)] bg-white">
        {/* The header bar lines up with this page's chat input. */}
        <BarAnchorScope>
          <WorkforceMain
            hideHandoffs
            panelStyle="drawer"
            panelCollapsed={false}
            hideDailyDigest
            hideDevTools
            forceDemoMode="returning"
            chrome="drawer"
            expanded
          />
        </BarAnchorScope>
      </main>
    </div>
  );
}
