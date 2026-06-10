import { ChatArea } from "./ChatArea";

export function MainContent({
  hideDailyDigest = false,
  chrome,
}: {
  hideDailyDigest?: boolean;
  chrome?: "drawer";
} = {}) {
  return (
    <div className="relative flex-1 overflow-hidden bg-white">
      <ChatArea hideDailyDigest={hideDailyDigest} chrome={chrome} />
    </div>
  );
}
