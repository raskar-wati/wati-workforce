"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, Check, ChevronDown, Play, Plus, X } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { getActionScript } from "../lib/agent-actions";
import { useAgents, type HandoffCta } from "../lib/agents";
import { useChatMode, type ChatMode } from "../lib/chat-mode";
import { useChatThreads } from "../lib/chat-threads";
import { useTenantProfile } from "../lib/tenant-signal-profile";
import { getWatcherType } from "../lib/watcher-types";
import { AgentActionRun } from "./agents/AgentActionRun";
import { AgentCreationFlow } from "./agents/AgentCreationFlow";
import { AgentSummaryCard } from "./agents/AgentSummaryCard";
import { Handoff } from "./agents/Handoff";
import { TenantAgentSuggestions } from "./agents/TenantAgentSuggestions";
import { ModePillRow } from "./ModePillRow";
import { ThinkingIndicator } from "./ThinkingIndicator";

type ModeOption = {
  id: ChatMode;
  chipLabel: string;
  title: string;
  description: string;
};

const MODE_OPTIONS: ModeOption[] = [
  {
    id: "agent",
    chipLabel: "Agent",
    title: "Create an agent",
    description: "Create a new agent, edit, or request a handoff.",
  },
  {
    id: "automation",
    chipLabel: "Automation",
    title: "Build an automation",
    description: "Run actions on triggers or a schedule.",
  },
  {
    id: "insights",
    chipLabel: "Insights",
    title: "Get insights",
    description: "Surface trends and answers from your data.",
  },
];

type ChatMessage =
  | { kind: "user-text"; id: string; content: string }
  | { kind: "agent-creation-flow"; id: string; initialMessage: string };

const HERO_PLACEHOLDERS = [
  "Create an agent",
  "Ask about your customers",
  "Ask about your agents",
  "Build an automation",
];

const CONVERSATION_PLACEHOLDER = "Write a message";

type LLMOption = {
  id: string;
  name: string;
  provider: string;
};

const LLM_OPTIONS: LLMOption[] = [
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "Google" },
  { id: "gemini-2.0-pro", name: "Gemini 2.0 Pro", provider: "Google" },
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI" },
  { id: "gpt-4o-mini", name: "GPT-4o mini", provider: "OpenAI" },
  { id: "claude-sonnet-4", name: "Claude Sonnet 4", provider: "Anthropic" },
  { id: "claude-haiku-4", name: "Claude Haiku 4", provider: "Anthropic" },
  { id: "llama-3.3-70b", name: "Llama 3.3 70B", provider: "Meta" },
];

const COMPOSER_TRANSITION = {
  type: "spring" as const,
  stiffness: 220,
  damping: 28,
  mass: 0.9,
};

