import type { WatcherTypeId } from "./agents";

/**
 * Streaming status lines shown in the "theatre" while an agent run is
 * being assembled. Keyed by watcher type so the cycling text reads as
 * specific to what that agent actually does.
 */
const RUN_STEPS: Record<WatcherTypeId, string[]> = {
  "ready-to-buy": [
    "Scanning recent conversations",
    "Identifying buying signals",
    "Building a list of hot leads",
  ],
  "top-topics": [
    "Reviewing recent conversations",
    "Clustering messages into topics",
    "Ranking the top 5",
  ],
  "demand-spike": [
    "Watching inbound rate",
    "Comparing to the 30-day baseline",
    "Flagging spike windows",
  ],
  "price-alert": [
    "Looking for price and discount mentions",
    "Grouping by segment",
    "Building a list",
  ],
  "sentiment-monitor": [
    "Scoring conversations for sentiment",
    "Computing net sentiment",
    "Surfacing flagged contacts",
  ],
  "volume-spike": [
    "Tracking message volume",
    "Comparing to the 7-day average",
    "Measuring queue depth",
  ],
  urgency: [
    "Going through 200 conversations",
    "Finalising the most urgent conversation",
    "Creating a list",
  ],
  "response-gap": [
    "Checking response times",
    "Finding overdue threads",
    "Ranking by urgency",
  ],
  "delivery-issue": [
    "Looking for delivery complaints",
    "Grouping by route and vendor",
    "Surfacing affected customers",
  ],
  "paid-acq": [
    "Reading WhatsApp ad replies",
    "Scoring intent",
    "Building a list",
  ],
  "ops-misclassification": [
    "Reviewing recent assignments",
    "Spotting misclassified threads",
    "Suggesting reassignments",
  ],
  custom: [
    "Reviewing recent conversations",
    "Working through the prompt",
    "Compiling the result",
  ],
};

export function getRunStepsFor(watcherType: WatcherTypeId): string[] {
  return RUN_STEPS[watcherType] ?? RUN_STEPS.custom;
}
