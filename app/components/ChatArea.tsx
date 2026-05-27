"use client";

import { AnimatePresence, motion } from "motion/react";
import { Play } from "lucide-react";
import { useEffect, useState } from "react";
import { useAgents, type HandoffCta, type WatcherTypeId } from "../lib/agents";
import { useChatMode } from "../lib/chat-mode";
import { useChatThreads } from "../lib/chat-threads";
import { useFireHandoffCta } from "../lib/use-fire-handoff-cta";
import { useTenantProfile } from "../lib/tenant-signal-profile";
import { getWatcherType } from "../lib/watcher-types";
import { AgentActionRun } from "./agents/AgentActionRun";
import { AgentCreationFlow } from "./agents/AgentCreationFlow";
import { AgentSummaryCard } from "./agents/AgentSummaryCard";
import { Handoff } from "./agents/Handoff";
import { TenantAgentSuggestions } from "./agents/TenantAgentSuggestions";
import { Composer, COMPOSER_TRANSITION } from "./Composer";
import { DailyDigest } from "./digest/DailyDigest";
import { HandoffInbox } from "./handoffs/HandoffInbox";
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
    // Mode is lifted to ChatModeProvider and managed by whoever sets it
    // (slash menu, pill row, sidebar New Agent button). Don't clobber it
    // here on thread change — that would race with sidebar-driven setMode.
  }, [activeThreadId]);

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

  const runAgentAgain = () => {
    if (!agentForThread) return;
    const wt = getWatcherType(agentForThread.watcherType);
    addHandoff(agentForThread.id, wt.buildDraft());
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
      <AnimatePresence initial={false} mode="popLayout">
        {!hasContent ? (
          <motion.div
            key="hero"
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
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
          </motion.div>
        ) : (
          <motion.div
            key="messages"
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              transition: { duration: 0.35, delay: 0.25 },
            }}
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
          </motion.div>
        )}
      </AnimatePresence>

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
