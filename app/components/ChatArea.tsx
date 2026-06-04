"use client";

import { motion } from "motion/react";
import { Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAgents, type HandoffCta, type WatcherTypeId } from "../lib/agents";
import { useChatMode } from "../lib/chat-mode";
import { useChatThreads } from "../lib/chat-threads";
import { useFireHandoffCta } from "../lib/use-fire-handoff-cta";
import { useTenantProfile } from "../lib/tenant-signal-profile";
import { getWatcherType } from "../lib/watcher-types";
import { AgentCreationFlow } from "./agents/AgentCreationFlow";
import { AgentRunningIndicator } from "./agents/AgentRunningIndicator";
import { AgentSummaryCard } from "./agents/AgentSummaryCard";
import { Handoff } from "./agents/Handoff";
import { TenantAgentSuggestions } from "./agents/TenantAgentSuggestions";
import { Composer, COMPOSER_TRANSITION } from "./Composer";
import { DailyDigest } from "./digest/DailyDigest";
import { HandoffInbox } from "./handoffs/HandoffInbox";
import { ModePillRow } from "./ModePillRow";
import { ThinkingIndicator } from "./ThinkingIndicator";

type ChatMessage =
  | { kind: "user-text"; id: string; content: string }
  | { kind: "agent-creation-flow"; id: string; initialMessage: string; watcherTypeId: WatcherTypeId };

