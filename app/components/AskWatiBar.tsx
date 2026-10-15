"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, type Transition } from "motion/react";
import { PanelRight } from "lucide-react";
import { useAskWatiDrawer } from "../lib/ask-wati-drawer";
import { AskWatiIcon } from "./icons/AskWatiIcon";

/**
 * Header entry point for Ask Wati. One surface that grows in place: at rest
 * it's a pill, and focusing it (click anywhere, or just start typing) eases
 * it open into a card with suggested asks while a soft mint light orbits
 * its edge. The Wati AI mark and the panel button open the side drawer.
 * Whatever is asked opens the drawer with that prompt already sent — or, on
 * the full Ask Wati page, is sent there.
 */

const SUGGESTIONS = [
  "List potential spam messages",
  "Summarize today's conversations",
  "Draft replies for waiting chats",
  "Re-engage with expired chats",
];

const PLACEHOLDER = "Draft replies for waiting chats";

const BAR_HEIGHT = 34;

const GROW: Transition = { type: "spring", stiffness: 420, damping: 38, mass: 0.8 };

export function AskWatiBar() {
  const { open: drawerOpen, toggle, openDrawer, askPrompt, inlineHost } = useAskWatiDrawer();
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!expanded) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setExpanded(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [expanded]);

  const collapse = () => {
    setExpanded(false);
    inputRef.current?.blur();
  };

  const ask = (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    askPrompt(trimmed);
    setText("");
    collapse();
  };

  // On the full Ask Wati page there's no drawer to open — the mark just
  // opens the bar.
  const openSideDrawer = () => {
    if (inlineHost) {
      inputRef.current?.focus();
      return;
    }
    collapse();
    openDrawer();
  };

  return (
    <div ref={rootRef} className="relative w-full" style={{ height: BAR_HEIGHT }}>
      <motion.div
        initial={false}
        animate={{ height: expanded ? "auto" : BAR_HEIGHT }}
        transition={GROW}
        onKeyDown={(e) => {
          if (e.key === "Escape") collapse();
        }}
        // Clicks on the surface (not its buttons) land in the input.
        onClick={(e) => {
          if (!(e.target as HTMLElement).closest("button")) inputRef.current?.focus();
        }}
        className={`absolute inset-x-0 top-0 z-50 cursor-text overflow-hidden rounded-[17px] bg-white transition-shadow duration-300 ${
          expanded
            ? "shadow-[0_12px_32px_rgba(27,29,28,0.12),0_2px_6px_rgba(27,29,28,0.06)]"
            : "shadow-[0_1px_2px_rgba(27,29,28,0.04)]"
        }`}
      >
        {/* Edge: a hairline that turns green as it opens, and the orbiting
            light on top of it. Drawn inside so overflow-hidden can clip the
            growing body without clipping the border. */}
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 rounded-[inherit] transition-[box-shadow] duration-300 ${
            expanded
              ? "shadow-[inset_0_0_0_1px_var(--wati-green)]"
              : "shadow-[inset_0_0_0_1px_var(--wati-border-default)]"
          }`}
        />
        <AnimatePresence>
          {expanded && (
            <motion.span
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="ask-wati-orbit"
            />
          )}
        </AnimatePresence>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(text);
          }}
          className="relative flex items-center gap-2.5 pl-3.5 pr-1.5"
          style={{ height: BAR_HEIGHT }}
        >
          <button
            type="button"
            onClick={openSideDrawer}
            aria-label="Open Ask Wati"
            className="flex shrink-0 items-center gap-1.5 rounded-full text-sm font-semibold text-[var(--wati-green)]"
          >
            <AskWatiIcon size={16} />
            Wati AI
          </button>
          <span aria-hidden="true" className="h-4 w-px shrink-0 bg-[var(--wati-border-default)]" />
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setExpanded(true)}
            placeholder={PLACEHOLDER}
            aria-label="Ask Wati AI"
            aria-expanded={expanded}
            className="min-w-0 flex-1 cursor-text bg-transparent text-sm text-[var(--wati-text-title)] outline-none placeholder:text-[#b7b9b7]"
          />
          {!inlineHost && (
            <button
              type="button"
              onClick={() => {
                collapse();
                toggle();
              }}
              aria-label={drawerOpen ? "Close Ask Wati panel" : "Open Ask Wati panel"}
              aria-pressed={drawerOpen}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--wati-icon-default)] hover:bg-[var(--wati-surface-emphasis)]"
            >
              <PanelRight size={16} strokeWidth={1.75} />
            </button>
          )}
        </form>

        <motion.div
          initial={false}
          animate={expanded ? "open" : "closed"}
          variants={{
            open: { transition: { staggerChildren: 0.035, delayChildren: 0.06 } },
            closed: { transition: { staggerChildren: 0.02, staggerDirection: -1 } },
          }}
          className="relative flex flex-wrap gap-2 px-3 pb-3 pt-1.5"
        >
          {SUGGESTIONS.map((s) => (
            <motion.button
              key={s}
              type="button"
              tabIndex={expanded ? 0 : -1}
              onClick={() => ask(s)}
              variants={{
                open: { opacity: 1, y: 0, filter: "blur(0px)" },
                closed: { opacity: 0, y: -4, filter: "blur(2px)" },
              }}
              transition={{ duration: 0.22, ease: [0.3, 0, 0, 1] }}
              className="h-8 rounded-full border border-[var(--wati-border-default)] bg-white px-4 text-[13px] font-medium text-[var(--wati-text-body)] transition-colors hover:border-[var(--wati-border-strong)] hover:bg-[var(--wati-surface-subtle)]"
            >
              {s}
            </motion.button>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
