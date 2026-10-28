"use client";

import { motion } from "motion/react";
import { Loader2, Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAgents, type HandoffCta, type WatcherTypeId } from "../lib/agents";
import { useChatMode } from "../lib/chat-mode";
import { useChatThreads } from "../lib/chat-threads";
import { useDemoState } from "../lib/demo-state";
import { useFireHandoffCta } from "../lib/use-fire-handoff-cta";
import { useOnboardingSeen } from "../lib/use-onboarding-seen";
import { useTenantProfile } from "../lib/tenant-signal-profile";
import { getTenantPromptCopy } from "../lib/tenant-prompts";
import {
  getOnboardingScript,
  type ClosingChip,
  type OfferingChoice,
} from "../lib/onboarding-script";
import {
  getWatcherType,
  rankWatcherMatches,
  resolveMatchTier,
  type MatchTier,
} from "../lib/watcher-types";
import { recordRoleRequest } from "../lib/role-requests";
import { generateInstructions } from "../lib/agent-instructions";
import { AgentActionRun } from "./agents/AgentActionRun";
import { WatcherMatchCard } from "./agents/WatcherMatchCard";
import { InsightMessageBody } from "./cards/InsightBlocks";
import { AnalyticsMockConversation } from "./analytics/AnalyticsMockConversation";
import { AgentCreationFlow } from "./agents/AgentCreationFlow";
import {
  AgentSummaryCard,
  getDefaultInstructions,
} from "./agents/AgentSummaryCard";
import { AgentEmptyRunsState } from "./agents/AgentEmptyRunsState";
import { AgentRunTheatre } from "./agents/AgentRunTheatre";
import { getRunStepsFor } from "../lib/agent-run-steps";
import { DailyDigestEntry } from "./agents/DailyDigestEntry";
import { DailyDigestSummaryCard } from "./agents/DailyDigestSummaryCard";
import {
  EditAgentDialog,
  type EditAgentValues,
  type SchedulePreset,
} from "./agents/EditAgentDialog";
import { useDailyDigestMeta } from "../lib/daily-digest-meta";
import { Handoff } from "./agents/Handoff";
import { TenantAgentSuggestions } from "./agents/TenantAgentSuggestions";
import {
  DAILY_DIGEST_ENTRIES,
  DAILY_DIGEST_THREAD_TITLE,
} from "../lib/daily-digest-data";
import {
  intakeFiles,
  releaseAttachments,
  type Attachment,
} from "../lib/attachments";
import { getPixabot, pixabotGifFromPath } from "../lib/pixabots";
import { useFileDropHandler } from "./attachments/FileDropZone";
import { MessageAttachments } from "./attachments/MessageAttachments";
import { Composer, COMPOSER_TRANSITION } from "./Composer";
import { DailyDigest } from "./digest/DailyDigest";
import { InboxAskWatiSuggestions } from "./agents/InboxAskWatiSuggestions";
import { useInboxContext } from "../lib/inbox-context";
import { useContactsContext } from "../lib/contacts-context";
import { useShopifyContext } from "../lib/shopify-context";
import { useAnalyticsContext } from "../lib/analytics-context";
import { useAskWatiDrawer } from "../lib/ask-wati-drawer";
import { ApprovalQueue } from "./handoffs/ApprovalQueue";
import { HandoffInbox } from "./handoffs/HandoffInbox";
import { ModePillRow } from "./ModePillRow";
import { AskWatiSparkleBloom } from "./AskWatiSparkleBloom";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { IslandNoticeCard } from "./island/IslandNotice";
import { getStarterPrompts } from "../lib/starter-prompts";
import { useNotifications, type AppNotification } from "../lib/notifications";
import { ReasoningTrace } from "./ReasoningTrace";
import { WatiWelcome } from "./WatiWelcome";
import { OnboardingHandoffPreview } from "./onboarding/OnboardingHandoffPreview";
import { WatiMessage, type WatiChip } from "./onboarding/WatiMessage";
import {
  BroadcastSetupCard,
  type BroadcastSetup,
  type BroadcastState,
} from "./chat/usecases/broadcast/BroadcastSetupCard";
import { RECOMMENDED_CAMPAIGNS, segmentFor, type RecommendedCampaign } from "../lib/campaigns-data";
import { useCampaigns } from "../lib/campaigns";
import { useTemplates } from "../lib/templates";
import {
  PURPOSE_CHOICES,
  detectPurpose,
  draftTemplate,
  isNewTemplateRequest,
  isRewriteRequest,
  isTemplateRequest,
  allowsCustomButtons,
  fromModelTemplate,
  refineTemplate,
  toModelTemplate,
  type TemplateDraft,
  type TemplatePurpose,
} from "../lib/template-draft";
import { askTemplateAi, modelLabel, templateAiStatus } from "../lib/template-ai";
import type { TemplateAiRequest } from "../api/template/route";
import {
  SupersededTemplateCard,
  TemplateDraftCard,
  type TemplateCardStage,
} from "./chat/usecases/template/TemplateDraftCard";

const ONBOARDING_TITLE = "Getting started";

type WatiAction =
  | { kind: "onboarding-pick-offering"; label: string; choice: OfferingChoice }
  | {
      kind: "onboarding-pick-agent";
      label: string;
      agentName: string;
      prompt: string;
      watcherTypeId: WatcherTypeId;
    }
  | { kind: "onboarding-back-to-offerings"; label: string }
  | { kind: "onboarding-skip"; label: string }
  | {
      kind: "onboarding-convert";
      label: string;
      watcherTypeId: WatcherTypeId;
      prompt: string;
    }
  | { kind: "onboarding-decline"; label: string }
  | { kind: "open-handoffs"; label: string }
  | { kind: "open-digest"; label: string }
  | { kind: "fill-composer"; label: string; prompt: string }
  | {
      kind: "template-pick-purpose";
      label: string;
      purpose: TemplatePurpose;
      /** The original ask, drafted from once the purpose is known. */
      intent: string;
    };

/** Thread title for a message that arrived as attachments with no caption. */
function titleForAttachments(list: Attachment[]): string {
  if (list.length === 0) return "New chat";
  return list.length === 1 ? list[0].name : `${list.length} attachments`;
}

/** Plain-text stand-in so an attachment-only turn isn't sent empty. */
function describeAttachments(list: Attachment[]): string {
  if (list.length === 0) return "";
  const names = list.map((a) => a.name).join(", ");
  return list.length === 1
    ? `Sent an attachment: ${names}`
    : `Sent ${list.length} attachments: ${names}`;
}

type ChatMessage =
  | { kind: "user-text"; id: string; content: string }
  | {
      kind: "agent-creation-flow";
      id: string;
      initialMessage: string;
      watcherTypeId: WatcherTypeId;
    }
  | {
      kind: "watcher-match";
      id: string;
      /** The free-typed instructions the ladder scored. */
      prompt: string;
      match: MatchTier;
      /** Set once the user picked a type — locks the card. */
      resolvedTypeId?: WatcherTypeId;
    }
  | {
      kind: "wati-message";
      id: string;
      text: string;
      actions: WatiAction[];
      /** Once a chip is tapped we strip actions so the row collapses. */
      locked?: boolean;
    }
  | {
      kind: "onboarding-preview";
      id: string;
      watcherTypeId: WatcherTypeId;
      agentName: string;
      prompt: string;
    }
  | { kind: "ai-thinking"; id: string }
  | {
      kind: "ai-response";
      id: string;
      content: string;
      /** Model reasoning captured before the answer; shown collapsed. */
      reasoning: string;
      /** How long reasoning took, once the answer starts. */
      reasoningMs?: number;
      streaming: boolean;
    }
  | { kind: "daily-digest"; id: string }
  | {
      /** One version of a template being made in chat. */
      kind: "template-card";
      id: string;
      version: number;
      draft: TemplateDraft;
      changes?: string[];
      stage: TemplateCardStage;
      /** A newer version replaced this one — renders collapsed. */
      superseded?: boolean;
      /** Set once saved or submitted. */
      templateId?: string;
      createdAt: number;
      /** Waiting on the model; the scripted draft stands in until it answers. */
      pending?: boolean;
      /** Model id when the model wrote this draft. */
      drafter?: string;
      /** Set when the template came from a recommended campaign: submitting
       *  it leads on to the broadcast set-up. */
      campaignId?: string;
    }
  | {
      /** Setting up the broadcast for a recommended campaign's template. */
      kind: "broadcast-card";
      id: string;
      campaignId: string;
      templateId?: string;
      templateName: string;
      setup: BroadcastSetup;
      state: BroadcastState;
    };

const TEMPLATE_LEAD =
  "Here's a first draft. Tap a suggestion or tell me what to change — hit Looks good when it reads right.";
const TEMPLATE_UNSUPPORTED =
  "I couldn't tell what to change. Send the exact text you want (e.g. “Update the draft to: …” or “Footer: …”), or ask me to adjust the length, tone, header image, buttons, coupon code, greeting, name, category or language.";
const TEMPLATE_NO_REWRITE =
  "The body is your own text now, so I've kept it as written. Rewriting it for tone or length needs the AI model, which isn't connected in this prototype — send the revised text and I'll use it.";

function watiText(text: string): ChatMessage {
  return { kind: "wati-message", id: crypto.randomUUID(), text, actions: [] };
}

function templateCardMessage(
  draft: TemplateDraft,
  version: number,
  changes?: string[],
): ChatMessage {
  return {
    kind: "template-card",
    id: crypto.randomUUID(),
    version,
    draft,
    changes,
    stage: "editing",
    createdAt: Date.now(),
  };
}

type TemplateCardMessage = Extract<ChatMessage, { kind: "template-card" }>;
type BroadcastCardMessage = Extract<ChatMessage, { kind: "broadcast-card" }>;

const CAMPAIGN_DATE = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" });

/** The broadcast set-up card, prefilled from Wati's recommendation. */
function broadcastCardMessage(campaign: RecommendedCampaign, templateId?: string): ChatMessage {
  return {
    kind: "broadcast-card",
    id: crypto.randomUUID(),
    campaignId: campaign.id,
    templateId,
    templateName: campaign.template.name,
    setup: {
      name: campaign.name,
      audienceId: segmentFor(campaign.audience.name).id,
      date: campaign.date,
      time: campaign.sendTime,
    },
    state: "setup",
  };
}

