"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { PanelRight } from "lucide-react";
import { useAskWatiDrawer } from "../lib/ask-wati-drawer";
import { AskWatiIcon } from "./icons/AskWatiIcon";

/**
 * Header entry point for Ask Wati. At rest it's a pill; the Wati AI mark and
 * the panel button open the side drawer, and a click anywhere else on the
 * pill expands it in place into an input with suggested asks. Whatever is
 * asked opens the drawer with that prompt already sent.
 */

const SUGGESTIONS = [
  "List potential spam messages",
  "Summarize today's conversations",
  "Draft replies for waiting chats",
  "Re-engage with expired chats",
];

const PLACEHOLDER = "Draft replies for waiting chats";

export function AskWatiBar() {
  const { open: drawerOpen, toggle, openDrawer, askPrompt } = useAskWatiDrawer();
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!expanded) return;
    inputRef.current?.focus();
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [expanded]);

  const ask = (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    askPrompt(trimmed);
    setText("");
    setExpanded(false);
  };

  const openSideDrawer = () => {
    setExpanded(false);
    openDrawer();
  };

  const brand = (
    <button
      type="button"
      onClick={openSideDrawer}
      aria-label="Open Ask Wati"
      className="flex shrink-0 items-center gap-1.5 rounded-full text-sm font-semibold text-[var(--wati-green)]"
    >
      <AskWatiIcon size={16} />
      Wati AI
    </button>
  );

  const panelButton = (
    <button
      type="button"
      onClick={() => {
        setExpanded(false);
        toggle();
      }}
      aria-label={drawerOpen ? "Close Ask Wati panel" : "Open Ask Wati panel"}
      aria-pressed={drawerOpen}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--wati-icon-default)] hover:bg-[var(--wati-surface-emphasis)]"
    >
      <PanelRight size={16} strokeWidth={1.75} />
    </button>
  );

  const divider = <span aria-hidden="true" className="h-4 w-px shrink-0 bg-[var(--wati-border-default)]" />;

  return (
    <div ref={rootRef} className="relative h-[34px] w-full max-w-[600px]">
      {/* Resting pill — always laid out so the header never shifts. */}
      <div
        role="button"
        tabIndex={expanded ? -1 : 0}
        aria-label="Ask Wati AI"
        aria-expanded={expanded}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("button")) return;
          setExpanded(true);
        }}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded(true);
          }
        }}
        className="flex h-full w-full cursor-text items-center gap-2.5 rounded-full border border-[var(--wati-border-default)] bg-white pl-3.5 pr-1.5 shadow-[0_1px_2px_rgba(27,29,28,0.04)] transition-colors hover:border-[var(--wati-border-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--wati-green)]"
      >
        {brand}
        {divider}
        <span className="min-w-0 flex-1 truncate text-sm text-[#b7b9b7]">{PLACEHOLDER}</span>
        {panelButton}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.99 }}
            transition={{ duration: 0.16, ease: [0.3, 0, 0, 1] }}
            onKeyDown={(e) => {
              if (e.key === "Escape") setExpanded(false);
            }}
            className="absolute inset-x-0 top-0 z-50 origin-top rounded-[17px] border border-[var(--wati-green)] bg-white shadow-lg"
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                ask(text);
              }}
              className="flex h-[32px] items-center gap-2.5 pl-3.5 pr-1.5"
            >
              {brand}
              {divider}
              <input
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={PLACEHOLDER}
                aria-label="Ask Wati AI"
                className="min-w-0 flex-1 bg-transparent text-sm text-[var(--wati-text-title)] outline-none placeholder:text-[#b7b9b7]"
              />
              {panelButton}
            </form>
            <div className="flex flex-wrap gap-2 px-3 pb-3 pt-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => ask(s)}
                  className="h-8 rounded-full border border-[var(--wati-border-default)] bg-white px-4 text-[13px] font-medium text-[var(--wati-text-body)] transition-colors hover:border-[var(--wati-border-strong)] hover:bg-[var(--wati-surface-subtle)]"
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
