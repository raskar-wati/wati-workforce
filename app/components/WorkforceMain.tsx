"use client";

import { AgentsProvider } from "../lib/agents";
import { ChatThreadsProvider } from "../lib/chat-threads";
import { MainContent } from "./MainContent";
import { WorkforcePanel } from "./WorkforcePanel";

export function WorkforceMain() {
  return (
    <ChatThreadsProvider>
      <AgentsProvider>
        <WorkforcePanel />
        <MainContent />
      </AgentsProvider>
    </ChatThreadsProvider>
  );
}