/**
 * The template card still taking edits: the latest version, not yet with
 * Meta, and nothing but the user and Wati's own notes said since. Anything
 * else in between (a model reply) means the user moved on.
 */
function openTemplateCard(
  list: readonly ChatMessage[],
  isLocked: (templateId?: string) => boolean,
): TemplateCardMessage | null {
  for (let i = list.length - 1; i >= 0; i--) {
    const m = list[i];
    if (m.kind === "user-text" || m.kind === "wati-message") continue;
    if (m.kind === "template-card" && !m.superseded && !isLocked(m.templateId)) {
      return m;
    }
    return null;
  }
  return null;
}

/** Wati's unanswered "what's this template for?" question, if it's last. */
function openPurposeQuestion(list: readonly ChatMessage[]) {
  const last = [...list].reverse().find((m) => m.kind !== "user-text");
  if (last?.kind !== "wati-message" || last.locked) return null;
  const pick = last.actions[0];
  return pick?.kind === "template-pick-purpose" ? { id: last.id, intent: pick.intent } : null;
}

/** A model call that fills in a card once it answers. */
type TemplateAiJob = {
  cardId: string;
  /** The draft the model's reply is folded into. */
  base: TemplateDraft;
  request: TemplateAiRequest;
  /** Refinements: the card this one replaced, restored if the model fails
   *  and there's no scripted result to fall back on. */
  replacedId?: string;
  fallback?: TemplateDraft | null;
};

/** What a template turn does to the thread besides appending `msgs`. */
type TemplateTurn = {
  ai?: TemplateAiJob;
  msgs: ChatMessage[];
  supersedeId?: string;
  lockId?: string;
  patch?: { id: string; draft: TemplateDraft };
};