export function ChatArea() {
  const [messagesByThread, setMessagesByThread] = useState<
    Record<string, ChatMessage[]>
  >({});
  const [input, setInput] = useState("");
  const { mode, setMode } = useChatMode();
  const { activeThreadId, createThread } = useChatThreads();
  const {
    getAgentsForThread,
    getHandoffs,
    addHandoff,
    getActionRuns,
    startActionRun,
  } = useAgents();
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
    if (firedCtaIds.has(cta.id)) return;
    const script = getActionScript(cta.action);
    startActionRun({
      agentId: agentForThread.id,
      handoffId,
      ctaId: cta.id,
      action: cta.action,
      runTitle: script.runTitle,
      steps: [...script.steps],
      resultLabel: script.resultLabel,
      resultDestination: script.resultDestination,
      resultCtaLabel: script.resultCtaLabel,
    });
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
      });
    }
    const tid = threadId;
    setMessagesByThread((prev) => ({
      ...prev,
      [tid]: [...(prev[tid] ?? []), ...nextMessages],
    }));
    setInput("");
    if (startsAgentFlow) setMode(null);
  };

  const runAgentAgain = () => {
    if (!agentForThread) return;
    const wt = getWatcherType(agentForThread.watcherType);
    addHandoff(agentForThread.id, wt.buildDraft());
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-[720px] flex-col px-6 pb-6">
      {/* Top: hero (with greeting or tenant suggestions inside) or messages */}
      <AnimatePresence initial={false} mode="popLayout">
        {!hasContent ? (
          <motion.div
            key="hero"
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            className="flex flex-1 flex-col justify-end pb-6"
          >
            {mode === "agent" ? (
              <TenantAgentSuggestions
                profile={tenantProfile}
                onSelect={setInput}
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

      {/* Bottom: mode pills shown only on the empty hero when no mode is set.
          Wrapped in a flex-1 spacer so it balances the top flex-1 hero block
          and centers the composer vertically. When a mode is picked, this
          block unmounts and the composer slides to the bottom. */}
      {!hasContent && mode === null && (
        <div className="flex flex-1 flex-col">
          <ModePillRow onSelect={setMode} />
        </div>
      )}
    </div>
  );
}

function Composer({
  value,
  onChange,
  onSubmit,
  hasMessages,
  mode,
  onModeChange,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  hasMessages: boolean;
  mode: ChatMode | null;
  onModeChange: (mode: ChatMode | null) => void;
}) {
  const [selectedModel, setSelectedModel] = useState<LLMOption>(LLM_OPTIONS[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [slashIndex, setSlashIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const slashOpen = !mode && value.startsWith("/");
  const slashQuery = slashOpen ? value.slice(1).trim().toLowerCase() : "";
  const filteredModes = slashOpen
    ? MODE_OPTIONS.filter(
        (o) =>
          !slashQuery ||
          o.id.includes(slashQuery) ||
          o.chipLabel.toLowerCase().includes(slashQuery) ||
          o.title.toLowerCase().includes(slashQuery),
      )
    : [];

  useEffect(() => {
    if (!slashOpen) setSlashIndex(0);
  }, [slashOpen]);

  useEffect(() => {
    if (slashIndex >= filteredModes.length) setSlashIndex(0);
  }, [filteredModes.length, slashIndex]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  const selectMode = (id: ChatMode) => {
    onModeChange(id);
    onChange("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (slashOpen && filteredModes.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSlashIndex((i) => (i + 1) % filteredModes.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSlashIndex((i) => (i - 1 + filteredModes.length) % filteredModes.length);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        selectMode(filteredModes[slashIndex].id);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        onChange("");
        return;
      }
    }
    if (e.key === "Backspace" && value === "" && mode) {
      e.preventDefault();
      onModeChange(null);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      onSubmit();
    }
  };

  const activeMode = mode ? MODE_OPTIONS.find((o) => o.id === mode) ?? null : null;

  return (
    <div className="relative flex w-full flex-col rounded-3xl bg-white pt-4 shadow-[0_8px_16px_rgba(0,0,0,0.06),0_2px_4px_rgba(0,0,0,0.04)]">
      <AnimatePresence>
        {slashOpen && filteredModes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.32, 0.72, 0, 1] }}
            className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.1)]"
          >
            <div className="flex flex-col py-1">
              {filteredModes.map((o, i) => {
                const highlighted = i === slashIndex;
                return (
                  <button
                    key={o.id}
                    type="button"
                    onMouseEnter={() => setSlashIndex(i)}
                    onClick={() => selectMode(o.id)}
                    className={`flex w-full items-center gap-3 px-3 py-2 text-left ${
                      highlighted ? "bg-black/[0.04]" : ""
                    }`}
                  >
                    <span className="text-[13px] font-medium tracking-[-0.078px] text-[#0a0a0a]">
                      {o.title}
                    </span>
                    <span className="truncate text-[12px] tracking-[-0.06px] text-black/50">
                      {o.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {activeMode && (
          <motion.div
            key={activeMode.id}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
            className="px-4 pb-2"
          >
            <ModeChip
              option={activeMode}
              onClear={() => onModeChange(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2 px-4">
        <div className="relative flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={hasMessages ? CONVERSATION_PLACEHOLDER : ""}
            autoFocus
            className="w-full bg-transparent text-[13px] tracking-[-0.078px] text-black/80 placeholder:text-black/50 focus:outline-none"
          />
          {!hasMessages && !value && !activeMode && <AnimatedPlaceholder />}
        </div>
      </div>

      <div className="flex w-full items-center justify-between px-3 pb-3 pt-2">
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-1.5 rounded-full border border-[#e5e5e5]/80 px-3 py-1.5"
          >
            <span className="text-[13px] tracking-[-0.078px] text-[#0a0a0a]">
              {selectedModel.name}
            </span>
            <motion.span
              animate={{ rotate: dropdownOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="flex"
            >
              <ChevronDown size={10} className="text-[#0a0a0a]" />
            </motion.span>
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.15, ease: [0.32, 0.72, 0, 1] }}
                className="absolute bottom-full left-0 mb-2 w-52 overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.1)]"
              >
                {(() => {
                  const grouped = LLM_OPTIONS.reduce<Record<string, LLMOption[]>>(
                    (acc, m) => {
                      (acc[m.provider] ??= []).push(m);
                      return acc;
                    },
                    {}
                  );
                  return Object.entries(grouped).map(([provider, models], gi) => (
                    <div key={provider}>
                      {gi > 0 && <div className="mx-3 border-t border-[#f0f0f0]" />}
                      <div className="px-3 pb-1 pt-2.5">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.8px] text-black/30">
                          {provider}
                        </span>
                      </div>
                      {models.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setSelectedModel(m);
                            setDropdownOpen(false);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-black/[0.03]"
                        >
                          <span className="flex-1 text-[13px] tracking-[-0.078px] text-[#0a0a0a]">
                            {m.name}
                          </span>
                          {selectedModel.id === m.id && (
                            <Check size={12} strokeWidth={2.5} className="text-[#0a0a0a]" />
                          )}
                        </button>
                      ))}
                    </div>
                  ));
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onSubmit}
            aria-label="Send message"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5"
          >
            <ArrowUp size={16} strokeWidth={2} className="text-[#0a0a0a]" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ModeChip({
  option,
  onClear,
}: {
  option: ModeOption;
  onClear: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-black/[0.06] py-1 pl-3 pr-1 text-[12px] tracking-[-0.06px] text-[#0a0a0a]">
      <span>{option.chipLabel}</span>
      <button
        type="button"
        onClick={onClear}
        aria-label={`Remove ${option.chipLabel} mode`}
        className="flex h-4 w-4 items-center justify-center rounded-full text-black/50 hover:bg-black/10 hover:text-black/80"
      >
        <X size={10} strokeWidth={2.5} />
      </button>
    </span>
  );
}

function AnimatedPlaceholder() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  const text = HERO_PLACEHOLDERS[index];

  useEffect(() => {
    const hideTimer = setTimeout(
      () => setVisible(false),
      text.length * 40 + 600 + 1800,
    );
    return () => clearTimeout(hideTimer);
  }, [index, text.length]);

  useEffect(() => {
    if (visible) return;
    const nextTimer = setTimeout(() => {
      setIndex((i) => (i + 1) % HERO_PLACEHOLDERS.length);
      setVisible(true);
    }, 350);
    return () => clearTimeout(nextTimer);
  }, [visible]);

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.span
          key={index}
          exit={{ opacity: 0, filter: "blur(4px)", transition: { duration: 0.25 } }}
          className="pointer-events-none absolute inset-0 flex items-center text-[13px] tracking-[-0.078px] text-black/40"
        >
          {text.split("").map((char, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, filter: "blur(8px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              transition={{ delay: i * 0.038, duration: 0.28, ease: "easeOut" }}
            >
              {char === " " ? " " : char}
            </motion.span>
          ))}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

