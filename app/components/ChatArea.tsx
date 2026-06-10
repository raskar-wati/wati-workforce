"use client";

import { motion } from "motion/react";
import { Play } from "lucide-react";
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
import { AgentCreationFlow } from "./agents/AgentCreationFlow";
import { AgentSummaryCard } from "./agents/AgentSummaryCard";
import { Handoff } from "./agents/Handoff";
import { TenantAgentSuggestions } from "./agents/TenantAgentSuggestions";
import { Composer, COMPOSER_TRANSITION } from "./Composer";
import { DailyDigest } from "./digest/DailyDigest";
import { InboxAskWatiSuggestions } from "./agents/InboxAskWatiSuggestions";
import { useInboxContext } from "../lib/inbox-context";
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
  const [input, setInput] = useState("");
  const [pendingWatcherTypeId, setPendingWatcherTypeId] =
    useState<WatcherTypeId | null>(null);
  const { mode, setMode, view, setView } = useChatMode();
  const {
    threads,
    activeThreadId,
    setActiveThreadId,
    createThread,
    hydrated: threadsHydrated,
  } = useChatThreads();
  const {
    getAgentsForThread,
    getHandoffs,
    addHandoff,
    getActionRuns,
    markHandoffRead,
  } = useAgents();
  const fireHandoffCta = useFireHandoffCta();
  const { profile: tenantProfile } = useTenantProfile();
  const inboxCtx = useInboxContext();
  const [inboxScopeActive, setInboxScopeActive] = useState(Boolean(inboxCtx));
  const { mode: demoMode, hydrated: demoHydrated } = useDemoState();
  const { seen: onboardingSeen, hydrated: onboardingHydrated, markSeen } =
    useOnboardingSeen();

  // Onboarding orchestration state. Lives in ChatArea so it can drive the
  // message timeline, but the thread itself is just a normal thread — we
  // remember its id so post-agent-creation we know to fire the closing
  // message.
  const [onboardingThreadId, setOnboardingThreadId] = useState<string | null>(
    null,
  );
  const [onboardingClosingPosted, setOnboardingClosingPosted] = useState(false);

  const messages = activeThreadId
    ? messagesByThread[activeThreadId] ?? []
    : [];
  const agentForThread = activeThreadId
    ? getAgentsForThread(activeThreadId)[0] ?? null
    : null;
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
  const hasContent = hasMessages || agentForThread !== null;

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

  useEffect(() => {
    setInput("");
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

  const submit = () => {
    const text = input.trim();
    if (!text) return;
    let threadId = activeThreadId;
    if (!threadId) {
      threadId = createThread(text);
    }
    const userMsg: ChatMessage = {
      kind: "user-text",
      id: crypto.randomUUID(),
      content: text,
    };
    const startsAgentFlow = mode === "agent" && !agentForThread;
    const nextMessages: ChatMessage[] = [userMsg];
    if (startsAgentFlow) {
      nextMessages.push({
        kind: "agent-creation-flow",
        id: crypto.randomUUID(),
        initialMessage: text,
        watcherTypeId: pendingWatcherTypeId ?? "custom",
      });
    }
    setPendingWatcherTypeId(null);
    const tid = threadId;
    appendMessages(tid, nextMessages);
    setInput("");
    if (startsAgentFlow) setMode(null);

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
    const wt = getWatcherType(agentForThread.watcherType);
    addHandoff(agentForThread.id, wt.buildDraft());
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
      className={`mx-auto flex w-full max-w-[720px] flex-col px-6 pb-6 ${
        isHomeScreen ? "h-full overflow-y-auto" : "h-full"
      }`}
    >
      <div
        className={
          isHomeScreen
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
              inboxCtx ? (
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
              <div className="flex flex-col items-start gap-5 px-1">
                <h2 className="text-[26px] font-semibold tracking-[-0.6px] text-[#0a0a0a]">
                  How can I help you?
                </h2>
                <div className="flex flex-col items-start gap-2">
                  {getStarterPrompts(Boolean(inboxCtx)).map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => setInput(prompt)}
                      className="rounded-full bg-black/[0.04] px-3.5 py-1.5 text-[13px] tracking-[-0.078px] text-[#0a0a0a] transition-colors hover:bg-black/[0.07]"
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
            className="flex flex-1 flex-col overflow-y-auto pt-12 pb-6"
          >
            <div className="flex flex-col gap-4">
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
                  actions={
                    <button
                      type="button"
                      onClick={runAgentAgain}
                      className="flex items-center gap-1.5 rounded-full bg-[#0a0a0a] px-3 py-1.5 text-[13px] tracking-[-0.078px] text-white hover:bg-[#0a0a0a]/90"
                    >
                      <Play size={12} strokeWidth={2} />
                      Run again
                    </button>
                  }
                />
              )}

              {messages.map((m) => {
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

              {agentForThread && handoffs.length > 0 && (
                <div className="flex flex-col gap-3 pt-2">
                  {handoffs.map((h, i) => {
                    const runs = runsByHandoff[h.id] ?? [];
                    return (
                      <div key={h.id} className="flex flex-col gap-2">
                        <Handoff
                          handoff={h}
                          agentName={agentForThread.name}
                          defaultExpanded={i === 0}
                          firedCtaIds={firedCtaIds}
                          onFireCta={(cta) => fireCta(h.id, cta)}
                          onExpand={() => markHandoffRead(h.id)}
                        />
                        {runs.map((r) => (
                          <AgentActionRun key={r.id} run={r} />
                        ))}
                      </div>
                    );
                  })}
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
          onCreateAgentClick={() => setMode("agent")}
          contextChips={
            inboxCtx && inboxScopeActive
              ? [
                  {
                    id: "inbox",
                    label: chrome === "drawer" ? "Team inbox" : "@inbox",
                    onRemove: () => setInboxScopeActive(false),
                  },
                ]
              : undefined
          }
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
      {isHomeScreen && !hideDailyDigest && (
        <div className="pt-6" data-daily-digest>
          <DailyDigest onSelectPointer={handleDigestPointer} />
        </div>
      )}
      </div>
    </div>
  );
}

function getStarterPrompts(hasInboxContext: boolean): string[] {
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

