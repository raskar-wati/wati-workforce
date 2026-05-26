"use client";

import { Play, User } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import { useState } from "react";
import type { HandoffCta, HandoffWithAgent } from "../../lib/agents";
import { useAgents } from "../../lib/agents";
import { useChatMode } from "../../lib/chat-mode";
import { useChatThreads } from "../../lib/chat-threads";
import { getWatcherType } from "../../lib/watcher-types";
import { AgentActionRun } from "../agents/AgentActionRun";
import { HandoffCtaButton } from "../agents/HandoffCtaButton";
import { HandoffSection } from "../agents/HandoffSection";
import { Composer, COMPOSER_TRANSITION } from "../Composer";

/** Width of the central content column inside the detail pane — matches the
 * chat surface so the composer below feels visually identical. The pane
 * itself remains flex-1 so there's free space on the right for future use. */
const DETAIL_CONTENT_WIDTH = "max-w-[720px]";

/**
 * Right column of the inbox — full content of the selected handoff.
 * Renders the same sections + CTAs the in-thread handoff card shows, plus
 * an "Open thread" link and a chat composer pinned at the bottom.
 */
export function HandoffDetail({
  handoff,
  firedCtaIds,
  onFireCta,
}: {
  handoff: HandoffWithAgent;
  firedCtaIds: ReadonlySet<string>;
  onFireCta: (cta: HandoffCta) => void;
}) {
  const { getActionRuns, addHandoff } = useAgents();
  const { mode, setMode, setView } = useChatMode();
  const { createThread } = useChatThreads();
  const [input, setInput] = useState("");

  const runs = getActionRuns(handoff.agent.id).filter(
    (r) => r.handoffId === handoff.id,
  );

  // Re-runs the agent — produces a fresh handoff from the watcher type's
  // draft, same flow as the in-thread "Run again" button.
  const runNow = () => {
    const wt = getWatcherType(handoff.agent.watcherType);
    addHandoff(handoff.agent.id, wt.buildDraft());
  };

  // Submitting from the handoff composer creates a fresh thread with the
  // typed message and flips back to the chat surface so the user sees it.
  const submit = () => {
    const text = input.trim();
    if (!text) return;
    createThread(text);
    setInput("");
    setView("chat");
  };

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Header — sticky-ish, sits above the scrollable body. Full-width so
          the bottom border spans the pane, but its inner content respects
          the fixed column width. */}
      <div className="border-b border-[var(--wati-border-default)] bg-white">
        <div
          className={`mx-auto flex w-full ${DETAIL_CONTENT_WIDTH} items-center justify-between gap-4 px-8 py-4`}
        >
          <div className="flex items-center gap-3">
            <Image
              src={handoff.agent.avatarSeed}
              alt=""
              width={32}
              height={32}
              className="rounded-full"
              aria-hidden
            />
            <div className="flex flex-col">
              <p className="text-[14px] font-semibold tracking-[-0.084px] text-[#0a0a0a]">
                {handoff.agent.name}
              </p>
              <p className="text-[12px] tracking-[-0.06px] text-black/50">
                Run #{handoff.runNumber} · {formatRunAt(handoff.runAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={runNow}
              className="flex items-center gap-1.5 rounded-full bg-[#0a0a0a] px-3 py-1.5 text-[12px] tracking-[-0.06px] text-white hover:bg-[#0a0a0a]/90"
            >
              <Play size={12} strokeWidth={2} />
              Run Now
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-full border border-[#e5e5e5] px-3 py-1.5 text-[12px] tracking-[-0.06px] text-[#0a0a0a] hover:bg-black/[0.03]"
            >
              <User size={12} strokeWidth={2} />
              View Agent
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable body — width-constrained, leaves whitespace on the right
          intentionally for future side content. */}
      <div className="flex-1 overflow-y-auto">
        <div
          className={`mx-auto flex w-full ${DETAIL_CONTENT_WIDTH} flex-col gap-6 px-8 py-6`}
        >
          {handoff.sections.map((s) => (
            <HandoffSection
              key={s.id}
              section={s}
              firedCtaIds={firedCtaIds}
              onFireCta={onFireCta}
            />
          ))}

          {handoff.ctas.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {handoff.ctas.map((c) => (
                <HandoffCtaButton
                  key={c.id}
                  cta={c}
                  fired={firedCtaIds.has(c.id)}
                  onFire={onFireCta}
                />
              ))}
            </div>
          )}

          {runs.length > 0 && (
            <div className="flex flex-col gap-2 pt-2">
              {runs.map((r) => (
                <AgentActionRun key={r.id} run={r} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Composer pinned at the bottom of the pane, matching column width. */}
      <div className="px-8 pb-6">
        <motion.div
          layout
          transition={COMPOSER_TRANSITION}
          className={`mx-auto w-full ${DETAIL_CONTENT_WIDTH}`}
        >
          <Composer
            value={input}
            onChange={setInput}
            onSubmit={submit}
            hasMessages
            mode={mode}
            onModeChange={setMode}
          />
        </motion.div>
      </div>
    </div>
  );
}

function formatRunAt(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const time = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${date} · ${time}`;
}
