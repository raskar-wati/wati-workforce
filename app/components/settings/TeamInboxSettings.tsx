"use client";

import {
  CircleDot,
  FileAudio,
  ListChecks,
  Mic,
  Phone,
  PhoneIncoming,
  PhoneMissed,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Select } from "../ui/Select";
import { Switch } from "../ui/Switch";
import { BetaBadge } from "./BetaBadge";
import { HINT } from "./settings-styles";

type InboxTab = "chat" | "call" | "groups";

const TABS: { id: InboxTab; label: string }[] = [
  { id: "chat", label: "Chat" },
  { id: "call", label: "Call" },
  { id: "groups", label: "Groups" },
];

const CHAT_SETTINGS = [
  {
    id: "agentName",
    title: "Show agent name",
    body: "Allow the agent name to be shown to the customer in WhatsApp.",
  },
  {
    id: "assigneeOwner",
    title: "Make assignee as contact owner",
    body: "If the assignee is changed the contact owner will be auto-assigned.",
  },
  {
    id: "typing",
    title: "Show typing indicator to customers",
    body: "Customers will see a typing indicator when the operator is typing.",
  },
  {
    id: "hideMedia",
    title: "Hide media saving",
    body: "When enabled, operators and agents cannot save or download media files. Admins are not affected.",
  },
  {
    id: "spamBlock",
    title: "Allow operators to Spam & Block contacts",
    body: "When disabled, only admins can Spam & Block or Unblock contacts in Team Inbox. Applies to all non-admin users.",
  },
] as const;

type ToggleId =
  | (typeof CHAT_SETTINGS)[number]["id"]
  | "whatsappCall"
  | "inboundCalls"
  | "autoPermission"
  | "autoRecord"
  | "transcriptions"
  | "callSummaries"
  | "voiceAgent"
  | "whatsappGroups"
  | "operatorGroups";

const DEFAULTS: Record<ToggleId, boolean> = {
  agentName: true,
  assigneeOwner: false,
  typing: false,
  hideMedia: false,
  spamBlock: true,
  whatsappCall: true,
  inboundCalls: false,
  autoPermission: false,
  autoRecord: true,
  transcriptions: true,
  callSummaries: true,
  voiceAgent: false,
  whatsappGroups: false,
  operatorGroups: false,
};

const REQUEST_LANGUAGES = ["English (US)", "English (UK)", "Arabic", "Hindi", "Portuguese (BR)", "Spanish"];

/**
 * Team Inbox settings body: Chat, Call and Groups. AI translation moved to
 * Wati AI settings > Conversations, so it isn't here.
 */
