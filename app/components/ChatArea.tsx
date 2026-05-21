"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, Check, ChevronDown, Plus } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useChatThreads } from "../lib/chat-threads";
import { getPixabot } from "../lib/pixabots";
import { ThinkingIndicator } from "./ThinkingIndicator";

type ChatMessage = {
  id: string;
  role: "user";
  content: string;
};

type Suggestion = {
  title: string;
  description: string;
};

const SUGGESTIONS: Suggestion[] = [
  {
    title: "Drop off risk",
    description: "Helps filter customers who are on the risk of drop off.",
  },
  {
    title: "Escalated",
    description: "Find all customers that require immediate attention.",
  },
  {
    title: "Demand spike",
    description: "Get alerts whenever there is a surge in demand.",
  },
  {
    title: "Flag Spam Chats",
    description: "Flag conversations that are spam and block them.",
  },
];

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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const { activeThreadId, createThread } = useChatThreads();

  const hasMessages = messages.length > 0;

  useEffect(() => {
    if (activeThreadId === null) {
      setMessages([]);
      setInput("");
    }
  }, [activeThreadId]);

  const submit = () => {
    const text = input.trim();
    if (!text) return;
    if (messages.length === 0) createThread(text);
    const id = crypto.randomUUID();
    setMessages((prev) => [...prev, { id, role: "user", content: text }]);
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-[720px] flex-col px-6 pb-6">
      {/* Top: hero (state A) or messages (state B) */}
      <AnimatePresence initial={false} mode="popLayout">
        {!hasMessages ? (
          <motion.div
            key="hero"
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            className="flex flex-1 flex-col justify-end pb-6"
          >
            <div className="flex justify-center">
              <ThinkingIndicator />
            </div>
            <div className="pt-3">
              <p className="text-center text-[16px] font-medium tracking-[-0.32px] text-black/70">
                How may I be of service?
              </p>
            </div>
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
            <div className="flex flex-col gap-3">
              {messages.map((m) => (
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
              ))}
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
          onKeyDown={handleKeyDown}
          hasMessages={hasMessages}
        />
      </motion.div>

      {/* Bottom: suggestions (state A only) */}
      <AnimatePresence initial={false}>
        {!hasMessages && (
          <motion.div
            key="suggestions"
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            className="flex-1 pt-6"
          >
            <SuggestedAgents />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Composer({
  value,
  onChange,
  onSubmit,
  onKeyDown,
  hasMessages,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  hasMessages: boolean;
}) {
  const [selectedModel, setSelectedModel] = useState<LLMOption>(LLM_OPTIONS[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="flex w-full flex-col rounded-3xl bg-white pt-4 shadow-[0_8px_16px_rgba(0,0,0,0.06),0_2px_4px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-2 px-4">
        <div className="relative flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={hasMessages ? CONVERSATION_PLACEHOLDER : ""}
            autoFocus
            className="w-full bg-transparent text-[13px] tracking-[-0.078px] text-black/80 placeholder:text-black/50 focus:outline-none"
          />
          {!hasMessages && !value && <AnimatedPlaceholder />}
        </div>
      </div>

      <div className="flex w-full items-center justify-between px-3 pb-3 pt-2">
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-1.5 rounded-full border border-[#e5e5e5]/80 px-3 py-1.5"
          >
            <Plus size={12} strokeWidth={2.5} className="text-[#0a0a0a]" />
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

function SuggestedAgents() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <p className="flex-1 text-sm text-[var(--wati-text-body)]">
          Suggested Agents
        </p>
        <ChevronDown
          size={20}
          strokeWidth={1.75}
          className="text-[var(--wati-icon-default)]"
        />
      </div>

      <div className="grid grid-cols-4 gap-3">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.title}
            type="button"
            className="flex flex-col items-start gap-2 rounded-[10px] border border-[#e5e5e5] bg-white p-4 text-left"
          >
            <Image
              src={getPixabot(s.title)}
              alt=""
              width={24}
              height={24}
              aria-hidden
            />
            <span className="text-[12px] font-medium leading-[16.5px] text-[#0a0a0a]">
              {s.title}
            </span>
            <span className="text-[12px] leading-[16.5px] text-[#737373]">
              {s.description}
            </span>
          </button>
        ))}
      </div>

      <button
        type="button"
        className="flex w-full items-center justify-center gap-1 rounded-full px-4 py-1.5"
      >
        <span className="text-sm font-medium text-[#505451]">Show more</span>
        <ChevronDown size={16} strokeWidth={2} className="text-[#505451]" />
      </button>
    </div>
  );
}
