"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, Check, ChevronDown, Plus, X } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { ChatMode } from "../lib/chat-mode";

export type ModeOption = {
  id: ChatMode;
  chipLabel: string;
  title: string;
  description: string;
};

export const MODE_OPTIONS: ModeOption[] = [
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

export const COMPOSER_TRANSITION = {
  type: "spring" as const,
  stiffness: 220,
  damping: 28,
  mass: 0.9,
};

export type ComposerContextChip = {
  id: string;
  label: string;
  onRemove: () => void;
};

export function Composer({
  value,
  onChange,
  onSubmit,
  hasMessages,
  mode,
  onModeChange,
  contextChips,
  chrome,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  hasMessages: boolean;
  mode: ChatMode | null;
  onModeChange: (mode: ChatMode | null) => void;
  /** Optional scope chips rendered alongside the mode chip (e.g. "@inbox"). */
  contextChips?: ComposerContextChip[];
  /** "drawer" restyles the model selector minimally (no pill background)
   *  and right-aligns the bottom row (model + send only). */
  chrome?: "drawer";
}) {
  const [selectedModel, setSelectedModel] = useState<LLMOption>(LLM_OPTIONS[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [slashIndex, setSlashIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow the textarea up to its max-height. Resets to single line when
  // empty so the composer collapses back to its compact size.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

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
    if (!plusMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target as Node)) {
        setPlusMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [plusMenuOpen]);

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

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const activeMode = mode ? MODE_OPTIONS.find((o) => o.id === mode) ?? null : null;
  // Drawer mode: surface context chips as a separate card that sits
  // BEHIND the composer with a 19px overlap (stacked-papers / Gemini
  // pattern). Mode chips stay in their original middle row.
  const drawerTopChips = chrome === "drawer" ? contextChips ?? [] : [];
  const hasDrawerTopChips = drawerTopChips.length > 0;
  const middleRowChips = chrome === "drawer" ? undefined : contextChips;

  return (
    <>
      {hasDrawerTopChips &&
        drawerTopChips.map((chip) => (
          <div
            key={chip.id}
            className="relative w-full rounded-tl-2xl rounded-tr-2xl border border-[var(--wati-border-default)] bg-[var(--wati-surface-subtle)] shadow-[0_8px_8px_rgba(0,0,0,0.06),0_2px_2px_rgba(0,0,0,0.04)]"
            style={{ marginBottom: -19 }}
          >
            <div className="flex items-center justify-between px-[13px] pt-[9px] pb-[22px]">
              <span className="text-[12px] leading-[18px] tracking-[-0.06px] text-[var(--wati-text-body)]">
                {chip.label}
              </span>
              <button
                type="button"
                onClick={chip.onRemove}
                aria-label={`Dismiss ${chip.label}`}
                className="flex h-4 w-4 items-center justify-center rounded-full text-black/40 hover:bg-black/5 hover:text-black/70"
              >
                <X size={10} strokeWidth={2} />
              </button>
            </div>
          </div>
        ))}
    <div className="relative flex w-full flex-col rounded-3xl border border-[var(--wati-border-default)] bg-white pt-4 shadow-[0_8px_16px_rgba(0,0,0,0.06),0_2px_4px_rgba(0,0,0,0.04)]">
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
        {(activeMode || (middleRowChips && middleRowChips.length > 0)) && (
          <motion.div
            key="composer-chips"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
            className="flex flex-wrap items-center gap-1.5 px-4 pb-2"
          >
            {activeMode && (
              <ModeChip option={activeMode} onClear={() => onModeChange(null)} />
            )}
            {middleRowChips?.map((chip) => (
              <ContextChip key={chip.id} label={chip.label} onClear={chip.onRemove} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-start gap-2 px-4">
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={
              hasMessages
                ? CONVERSATION_PLACEHOLDER
                : chrome === "drawer"
                  ? hasDrawerTopChips
                    ? "Ask about your inbox"
                    : "Ask Wati anything"
                  : ""
            }
            autoFocus
            className="block max-h-40 w-full resize-none overflow-y-auto bg-transparent text-[13px] leading-[20px] tracking-[-0.078px] text-black/80 placeholder:text-black/50 focus:outline-none"
          />
          {!hasMessages && !value && !activeMode && chrome !== "drawer" && (
            <AnimatedPlaceholder />
          )}
        </div>
      </div>

      <div className="flex w-full items-center justify-between px-3 pb-3 pt-2">
        {/* Left cluster: drawer mode shows a [+] mode picker (Agent /
            Automation / Insights). Default chrome puts the model dropdown
            here instead. */}
        {chrome === "drawer" ? (
          <div ref={plusMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setPlusMenuOpen((o) => !o)}
              aria-label="Pick a mode"
              aria-haspopup="menu"
              aria-expanded={plusMenuOpen}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e5e5e5]/80 text-[#0a0a0a] hover:bg-black/[0.04]"
            >
              <Plus size={16} strokeWidth={2} />
            </button>
            <AnimatePresence>
              {plusMenuOpen && (
                <motion.div
                  role="menu"
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.15, ease: [0.32, 0.72, 0, 1] }}
                  className="absolute bottom-full left-0 mb-2 w-56 overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.1)]"
                >
                  {MODE_OPTIONS.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setPlusMenuOpen(false);
                        selectMode(o.id);
                      }}
                      className="flex w-full flex-col gap-0.5 px-3 py-2 text-left hover:bg-black/[0.03]"
                    >
                      <span className="text-[13px] font-medium tracking-[-0.078px] text-[#0a0a0a]">
                        {o.title}
                      </span>
                      <span className="text-[11px] tracking-[-0.055px] text-black/50">
                        {o.description}
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <ModelDropdown
            dropdownRef={dropdownRef}
            dropdownOpen={dropdownOpen}
            setDropdownOpen={setDropdownOpen}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            chrome={chrome}
          />
        )}

        {/* Right cluster: in drawer mode the model dropdown moves here
            next to the send button (matches the Gemini reference). */}
        <div className="flex items-center gap-1.5">
          {chrome === "drawer" && (
            <ModelDropdown
              dropdownRef={dropdownRef}
              dropdownOpen={dropdownOpen}
              setDropdownOpen={setDropdownOpen}
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
              chrome={chrome}
            />
          )}
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
    </>
  );
}

function ModelDropdown({
  dropdownRef,
  dropdownOpen,
  setDropdownOpen,
  selectedModel,
  setSelectedModel,
  chrome,
}: {
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  dropdownOpen: boolean;
  setDropdownOpen: (updater: (o: boolean) => boolean) => void;
  selectedModel: LLMOption;
  setSelectedModel: (m: LLMOption) => void;
  chrome?: "drawer";
}) {
  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setDropdownOpen((o) => !o)}
        className={
          chrome === "drawer"
            ? "flex items-center gap-1 rounded-md px-2 py-1 text-black/55 hover:bg-black/[0.04] hover:text-black/80"
            : "flex items-center gap-1.5 rounded-full border border-[#e5e5e5]/80 px-3 py-1.5"
        }
      >
        <span
          className={
            chrome === "drawer"
              ? "text-[12px] tracking-[-0.06px]"
              : "text-[13px] tracking-[-0.078px] text-[#0a0a0a]"
          }
        >
          {chrome === "drawer" ? shortModelName(selectedModel) : selectedModel.name}
        </span>
        <motion.span
          animate={{ rotate: dropdownOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex"
        >
          <ChevronDown
            size={10}
            className={chrome === "drawer" ? "text-current" : "text-[#0a0a0a]"}
          />
        </motion.span>
      </button>

      <AnimatePresence>
        {dropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: [0.32, 0.72, 0, 1] }}
            className={
              chrome === "drawer"
                ? "absolute bottom-full right-0 mb-2 w-52 overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.1)]"
                : "absolute bottom-full left-0 mb-2 w-52 overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.1)]"
            }
          >
            {(() => {
              const grouped = LLM_OPTIONS.reduce<Record<string, LLMOption[]>>(
                (acc, m) => {
                  (acc[m.provider] ??= []).push(m);
                  return acc;
                },
                {},
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
                        setDropdownOpen(() => false);
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
  );
}

function shortModelName(m: LLMOption): string {
  // Drawer mode shows a more compact label — strip the provider/family
  // prefix so "Gemini 2.5 Flash" becomes "Flash", matching the Gemini ref.
  const parts = m.name.split(" ");
  return parts[parts.length - 1] ?? m.name;
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

function ContextChip({
  label,
  onClear,
}: {
  label: string;
  onClear: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#EFF8FF] py-1 pl-3 pr-1 text-[12px] tracking-[-0.06px] text-[#1570EF]">
      <span>{label}</span>
      <button
        type="button"
        onClick={onClear}
        aria-label={`Remove ${label} scope`}
        className="flex h-4 w-4 items-center justify-center rounded-full text-[#1570EF]/60 hover:bg-[#1570EF]/10 hover:text-[#1570EF]"
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
