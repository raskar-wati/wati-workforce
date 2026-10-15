"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, type Transition } from "motion/react";
import { PanelRight } from "lucide-react";
import { useAskWatiDrawer } from "../lib/ask-wati-drawer";
import { useNotifications, type AppNotification } from "../lib/notifications";
import { getStarterPrompts, pageForPath } from "../lib/starter-prompts";
import { armChime, playChime } from "../lib/chime";
import { AskWatiIcon } from "./icons/AskWatiIcon";
import { IslandNoticeRow } from "./island/IslandNotice";

/**
 * Header entry point for Ask Wati. One surface that grows in place: at rest
 * it's a pill, and focusing it (click anywhere, or just start typing) eases
 * it open into a card with suggested asks while a soft mint light orbits
 * its edge. The Wati AI mark and the panel button open the side drawer.
 * Whatever is asked opens the drawer with that prompt already sent — or, on
 * the full Ask Wati page, is sent there.
 *
 * It's also the island: the shared place important notices surface. At rest
 * the top live notice stands in for the placeholder, with a count of the
 * rest, and the light makes one pass when a new one arrives. Opened, they
 * list above the suggestions — except on the Ask Wati page, where they're
 * posted into the chat instead of covering it.
 */

/** The bar offers at most this many of the page's starter asks. */
const SUGGESTION_LIMIT = 3;

/** Astra (Instagram DM automation) — offered on every page after the page's asks. */
const ASTRA_CHIP = {
  label: "Automate Instagram DMs with Astra",
  icon: "/astra-mark.svg" as string | null,
};


const BAR_HEIGHT = 34;

/**
 * Dynamic-island motion: opening, the card outgrows the bar's slot a touch
 * to the left, right and down (never up — the top edge stays pinned) with a slight springy overshoot; closing, it settles back
 * into the pill without one. Inner padding stays the same, so the content
 * moves with the edge rather than leaving a gap.
 */
const OPEN: Transition = { type: "spring", stiffness: 380, damping: 28, mass: 0.9 };
const CLOSE: Transition = { type: "spring", stiffness: 480, damping: 40, mass: 0.8 };
const OUTGROW_X = 8;
const RADIUS_REST = 17;
const RADIUS_OPEN = 20;

/** Rows listed before folding the rest behind "N more". */
const NOTICE_LIMIT = 3;

const PULSE_MS = 1800;

