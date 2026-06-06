import { ChatArea } from "./ChatArea";

export function MainContent({ hideDailyDigest = false }: { hideDailyDigest?: boolean } = {}) {
  return (
    <div className="relative flex-1 overflow-hidden bg-white">
      <ChatArea hideDailyDigest={hideDailyDigest} />
    </div>
  );
}
