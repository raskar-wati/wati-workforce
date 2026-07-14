"use client";

import { PanelLeftClose, PanelLeftOpen, Plus } from "lucide-react";
import { useAgents } from "../lib/agents";
import { useChatMode } from "../lib/chat-mode";
import { useChatThreads } from "../lib/chat-threads";
import { ChatArea } from "./ChatArea";

export function MainContent({
  hideDailyDigest = false,
  chrome,
  expanded = false,
  panelCollapsed,
  onTogglePanel,
}: {
  hideDailyDigest?: boolean;
  chrome?: "drawer";
  /** Expanded modal mode — hides the panel toggle in the WorkForce header
   *  and centers the chat content with a max-width so it reads at "page"
   *  width on large screens. */
  expanded?: boolean;
  /** Drawer-only: when defined, MainContent renders a small "WorkForce"
   *  header bar with a panel toggle next to the label. */
  panelCollapsed?: boolean;
  onTogglePanel?: () => void;
} = {}) {
  const showToggle = chrome === "drawer" && onTogglePanel !== undefined;
  const showHeader = chrome === "drawer" && (showToggle || expanded);
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-white">
      {showHeader && (
        <div className="flex shrink-0 items-center gap-2 px-3 pt-3 pb-1">
          {showToggle && (
            <button
              type="button"
              onClick={onTogglePanel}
              aria-label={
                panelCollapsed ? "Open navigation" : "Close navigation"
              }
              title={panelCollapsed ? "Open navigation" : "Close navigation"}
              className="flex h-7 w-7 items-center justify-center rounded text-[var(--wati-icon-default)] hover:bg-[var(--wati-surface-subtle)]"
            >
              {panelCollapsed ? (
                <PanelLeftOpen size={16} strokeWidth={1.75} />
              ) : (
                <PanelLeftClose size={16} strokeWidth={1.75} />
              )}
            </button>
          )}
          <p className="text-sm font-semibold text-[var(--wati-text-body)]">
            WorkForce
          </p>
        </div>
      )}
      {chrome === "drawer" && <NewThreadButton />}
      <div className="min-h-0 flex-1">
        {expanded ? (
          <div className="mx-auto flex h-full w-full max-w-[820px] flex-col">
            <ChatArea hideDailyDigest={hideDailyDigest} chrome={chrome} />
          </div>
        ) : (
          <ChatArea hideDailyDigest={hideDailyDigest} chrome={chrome} />
        )}
      </div>
    </div>
  );
}

/**
 * Quick "start a new chat / new agent" affordance in the WorkForce header.
 * Hidden on the bare hero (no active thread); visible inside any actual
 * thread. Action is context-aware:
 *   - on an agent thread → enter New Agent creation
 *   - everywhere else → return to the chat hero so the user can start
 *     a fresh Ask Wati conversation
 *
 * Right-padded in expanded mode so it doesn't sit under the absolutely-
 * positioned Minimize2 / X icons in the aside top-right.
 */
function NewThreadButton() {
  const { activeThreadId, setActiveThreadId } = useChatThreads();
  const { mode, setMode } = useChatMode();
  const { getAgentsForThread } = useAgents();

  // Rule 1: default hero / Rule 2: agent-creation hero (no thread yet) →
  // there is nothing for "new chat" to do that differs from the current
  // state. Hide.
  if (activeThreadId === null) return null;

  const onAgentThread =
    mode === "agent" || getAgentsForThread(activeThreadId).length > 0;

  const handleClick = () => {
    if (onAgentThread) {
      setActiveThreadId(null);
      setMode("agent");
    } else {
      setActiveThreadId(null);
      setMode(null);
    }
  };

  // Sits to the left of the aside's absolute expand + close icons so the
  // three modal-chrome controls (+, expand, X) align on the same row.
  // Expand/close live at right-2 (8px) with gap-1 (4px) and h-7 w-7 (28px)
  // each → expand's left edge is at 8 + 28 + 4 = 40px from the right; we
  // place the plus another 28 + 4 = 32px further left at right-[72px].
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={onAgentThread ? "Start a new agent" : "Start a new chat"}
      title={onAgentThread ? "Start a new agent" : "Start a new chat"}
      className="absolute right-[72px] top-2 z-10 flex h-7 w-7 items-center justify-center rounded text-[var(--wati-icon-default)] hover:bg-[var(--wati-surface-subtle)]"
    >
      <Plus size={16} strokeWidth={1.75} />
    </button>
  );
}