export function AskWatiBar() {
  const { open: drawerOpen, toggle, openDrawer, askPrompt, inlineHost, postNotices } =
    useAskWatiDrawer();
  const { notifications, islandNotices, markSeen } = useNotifications();
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState("");
  // Same asks the drawer's hero offers on this page.
  const suggestions = getStarterPrompts(pageForPath(usePathname())).slice(
    0,
    SUGGESTION_LIMIT,
  );
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Notices listed while open. Pinned when the island opens (new arrivals
  // join at the top) so a row that's just been decided stays put, showing
  // its outcome, instead of vanishing under the cursor.
  const [openIds, setOpenIds] = useState<string[]>([]);
  const [showAllNotices, setShowAllNotices] = useState(false);
  const liveIds = islandNotices.map((n) => n.id);
  const liveKey = liveIds.join("|");

  useEffect(() => {
    if (!expanded) return;
    const ids = liveKey ? liveKey.split("|") : [];
    if (inlineHost) {
      // Ask Wati page: post into the chat, which counts as seeing them.
      postNotices(ids);
      markSeen(ids);
      return;
    }
    setOpenIds((prev) => {
      const fresh = ids.filter((id) => !prev.includes(id));
      return fresh.length ? [...fresh, ...prev] : prev;
    });
  }, [expanded, liveKey, inlineHost, postNotices, markSeen]);

  const listedNotices = openIds
    .map((id) => notifications.find((n) => n.id === id))
    .filter((n): n is AppNotification => n !== undefined && !n.dismissed);
  const visibleNotices = showAllNotices
    ? listedNotices
    : listedNotices.slice(0, NOTICE_LIMIT);
  const hiddenCount = listedNotices.length - visibleNotices.length;

  // One pass of the light when a notice arrives while the island is at rest,
  // and a chime when the new one needs a decision.
  const [pulse, setPulse] = useState(false);
  const seenLiveIds = useRef<Set<string> | null>(null);
  const blockingKey = islandNotices
    .filter((n) => n.priority === "blocking")
    .map((n) => n.id)
    .join("|");
  useEffect(() => armChime(), []);
  useEffect(() => {
    const ids = liveKey ? liveKey.split("|") : [];
    const known = seenLiveIds.current;
    seenLiveIds.current = new Set(ids);
    // First read (hydration) establishes the baseline without a pulse.
    if (!known) return;
    const fresh = ids.filter((id) => !known.has(id));
    if (fresh.length === 0) return;
    if (blockingKey.split("|").some((id) => fresh.includes(id))) playChime();
    setPulse(true);
    const t = window.setTimeout(() => setPulse(false), PULSE_MS);
    return () => window.clearTimeout(t);
  }, [liveKey, blockingKey]);

  const topNotice = islandNotices[0];
  const blockingCount = islandNotices.filter((n) => n.priority === "blocking").length;
  const showTeaser = !expanded && !text && topNotice !== undefined;

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

  // Closing the island counts its listed notices as seen. Blocking ones
  // ignore that — they stay until decided.
  useEffect(() => {
    if (expanded || openIds.length === 0) return;
    markSeen(openIds);
    setOpenIds([]);
    setShowAllNotices(false);
  }, [expanded, openIds, markSeen]);

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
        animate={{
          height: expanded ? "auto" : BAR_HEIGHT,
          left: expanded ? -OUTGROW_X : 0,
          right: expanded ? -OUTGROW_X : 0,
          top: 0,
          borderRadius: expanded ? RADIUS_OPEN : RADIUS_REST,
        }}
        style={{ borderRadius: RADIUS_REST }}
        transition={expanded ? OPEN : CLOSE}
        onKeyDown={(e) => {
          if (e.key === "Escape") collapse();
        }}
        // Clicks on the surface (not its buttons) land in the input.
        onClick={(e) => {
          if (!(e.target as HTMLElement).closest("button")) inputRef.current?.focus();
        }}
        className={`absolute z-50 cursor-text overflow-hidden bg-white transition-shadow duration-300 ${
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
          {(expanded || pulse) && (
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
          <div className="relative flex min-w-0 flex-1 items-center">
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onFocus={() => setExpanded(true)}
              placeholder={showTeaser ? "" : suggestions[0]}
              aria-label="Ask Wati AI"
              aria-expanded={expanded}
              className="min-w-0 flex-1 cursor-text bg-transparent text-sm text-[var(--wati-text-title)] outline-none placeholder:text-[#b7b9b7]"
            />
            {/* The teaser stands in for the placeholder; clicks fall through
                to the input, which opens the island. */}
            {showTeaser && (
              <span
                aria-live="polite"
                className="pointer-events-none absolute inset-0 flex items-center gap-2 text-sm"
              >
                {/* Counter: red while anything is waiting on a decision,
                    grey when it's only updates. Pops on every change. */}
                <motion.span
                  key={islandNotices.length}
                  initial={{ scale: 0.6 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 600, damping: 18 }}
                  aria-label={
                    blockingCount > 0
                      ? `${islandNotices.length} notifications, ${blockingCount} need your approval`
                      : `${islandNotices.length} new notifications`
                  }
                  className={`flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full px-1 text-[11px] font-semibold tabular-nums ${
                    blockingCount > 0
                      ? "bg-[var(--wati-state-danger-text)] text-white"
                      : "bg-[var(--wati-text-body)] text-white"
                  }`}
                >
                  {islandNotices.length > 99 ? "99+" : islandNotices.length}
                </motion.span>
                <span className="truncate font-medium text-[var(--wati-text-title)]">
                  {topNotice.title}
                </span>
              </span>
            )}
          </div>
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

        {!inlineHost && listedNotices.length > 0 && (
          <div className="relative flex flex-col px-1.5 pt-1">
            {visibleNotices.map((n) => (
              <IslandNoticeRow key={n.id} notice={n} onAct={collapse} />
            ))}
            {(hiddenCount > 0 || showAllNotices) && (
              <button
                type="button"
                onClick={() => setShowAllNotices((v) => !v)}
                className="mx-2.5 mb-1 mt-0.5 self-start text-[12px] font-medium text-[var(--wati-green)] hover:underline"
              >
                {showAllNotices ? "Show fewer" : `${hiddenCount} more`}
              </button>
            )}
            <span aria-hidden="true" className="mx-2.5 mt-1 h-px bg-[var(--wati-border-default)]" />
          </div>
        )}

        <motion.div
          initial={false}
          animate={expanded ? "open" : "closed"}
          variants={{
            open: { transition: { staggerChildren: 0.035, delayChildren: 0.06 } },
            closed: { transition: { staggerChildren: 0.02, staggerDirection: -1 } },
          }}
          className="relative flex flex-wrap gap-2 px-3 pb-3 pt-1.5"
        >
          {[
            ...suggestions.map((label) => ({ label, icon: null as string | null })),
            ASTRA_CHIP,
          ].map(({ label: s, icon }) => (
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
              className={`flex h-8 items-center gap-1.5 rounded-full border px-4 text-[13px] font-medium text-[var(--wati-text-body)] transition-[colors,box-shadow] ${
                icon
                  ? // Astra: a gradient border in the brand blues (white fill on
                    // the padding box, gradient on the border box) and a soft glow.
                    "border-transparent shadow-[0_0_0_3px_rgba(54,107,255,0.08)] [background:linear-gradient(white,white)_padding-box,linear-gradient(120deg,#5BAEF7,#366BFF_50%,#0034C5)_border-box] hover:shadow-[0_0_0_3px_rgba(54,107,255,0.16)]"
                  : "border-[var(--wati-border-default)] bg-white hover:border-[var(--wati-border-strong)] hover:bg-[var(--wati-surface-subtle)]"
              }`}
            >
              {icon && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={icon} alt="" aria-hidden="true" className="h-4 w-4 shrink-0" />
              )}
              {s}
            </motion.button>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
