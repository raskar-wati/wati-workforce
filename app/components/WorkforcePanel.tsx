"use client";

import {
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Inbox,
  Plus,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useAgents } from "../lib/agents";
import { useChatMode } from "../lib/chat-mode";
import { useChatThreads } from "../lib/chat-threads";
import { DAILY_DIGEST_THREAD_TITLE } from "../lib/daily-digest-data";
import { getPixabot } from "../lib/pixabots";
import { DemoStateToggleChip } from "./DemoStateToggleChip";
import { TenantToggleChip } from "./TenantToggleChip";

type PanelStyle = "expandable" | "popover" | "drawer";

export function WorkforcePanel({
  hideHandoffs = false,
  defaultCollapsed = false,
  hideDevTools = false,
  panelStyle = "expandable",
  collapsed: collapsedProp,
  onCollapsedChange,
}: {
  hideHandoffs?: boolean;
  defaultCollapsed?: boolean;
  hideDevTools?: boolean;
  /** Optional controlled collapsed state. When provided, the host owns the
   *  open/closed value and gets notified via onCollapsedChange. Used by the
   *  Ask Wati drawer so it can resize itself when the panel toggles. */
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /**
   * "expandable" (default): expanding the panel replaces the 52px column
   *   with a 232px inline column — the original behavior.
   * "popover": the 52px column is always visible; expanding renders the
   *   232px content as an absolutely-positioned overlay so it doesn't
   *   consume horizontal space.
   * "drawer": the icon column is always visible AND the 232px content
   *   panel sits inline next to it (no overlay). The icon column doubles
   *   as a tab strip — clicking Ask Wati or Agents swaps the content
   *   panel rather than mutating chat state. Used by the Ask Wati drawer.
   */
  panelStyle?: PanelStyle;
} = {}) {
  const { threads, activeThreadId, setActiveThreadId, createThread } =
    useChatThreads();
  const { agents, getUnreadCountForAgent, unreadHandoffCount } = useAgents();
  const { mode, setMode, view, setView } = useChatMode();
  const [agentsOpen, setAgentsOpen] = useState(false);
  const [collapsedInternal, setCollapsedInternal] = useState(defaultCollapsed);
  const collapsed = collapsedProp ?? collapsedInternal;
  const setCollapsed = (next: boolean | ((c: boolean) => boolean)) => {
    const resolved =
      typeof next === "function"
        ? (next as (c: boolean) => boolean)(collapsed)
        : next;
    if (collapsedProp === undefined) setCollapsedInternal(resolved);
    onCollapsedChange?.(resolved);
  };
  // Drawer-only: which tab's content the 232px panel is showing. Defaults
  // to "chats" since that's the entry point for a fresh conversation.
  const [drawerTab, setDrawerTab] = useState<"chats" | "agents">("chats");

  const inboxSelected = view === "handoffs";
  const askWatiSelected =
    !inboxSelected && activeThreadId === null && mode !== "agent";
  const newAgentSelected =
    !inboxSelected && activeThreadId === null && mode === "agent";

  const goHome = () => {
    setView("chat");
    setActiveThreadId(null);
    setMode(null);
  };

  const openInbox = () => {
    setView("handoffs");
    setActiveThreadId(null);
    setMode(null);
  };

  const startNewAgent = () => {
    setView("chat");
    setActiveThreadId(null);
    setMode("agent");
  };

  const openAgentThread = (threadId: string) => {
    setView("chat");
    setActiveThreadId(threadId);
  };

  // Pinned, undeletable "Daily Digest" agent. Lives outside the regular
  // agent store; we just find-or-create a thread with a known title and
  // let ChatArea bootstrap the digest message into it.
  const openDailyDigest = () => {
    setView("chat");
    setMode(null);
    const existing = threads.find(
      (t) => t.title === DAILY_DIGEST_THREAD_TITLE,
    );
    const id = existing?.id ?? createThread(DAILY_DIGEST_THREAD_TITLE);
    setActiveThreadId(id);
  };

  const dailyDigestThreadId =
    threads.find((t) => t.title === DAILY_DIGEST_THREAD_TITLE)?.id ?? null;

  // ─── Drawer variant ────────────────────────────────────────────────
  if (panelStyle === "drawer") {
    return (
      <div className="relative flex h-full shrink-0">
        <DrawerIconColumn
          collapsed={collapsed}
          activeTab={drawerTab}
          onToggleCollapsed={() => setCollapsed((c) => !c)}
          onPickChats={() => {
            setCollapsed(false);
            setDrawerTab("chats");
          }}
          onPickAgents={() => {
            setCollapsed(false);
            setDrawerTab("agents");
          }}
        />
        {!collapsed && (
          <div className="flex h-full w-[232px] shrink-0 flex-col gap-4 overflow-y-auto border-r border-[var(--wati-border-default)] bg-white p-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-sm font-semibold text-[var(--wati-text-body)]">
                WorkForce
              </p>
            </div>

            {drawerTab === "chats" ? (
              <ChatsTabContent
                threads={threads}
                activeThreadId={activeThreadId}
                inboxSelected={inboxSelected}
                askWatiSelected={askWatiSelected}
                onNewChat={goHome}
                onOpenThread={openAgentThread}
              />
            ) : (
              <AgentsTabContent
                agents={agents}
                activeThreadId={activeThreadId}
                inboxSelected={inboxSelected}
                newAgentSelected={newAgentSelected}
                getUnreadCountForAgent={getUnreadCountForAgent}
                onNewAgent={startNewAgent}
                onOpenAgentThread={openAgentThread}
                dailyDigestThreadId={dailyDigestThreadId}
                onOpenDailyDigest={openDailyDigest}
              />
            )}
          </div>
        )}
      </div>
    );
  }

  const collapsedColumn = (
    <div className="flex w-[52px] shrink-0 flex-col items-center gap-2 overflow-hidden border-r border-[var(--wati-border-default)] bg-white p-2">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          aria-label="Expand navigation"
          title="Expand"
          className="flex h-8 w-8 items-center justify-center rounded text-[var(--wati-icon-default)] hover:bg-[var(--wati-surface-subtle)]"
        >
          <ChevronsRight size={16} strokeWidth={1.75} />
        </button>

        <button
          type="button"
          onClick={goHome}
          aria-label="Ask Wati"
          title="Ask Wati"
          className={`flex h-8 w-8 items-center justify-center rounded ${
            askWatiSelected
              ? "bg-[var(--wati-chip-bg)]"
              : "hover:bg-[var(--wati-surface-subtle)]"
          }`}
        >
          <Plus
            size={16}
            strokeWidth={2}
            className="text-[var(--wati-icon-default)]"
          />
        </button>

        {!hideHandoffs && (
          <button
            type="button"
            onClick={openInbox}
            aria-label="Handoffs"
            title="Handoffs"
            className={`relative flex h-8 w-8 items-center justify-center rounded ${
              inboxSelected
                ? "bg-[var(--wati-chip-bg)]"
                : "hover:bg-[var(--wati-surface-subtle)]"
            }`}
          >
            <Inbox
              size={16}
              strokeWidth={1.75}
              className="text-[var(--wati-icon-default)]"
            />
            {unreadHandoffCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-[var(--wati-text-primary)] px-1 text-[9px] font-semibold text-white">
                {unreadHandoffCount}
              </span>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            setCollapsed(false);
            setAgentsOpen(true);
          }}
          aria-label="Agents"
          title="Agents"
          className="flex h-8 w-8 items-center justify-center rounded hover:bg-[var(--wati-surface-subtle)]"
        >
          <Sparkles
            size={16}
            strokeWidth={1.75}
            className="text-[var(--wati-icon-default)]"
          />
        </button>
      </div>
  );

  const expandedColumn = (
    <div
      className={
        panelStyle === "popover"
          ? "absolute left-[52px] top-0 z-30 flex h-full w-[232px] flex-col gap-6 overflow-y-auto border-r border-[var(--wati-border-default)] bg-white p-3 shadow-lg"
          : "flex w-[232px] shrink-0 flex-col gap-6 overflow-hidden border-r border-[var(--wati-border-default)] bg-white p-3"
      }
    >
      {/* Header + agent list */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-center gap-1 px-1">
          <p className="flex-1 text-sm font-semibold text-[var(--wati-text-body)]">
            WorkForce
          </p>
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            aria-label="Collapse navigation"
            title="Collapse"
            className="flex h-6 w-6 items-center justify-center rounded text-[var(--wati-icon-default)] hover:bg-[var(--wati-surface-subtle)]"
          >
            <ChevronsLeft size={14} strokeWidth={1.75} />
          </button>
        </div>

        <button
          type="button"
          onClick={goHome}
          className={`flex w-full items-center gap-1 rounded p-1 transition-colors ${
            askWatiSelected
              ? "bg-[var(--wati-chip-bg)]"
              : "bg-white hover:bg-[var(--wati-surface-subtle)]"
          }`}
        >
          <span className="flex h-5 w-5 items-center justify-center text-[var(--wati-icon-default)]">
            <Plus size={16} strokeWidth={2} />
          </span>
          <span className="flex-1 text-left text-sm font-medium text-[var(--wati-text-body)]">
            Ask Wati
          </span>
        </button>

        {!hideHandoffs && (
          <button
            type="button"
            onClick={openInbox}
            className={`flex w-full items-center gap-1 rounded p-1 transition-colors ${
              inboxSelected
                ? "bg-[var(--wati-chip-bg)]"
                : "bg-white hover:bg-[var(--wati-surface-subtle)]"
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center text-[var(--wati-icon-default)]">
              <Inbox size={16} strokeWidth={1.75} />
            </span>
            <span className="flex-1 text-left text-sm font-medium text-[var(--wati-text-body)]">
              Handoffs
            </span>
            {unreadHandoffCount > 0 && (
              <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded border border-[var(--wati-border-default)] bg-[var(--wati-surface-subtle)] px-1 text-[10px] font-medium text-[var(--wati-text-body)]">
                {unreadHandoffCount}
              </span>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={() => setAgentsOpen((o) => !o)}
          className="flex w-full items-center gap-1 rounded bg-white p-1 transition-colors hover:bg-[var(--wati-surface-subtle)]"
        >
          <span className="flex h-5 w-5 items-center justify-center text-[var(--wati-icon-default)]">
            <Sparkles size={16} strokeWidth={1.75} />
          </span>
          <span className="flex-1 text-left text-sm font-medium text-[var(--wati-text-body)]">
            Agents
          </span>
          <ChevronDown
            size={16}
            strokeWidth={2}
            className={`text-[var(--wati-icon-default)] transition-transform duration-200 ${agentsOpen ? "rotate-0" : "-rotate-90"}`}
          />
        </button>

        {agentsOpen && (
          <>
            <button
              type="button"
              onClick={startNewAgent}
              className={`flex w-full items-center gap-1 rounded p-1 transition-colors ${
                newAgentSelected
                  ? "bg-[var(--wati-chip-bg)]"
                  : "bg-white hover:bg-[var(--wati-surface-subtle)]"
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center text-[var(--wati-icon-default)]">
                <Plus size={14} strokeWidth={2} />
              </span>
              <span className="flex-1 text-left text-sm font-medium text-[var(--wati-text-body)]">
                New Agent
              </span>
            </button>

            {agents.map((a) => {
              const unread = getUnreadCountForAgent(a.id);
              const isActive = !inboxSelected && activeThreadId === a.threadId;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => openAgentThread(a.threadId)}
                  className={`flex w-full items-center gap-1 rounded px-2 py-1 text-left transition-colors ${
                    isActive
                      ? "bg-[var(--wati-chip-bg)]"
                      : "hover:bg-[var(--wati-surface-subtle)]"
                  }`}
                >
                  <Image
                    src={a.avatarSeed}
                    alt=""
                    width={16}
                    height={16}
                    className="shrink-0 rounded-full"
                    aria-hidden
                  />
                  <p className="flex-1 truncate text-sm text-[#101828]">{a.name}</p>
                  {unread > 0 && (
                    <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded border border-[var(--wati-border-default)] bg-[var(--wati-surface-subtle)] px-1 text-[10px] font-medium text-[var(--wati-text-body)]">
                      {unread}
                    </span>
                  )}
                </button>
              );
            })}
          </>
        )}
      </div>

      {/* Recent chats — non-agent threads only */}
      {threads.some((t) => !t.agentId) && (
        <div className="flex flex-col gap-1">
          <div className="px-1 pb-2">
            <p className="text-[12px] font-semibold uppercase tracking-[1px] text-[var(--wati-text-caption)]">
              Recent Chats
            </p>
          </div>

          {threads
            .filter((thread) => !thread.agentId)
            .map((thread) => (
              <button
                key={thread.id}
                type="button"
                onClick={() => openAgentThread(thread.id)}
                className={`w-full rounded px-2 py-1.5 text-left text-sm transition-colors ${
                  !inboxSelected && activeThreadId === thread.id
                    ? "bg-[var(--wati-chip-bg)] font-medium text-[var(--wati-text-body)]"
                    : "text-[var(--wati-text-subtitle)] hover:bg-[var(--wati-surface-subtle)]"
                }`}
              >
                <span className="block truncate">{thread.title}</span>
              </button>
            ))}
        </div>
      )}

      {/* Footer — dev-only toggles (user state + tenant) */}
      {!hideDevTools && (
        <div className="mt-auto flex flex-col gap-0.5 border-t border-[var(--wati-border-default)] pt-3">
          <DemoStateToggleChip />
          <TenantToggleChip />
        </div>
      )}
    </div>
  );

  if (panelStyle === "popover") {
    // Collapsed column always visible; expanded content rendered as an
    // overlay so it doesn't push neighbouring content.
    return (
      <div className="relative flex h-full shrink-0">
        {collapsedColumn}
        {!collapsed && (
          <>
            <div
              aria-hidden
              onClick={() => setCollapsed(true)}
              className="fixed inset-0 z-20"
            />
            {expandedColumn}
          </>
        )}
      </div>
    );
  }

  return collapsed ? collapsedColumn : expandedColumn;
}

// ─── Drawer sub-components ───────────────────────────────────────────

function DrawerIconColumn({
  collapsed,
  activeTab,
  onToggleCollapsed,
  onPickChats,
  onPickAgents,
}: {
  collapsed: boolean;
  activeTab: "chats" | "agents";
  onToggleCollapsed: () => void;
  onPickChats: () => void;
  onPickAgents: () => void;
}) {
  return (
    <div className="flex w-[47px] shrink-0 flex-col items-center gap-1 border-r border-[var(--wati-border-default)] bg-white py-2">
      <button
        type="button"
        onClick={onToggleCollapsed}
        aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
        title={collapsed ? "Expand" : "Collapse"}
        className="flex h-8 w-8 items-center justify-center rounded text-[var(--wati-icon-default)] hover:bg-[var(--wati-surface-subtle)]"
      >
        {collapsed ? (
          <ChevronsRight size={16} strokeWidth={1.75} />
        ) : (
          <ChevronsLeft size={16} strokeWidth={1.75} />
        )}
      </button>

      <button
        type="button"
        onClick={onPickChats}
        aria-label="Ask Wati"
        aria-pressed={!collapsed && activeTab === "chats"}
        title="Ask Wati"
        className={`flex h-8 w-8 items-center justify-center rounded ${
          !collapsed && activeTab === "chats"
            ? "bg-[var(--wati-chip-bg)]"
            : "hover:bg-[var(--wati-surface-subtle)]"
        }`}
      >
        <Plus size={16} strokeWidth={2} className="text-[var(--wati-icon-default)]" />
      </button>

      <button
        type="button"
        onClick={onPickAgents}
        aria-label="Agents"
        aria-pressed={!collapsed && activeTab === "agents"}
        title="Agents"
        className={`flex h-8 w-8 items-center justify-center rounded ${
          !collapsed && activeTab === "agents"
            ? "bg-[var(--wati-chip-bg)]"
            : "hover:bg-[var(--wati-surface-subtle)]"
        }`}
      >
        <Sparkles
          size={16}
          strokeWidth={1.75}
          className="text-[var(--wati-icon-default)]"
        />
      </button>
    </div>
  );
}

function ChatsTabContent({
  threads,
  activeThreadId,
  inboxSelected,
  askWatiSelected,
  onNewChat,
  onOpenThread,
}: {
  threads: ReturnType<typeof useChatThreads>["threads"];
  activeThreadId: string | null;
  inboxSelected: boolean;
  askWatiSelected: boolean;
  onNewChat: () => void;
  onOpenThread: (threadId: string) => void;
}) {
  const chatThreads = threads.filter((t) => !t.agentId);
  return (
    <>
      <button
        type="button"
        onClick={onNewChat}
        className={`flex w-full items-center gap-1 rounded p-1 transition-colors ${
          askWatiSelected
            ? "bg-[var(--wati-chip-bg)]"
            : "bg-white hover:bg-[var(--wati-surface-subtle)]"
        }`}
      >
        <span className="flex h-5 w-5 items-center justify-center text-[var(--wati-icon-default)]">
          <Plus size={16} strokeWidth={2} />
        </span>
        <span className="flex-1 text-left text-sm font-medium text-[var(--wati-text-body)]">
          Ask Wati
        </span>
      </button>

      {chatThreads.length > 0 && (
        <div className="flex flex-col gap-1">
          {chatThreads.map((thread) => (
            <button
              key={thread.id}
              type="button"
              onClick={() => onOpenThread(thread.id)}
              className={`w-full rounded px-2 py-1.5 text-left text-sm transition-colors ${
                !inboxSelected && activeThreadId === thread.id
                  ? "bg-[var(--wati-chip-bg)] font-medium text-[var(--wati-text-body)]"
                  : "text-[var(--wati-text-subtitle)] hover:bg-[var(--wati-surface-subtle)]"
              }`}
            >
              <span className="block truncate">{thread.title}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function AgentsTabContent({
  agents,
  activeThreadId,
  inboxSelected,
  newAgentSelected,
  getUnreadCountForAgent,
  onNewAgent,
  onOpenAgentThread,
  dailyDigestThreadId,
  onOpenDailyDigest,
}: {
  agents: ReturnType<typeof useAgents>["agents"];
  activeThreadId: string | null;
  inboxSelected: boolean;
  newAgentSelected: boolean;
  getUnreadCountForAgent: (id: string) => number;
  onNewAgent: () => void;
  onOpenAgentThread: (threadId: string) => void;
  /** Thread id if the Daily Digest has been opened this session; null otherwise. */
  dailyDigestThreadId: string | null;
  onOpenDailyDigest: () => void;
}) {
  const digestActive =
    !inboxSelected &&
    dailyDigestThreadId !== null &&
    activeThreadId === dailyDigestThreadId;
  const digestAvatar = getPixabot("daily-digest");
  return (
    <>
      <button
        type="button"
        onClick={onNewAgent}
        className={`flex w-full items-center gap-1 rounded p-1 transition-colors ${
          newAgentSelected
            ? "bg-[var(--wati-chip-bg)]"
            : "bg-white hover:bg-[var(--wati-surface-subtle)]"
        }`}
      >
        <span className="flex h-5 w-5 items-center justify-center text-[var(--wati-icon-default)]">
          <Plus size={16} strokeWidth={2} />
        </span>
        <span className="flex-1 text-left text-sm font-medium text-[var(--wati-text-body)]">
          New Agent
        </span>
      </button>

      <div className="flex flex-col gap-0.5">
        {/* Pinned, system-owned Daily Digest entry. Same visual treatment
            as a normal agent row so it reads as one of them. */}
        <button
          type="button"
          onClick={onOpenDailyDigest}
          className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors ${
            digestActive
              ? "bg-[var(--wati-chip-bg)]"
              : "hover:bg-[var(--wati-surface-subtle)]"
          }`}
        >
          <Image
            src={digestAvatar}
            alt=""
            width={18}
            height={18}
            className="shrink-0 rounded-full"
            aria-hidden
          />
          <p className="flex-1 truncate text-sm text-[#101828]">Daily Digest</p>
        </button>

        {agents.map((a) => {
          const unread = getUnreadCountForAgent(a.id);
          const isActive = !inboxSelected && activeThreadId === a.threadId;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => onOpenAgentThread(a.threadId)}
              className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors ${
                isActive
                  ? "bg-[var(--wati-chip-bg)]"
                  : "hover:bg-[var(--wati-surface-subtle)]"
              }`}
            >
              <Image
                src={a.avatarSeed}
                alt=""
                width={18}
                height={18}
                className="shrink-0 rounded-full"
                aria-hidden
              />
              <p className="flex-1 truncate text-sm text-[#101828]">{a.name}</p>
              {unread > 0 && (
                <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded border border-[var(--wati-border-default)] bg-[var(--wati-surface-subtle)] px-1 text-[10px] font-medium text-[var(--wati-text-body)]">
                  {unread}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}