export function ChatArea() {
  const [messagesByThread, setMessagesByThread] = useState<
    Record<string, ChatMessage[]>
  >({});
  const [input, setInput] = useState("");
  const [pendingWatcherTypeId, setPendingWatcherTypeId] = useState<WatcherTypeId | null>(null);
  // Theatre: which agent is currently "running" (mock loading state). Cleared
  // when the simulated run finishes and the handoff is appended.
  const [runningAgentId, setRunningAgentId] = useState<string | null>(null);
  const runTimerRef = useRef<number | null>(null);
  // Scroll plumbing for chat-style scaffolding: runs render oldest→newest and
  // new output appends at the bottom, so we follow the conversation downward
  // (never yanking the view back up). Driven by effects below — on thread open
  // we land at the newest run; when a run starts or finishes we follow down.
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { mode, setMode, view } = useChatMode();
  const { activeThreadId, createThread } = useChatThreads();
  const {
    getAgentsForThread,
    getHandoffs,
    addHandoff,
    getActionRuns,
    markHandoffRead,
  } = useAgents();
  const fireHandoffCta = useFireHandoffCta();
  const { profile: tenantProfile } = useTenantProfile();

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

  useEffect(() => {
    setInput("");
    // Cancel any in-flight run theatre when switching threads, so a pending
    // timer doesn't append a handoff to the wrong (now-inactive) agent.
    setRunningAgentId(null);
    if (runTimerRef.current !== null) {
      window.clearTimeout(runTimerRef.current);
      runTimerRef.current = null;
    }
    // Mode is lifted to ChatModeProvider and managed by whoever sets it
    // (slash menu, pill row, sidebar New Agent button). Don't clobber it
    // here on thread change — that would race with sidebar-driven setMode.
  }, [activeThreadId]);

  // Clear any pending run timer on unmount.
  useEffect(() => {
    return () => {
      if (runTimerRef.current !== null) {
        window.clearTimeout(runTimerRef.current);
      }
    };
  }, []);

  // When a thread with existing content opens, land on the newest run at the
  // bottom (chat-style) instead of the top. Instant, so it reads as "already
  // there" rather than a scroll.
  useEffect(() => {
    if (!activeThreadId) return;
    scrollToBottom("auto");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeThreadId]);

  // Newest handoff id — changes when a run completes and appends a result.
  const newestHandoffId = handoffs[0]?.id ?? null;

  // Follow the conversation downward whenever a run starts (indicator appears)
  // or finishes (new result appends). Runs after commit, so layout is settled;
  // skips the first pass per thread (the open effect already landed us).
  const didFollowInit = useRef(false);
  useEffect(() => {
    if (!didFollowInit.current) {
      didFollowInit.current = true;
      return;
    }
    scrollToBottom("smooth");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runningAgentId, newestHandoffId]);

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
    setMessagesByThread((prev) => ({
      ...prev,
      [tid]: [...(prev[tid] ?? []), ...nextMessages],
    }));
    setInput("");
    if (startsAgentFlow) setMode(null);
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

  const scrollToBottom = (behavior: ScrollBehavior) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  };

  const runAgentAgain = () => {
    if (!agentForThread || runningAgentId) return;
    const agent = agentForThread;
    // Theatre: show the running indicator for a beat before the result lands,
    // standing in for the real backend run. The indicator appends at the bottom
    // of the thread; the follow-effect scrolls down to it so the conversation
    // builds downward like a chat — never yanking the view back up to the top.
    setRunningAgentId(agent.id);
    runTimerRef.current = window.setTimeout(() => {
      const wt = getWatcherType(agent.watcherType);
      addHandoff(agent.id, wt.buildDraft());
      setRunningAgentId(null);
      runTimerRef.current = null;
    }, 2500);
  };

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
              <TenantAgentSuggestions
                profile={tenantProfile}
                onSelect={(prompt, watcherTypeId) => {
                  setInput(prompt);
                  setPendingWatcherTypeId(watcherTypeId);
                }}
              />
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
            ref={scrollRef}
            key="messages"
            className="flex flex-1 flex-col overflow-y-auto pb-6"
          >
            <div className="flex flex-col gap-4">
              {agentForThread && (
                // Sticky header: keeps the agent identity + "Run again" in reach
                // while runs scroll beneath it, so you never lose the control
                // after the conversation grows downward.
                <div className="sticky top-0 z-10 bg-white pt-12 pb-3">
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
                        disabled={runningAgentId === agentForThread.id}
                        className="flex items-center gap-1.5 rounded-full bg-[#0a0a0a] px-3 py-1.5 text-[13px] tracking-[-0.078px] text-white hover:bg-[#0a0a0a]/90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Play size={12} strokeWidth={2} />
                        Run again
                      </button>
                    }
                  />
                </div>
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

              {agentForThread &&
                (handoffs.length > 0 ||
                  runningAgentId === agentForThread.id) && (
                <div className="flex flex-col gap-3 pt-2">
                  {/* Oldest → newest, so new runs append at the bottom and the
                      view follows downward like a chat transcript. Newest run
                      starts expanded; older runs collapse. */}
                  {[...handoffs].reverse().map((h, i, arr) => (
                    <Handoff
                      key={h.id}
                      handoff={h}
                      agentName={agentForThread.name}
                      defaultExpanded={i === arr.length - 1}
                      firedCtaIds={firedCtaIds}
                      actionRuns={runsByHandoff[h.id] ?? []}
                      onFireCta={(cta) => fireCta(h.id, cta)}
                      onExpand={() => markHandoffRead(h.id)}
                    />
                  ))}
                  {runningAgentId === agentForThread.id && (
                    <AgentRunningIndicator
                      agentName={agentForThread.name}
                      avatarPath={agentForThread.avatarSeed}
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
        />
      </motion.div>

      {/* Bottom: mode pills shown only on the empty hero when no mode is set.
          Wrapped in a flex-1 spacer so it balances the top flex-1 hero block
          and centers the composer vertically. When a mode is picked, this
          block unmounts and the composer slides to the bottom. */}
      {!hasContent && mode === null && (
        <div className="flex flex-col">
          <ModePillRow onSelect={setMode} />
        </div>
      )}

      {/* Daily Digest — home screen only. Lives inside the centered wrapper
          so the whole cluster (hero + composer + pills + digest) reads as
          one vertically-centered group. */}
      {isHomeScreen && (
        <div className="pt-6">
          <DailyDigest onSelectPointer={handleDigestPointer} />
        </div>
      )}
      </div>
    </div>
  );
}
