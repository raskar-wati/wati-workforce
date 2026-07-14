"use client";

import { AgentsProvider } from "../lib/agents";
import { ChatModeProvider, type ChatMode } from "../lib/chat-mode";
import { ChatThreadsProvider } from "../lib/chat-threads";
import { DailyDigestMetaProvider } from "../lib/daily-digest-meta";
import { DemoStateProvider } from "../lib/demo-state";
import { TenantProfileProvider } from "../lib/tenant-signal-profile";
import { MainContent } from "./MainContent";
import { WorkforcePanel } from "./WorkforcePanel";

export function WorkforceMain({
  hideHandoffs = false,
  panelDefaultCollapsed = false,
  panelStyle = "expandable",
  defaultMode = null,
  hideDailyDigest = false,
  hideDevTools = false,
  forceDemoMode,
  chrome,
  panelCollapsed,
  onPanelCollapsedChange,
  expanded = false,
}: {
  hideHandoffs?: boolean;
  panelDefaultCollapsed?: boolean;
  panelStyle?: "expandable" | "popover" | "drawer";
  defaultMode?: ChatMode | null;
  hideDailyDigest?: boolean;
  hideDevTools?: boolean;
  forceDemoMode?: "first-time" | "returning";
  chrome?: "drawer";
  panelCollapsed?: boolean;
  onPanelCollapsedChange?: (collapsed: boolean) => void;
  /** Drawer-only: when true, hide the WorkForce header panel toggle and
   *  constrain main content to a centered max-width. */
  expanded?: boolean;
} = {}) {
  return (
    <DemoStateProvider forceMode={forceDemoMode}>
      <TenantProfileProvider>
        <ChatModeProvider defaultMode={defaultMode}>
          <ChatThreadsProvider>
            <AgentsProvider>
              <DailyDigestMetaProvider>
                <WorkforcePanel
                hideHandoffs={hideHandoffs}
                defaultCollapsed={panelDefaultCollapsed}
                hideDevTools={hideDevTools}
                panelStyle={panelStyle}
                collapsed={panelCollapsed}
                onCollapsedChange={onPanelCollapsedChange}
              />
              <MainContent
                hideDailyDigest={hideDailyDigest}
                chrome={chrome}
                expanded={expanded}
                panelCollapsed={
                  chrome === "drawer" ? panelCollapsed : undefined
                }
                onTogglePanel={
                  chrome === "drawer" && !expanded
                    ? () => onPanelCollapsedChange?.(!panelCollapsed)
                    : undefined
                }
              />
              </DailyDigestMetaProvider>
            </AgentsProvider>
          </ChatThreadsProvider>
        </ChatModeProvider>
      </TenantProfileProvider>
    </DemoStateProvider>
  );
}
