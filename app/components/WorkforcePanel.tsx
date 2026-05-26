"use client";

import { ChevronDown, Inbox, Plus, Sparkles } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useAgents } from "../lib/agents";
import { useChatMode } from "../lib/chat-mode";
import { useChatThreads } from "../lib/chat-threads";
import { DemoStateToggleChip } from "./DemoStateToggleChip";
import { TenantToggleChip } from "./TenantToggleChip";

export function WorkforcePanel() {
  const { threads, activeThreadId, setActiveThreadId } = useChatThreads();
  const { agents, getUnreadCountForAgent, unreadHandoffCount } = useAgents();
  const { mode, setMode, view, setView } = useChatMode();
  const [agentsOpen, setAgentsOpen] = useState(false);

  // Selection is driven first by `view` (Handoffs sits outside thread/mode).
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

  return (
    <div className="flex w-[232px] shrink-0 flex-col gap-6 overflow-hidden border-r border-[var(--wati-border-default)] bg-white p-3">
      {/* Header + agent list */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-center px-1">
          <p className="flex-1 text-sm font-semibold text-[var(--wati-text-body)]">
            WorkForce
          </p>
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
      <div className="mt-auto flex flex-col gap-0.5 border-t border-[var(--wati-border-default)] pt-3">
        <DemoStateToggleChip />
        <TenantToggleChip />
      </div>
    </div>
  );
}
