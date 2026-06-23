"use client";

import { motion } from "motion/react";
import { Loader2, Play } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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
import { getWatcherType } from "../lib/watcher-types";
import { AgentActionRun } from "./agents/AgentActionRun";
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
import { getPixabot, pixabotGifFromPath } from "../lib/pixabots";
import { Composer, COMPOSER_TRANSITION } from "./Composer";
import { DailyDigest } from "./digest/DailyDigest";
import { InboxAskWatiSuggestions } from "./agents/InboxAskWatiSuggestions";
import { useInboxContext } from "../lib/inbox-context";
import { useContactsContext } from "../lib/contacts-context";
import { useAskWatiDrawer } from "../lib/ask-wati-drawer";
import { HandoffInbox } from "./handoffs/HandoffInbox";
import { ModePillRow } from "./ModePillRow";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { WatiWelcome } from "./WatiWelcome";
import { OnboardingHandoffPreview } from "./onboarding/OnboardingHandoffPreview";
import { WatiMessage, type WatiChip } from "./onboarding/WatiMessage";

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
  | { kind: "fill-composer"; label: string; prompt: string };

type ChatMessage =
  | { kind: "user-text"; id: string; content: string }
  | {
      kind: "agent-creation-flow";
      id: string;
      initialMessage: string;
      watcherTypeId: WatcherTypeId;
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
  | { kind: "ai-response"; id: string; content: string; streaming: boolean }
  | { kind: "daily-digest"; id: string };

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
  const { mode, setMode, view, setView } = useChatMode();
  const { pendingAction, clearAction } = useAskWatiDrawer();

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
    updateAgent,
    deleteAgent,
    setAgentStatus,
  } = useAgents();
  const fireHandoffCta = useFireHandoffCta();
  const { profile: tenantProfile } = useTenantProfile();
  const inboxCtx = useInboxContext();
  const contactsCtx = useContactsContext();
  const [inboxScopeActive, setInboxScopeActive] = useState(Boolean(inboxCtx));
  const [contactsScopeActive, setContactsScopeActive] = useState(
    Boolean(contactsCtx),
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

  const fireCta = (handoffId: string, cta: HandoffCta) => {
    if (!agentForThread) return;
    fireHandoffCta(agentForThread.id, handoffId, cta);
  };

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

  // Truncate the run list (handoffs / digest entries) to RUN_LIST_LIMIT
  // by default; user toggles to show all. Resets on thread change so each
  // agent's collapse state is independent.
  const [showAllRuns, setShowAllRuns] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [runningAgentId, setRunningAgentId] = useState<string | null>(null);
  const digestMeta = useDailyDigestMeta();

  useEffect(() => {
    setInput("");
    setShowAllRuns(false);
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

  const sendPrompt = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    let threadId = activeThreadId;
    if (!threadId) {
      threadId = createThread(trimmed);
    }
    const userMsg: ChatMessage = {
      kind: "user-text",
      id: crypto.randomUUID(),
      content: trimmed,
    };
    const startsAgentFlow = mode === "agent" && !agentForThread;
    const thinkingId = crypto.randomUUID();
    const nextMessages: ChatMessage[] = [userMsg];
    if (startsAgentFlow) {
      nextMessages.push({
        kind: "agent-creation-flow",
        id: crypto.randomUUID(),
        initialMessage: trimmed,
        watcherTypeId: pendingWatcherTypeId ?? "custom",
      });
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
      streamAssistantReply(tid, thinkingId, trimmed);
    }
    return tid;
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
        let acc = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (!value) continue;
          acc += value;
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
                        content: acc,
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
                  ? { ...m, content: acc }
                  : m,
              ),
            };
          });
        }
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
        setMessagesByThread((prev) => {
          const list = prev[threadId];
          if (!list) return prev;
          return {
            ...prev,
            [threadId]: list.map((m) =>
              m.kind === "ai-thinking" && m.id === thinkingId
                ? {
                    kind: "ai-response",
                    id: responseId,
                    content:
                      "Something went wrong reaching the model. Try again in a moment.",
                    streaming: false,
                  }
                : m,
            ),
          };
        });
      }
    },
    [messagesByThread],
  );

  const submit = () => {
    const text = input.trim();
    if (!text) return;
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
      }
    },
    [
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

  // Handoff inbox is a parallel top-level surface — render it instead of the
  // chat column when the user has navigated there from the sidebar.
  if (view === "handoffs") {
    return <HandoffInbox />;
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
                <div className="-ml-3">
                  <ThinkingIndicator />
                </div>
                <h2 className="text-[20px] font-semibold tracking-[-0.4px] text-[#0a0a0a]">
                  How can I help you?
                </h2>
                <div className="flex flex-col items-start gap-2">
                  {getStarterPrompts({
                    hasInboxContext: Boolean(inboxCtx),
                    hasContactsContext: Boolean(contactsCtx),
                  }).map((prompt) => (
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
            className="flex flex-1 flex-col overflow-y-auto pt-12 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                  <div className="flex flex-col">
                    {(showAllRuns
                      ? DAILY_DIGEST_ENTRIES
                      : DAILY_DIGEST_ENTRIES.slice(0, RUN_LIST_LIMIT)
                    ).map((entry, i) => (
                      <div key={entry.id} className="flex flex-col py-1">
                        <DailyDigestEntry
                          entry={entry}
                          defaultExpanded={i === 0}
                          onViewAgent={(agentName) => {
                            const match = agents.find(
                              (a) =>
                                a.name.toLowerCase() === agentName.toLowerCase(),
                            );
                            if (match) setActiveThreadId(match.threadId);
                          }}
                        />
                      </div>
                    ))}
                    {DAILY_DIGEST_ENTRIES.length > RUN_LIST_LIMIT && (
                      <RunListToggle
                        showingAll={showAllRuns}
                        total={DAILY_DIGEST_ENTRIES.length}
                        onToggle={() => setShowAllRuns((v) => !v)}
                      />
                    )}
                  </div>
                </>
              )}
              {agentForThread && (
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
                          className="animate-spin text-emerald-400"
                        />
                        Running
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={runAgentAgain}
                        className="flex items-center gap-1.5 rounded-full bg-[#0a0a0a] px-3 py-1.5 text-[13px] tracking-[-0.078px] text-white hover:bg-[#0a0a0a]/90"
                      >
                        <Play size={12} strokeWidth={2} />
                        Run now
                      </button>
                    )
                  }
                />
              )}

              {/* On an agent thread the chat surface shows the agent card,
                  empty-state / run theatre, and handoffs only. The original
                  user prompt that started the agent (and any chat messages)
                  add no value here — the agent's context lives in Edit Agent. */}
              {(agentForThread ? [] : messages).map((m) => {
                if (m.kind === "user-text") {
                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                      className="flex justify-end"
                    >
                      <div className="max-w-[80%] rounded-2xl bg-black/[0.04] px-4 py-2.5 text-[14px] leading-[20px] text-black/80">
                        {m.content}
                      </div>
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
                      <div className="max-w-[88%] whitespace-pre-wrap text-[14px] leading-[21px] text-black/80">
                        {m.content}
                        {m.streaming && (
                          <span
                            aria-hidden="true"
                            className="ml-0.5 inline-block h-[14px] w-[7px] translate-y-[2px] animate-pulse bg-black/40"
                            style={{ verticalAlign: "baseline" }}
                          />
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
                  {(showAllRuns
                    ? handoffs
                    : handoffs.slice(0, RUN_LIST_LIMIT)
                  ).map((h, i) => {
                    const runs = runsByHandoff[h.id] ?? [];
                    return (
                      <div key={h.id} className="flex flex-col py-1">
                        <Handoff
                          handoff={h}
                          agentName={agentForThread.name}
                          defaultExpanded={i === 0}
                          firedCtaIds={firedCtaIds}
                          onFireCta={(cta) => fireCta(h.id, cta)}
                          onExpand={() => markHandoffRead(h.id)}
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
                  })}
                  {handoffs.length > RUN_LIST_LIMIT && (
                    <RunListToggle
                      showingAll={showAllRuns}
                      total={handoffs.length}
                      onToggle={() => setShowAllRuns((v) => !v)}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </>

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
            schedulePreset:
              agentForThread.schedule.kind === "recurring"
                ? (agentForThread.schedule.preset as SchedulePreset)
                : "daily",
            scheduleTime: "08:00",
            model: agentForThread.model ?? "gemini-2.5-flash",
            active: agentForThread.status === "active",
          }}
          onSave={(next: EditAgentValues) => {
            updateAgent(agentForThread.id, {
              name: next.name,
              description: next.description,
              avatarSeed: next.avatarPath,
              instructions: next.instructions,
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
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-[#e5e5e5] bg-white p-4">
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
        className="rounded-full border border-[#e5e5e5] bg-white px-3 py-1.5 text-[13px] tracking-[-0.078px] text-[#0a0a0a] hover:bg-black/[0.04]"
      >
        Restore agent
      </button>
    </div>
  );
}

function getStarterPrompts({
  hasInboxContext,
  hasContactsContext,
}: {
  hasInboxContext: boolean;
  hasContactsContext: boolean;
}): string[] {
  if (hasContactsContext) {
    return [
      "Find my top spenders this month",
      "Which contacts haven't been messaged in 30 days?",
      "What can you do?",
    ];
  }
  if (hasInboxContext) {
    return [
      "Summarize my inbox queue",
      "Which conversations need a response now?",
      "What can you do?",
    ];
  }
  return [
    "Find customers ready to book",
    "Show me delivery complaints today",
    "What can you do?",
  ];
}

/** How many handoffs / digest entries to show before requiring "view more". */
const RUN_LIST_LIMIT = 3;

function RunListToggle({
  showingAll,
  total,
  onToggle,
}: {
  showingAll: boolean;
  total: number;
  onToggle: () => void;
}) {
  const hidden = total - RUN_LIST_LIMIT;
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

