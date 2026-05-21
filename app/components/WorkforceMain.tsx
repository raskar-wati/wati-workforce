"use client";

import { ChatThreadsProvider } from "../lib/chat-threads";
import { MainContent } from "./MainContent";
import { WorkforcePanel } from "./WorkforcePanel";

export function WorkforceMain() {
  return (
    <ChatThreadsProvider>
      <WorkforcePanel />
      <MainContent />
    </ChatThreadsProvider>
  );
}
