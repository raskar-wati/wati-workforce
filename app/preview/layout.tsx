import { GlobalHeader } from "../components/GlobalHeader";
import { IslandSimulator } from "../components/island/IslandSimulator";
import { AgentsProvider } from "../lib/agents";
import { DemoStateProvider } from "../lib/demo-state";
import { TemplatesProvider } from "../lib/templates";
import { CampaignsProvider } from "../lib/campaigns";

/**
 * Shared shell for every preview module. The header lives here rather than
 * in each page so it stays mounted across navigation — that's what lets the
 * Wati AI bar glide between its centred spot and the Ask Wati chat input
 * instead of jumping on every route change.
 *
 * Agent state lives here too (returning-user demo data, same as the drawer
 * and Ask Wati page), so the island can raise and decide agent notices while
 * the drawer is shut. The surfaces below reuse this store.
 */
export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <DemoStateProvider forceMode="returning">
      <AgentsProvider>
        <TemplatesProvider>
        <CampaignsProvider>
        <div className="flex h-screen flex-col bg-[var(--wati-surface-subtle)]">
          <GlobalHeader />
          {children}
        </div>
        <IslandSimulator />
        </CampaignsProvider>
        </TemplatesProvider>
      </AgentsProvider>
    </DemoStateProvider>
  );
}
