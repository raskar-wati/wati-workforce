"use client";

import { AgentsProvider } from "../lib/agents";
import { ChatModeProvider } from "../lib/chat-mode";
import { ChatThreadsProvider } from "../lib/chat-threads";
import { TenantProfileProvider } from "../lib/tenant-signal-profile";
import { MainContent } from "./MainContent";
import { WorkforcePanel } from "./WorkforcePanel";

export function WorkforceMain() {
  return (
    <TenantProfileProvider>
      <ChatModeProvider>
        <ChatThreadsProvider>
          <AgentsProvider>
            <WorkforcePanel />
            <MainContent />
          </AgentsProvider>
        </ChatThreadsProvider>
      </ChatModeProvider>
    </TenantProfileProvider>
  );
}