export function ChatArea({
  hideDailyDigest = false,
  chrome,
}: {
  hideDailyDigest?: boolean;
  /**
   * "drawer" flips the empty state into the Ask Wati drawer layout:
   * "How can I help you?" greeting with starter chips above the
   * composer; ModePillRow hidden; Composer surfaces a + menu instead
   * of the home-screen mode pills. Default = full WorkForce surface.
   */
  chrome?: "drawer";
} = {}) {
  const [messagesByThread, setMessagesByThread] = useState<
    Record<string, ChatMessage[]>
  >({});
  const [messagesHydratedForMode, setMessagesHydratedForMode] = useState<
    string | null
  >(null);
  const [input, setInput] = useState("");
  const [pendingWatcherTypeId, setPendingWatcherTypeId] =
    useState<WatcherTypeId | null>(null);

  /**
   * Attachments are session-only and deliberately kept OUT of
   * `messagesByThread`, which is serialised to localStorage — object URLs
   * would be dead on reload and inlined bytes would blow the quota. Staged
   * files move into `attachmentsByMessage` under the sent message's id.
   */
  const [stagedAttachments, setStagedAttachments] = useState<Attachment[]>([]);
  const [attachmentsByMessage, setAttachmentsByMessage] = useState<
    Record<string, Attachment[]>
  >({});
  const [attachmentNotice, setAttachmentNotice] = useState<string | null>(null);

  /**
   * Intake runs outside the state updater on purpose: it mints object URLs
   * and sets the notice, and StrictMode double-invokes updaters in dev —
   * doing this inside one leaks a URL per rejected pass and re-enters
   * setState mid-update.
   */
  const attachFiles = useCallback(
    (files: File[]) => {
      const { accepted, rejected } = intakeFiles(files, stagedAttachments);
      setAttachmentNotice(rejected.length > 0 ? rejected.join(" · ") : null);
      if (accepted.length > 0) {
        setStagedAttachments((prev) => [...prev, ...accepted]);
      }
    },
    [stagedAttachments],
  );
  // Files dropped anywhere on the surrounding Ask Wati surface stage here.
  useFileDropHandler(attachFiles);

  const removeStagedAttachment = useCallback(
    (id: string) => {
      const hit = stagedAttachments.find((a) => a.id === id);
      if (hit) releaseAttachments([hit]);
      setStagedAttachments((prev) => prev.filter((a) => a.id !== id));
      setAttachmentNotice(null);
    },
    [stagedAttachments],
  );

  // Clear a stale rejection notice once the user edits the draft.
  useEffect(() => {
    if (attachmentNotice) setAttachmentNotice(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  // Mirror of every live attachment, so the unmount cleanup below revokes
  // what exists at that moment rather than the empty mount-time value.
  const liveAttachmentsRef = useRef<Attachment[]>([]);
  useEffect(() => {
    liveAttachmentsRef.current = [
      ...stagedAttachments,
      ...Object.values(attachmentsByMessage).flat(),
    ];
  }, [stagedAttachments, attachmentsByMessage]);

  // Release every object URL still held when the chat surface goes away
  // (the drawer unmounts its whole tree on close).
  useEffect(() => () => releaseAttachments(liveAttachmentsRef.current), []);
  const { mode, setMode, view, setView } = useChatMode();
  const {
    pendingAction,
    clearAction,
    pendingPrompt,
    clearPrompt,
    pendingThread,
    clearThread,
    pendingCampaign,
    clearCampaign,
    inlineHost,
    postedNoticeIds,
    unpostNotice,
  } = useAskWatiDrawer();
  const { notifications } = useNotifications();
  // Island notices posted into the Ask Wati page's chat (not the drawer).
  const postedNotices = inlineHost
    ? postedNoticeIds
        .map((id) => notifications.find((n) => n.id === id))
        .filter((n): n is AppNotification => n !== undefined && !n.dismissed)
    : [];

  // Drawer 3-dot menu → "Select an agent" opens the existing agent flow.
  // "View older chats" has no history surface yet — consume and no-op.
  useEffect(() => {
    if (!pendingAction || chrome !== "drawer") return;
    if (pendingAction === "select-agent") setMode("agent");
    clearAction();
  }, [pendingAction, chrome, setMode, clearAction]);
  const {
    threads,
    activeThreadId,
    setActiveThreadId,
    createThread,
    hydrated: threadsHydrated,
  } = useChatThreads();
  const {
    agents,
    getAgentsForThread,
    getHandoffs,
    addHandoff,
    getActionRuns,
    markHandoffRead,
    setWatchedThread,
    updateAgent,
    deleteAgent,
    setAgentStatus,
  } = useAgents();
  const fireHandoffCta = useFireHandoffCta();
  const { profile: tenantProfile } = useTenantProfile();
  const inboxCtx = useInboxContext();
  const contactsCtx = useContactsContext();
  const shopifyCtx = useShopifyContext();
  const analyticsCtx = useAnalyticsContext();
  const [inboxScopeActive, setInboxScopeActive] = useState(Boolean(inboxCtx));
  const [contactsScopeActive, setContactsScopeActive] = useState(
    Boolean(contactsCtx),
  );
  const [shopifyScopeActive, setShopifyScopeActive] = useState(
    Boolean(shopifyCtx),
  );
  const [analyticsScopeActive, setAnalyticsScopeActive] = useState(
    Boolean(analyticsCtx),
  );
  const { mode: demoMode, hydrated: demoHydrated } = useDemoState();
  const { seen: onboardingSeen, hydrated: onboardingHydrated, markSeen } =
    useOnboardingSeen();

  // Persist messagesByThread per demo mode so threads keep their messages
  // across reloads. Threads themselves are already persisted in
  // chat-threads.tsx; without this, clicking a recent chat showed an empty
  // hero because ephemeral message state was lost.
  useEffect(() => {
    if (!demoHydrated) return;
    const key = `wati.messages.v1.${demoMode}`;
    try {
      const raw =
        typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, ChatMessage[]>;
        if (parsed && typeof parsed === "object") {
          setMessagesByThread(parsed);
        } else {
          setMessagesByThread({});
        }
      } else {
        setMessagesByThread({});
      }
    } catch {
      setMessagesByThread({});
    }
    setMessagesHydratedForMode(demoMode);
  }, [demoMode, demoHydrated]);

  useEffect(() => {
    if (messagesHydratedForMode !== demoMode) return;
    try {
      window.localStorage.setItem(
        `wati.messages.v1.${demoMode}`,
        JSON.stringify(messagesByThread),
      );
    } catch {
      // quota / disabled storage — ignore
    }
  }, [messagesByThread, messagesHydratedForMode, demoMode]);

  // Onboarding orchestration state. Lives in ChatArea so it can drive the
  // message timeline, but the thread itself is just a normal thread — we
  // remember its id so post-agent-creation we know to fire the closing
  // message.
  const [onboardingThreadId, setOnboardingThreadId] = useState<string | null>(
    null,
  );
  const [onboardingClosingPosted, setOnboardingClosingPosted] = useState(false);

  const agentForThread = activeThreadId
    ? getAgentsForThread(activeThreadId)[0] ?? null
    : null;
  const persistedMessages = activeThreadId
    ? messagesByThread[activeThreadId] ?? []
    : [];
  // Threads created in prior sessions (before message persistence existed)
  // can have a title but no stored messages. Fall back to rendering the
  // title as the user's original prompt so the chat surface shows what
  // the thread is actually about instead of the empty hero.
  const activeThreadMeta = activeThreadId
    ? threads.find((t) => t.id === activeThreadId)
    : null;
  const messages: ChatMessage[] =
    persistedMessages.length === 0 &&
    activeThreadMeta &&
    !agentForThread &&
    activeThreadMeta.title !== DAILY_DIGEST_THREAD_TITLE &&
    !activeThreadMeta.hasVisuals
      ? [
          {
            kind: "user-text",
            id: `${activeThreadMeta.id}-ghost-user`,
            content: activeThreadMeta.title,
          },
        ]
      : persistedMessages;
  const handoffs = agentForThread ? getHandoffs(agentForThread.id) : [];
  const actionRuns = agentForThread ? getActionRuns(agentForThread.id) : [];
  const runsByHandoff = actionRuns.reduce<Record<string, typeof actionRuns>>(
    (acc, r) => {
      (acc[r.handoffId] ??= []).push(r);
      return acc;
    },
    {},
  );
  const firedCtaIds = new Set(actionRuns.map((r) => r.ctaId));
  const hasMessages = messages.length > 0;
  const activeThread = activeThreadId
    ? threads.find((t) => t.id === activeThreadId) ?? null
    : null;
  const isDailyDigestThread =
    activeThread?.title === DAILY_DIGEST_THREAD_TITLE;
  const isAnalyticsThread = Boolean(activeThread?.hasVisuals);
  const hasContent =
    hasMessages ||
    agentForThread !== null ||
    isDailyDigestThread ||
    isAnalyticsThread;

  /**
   * The Ask Wati splash is spent once per drawer open. The drawer unmounts
   * this whole tree when it closes, so a plain ref resets on the next
   * open — while returning to the hero mid-session renders the resting
   * mark instead of blooming again.
   */
  const askWatiSplashSpent = useRef(false);

  const fireCta = (handoffId: string, cta: HandoffCta) => {
    if (!agentForThread) return;
    // Templates are made in chat, so an agent's "Draft … template" opens a
    // template thread seeded from the run instead of a scripted action run.
    if (cta.action === "create-template") {
      startTemplateFromAgent(agentForThread.name, cta.label);
      return;
    }
    fireHandoffCta(agentForThread.id, handoffId, cta);
  };

  // Shared row renderer for the agent-thread handoff list. Older rows report
  // expand/collapse so the list's height cap can lift while one is open; the
  // latest row starts expanded and never affects the cap.
  const renderHandoff = (
    h: (typeof handoffs)[number],
    { isLatest }: { isLatest: boolean },
  ) => {
    if (!agentForThread) return null;
    const runs = runsByHandoff[h.id] ?? [];
    return (
      <div key={h.id} className="flex flex-col py-1">
        <Handoff
          handoff={h}
          agentName={agentForThread.name}
          defaultExpanded={isLatest}
          firedCtaIds={firedCtaIds}
          onFireCta={(cta) => fireCta(h.id, cta)}
          onExpand={() => markHandoffRead(h.id)}
          onExpandedChange={
            isLatest
              ? undefined
              : (open) =>
                  setExpandedOlderIds((prev) => {
                    const next = new Set(prev);
                    if (open) next.add(h.id);
                    else next.delete(h.id);
                    return next;
                  })
          }
          runsSlot={
            runs.length > 0 ? (
              <div className="flex flex-col gap-2 pt-1">
                {runs.map((r) => (
                  <AgentActionRun key={r.id} run={r} />
                ))}
              </div>
            ) : null
          }
        />
      </div>
    );
  };

  // Shared row renderer for the Daily Digest run list — same behaviour as
  // renderHandoff: older rows report expand/collapse so the list's height cap
  // can lift while one is open; the latest row starts expanded.
  const renderDigestEntry = (
    entry: (typeof DAILY_DIGEST_ENTRIES)[number],
    { isLatest }: { isLatest: boolean },
  ) => (
    <div key={entry.id} className="flex flex-col py-1">
      <DailyDigestEntry
        entry={entry}
        defaultExpanded={isLatest}
        onExpandedChange={
          isLatest
            ? undefined
            : (open) =>
                setExpandedOlderIds((prev) => {
                  const next = new Set(prev);
                  if (open) next.add(entry.id);
                  else next.delete(entry.id);
                  return next;
                })
        }
        onViewAgent={(agentName) => {
          const match = agents.find(
            (a) => a.name.toLowerCase() === agentName.toLowerCase(),
          );
          if (match) setActiveThreadId(match.threadId);
        }}
      />
    </div>
  );

  const appendMessages = useCallback(
    (threadId: string, msgs: ChatMessage[]) => {
      setMessagesByThread((prev) => ({
        ...prev,
        [threadId]: [...(prev[threadId] ?? []), ...msgs],
      }));
    },
    [],
  );

  const lockWatiMessageActions = useCallback(
    (threadId: string, messageId: string) => {
      setMessagesByThread((prev) => {
        const list = prev[threadId];
        if (!list) return prev;
        return {
          ...prev,
          [threadId]: list.map((m) =>
            m.kind === "wati-message" && m.id === messageId
              ? { ...m, locked: true }
              : m,
          ),
        };
      });
    },
    [],
  );

  // Truncate the run list (handoffs and digest entries alike) to the latest
  // run by default; user toggles to show all. Resets on thread change so each
  // agent's collapse state is independent.
  const [showAllRuns, setShowAllRuns] = useState(false);
  // Older handoffs currently expanded — while any are open, the older-list
  // height cap lifts so their content shows in full.
  const [expandedOlderIds, setExpandedOlderIds] = useState<ReadonlySet<string>>(
    new Set(),
  );
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [runningAgentId, setRunningAgentId] = useState<string | null>(null);
  const digestMeta = useDailyDigestMeta();

  useEffect(() => {
    setInput("");
    setShowAllRuns(false);
    setExpandedOlderIds(new Set());
    setEditDialogOpen(false);
    setRunningAgentId(null);
    // Mode is lifted to ChatModeProvider and managed by whoever sets it
    // (slash menu, pill row, sidebar New Agent button). Don't clobber it
    // here on thread change — that would race with sidebar-driven setMode.
  }, [activeThreadId]);

  // Bootstrap onboarding for first-time users who have not yet seen the
  // flow. Idempotent — finds the existing "Getting started" thread if one
  // is already there (StrictMode double-mount, hot reload, etc.) and only
  // posts the intro message when the thread has none. Skipped for
  // returning-user mode and once the user has completed/skipped onboarding.
  useEffect(() => {
    if (!demoHydrated || !onboardingHydrated || !threadsHydrated) return;
    if (demoMode !== "first-time") return;
    if (onboardingSeen) return;
    if (view !== "chat") return;

    const existing = threads.find((t) => t.title === ONBOARDING_TITLE);
    let threadId: string;
    if (existing) {
      threadId = existing.id;
      if (onboardingThreadId !== threadId) {
        setOnboardingThreadId(threadId);
      }
      if (!activeThreadId) {
        setActiveThreadId(threadId);
      }
    } else {
      if (activeThreadId) return; // user already in some other thread; don't override
      threadId = createThread(ONBOARDING_TITLE);
      setOnboardingThreadId(threadId);
      setOnboardingClosingPosted(false);
    }

    const existingMessages = messagesByThread[threadId] ?? [];
    if (existingMessages.length > 0) return;

    const script = getOnboardingScript(tenantProfile);
    appendMessages(threadId, [
      {
        kind: "wati-message",
        id: crypto.randomUUID(),
        text: script.intro.text,
        actions: [
          ...script.intro.offerings.map<WatiAction>((o) => ({
            kind: "onboarding-pick-offering",
            label: o.label,
            choice: o.choice,
          })),
          { kind: "onboarding-skip", label: script.intro.skipLabel },
        ],
      },
    ]);
  }, [
    demoHydrated,
    onboardingHydrated,
    threadsHydrated,
    demoMode,
    onboardingSeen,
    view,
    threads,
    activeThreadId,
    messagesByThread,
    onboardingThreadId,
    tenantProfile,
    appendMessages,
    createThread,
    setActiveThreadId,
  ]);

  // Once the agent for the onboarding thread is created, post the closing
  // message. Runs once thanks to `onboardingClosingPosted`.
  useEffect(() => {
    if (!onboardingThreadId) return;
    if (onboardingClosingPosted) return;
    if (activeThreadId !== onboardingThreadId) return;
    const onboardingAgent = getAgentsForThread(onboardingThreadId)[0] ?? null;
    if (!onboardingAgent) return;
    const script = getOnboardingScript(tenantProfile);
    setOnboardingClosingPosted(true);
    appendMessages(onboardingThreadId, [
      {
        kind: "wati-message",
        id: crypto.randomUUID(),
        text: script.afterAgent.text,
        actions: script.afterAgent.closingChips.map((c) =>
          closingChipToAction(c),
        ),
      },
    ]);
    markSeen();
  }, [
    onboardingThreadId,
    onboardingClosingPosted,
    activeThreadId,
    getAgentsForThread,
    tenantProfile,
    appendMessages,
    markSeen,
  ]);

  /* ---------------------------------------------- Template use case */

  const { takenNames, getTemplate, submit: submitTemplate } = useTemplates();
  const campaigns = useCampaigns();
  const templateLocked = (templateId?: string) => {
    const status = templateId ? getTemplate(templateId)?.status : undefined;
    return status === "pending-meta" || status === "approved";
  };

  // Whether the open-weight model is configured; checked once per mount.
  const [templateAi, setTemplateAi] = useState({ enabled: false, model: "" });
  useEffect(() => {
    let live = true;
    templateAiStatus().then((s) => live && setTemplateAi(s));
    return () => {
      live = false;
    };
  }, []);
  // Say once per session why the model isn't drafting, not on every turn.
  const aiFallbackNoted = useRef(false);

  /**
   * Lead line + first card. The scripted draft is computed either way: it
   * shows instantly without the model and is the fallback when it fails.
   */
  const startTemplate = (
    intent: string,
    purpose: TemplatePurpose,
    lead = TEMPLATE_LEAD,
  ): { msgs: ChatMessage[]; ai?: TemplateAiJob } => {
    const draft = draftTemplate(intent, purpose, takenNames());
    const card = templateCardMessage(draft, 1) as TemplateCardMessage;
    if (!templateAi.enabled) return { msgs: [watiText(lead), card] };
    return {
      msgs: [watiText(lead), { ...card, pending: true }],
      ai: {
        cardId: card.id,
        base: draft,
        request: {
          mode: "draft",
          intent,
          purpose,
          channel: draft.channel ?? "whatsapp",
          language: draft.language,
        },
      },
    };
  };

  /** Fill a pending card from the model, or fall back to the scripted path. */
  const runTemplateAi = async (threadId: string, job: TemplateAiJob) => {
    const res = await askTemplateAi(job.request);
    if (res.ok && res.template) {
      updateTemplateCard(threadId, job.cardId, {
        draft: fromModelTemplate(res.template, job.base),
        pending: false,
        drafter: res.model,
      });
      return;
    }
    const reason = res.ok ? "bad-output" : res.reason;
    if (reason === "no-key" || reason === "no-credits") {
      setTemplateAi((s) => ({ ...s, enabled: false }));
    }
    const note =
      !aiFallbackNoted.current && (reason === "no-key" || reason === "no-credits")
        ? watiText(
            reason === "no-credits"
              ? `${modelLabel(templateAi.model)} couldn't run — the model account is out of credits — so I'm using the built-in drafter for now.`
              : `${modelLabel(templateAi.model)} isn't connected, so I'm using the built-in drafter for now.`,
          )
        : null;
    if (note) aiFallbackNoted.current = true;
    setMessagesByThread((prev) => {
      let list = prev[threadId] ?? [];
      const keep = job.request.mode === "draft" || job.fallback;
      if (keep) {
        list = list.map((m) =>
          m.kind === "template-card" && m.id === job.cardId
            ? { ...m, pending: false, draft: job.fallback ?? m.draft }
            : m,
        );
      } else {
        // Nothing scripted to show: undo the pending turn's card.
        list = list
          .filter((m) => m.id !== job.cardId)
          .map((m) =>
            m.kind === "template-card" && m.id === job.replacedId ? { ...m, superseded: false } : m,
          );
      }
      const extra = [
        ...(note ? [note] : []),
        ...(keep ? [] : [watiText(TEMPLATE_UNSUPPORTED)]),
      ];
      return { ...prev, [threadId]: [...list, ...extra] };
    });
  };

  /**
   * How a user turn moves the template flow on, or null when it isn't part
   * of one — then it goes to the model as usual.
   */
  const templateTurn = (
    list: readonly ChatMessage[],
    text: string,
    files: readonly Attachment[],
  ): TemplateTurn | null => {
    const question = openPurposeQuestion(list);
    if (question && text) {
      return {
        lockId: question.id,
        ...startTemplate(`${question.intent} ${text}`, detectPurpose(text) ?? "general"),
      };
    }
    // Asking for another template while one is open starts that one fresh.
    const card = isNewTemplateRequest(text) ? null : openTemplateCard(list, templateLocked);
    if (card) {
      const image = files.find((f) => f.kind === "image");
      if (image && card.draft.header?.kind === "image") {
        return {
          patch: {
            id: card.id,
            draft: { ...card.draft, header: { kind: "image", fileName: image.name } },
          },
          msgs: [watiText(`Added ${image.name} as the header image.`)],
        };
      }
      if (text) {
        const result = refineTemplate(card.draft, text);
        if (result && "blocked" in result) return { msgs: [watiText(result.blocked)] };
        if (templateAi.enabled && card.draft.category !== "authentication") {
          // The model takes any change in the user's own words; the scripted
          // result, if there is one, is the fallback.
          const next = {
            ...(templateCardMessage(card.draft, card.version + 1) as TemplateCardMessage),
            campaignId: card.campaignId,
            pending: true,
          };
          return {
            supersedeId: card.id,
            msgs: [next],
            ai: {
              cardId: next.id,
              base: card.draft,
              request: { mode: "refine", template: toModelTemplate(card.draft), instruction: text },
              replacedId: card.id,
              fallback: result?.draft ?? null,
            },
          };
        }
        if (!result) {
          const reply =
            card.draft.customBody && isRewriteRequest(text)
              ? TEMPLATE_NO_REWRITE
              : TEMPLATE_UNSUPPORTED;
          return { msgs: [watiText(reply)] };
        }
        return {
          supersedeId: card.id,
          msgs: [
            {
              ...(templateCardMessage(result.draft, card.version + 1, result.changes) as TemplateCardMessage),
              campaignId: card.campaignId,
            },
          ],
        };
      }
    }
    if (text && isTemplateRequest(text)) {
      const purpose = detectPurpose(text);
      if (purpose) return startTemplate(text, purpose);
      return {
        msgs: [
          {
            kind: "wati-message",
            id: crypto.randomUUID(),
            text: "Happy to help. What's this template for?",
            actions: PURPOSE_CHOICES.map<WatiAction>((c) => ({
              kind: "template-pick-purpose",
              label: c.label,
              purpose: c.purpose,
              intent: text,
            })),
          },
        ],
      };
    }
    return null;
  };

  /** Apply a template turn's in-place changes and append its messages. */
  const applyTemplateTurn = (threadId: string, turn: TemplateTurn, lead: ChatMessage[]) => {
    setMessagesByThread((prev) => {
      const list = (prev[threadId] ?? []).map((m): ChatMessage => {
        if (m.id === turn.supersedeId && m.kind === "template-card") {
          return { ...m, superseded: true };
        }
        if (m.id === turn.lockId && m.kind === "wati-message") return { ...m, locked: true };
        if (m.id === turn.patch?.id && m.kind === "template-card") {
          return { ...m, draft: turn.patch.draft };
        }
        return m;
      });
      return { ...prev, [threadId]: [...list, ...lead, ...turn.msgs] };
    });
    if (turn.ai) void runTemplateAi(threadId, turn.ai);
  };

  const updateTemplateCard = (
    threadId: string,
    cardId: string,
    patch: Partial<Pick<TemplateCardMessage, "draft" | "stage" | "templateId" | "pending" | "drafter">>,
  ) => {
    setMessagesByThread((prev) => ({
      ...prev,
      [threadId]: (prev[threadId] ?? []).map((m) =>
        m.kind === "template-card" && m.id === cardId ? { ...m, ...patch } : m,
      ),
    }));
  };

  /** Composer hint while a template flow is waiting on the user. */
  const templatePlaceholder = (): string | undefined => {
    if (openPurposeQuestion(messages)) return "Or describe what the template is for";
    const card = openTemplateCard(messages, templateLocked);
    if (!card) return undefined;
    if (card.draft.category === "authentication") {
      return "Change how long the code is valid, or switch the category";
    }
    // Formats that set custom buttons or the header aside don't ask for them.
    const type = card.draft.templateType ?? "standard";
    if (type !== "carousel" && card.draft.header?.kind === "image" && !card.draft.header.fileName) {
      return "Upload the header image, or describe a change";
    }
    if (
      allowsCustomButtons(card.draft) &&
      card.draft.buttons.some((b) => b.kind === "copy-code" && !b.code)
    ) {
      return "Enter the coupon code, e.g. “code DIWALI20”";
    }
    if (card.stage === "review") return "Anything to change before you submit?";
    // Examples are ones refineTemplate can actually apply.
    if (templateAi.enabled) return "Describe any change in your own words";
    if (card.draft.customBody) return "Send revised text, or e.g. “footer: T&Cs apply”";
    return card.draft.purpose === "promotion"
      ? "Describe a change, e.g. “make it 25% off” or “use code DIWALI20”"
      : "Describe a change, e.g. “add a quick reply ‘Call me’”";
  };

  /** A refinement chip on the card — posts as if the user typed it. */
  const sendTemplateChip = (threadId: string, text: string) => {
    const turn = templateTurn(messagesByThread[threadId] ?? [], text, []);
    if (!turn) return;
    applyTemplateTurn(threadId, turn, [
      { kind: "user-text", id: crypto.randomUUID(), content: text },
    ]);
  };

  const startTemplateFromAgent = (agentName: string, ctaLabel: string) => {
    const subject = ctaLabel.replace(/^draft\s+/i, "");
    const threadId = createThread(subject.charAt(0).toUpperCase() + subject.slice(1));
    setMode(null);
    setView("chat");
    const start = startTemplate(
      ctaLabel,
      detectPurpose(ctaLabel) ?? "general",
      `${agentName} flagged this in its last run, so I drafted a template for it. Tap a suggestion or tell me what to change.`,
    );
    appendMessages(threadId, start.msgs);
    if (start.ai) void runTemplateAi(threadId, start.ai);
  };

  const sendPrompt = (text: string) => {
    const trimmed = text.trim();
    // Attachments alone are a valid message — a photo with no caption still
    // says something. Only an entirely empty composer is a no-op.
    const outgoing = stagedAttachments;
    if (!trimmed && outgoing.length === 0) return;
    let threadId = activeThreadId;
    if (!threadId) {
      // An attachment-only opener has no text to name the thread after.
      threadId = createThread(trimmed || titleForAttachments(outgoing));
    }
    const userMsg: ChatMessage = {
      kind: "user-text",
      id: crypto.randomUUID(),
      content: trimmed,
    };
    if (outgoing.length > 0) {
      // Hand the staged files to this message and clear the composer. The
      // object URLs stay alive — ownership moves, it is not a copy.
      setAttachmentsByMessage((prev) => ({ ...prev, [userMsg.id]: outgoing }));
      setStagedAttachments([]);
      setAttachmentNotice(null);
    }
    const startsAgentFlow = mode === "agent" && !agentForThread;
    const template =
      startsAgentFlow || agentForThread
        ? null
        : templateTurn(messagesByThread[threadId] ?? [], trimmed, outgoing);
    if (template) {
      applyTemplateTurn(threadId, template, [userMsg]);
      setInput("");
      setPendingWatcherTypeId(null);
      return threadId;
    }
    const thinkingId = crypto.randomUUID();
    const nextMessages: ChatMessage[] = [userMsg];
    if (startsAgentFlow) {
      if (pendingWatcherTypeId) {
        // Entry point already resolved the type (suggestion chip / shelf) —
        // the ladder only runs on unresolved free text.
        nextMessages.push({
          kind: "agent-creation-flow",
          id: crypto.randomUUID(),
          initialMessage: trimmed,
          watcherTypeId: pendingWatcherTypeId,
        });
      } else {
        // Free-text matching ladder (agent-schema.md §2). A no-match ask is
        // captured as a role request; nothing is created either way until
        // the user picks a real type off the card.
        const match = resolveMatchTier(rankWatcherMatches(trimmed));
        if (match.tier === "none") recordRoleRequest(trimmed);
        nextMessages.push({
          kind: "watcher-match",
          id: crypto.randomUUID(),
          prompt: trimmed,
          match,
        });
      }
    } else {
      // Free-form chat: show the streaming indicator until the first
      // chunk arrives, then it gets replaced with the streamed reply.
      nextMessages.push({ kind: "ai-thinking", id: thinkingId });
    }
    setPendingWatcherTypeId(null);
    const tid = threadId;
    // Drop any prior ai-thinking placeholder so only the most recent
    // user prompt has a live indicator under it. Past turns keep their
    // user message + final response in the transcript.
    setMessagesByThread((prev) => {
      const existing = prev[tid] ?? [];
      const cleaned = existing.filter((m) => m.kind !== "ai-thinking");
      return { ...prev, [tid]: [...cleaned, ...nextMessages] };
    });
    setInput("");
    if (startsAgentFlow) setMode(null);
    if (!startsAgentFlow) {
      // An attachment-only send still needs non-empty text upstream, so
      // describe what was attached rather than posting an empty turn.
      streamAssistantReply(
        tid,
        thinkingId,
        trimmed || describeAttachments(outgoing),
      );
    }
    return tid;
  };

  // A prompt asked from the header Wati AI bar lands here once the drawer
  // has mounted and its threads and messages have loaded from storage —
  // sending earlier gets overwritten by that load. The ref guards
  // StrictMode's effect replay.
  const handledPromptId = useRef<string | null>(null);
  const storageReady = threadsHydrated && messagesHydratedForMode === demoMode;
  useEffect(() => {
    if (!pendingPrompt || chrome !== "drawer" || !storageReady) return;
    if (handledPromptId.current === pendingPrompt.id) return;
    handledPromptId.current = pendingPrompt.id;
    clearPrompt();
    sendPrompt(pendingPrompt.text);
    // sendPrompt is re-created every render; only a new prompt should fire.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPrompt, chrome, storageReady, clearPrompt]);

  // An island notice's Review brings its agent thread up — same wait for
  // storage as a handed-in prompt.
  const handledThreadId = useRef<string | null>(null);
  useEffect(() => {
    if (!pendingThread || chrome !== "drawer" || !storageReady) return;
    if (handledThreadId.current === pendingThread.id) return;
    handledThreadId.current = pendingThread.id;
    clearThread();
    setView("chat");
    setMode(null);
    setActiveThreadId(pendingThread.threadId);
  }, [pendingThread, chrome, storageReady, clearThread, setView, setMode, setActiveThreadId]);

  // A recommended campaign handed over from the Campaigns calendar opens its
  // own thread: "edit" with the template ready to change, "approve" with it
  // submitted as-is and the broadcast set-up next.
  const handledCampaignId = useRef<string | null>(null);
  useEffect(() => {
    if (!pendingCampaign || chrome !== "drawer" || !storageReady) return;
    if (handledCampaignId.current === pendingCampaign.id) return;
    handledCampaignId.current = pendingCampaign.id;
    clearCampaign();
    const campaign = RECOMMENDED_CAMPAIGNS.find((c) => c.id === pendingCampaign.campaignId);
    if (!campaign) return;
    const threadId = createThread(campaign.name);
    setView("chat");
    setMode(null);
    const card = templateCardMessage(campaign.template, 1) as TemplateCardMessage;
    const lead = watiText(
      `Recommended for ${CAMPAIGN_DATE.format(new Date(`${campaign.date}T00:00:00`))}, ${campaign.sendTime}.`,
    );
    if (pendingCampaign.mode === "edit") {
      appendMessages(threadId, [lead, { ...card, campaignId: campaign.id }]);
      return;
    }
    const templateId = submitTemplate(threadId, campaign.template);
    appendMessages(threadId, [
      lead,
      { ...card, campaignId: campaign.id, templateId, stage: "review" },
      broadcastCardMessage(campaign, templateId),
    ]);
    // Thread and template stores are read fresh on the next render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingCampaign, chrome, storageReady]);

  // Tell the agents store which agent thread is on screen, so runs the
  // admin is already watching don't also ping the island.
  const watchedThreadId =
    chrome === "drawer" && view === "chat" && agentForThread ? activeThreadId : null;
  useEffect(() => {
    setWatchedThread(watchedThreadId);
    return () => setWatchedThread(null);
  }, [watchedThreadId, setWatchedThread]);

  /** Ladder card pick: lock the card and start the normal creation flow. */
  const resolveWatcherMatch = (
    threadId: string,
    messageId: string,
    typeId: WatcherTypeId,
  ) => {
    setMessagesByThread((prev) => {
      const list = prev[threadId] ?? [];
      const source = list.find(
        (m) => m.kind === "watcher-match" && m.id === messageId,
      );
      if (!source || source.kind !== "watcher-match" || source.resolvedTypeId) {
        return prev;
      }
      return {
        ...prev,
        [threadId]: [
          ...list.map((m) =>
            m.kind === "watcher-match" && m.id === messageId
              ? { ...m, resolvedTypeId: typeId }
              : m,
          ),
          {
            kind: "agent-creation-flow" as const,
            id: crypto.randomUUID(),
            initialMessage: source.prompt,
            watcherTypeId: typeId,
          },
        ],
      };
    });
  };

  /** Ambiguous rung's "None of these" → the no-match state + capture. */
  const demoteWatcherMatch = (threadId: string, messageId: string) => {
    const source = (messagesByThread[threadId] ?? []).find(
      (m) => m.kind === "watcher-match" && m.id === messageId,
    );
    if (source?.kind === "watcher-match") recordRoleRequest(source.prompt);
    setMessagesByThread((prev) => ({
      ...prev,
      [threadId]: (prev[threadId] ?? []).map((m) =>
        m.kind === "watcher-match" && m.id === messageId
          ? { ...m, match: { tier: "none" as const } }
          : m,
      ),
    }));
  };

  const streamAssistantReply = useCallback(
    async (threadId: string, thinkingId: string, userText: string) => {
      // Reconstruct chat history from current transcript so the model
      // has prior turns. We snapshot from the latest state at send time
      // — `messagesByThread` may have been updated by sendPrompt already
      // but it doesn't matter; we recompute below.
      const history = (messagesByThread[threadId] ?? [])
        .filter(
          (m): m is Extract<ChatMessage, { kind: "user-text" | "ai-response" }> =>
            m.kind === "user-text" || m.kind === "ai-response",
        )
        .map((m) => ({
          role: m.kind === "user-text" ? ("user" as const) : ("assistant" as const),
          content: m.kind === "user-text" ? m.content : m.content,
        }));
      const payloadMessages = [
        ...history,
        { role: "user" as const, content: userText },
      ];
      const responseId = crypto.randomUUID();
      let started = false;
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: payloadMessages }),
        });
        if (!res.ok || !res.body) {
          throw new Error(`Chat request failed: ${res.status}`);
        }
        const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
        // Server sends line-delimited JSON events: reasoning deltas ("r"),
        // answer-text deltas ("t"), errors ("e"). We accumulate reasoning and
        // answer separately so the reasoning renders in a collapsed trace.
        let buffer = "";
        let reasoning = "";
        let content = "";
        let reasoningStart = 0;
        let reasoningMs: number | undefined;

        const flushToState = () => {
          setMessagesByThread((prev) => {
            const list = prev[threadId];
            if (!list) return prev;
            if (!started) {
              started = true;
              return {
                ...prev,
                [threadId]: list.map((m) =>
                  m.kind === "ai-thinking" && m.id === thinkingId
                    ? {
                        kind: "ai-response",
                        id: responseId,
                        content,
                        reasoning,
                        reasoningMs,
                        streaming: true,
                      }
                    : m,
                ),
              };
            }
            return {
              ...prev,
              [threadId]: list.map((m) =>
                m.kind === "ai-response" && m.id === responseId
                  ? { ...m, content, reasoning, reasoningMs }
                  : m,
              ),
            };
          });
        };

        const handleEvent = (line: string) => {
          if (!line.trim()) return;
          let evt: { t: "r" | "t" | "e"; d: string };
          try {
            evt = JSON.parse(line);
          } catch {
            return;
          }
          if (evt.t === "e") throw new Error(evt.d || "stream error");
          if (evt.t === "r") {
            if (!reasoningStart) reasoningStart = Date.now();
            reasoning += evt.d;
          } else if (evt.t === "t") {
            // First answer token marks the end of the reasoning phase.
            if (reasoningStart && reasoningMs === undefined) {
              reasoningMs = Date.now() - reasoningStart;
            }
            content += evt.d;
          }
        };

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (!value) continue;
          buffer += value;
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) handleEvent(line);
          flushToState();
        }
        if (buffer) handleEvent(buffer);
        flushToState();

        if (!started) {
          // Stream closed with no chunks (e.g. server-side gateway error
          // after headers were sent). Surface a friendly fallback.
          throw new Error("Empty response stream");
        }
        // Mark stream complete.
        setMessagesByThread((prev) => {
          const list = prev[threadId];
          if (!list) return prev;
          return {
            ...prev,
            [threadId]: list.map((m) =>
              m.kind === "ai-response" && m.id === responseId
                ? { ...m, streaming: false }
                : m,
            ),
          };
        });
      } catch (err) {
        console.error("Ask Wati stream failed", err);
        const fallback =
          "Something went wrong reaching the model. Try again in a moment.";
        setMessagesByThread((prev) => {
          const list = prev[threadId];
          if (!list) return prev;
          return {
            ...prev,
            [threadId]: list.map((m) => {
              // Error before any token: swap the thinking placeholder.
              if (m.kind === "ai-thinking" && m.id === thinkingId) {
                return {
                  kind: "ai-response" as const,
                  id: responseId,
                  content: fallback,
                  reasoning: "",
                  streaming: false,
                };
              }
              // Error mid-stream: stop the in-progress response, keeping
              // whatever answer text already arrived (or the fallback).
              if (m.kind === "ai-response" && m.id === responseId) {
                return {
                  ...m,
                  content: m.content || fallback,
                  streaming: false,
                };
              }
              return m;
            }),
          };
        });
      }
    },
    [messagesByThread],
  );

  const submit = () => {
    const text = input.trim();
    // Attachments with no caption are still a message worth sending.
    if (!text && stagedAttachments.length === 0) return;
    const tid = sendPrompt(text);
    if (!tid) return;

    // If a first-time user starts typing free-form in the onboarding
    // thread without tapping the lead chip, treat it as them finding
    // their own way in and step out of the way for future sessions.
    if (
      onboardingThreadId &&
      tid === onboardingThreadId &&
      !onboardingSeen
    ) {
      markSeen();
    }
  };

  // Clicking a Daily Digest pointer enters Insights mode in a fresh thread,
  // with the pointer text as the first user message so the conversation has
  // something concrete to dig into.
  const handleDigestPointer = (text: string) => {
    setMode("insights");
    const threadId = createThread(text);
    setMessagesByThread((prev) => ({
      ...prev,
      [threadId]: [
        ...(prev[threadId] ?? []),
        { kind: "user-text", id: crypto.randomUUID(), content: text },
      ],
    }));
  };

  const runAgentAgain = () => {
    if (!agentForThread) return;
    setRunningAgentId(agentForThread.id);
  };

  const completeRun = () => {
    if (!agentForThread) return;
    const wt = getWatcherType(agentForThread.watcherType);
    addHandoff(agentForThread.id, wt.buildDraft());
    setRunningAgentId(null);
  };

  // Resolves a WatiAction tapped by the user. The dispatcher is constructed
  // at render time (not stored in the message) so each handler sees current
  // closures.
  const handleWatiAction = useCallback(
    (threadId: string, messageId: string, action: WatiAction) => {
      lockWatiMessageActions(threadId, messageId);

      switch (action.kind) {
        case "onboarding-pick-offering": {
          const script = getOnboardingScript(tenantProfile);
          if (action.choice === "agents") {
            // Drill in: show the tenant-aware agent options.
            appendMessages(threadId, [
              {
                kind: "wati-message",
                id: crypto.randomUUID(),
                text: script.agentsDrillDown.text,
                actions: [
                  ...script.agentsDrillDown.agents.map<WatiAction>((a) => ({
                    kind: "onboarding-pick-agent",
                    label: a.label,
                    agentName: a.agentName,
                    prompt: a.prompt,
                    watcherTypeId: a.watcherTypeId,
                  })),
                  {
                    kind: "onboarding-back-to-offerings",
                    label: script.agentsDrillDown.backLabel,
                  },
                  {
                    kind: "onboarding-skip",
                    label: script.agentsDrillDown.skipLabel,
                  },
                ],
              },
            ]);
          } else {
            // Automations / Insights aren't built yet — surface a friendly
            // "coming soon" turn with a path back to agents.
            const turn =
              action.choice === "automations"
                ? script.comingSoonAutomations
                : script.comingSoonInsights;
            appendMessages(threadId, [
              {
                kind: "wati-message",
                id: crypto.randomUUID(),
                text: turn.text,
                actions: [
                  {
                    kind: "onboarding-back-to-offerings",
                    label: turn.backLabel,
                  },
                  { kind: "onboarding-skip", label: turn.skipLabel },
                ],
              },
            ]);
          }
          break;
        }

        case "onboarding-pick-agent": {
          // Render their question, then a "thinking" → preview handoff.
          // The follow-up "want me to keep watching?" message is posted by
          // `onPreviewReady` once the preview animation finishes, so we
          // don't race the thinking indicator here.
          appendMessages(threadId, [
            {
              kind: "user-text",
              id: crypto.randomUUID(),
              content: action.prompt,
            },
            {
              kind: "onboarding-preview",
              id: crypto.randomUUID(),
              watcherTypeId: action.watcherTypeId,
              agentName: action.agentName,
              prompt: action.prompt,
            },
          ]);
          break;
        }

        case "onboarding-back-to-offerings": {
          // Re-post the intro turn so the user can pick a different
          // offering. New message, new id — the previous turn stays in
          // the transcript (locked) so the conversation history reads
          // naturally.
          const script = getOnboardingScript(tenantProfile);
          appendMessages(threadId, [
            {
              kind: "wati-message",
              id: crypto.randomUUID(),
              text: script.intro.text,
              actions: [
                ...script.intro.offerings.map<WatiAction>((o) => ({
                  kind: "onboarding-pick-offering",
                  label: o.label,
                  choice: o.choice,
                })),
                { kind: "onboarding-skip", label: script.intro.skipLabel },
              ],
            },
          ]);
          break;
        }

        case "onboarding-skip": {
          markSeen();
          // Drop them onto the standard first-time home (WatiWelcome).
          setActiveThreadId(null);
          setOnboardingThreadId(null);
          break;
        }

        case "onboarding-convert": {
          appendMessages(threadId, [
            {
              kind: "agent-creation-flow",
              id: crypto.randomUUID(),
              initialMessage: action.prompt,
              watcherTypeId: action.watcherTypeId,
            },
          ]);
          break;
        }

        case "onboarding-decline": {
          appendMessages(threadId, [
            {
              kind: "wati-message",
              id: crypto.randomUUID(),
              text: "No problem — you can always ask me to set one up later.",
              actions: [],
            },
          ]);
          markSeen();
          break;
        }

        case "open-handoffs": {
          setView("handoffs");
          break;
        }

        case "open-digest": {
          setActiveThreadId(null);
          setMode(null);
          // The home renders DailyDigest. Defer scroll so the home mounts
          // before we try to find the digest.
          requestAnimationFrame(() => {
            const el = document.querySelector("[data-daily-digest]");
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          });
          break;
        }

        case "fill-composer": {
          setActiveThreadId(null);
          setMode(null);
          setInput(action.prompt);
          break;
        }

        case "template-pick-purpose": {
          const start = startTemplate(action.intent, action.purpose);
          appendMessages(threadId, [
            { kind: "user-text", id: crypto.randomUUID(), content: action.label },
            ...start.msgs,
          ]);
          if (start.ai) void runTemplateAi(threadId, start.ai);
          break;
        }
      }
    },
    // startTemplate reads takenNames and templateAi, which it tracks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      takenNames,
      templateAi,
      appendMessages,
      lockWatiMessageActions,
      markSeen,
      setActiveThreadId,
      setMode,
      setView,
      tenantProfile,
    ],
  );

  const onPreviewReady = useCallback(
    (
      threadId: string,
      previewCtx: { watcherTypeId: WatcherTypeId; prompt: string },
    ) => {
      const script = getOnboardingScript(tenantProfile);
      appendMessages(threadId, [
        {
          kind: "wati-message",
          id: crypto.randomUUID(),
          text: script.afterResult.text,
          actions: [
            {
              kind: "onboarding-convert",
              label: script.afterResult.convertLabel,
              watcherTypeId: previewCtx.watcherTypeId,
              prompt: previewCtx.prompt,
            },
            {
              kind: "onboarding-decline",
              label: script.afterResult.declineLabel,
            },
          ],
        },
      ]);
    },
    [appendMessages, tenantProfile],
  );

  // Handoff inbox and the approval queue are parallel top-level surfaces —
  // render them instead of the chat column when navigated to from the sidebar.
  if (view === "handoffs") {
    return <HandoffInbox />;
  }
  if (view === "approvals") {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <ApprovalQueue />
      </div>
    );
  }

  // On the home screen (no thread, no messages, no mode picked) we let the
  // page scroll so the Daily Digest can flow in below the hero. Outside
  // the home state the layout stays as a full-height non-scrolling column.
  const isHomeScreen = !hasContent && mode === null;

  return (
    <div
      className={`mx-auto flex w-full max-w-[720px] flex-col px-6 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
        isHomeScreen ? "h-full overflow-y-auto" : "h-full"
      }`}
    >
      <div
        className={
          chrome === "drawer"
            ? "flex h-full flex-col justify-end"
            : isHomeScreen
              ? "flex min-h-full flex-col justify-center"
              : "flex h-full flex-col"
        }
      >
      {/* Top: hero (with greeting or tenant suggestions inside) or messages */}
      <>
        {!hasContent ? (
          <div
            className={`flex flex-col justify-end pb-6 ${isHomeScreen ? "" : "flex-1"}`}
          >
            {mode === "agent" ? (
              // Drawer always uses the tenant-suggested agents (watcher
              // avatars + counts). Outside the drawer, inbox surfaces get
              // the inbox-flavored "For your inbox" prompts.
              inboxCtx && chrome !== "drawer" ? (
                <InboxAskWatiSuggestions
                  stats={inboxCtx.stats}
                  onSelect={(prompt, watcherTypeId) => {
                    setInput(prompt);
                    setPendingWatcherTypeId(watcherTypeId);
                  }}
                />
              ) : (
                <TenantAgentSuggestions
                  profile={tenantProfile}
                  onSelect={(prompt, watcherTypeId) => {
                    setInput(prompt);
                    setPendingWatcherTypeId(watcherTypeId);
                  }}
                />
              )
            ) : demoMode === "first-time" ? (
              <WatiWelcome
                copy={getTenantPromptCopy(tenantProfile)}
                onSelectPrompt={(prompt) => setInput(prompt)}
              />
            ) : chrome === "drawer" ? (
              <div className="flex flex-col items-start gap-4 px-1">
                <AskWatiSparkleBloom
                  play={!askWatiSplashSpent.current}
                  onPlayed={() => {
                    askWatiSplashSpent.current = true;
                  }}
                />
                <h2 className="text-[20px] font-semibold tracking-[-0.4px] text-[#0a0a0a]">
                  How can I help you?
                </h2>
                <div className="flex flex-col items-start gap-2">
                  {getStarterPrompts(
                    analyticsCtx
                      ? "analytics"
                      : shopifyCtx
                        ? "shopify"
                        : contactsCtx
                          ? "contacts"
                          : inboxCtx
                            ? "inbox"
                            : null,
                  ).map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => sendPrompt(prompt)}
                      className="rounded-2xl bg-black/[0.04] px-3.5 py-1.5 text-left text-[13px] tracking-[-0.078px] text-[#0a0a0a] transition-colors hover:bg-black/[0.07]"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-center">
                  <ThinkingIndicator />
                </div>
                <div className="pt-3">
                  <p className="text-center text-[16px] font-medium tracking-[-0.32px] text-black/70">
                    How may I be of service?
                  </p>
                </div>
              </>
            )}
          </div>
        ) : (
          <div
            className="flex flex-1 flex-col overflow-y-auto pt-4 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="flex flex-col gap-4">
              {isAnalyticsThread && !hasMessages && (
                <AnalyticsMockConversation />
              )}
              {isDailyDigestThread && digestMeta.deleted && (
                <DeletedDigestPlaceholder onRestore={digestMeta.restoreDigest} />
              )}
              {isDailyDigestThread && !digestMeta.deleted && (
                <>
                  <DailyDigestSummaryCard
                    avatarPath={getPixabot(digestMeta.avatarSeed)}
                    showInstructions={editDialogOpen}
                    onToggleInstructions={() => setEditDialogOpen(true)}
                  />
                  {/* Same run-list logic as watcher-agent handoffs: latest
                      at the bottom next to the composer, only the latest shown
                      by default with older runs behind "View older" above. The
                      older list is height-capped and scrolls internally while
                      collapsed; expanding one lifts the cap. */}
                  <div className="flex flex-col">
                    {DAILY_DIGEST_ENTRIES.length > DIGEST_LIST_LIMIT && (
                      <RunListToggle
                        showingAll={showAllRuns}
                        hidden={DAILY_DIGEST_ENTRIES.length - DIGEST_LIST_LIMIT}
                        onToggle={() => {
                          setShowAllRuns((v) => !v);
                          setExpandedOlderIds(new Set());
                        }}
                      />
                    )}
                    {showAllRuns && (
                      <div
                        className={
                          expandedOlderIds.size > 0
                            ? "flex flex-col"
                            : "flex max-h-[400px] flex-col overflow-y-auto overscroll-contain"
                        }
                      >
                        {DAILY_DIGEST_ENTRIES.slice(DIGEST_LIST_LIMIT)
                          .reverse()
                          .map((entry) =>
                            renderDigestEntry(entry, { isLatest: false }),
                          )}
                      </div>
                    )}
                    {DAILY_DIGEST_ENTRIES.slice(0, DIGEST_LIST_LIMIT)
                      .reverse()
                      .map((entry) =>
                        renderDigestEntry(entry, { isLatest: true }),
                      )}
                  </div>
                </>
              )}
              {agentForThread && (
                <div className="sticky -top-4 z-10 bg-white pb-3 pt-4">
                <AgentSummaryCard
                  data={{
                    avatarPath: agentForThread.avatarSeed,
                    name: agentForThread.name,
                    watcherType: agentForThread.watcherType,
                    schedule: agentForThread.schedule,
                    description: agentForThread.description,
                    status: agentForThread.status,
                  }}
                  showInstructions={editDialogOpen}
                  onToggleInstructions={() => setEditDialogOpen(true)}
                  onToggleStatus={() =>
                    setAgentStatus(
                      agentForThread.id,
                      agentForThread.status === "active"
                        ? "paused"
                        : "active",
                    )
                  }
                  actions={
                    runningAgentId === agentForThread.id ? (
                      <button
                        type="button"
                        disabled
                        className="flex items-center gap-1.5 rounded-full bg-[#0a0a0a] px-3 py-1.5 text-[13px] tracking-[-0.078px] text-white"
                      >
                        <Loader2
                          size={12}
                          strokeWidth={2.25}
                          className="animate-spin text-wati-green"
                        />
                        Running
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={runAgentAgain}
                        className="flex items-center gap-1.5 rounded-full bg-wati-green px-3 py-1.5 text-[13px] tracking-[-0.078px] text-white hover:bg-wati-green-hover"
                      >
                        <Play size={12} strokeWidth={2} />
                        Run now
                      </button>
                    )
                  }
                />
                </div>
              )}

              {/* On an agent thread the chat surface shows the agent card,
                  empty-state / run theatre, and handoffs only. The original
                  user prompt that started the agent (and any chat messages)
                  add no value here — the agent's context lives in Edit Agent. */}
              {(agentForThread ? [] : messages).map((m) => {
                if (m.kind === "user-text") {
                  const sent = attachmentsByMessage[m.id] ?? [];
                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                      className="flex flex-col items-end"
                    >
                      {/* An attachment-only message has no bubble to draw. */}
                      {m.content && (
                        <div className="max-w-[80%] rounded-2xl bg-black/[0.04] px-4 py-2.5 text-[14px] leading-[20px] text-black/80">
                          {m.content}
                        </div>
                      )}
                      <MessageAttachments attachments={sent} />
                    </motion.div>
                  );
                }
                if (m.kind === "wati-message") {
                  const chips: WatiChip[] | undefined =
                    m.locked || m.actions.length === 0
                      ? undefined
                      : m.actions.map((a, i) => ({
                          id: `${m.id}-${i}`,
                          label: a.label,
                          variant: chipVariantFor(a),
                          onClick: () =>
                            activeThreadId &&
                            handleWatiAction(activeThreadId, m.id, a),
                        }));
                  return (
                    <WatiMessage key={m.id} text={m.text} chips={chips} />
                  );
                }
                if (m.kind === "daily-digest") {
                  // Legacy message kind from earlier iteration. Daily
                  // Digest content is now rendered structurally at the
                  // top of the thread, not as a chat message. Ignore.
                  return null;
                }
                if (m.kind === "ai-thinking") {
                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                      className="flex justify-start py-1"
                    >
                      <ThinkingIndicator variant="streaming" />
                    </motion.div>
                  );
                }
                if (m.kind === "ai-response") {
                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                      className="flex justify-start"
                    >
                      <div className="flex max-w-[88%] flex-col gap-2">
                        {m.reasoning && (
                          <ReasoningTrace
                            reasoning={m.reasoning}
                            active={m.streaming && m.content.length === 0}
                            durationMs={m.reasoningMs}
                          />
                        )}
                        {m.content && (
                          <div className="relative">
                            <InsightMessageBody
                              content={m.content}
                              streaming={m.streaming}
                            />
                            {m.streaming && (
                              <span
                                aria-hidden="true"
                                className="ml-0.5 inline-block h-[14px] w-[7px] translate-y-[2px] animate-pulse bg-black/40"
                                style={{ verticalAlign: "baseline" }}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                }
                if (m.kind === "onboarding-preview") {
                  if (!activeThreadId) return null;
                  return (
                    <OnboardingHandoffPreview
                      key={m.id}
                      watcherTypeId={m.watcherTypeId}
                      agentName={m.agentName}
                      onReady={() =>
                        onPreviewReady(activeThreadId, {
                          watcherTypeId: m.watcherTypeId,
                          prompt: m.prompt,
                        })
                      }
                    />
                  );
                }
                if (!activeThreadId) return null;
                if (m.kind === "template-card") {
                  if (m.superseded) {
                    return (
                      <SupersededTemplateCard key={m.id} draft={m.draft} version={m.version} />
                    );
                  }
                  return (
                    <TemplateDraftCard
                      key={m.id}
                      threadId={activeThreadId}
                      draft={m.draft}
                      version={m.version}
                      stage={m.stage}
                      templateId={m.templateId}
                      fresh={Date.now() - m.createdAt < 1500}
                      // A pending card left over from a reload never resolves; let it show.
                      pending={m.pending && Date.now() - m.createdAt < 90_000}
                      drafter={m.drafter}
                      canRewrite={templateAi.enabled}
                      onEnhance={
                        templateAi.enabled
                          ? async (body) => {
                              const res = await askTemplateAi({
                                mode: "enhance",
                                body,
                                template: toModelTemplate(m.draft),
                              });
                              return res.ok && res.body ? res.body : null;
                            }
                          : undefined
                      }
                      onDraftChange={(draft) =>
                        updateTemplateCard(activeThreadId, m.id, { draft })
                      }
                      onRefine={(text) => sendTemplateChip(activeThreadId, text)}
                      onStageChange={(stage) =>
                        updateTemplateCard(activeThreadId, m.id, { stage })
                      }
                      onSaved={(templateId, status) => {
                        updateTemplateCard(activeThreadId, m.id, { templateId });
                        // A recommended campaign's template, once submitted,
                        // moves on to its broadcast set-up (once per thread).
                        const campaign = RECOMMENDED_CAMPAIGNS.find((c) => c.id === m.campaignId);
                        const hasBroadcast = messages.some(
                          (x) => x.kind === "broadcast-card" && x.campaignId === m.campaignId,
                        );
                        if (campaign && status === "pending-meta" && !hasBroadcast) {
                          appendMessages(activeThreadId, [
                            broadcastCardMessage(
                              { ...campaign, template: { ...campaign.template, name: m.draft.name } },
                              templateId,
                            ),
                          ]);
                        }
                      }}
                      onFollowUp={m.campaignId ? undefined : setInput}
                    />
                  );
                }
                if (m.kind === "broadcast-card") {
                  const update = (patch: Partial<BroadcastCardMessage>) =>
                    setMessagesByThread((prev) => ({
                      ...prev,
                      [activeThreadId]: (prev[activeThreadId] ?? []).map((x) =>
                        x.kind === "broadcast-card" && x.id === m.id ? { ...x, ...patch } : x,
                      ),
                    }));
                  return (
                    <BroadcastSetupCard
                      key={m.id}
                      setup={m.setup}
                      templateId={m.templateId}
                      templateName={m.templateName}
                      state={m.state}
                      onChange={(setup) => update({ setup })}
                      onSchedule={() => {
                        campaigns.schedule(m.campaignId, { ...m.setup, threadId: activeThreadId });
                        update({ state: "scheduled" });
                      }}
                      onRemove={() => {
                        campaigns.remove(m.campaignId);
                        update({ state: "removed" });
                      }}
                    />
                  );
                }
                if (m.kind === "watcher-match") {
                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                    >
                      <WatcherMatchCard
                        match={m.match}
                        resolvedTypeId={m.resolvedTypeId ?? null}
                        onPick={(typeId) =>
                          resolveWatcherMatch(activeThreadId, m.id, typeId)
                        }
                        onNone={() => demoteWatcherMatch(activeThreadId, m.id)}
                      />
                    </motion.div>
                  );
                }
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                  >
                    <AgentCreationFlow
                      threadId={activeThreadId}
                      initialMessage={m.initialMessage}
                      watcherTypeId={m.watcherTypeId}
                    />
                  </motion.div>
                );
              })}

              {agentForThread && runningAgentId === agentForThread.id && (
                <AgentRunTheatre
                  avatarGifPath={pixabotGifFromPath(agentForThread.avatarSeed)}
                  steps={getRunStepsFor(agentForThread.watcherType)}
                  onComplete={completeRun}
                />
              )}
              {agentForThread &&
                handoffs.length === 0 &&
                runningAgentId !== agentForThread.id && (
                  <AgentEmptyRunsState />
                )}

              {agentForThread && handoffs.length > 0 && (
                <div className="flex flex-col">
                  {handoffs.length > HANDOFF_LIST_LIMIT && (
                    <RunListToggle
                      showingAll={showAllRuns}
                      hidden={handoffs.length - HANDOFF_LIST_LIMIT}
                      onToggle={() => {
                        setShowAllRuns((v) => !v);
                        setExpandedOlderIds(new Set());
                      }}
                    />
                  )}
                  {/* Oldest at top, latest at bottom — the latest handoff sits
                      next to the composer so continuing the conversation feels
                      natural. Only the latest shows by default; the rest hide
                      behind "View older" above. The older list is capped in
                      height and scrolls internally while its rows are all
                      collapsed; expanding one lifts the cap so its content
                      shows in full. The latest handoff renders below, outside
                      the cap, always at full height. */}
                  {showAllRuns && (
                    <div
                      className={
                        expandedOlderIds.size > 0
                          ? "flex flex-col"
                          : "flex max-h-[400px] flex-col overflow-y-auto overscroll-contain"
                      }
                    >
                      {handoffs
                        .slice(HANDOFF_LIST_LIMIT)
                        .reverse()
                        .map((h) => renderHandoff(h, { isLatest: false }))}
                    </div>
                  )}
                  {handoffs
                    .slice(0, HANDOFF_LIST_LIMIT)
                    .reverse()
                    .map((h) => renderHandoff(h, { isLatest: true }))}
                </div>
              )}
            </div>
          </div>
        )}
      </>

      {postedNotices.length > 0 && (
        <div className="flex flex-col gap-2 pb-3">
          {postedNotices.map((n) => (
            <IslandNoticeCard key={n.id} notice={n} onClose={() => unpostNotice(n.id)} />
          ))}
        </div>
      )}

      {/* Composer — same element across both states; layout animates the position change */}
      <motion.div layout transition={COMPOSER_TRANSITION}>
        <Composer
          value={input}
          onChange={setInput}
          onSubmit={submit}
          hasMessages={hasContent}
          mode={mode}
          onModeChange={setMode}
          chrome={chrome}
          attachments={stagedAttachments}
          onAttachFiles={attachFiles}
          onRemoveAttachment={removeStagedAttachment}
          attachmentNotice={attachmentNotice}
          onDismissAttachmentNotice={() => setAttachmentNotice(null)}
          placeholder={agentForThread ? undefined : templatePlaceholder()}
          mentionables={agents.map((a) => ({
            id: a.id,
            name: a.name,
            avatarPath: getPixabot(a.avatarSeed),
          }))}
          contextChips={(() => {
            const chips: {
              id: string;
              label: string;
              onRemove: () => void;
            }[] = [];
            if (inboxCtx && inboxScopeActive) {
              chips.push({
                id: "inbox",
                label: chrome === "drawer" ? "Team inbox" : "@inbox",
                onRemove: () => setInboxScopeActive(false),
              });
            }
            if (contactsCtx && contactsScopeActive) {
              chips.push({
                id: "contacts",
                label: chrome === "drawer" ? "Contacts" : "@contacts",
                onRemove: () => setContactsScopeActive(false),
              });
            }
            if (shopifyCtx && shopifyScopeActive) {
              chips.push({
                id: "shopify",
                label:
                  chrome === "drawer"
                    ? "Shopify Analytics"
                    : "@shopify",
                onRemove: () => setShopifyScopeActive(false),
              });
            }
            if (analyticsCtx && analyticsScopeActive) {
              chips.push({
                id: "analytics",
                label: chrome === "drawer" ? "Inbox Analytics" : "@inbox-analytics",
                onRemove: () => setAnalyticsScopeActive(false),
              });
            }
            return chips.length > 0 ? chips : undefined;
          })()}
        />
      </motion.div>

      {/* Bottom: mode pills shown only on the empty hero when no mode is set.
          Wrapped in a flex-1 spacer so it balances the top flex-1 hero block
          and centers the composer vertically. When a mode is picked, this
          block unmounts and the composer slides to the bottom. */}
      {!hasContent && mode === null && chrome !== "drawer" && (
        <div className="flex flex-col">
          <ModePillRow onSelect={setMode} />
        </div>
      )}

      {/* Daily Digest — home screen only. Lives inside the centered wrapper
          so the whole cluster (hero + composer + pills + digest) reads as
          one vertically-centered group. */}
      {isHomeScreen && !hideDailyDigest && !digestMeta.deleted && (
        <div className="pt-6" data-daily-digest>
          <DailyDigest onSelectPointer={handleDigestPointer} />
        </div>
      )}
      </div>

      {/* Edit Agent modal — opened by "View Instructions" on any card.
          Initial values come from whichever card is active. */}
      {isDailyDigestThread && !digestMeta.deleted && (
        <EditAgentDialog
          open={editDialogOpen}
          initial={{
            name: digestMeta.name,
            description: digestMeta.description,
            avatarPath: getPixabot(digestMeta.avatarSeed),
            instructions: digestMeta.instructions,
            focusNote: "",
            schedulePreset: digestMeta.schedulePreset as SchedulePreset,
            scheduleTime: digestMeta.scheduleTime,
            model: digestMeta.model,
            active: digestMeta.status === "active",
          }}
          onSave={(next: EditAgentValues) => {
            digestMeta.updateMeta({
              name: next.name,
              description: next.description,
              instructions: next.instructions,
              schedulePreset: next.schedulePreset,
              scheduleTime: next.scheduleTime,
              model: next.model,
              status: next.active ? "active" : "paused",
            });
            setEditDialogOpen(false);
          }}
          onDelete={() => {
            setEditDialogOpen(false);
            digestMeta.deleteDigest();
          }}
          onClose={() => setEditDialogOpen(false)}
        />
      )}
      {agentForThread && (
        <EditAgentDialog
          open={editDialogOpen}
          initial={{
            name: agentForThread.name,
            description: agentForThread.description ?? "",
            avatarPath: agentForThread.avatarSeed,
            instructions:
              agentForThread.instructions ??
              getDefaultInstructions(agentForThread),
            focusNote: agentForThread.focusNote ?? "",
            schedulePreset:
              agentForThread.schedule.kind === "recurring"
                ? (agentForThread.schedule.preset as SchedulePreset)
                : "daily",
            scheduleTime: "08:00",
            model: agentForThread.model ?? "gemini-2.5-flash",
            active: agentForThread.status === "active",
          }}
          // The brief is printed from the agent's schema slots — the dialog
          // shows a live preview and stores the regenerated text on save
          // (agent-schema.md §1, slot 6).
          generateBrief={(v) =>
            generateInstructions({
              agentName: v.name.trim() || agentForThread.name,
              watcherType: agentForThread.watcherType,
              customDescription: agentForThread.description,
              achievements: agentForThread.actions,
              schedule: { kind: "recurring", preset: v.schedulePreset },
              focusNote: v.focusNote,
            })
          }
          onSave={(next: EditAgentValues) => {
            updateAgent(agentForThread.id, {
              name: next.name,
              description: next.description,
              avatarSeed: next.avatarPath,
              instructions: generateInstructions({
                agentName: next.name.trim() || agentForThread.name,
                watcherType: agentForThread.watcherType,
                customDescription: agentForThread.description,
                achievements: agentForThread.actions,
                schedule: { kind: "recurring", preset: next.schedulePreset },
                focusNote: next.focusNote,
              }),
              focusNote: next.focusNote,
              schedule: { kind: "recurring", preset: next.schedulePreset },
              model: next.model,
              status: next.active ? "active" : "paused",
            });
            setEditDialogOpen(false);
          }}
          onDelete={() => {
            setEditDialogOpen(false);
            deleteAgent(agentForThread.id);
            setActiveThreadId(null);
          }}
          onClose={() => setEditDialogOpen(false)}
        />
      )}
    </div>
  );
}

