"use client";

import { useState } from "react";
import { WATI_AI_TABS } from "./AskWatiSettings";

export type SettingsPage = { id: string; label: string };
type SettingsGroup = { id: string; label: string; icon: string; pages?: SettingsPage[] };

const ICONS = "/settings-nav";

/** Account and workspace settings IA (Settings IA, Q4 '26). */
export const SETTINGS_IA: SettingsGroup[] = [
  {
    id: "personal",
    label: "Personal",
    icon: `${ICONS}/person.svg`,
    pages: [
      { id: "my-profile", label: "My profile" },
      { id: "notifications", label: "Notifications" },
    ],
  },
  { id: "user-management", label: "User Management", icon: `${ICONS}/person-settings.svg` },
  {
    id: "workspace",
    label: "Workspace",
    icon: `${ICONS}/wrench.svg`,
    pages: [
      { id: "general", label: "General" },
      { id: "business-profile", label: "Business profile" },
      { id: "work-hours", label: "Work hour settings" },
      { id: "chat-assignment", label: "Chat Assignment" },
      { id: "security", label: "Security" },
      { id: "chat-data", label: "Chat Data" },
    ],
  },
  {
    id: "billing",
    label: "Billing",
    icon: `${ICONS}/receipt.svg`,
    pages: [
      { id: "your-plan", label: "Your plan" },
      { id: "billing-info", label: "Billing info" },
      { id: "switch-plan", label: "Switch plan" },
    ],
  },
  {
    id: "wati-ai",
    label: "Wati AI",
    icon: `${ICONS}/wati-ai.svg`,
    pages: WATI_AI_TABS.map((t) => ({ id: `wati-ai-${t.id}`, label: t.label })),
  },
];

/** Every leaf page, in nav order, for looking up the open page's label. */
export const SETTINGS_PAGES: SettingsPage[] = SETTINGS_IA.flatMap((g) =>
  g.pages ?? [{ id: g.id, label: g.label }],
);

const TEXT = "text-[14px] font-medium leading-5 text-[#353735]";
const rowState = (active: boolean) =>
  active ? "bg-[var(--wati-surface-emphasis)]" : "hover:bg-[var(--wati-surface-subtle)]";

/**
 * Settings sub-nav, per the Settings IA frame: groups open by default with
 * a 1px rail beside their pages; 14px medium text, Fluent icons at 20px.
 */
export function SettingsNav({
  current,
  onSelect,
}: {
  current: string;
  onSelect: (id: string) => void;
}) {
  const [closed, setClosed] = useState<Record<string, boolean>>({});

  return (
    <nav
      aria-label="Settings"
      className="flex w-[232px] shrink-0 flex-col items-start gap-3 overflow-y-auto border-r border-[var(--wati-border-default)] bg-white p-3"
    >
      <p className="w-[208px] px-1 text-[14px] font-semibold leading-5 text-[#353735]">Settings</p>
      {SETTINGS_IA.map(({ id, label, icon, pages }) => {
        if (!pages) {
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              aria-current={current === id ? "page" : undefined}
              className={`flex w-[208px] items-start gap-1 rounded px-1 py-2 text-left ${TEXT} ${rowState(current === id)}`}
            >
              <img src={icon} alt="" className="size-5 shrink-0" />
              {label}
            </button>
          );
        }
        const open = !closed[id];
        return (
          <div key={id} className="flex flex-col gap-2 p-1">
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setClosed((c) => ({ ...c, [id]: open }))}
              className={`flex w-[198px] items-center gap-1 text-left ${TEXT}`}
            >
              <img src={icon} alt="" className="size-5 shrink-0" />
              <span className="flex-1">{label}</span>
              <img
                src={`${ICONS}/chevron.svg`}
                alt=""
                className={`size-4 shrink-0 ${open ? "" : "rotate-180"}`}
              />
            </button>
            {open && (
              <div className="flex">
                <span aria-hidden className="flex w-5 shrink-0 justify-center">
                  <span className="w-px bg-[#ced0ce]" />
                </span>
                <div className="flex w-[178px] flex-col gap-1">
                  {pages.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onSelect(p.id)}
                      aria-current={current === p.id ? "page" : undefined}
                      className={`w-full rounded p-1 text-left ${TEXT} ${rowState(current === p.id)}`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