export function TeamInboxSettings() {
  const [tab, setTab] = useState<InboxTab>("chat");
  const [on, setOn] = useState(DEFAULTS);
  const [requestLanguage, setRequestLanguage] = useState(REQUEST_LANGUAGES[0]);

  const toggle = (id: ToggleId, title: string) => (
    <Switch checked={on[id]} onChange={(v) => setOn((s) => ({ ...s, [id]: v }))} label={title} />
  );

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-5">
      <div
        role="tablist"
        className="grid grid-cols-3 gap-1 rounded-xl bg-[var(--wati-surface-subtle)] p-1"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg py-1.5 text-[13px] tracking-[-0.078px] ${
              tab === t.id
                ? "bg-white font-medium text-[#0a0a0a] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                : "text-black/60 hover:text-[#0a0a0a]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {tab === "chat" &&
          CHAT_SETTINGS.map((s) => (
            <div
              key={s.id}
              className="flex items-start gap-4 rounded-xl bg-[var(--wati-surface-subtle)] px-4 py-3.5"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-[#0a0a0a]">{s.title}</p>
                <p className={`${HINT} mt-0.5`}>{s.body}</p>
              </div>
              {toggle(s.id, s.title)}
            </div>
          ))}

        {tab === "call" && (
          <>
            <SettingsCard
              head={
                <CardHead
                  icon={Phone}
                  title="Enable WhatsApp Call"
                  beta
                  body="If you enable this, customers can call you, and you can also call them."
                  control={toggle("whatsappCall", "Enable WhatsApp Call")}
                >
                  <label className="mt-3 flex flex-col gap-1.5">
                    <span className="text-[12px] font-medium text-black/70">Send request in</span>
                    <Select
                      className="w-[280px]"
                      value={requestLanguage}
                      onChange={(e) => setRequestLanguage(e.target.value)}
                    >
                      {REQUEST_LANGUAGES.map((l) => (
                        <option key={l}>{l}</option>
                      ))}
                    </Select>
                    <span className={HINT}>
                      A default permission template will be shared in your preferred language.
                    </span>
                  </label>
                </CardHead>
              }
            >
              <CardRow
                icon={PhoneIncoming}
                title="Allow customers to call your business"
                body="This will allow customers to call your business directly on WhatsApp."
                control={toggle("inboundCalls", "Allow customers to call your business")}
              />
              <CardRow
                icon={PhoneMissed}
                title="Allow auto permission requests"
                body="Automatically send a permission request in case of a missed call."
                control={toggle("autoPermission", "Allow auto permission requests")}
              />
            </SettingsCard>

            <SettingsCard
              head={
                <CardHead
                  icon={CircleDot}
                  title="Auto record all calls"
                  body="Saves a replay of every customer call."
                  control={toggle("autoRecord", "Auto record all calls")}
                />
              }
            >
              <CardRow
                icon={FileAudio}
                title="Auto generate transcriptions"
                body="Converts your call audio into readable text."
                control={toggle("transcriptions", "Auto generate transcriptions")}
              />
              <CardRow
                icon={ListChecks}
                title="Auto generate summaries"
                body="Auto-generates key points after each call ends."
                control={toggle("callSummaries", "Auto generate summaries")}
              />
            </SettingsCard>

            <SettingsCard>
              <CardRow
                icon={Mic}
                title="Voice agent"
                body={
                  <>
                    Bring your own voice agent or use{" "}
                    <a href="#" className="text-wati-green underline">
                      Astra agent
                    </a>
                  </>
                }
                control={toggle("voiceAgent", "Voice agent")}
              />
            </SettingsCard>
          </>
        )}

        {tab === "groups" && (
          <SettingsCard
            head={
              <CardHead
                icon={UsersRound}
                title="Enable WhatsApp Groups"
                beta
                body="Groups allow adding multiple customers and operators together for easier collaboration."
                control={toggle("whatsappGroups", "Enable WhatsApp Groups")}
              />
            }
          >
            <CardRow
              icon={UsersRound}
              title="Allow operators to create groups"
              body="This will allow operators to create groups and add customers."
              control={toggle("operatorGroups", "Allow operators to create groups")}
            />
          </SettingsCard>
        )}
      </div>
    </div>
  );
}

/** Bordered card: an optional grey head (the feature switch), then its rows. */
function SettingsCard({ head, children }: { head?: ReactNode; children?: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--wati-border-default)]">
      {head}
      {children}
    </div>
  );
}

function CardHead({
  icon: Icon,
  title,
  beta,
  body,
  control,
  children,
}: {
  icon: LucideIcon;
  title: string;
  beta?: boolean;
  body: string;
  control: ReactNode;
  /** Extra settings shown under the head's text. */
  children?: ReactNode;
}) {
  return (
    <div className="border-b border-black/[0.06] bg-[var(--wati-surface-subtle)] px-4 py-3.5 last:border-b-0">
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-wati-green">
          <Icon size={17} strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-[13px] font-semibold text-[#0a0a0a]">
            {title}
            {beta && <BetaBadge />}
          </p>
          <p className={HINT}>{body}</p>
        </div>
        {control}
      </div>
      {children}
    </div>
  );
}

function CardRow({
  icon: Icon,
  title,
  body,
  control,
}: {
  icon: LucideIcon;
  title: string;
  body: ReactNode;
  control: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-black/[0.06] px-4 py-3 last:border-b-0">
      <span className="grid w-9 shrink-0 place-items-center text-black/55">
        <Icon size={17} strokeWidth={1.5} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-[#0a0a0a]">{title}</p>
        <p className={HINT}>{body}</p>
      </div>
      {control}
    </div>
  );
}