function DeletedDigestPlaceholder({ onRestore }: { onRestore: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-wati-border bg-white p-4">
      <div>
        <p className="text-[14px] font-medium text-[#0a0a0a]">
          Daily Digest deleted
        </p>
        <p className="text-[12px] text-black/55">
          You won&apos;t receive a digest until it&apos;s restored.
        </p>
      </div>
      <button
        type="button"
        onClick={onRestore}
        className="rounded-full border border-wati-border bg-white px-3 py-1.5 text-[13px] tracking-[-0.078px] text-[#0a0a0a] hover:bg-black/[0.04]"
      >
        Restore agent
      </button>
    </div>
  );
}


/**
 * Only the latest run shows by default; older ones hide behind "View older".
 * Watcher-agent handoffs and Daily Digest entries share this behaviour.
 */
const HANDOFF_LIST_LIMIT = 1;
const DIGEST_LIST_LIMIT = 1;

function RunListToggle({
  showingAll,
  hidden,
  onToggle,
}: {
  showingAll: boolean;
  hidden: number;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="self-start rounded-md px-2 py-1.5 text-[12px] font-medium tracking-[-0.06px] text-black/55 transition-colors hover:bg-black/[0.03] hover:text-black/75"
    >
      {showingAll ? "Show less" : `View ${hidden} older`}
    </button>
  );
}

function chipVariantFor(action: WatiAction): "primary" | "ghost" {
  // Primary emphasis on the chips that advance the user toward an agent —
  // the recommended path. Everything else (Automations, Insights, back,
  // skip, decline) stays ghost so the offering row reads as one strong
  // suggestion alongside lower-weight alternatives.
  if (
    action.kind === "onboarding-pick-offering" &&
    action.choice === "agents"
  ) {
    return "primary";
  }
  if (action.kind === "onboarding-pick-agent") return "primary";
  if (action.kind === "onboarding-convert") return "primary";
  return "ghost";
}

function closingChipToAction(chip: ClosingChip): WatiAction {
  switch (chip.action.kind) {
    case "open-handoffs":
      return { kind: "open-handoffs", label: chip.label };
    case "open-digest":
      return { kind: "open-digest", label: chip.label };
    case "fill-composer":
      return {
        kind: "fill-composer",
        label: chip.label,
        prompt: chip.action.prompt,
      };
  }
}

