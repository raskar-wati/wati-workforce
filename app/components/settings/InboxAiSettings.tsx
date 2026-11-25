"use client";

import {
  ImagePlus,
  PenLine,
  Smile,
  SquareMousePointer,
  Star,
  WrapText,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import {
  useAskWatiSettings,
  type InboxAiToggle,
} from "../../lib/ask-wati-settings";
import { Switch } from "../ui/Switch";
import { BTN, BTN_PRIMARY, HINT, INPUT, LIST } from "./settings-styles";

type ToggleRow = { id: InboxAiToggle; icon: LucideIcon; title: string; body: string };

const SECTIONS: { title: string; rows: ToggleRow[] }[] = [
  {
    title: "CX Score",
    rows: [
      {
        id: "autoRating",
        icon: Star,
        title: "Automatic rating",
        body: "Wati AI will rate any new eligible conversations after being switched on",
      },
      {
        id: "manualRating",
        icon: ImagePlus,
        title: "Manual rating",
        body: "Allow Admins to manually trigger Wati AI to rate a Solved/Expired conversation",
      },
    ],
  },
  {
    title: "Conversation summary",
    rows: [
      {
        id: "autoSummary",
        icon: WrapText,
        title: "Automatic summaries in Team inbox",
        body: "Wati AI will automatically log summaries and action items for you",
      },
      {
        id: "manualSummary",
        icon: SquareMousePointer,
        title: "Manual summary generation",
        body: "Allow Admins and Operators to manually trigger Wati AI to summarise a conversation",
      },
    ],
  },
];

const ROW = "flex items-start gap-3 border-b border-black/[0.06] px-4 py-3.5 last:border-b-0";

/**
 * Wati AI features inside the Team inbox: CX score, summaries, brand tone
 * and the AI editor. Shown in the Wati AI settings pop-up and on the Team
 * inbox Settings page; both read the same store.
 */
export function InboxAiSettings({ heading = true }: { heading?: boolean }) {
  const { inboxAi, setInboxAi } = useAskWatiSettings();

  return (
    <div className="flex flex-col gap-6">
      {heading && (
        <div>
          <h3 className="text-[14px] font-medium tracking-[-0.084px] text-[#0a0a0a]">
            Team inbox
          </h3>
          <p className={`${HINT} mt-0.5`}>
            Works across your connected channels, including WhatsApp and Instagram.
          </p>
        </div>
      )}

      {SECTIONS.map((section) => (
        <section key={section.title}>
          <SectionLabel>{section.title}</SectionLabel>
          <div className={LIST}>
            {section.rows.map((row) => (
              <SettingRow key={row.id} icon={row.icon} title={row.title} body={row.body}>
                <Switch
                  checked={inboxAi[row.id]}
                  onChange={(v) => setInboxAi({ [row.id]: v })}
                  label={row.title}
                />
              </SettingRow>
            ))}
          </div>
        </section>
      ))}

      <section>
        <SectionLabel>Writing</SectionLabel>
        <div className={LIST}>
          <BrandToneRow />
          <SettingRow
            icon={PenLine}
            title="AI editor in Team inbox"
            body="Let Wati AI help you draft replies, fix grammar and more"
          >
            <Switch
              checked={inboxAi.aiEditor}
              onChange={(v) => setInboxAi({ aiEditor: v })}
              label="AI editor in Team inbox"
            />
          </SettingRow>
        </div>
      </section>
    </div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <p className="mb-2 text-[12px] font-medium text-black/60">{children}</p>;
}

function SettingRow({
  icon: Icon,
  title,
  body,
  children,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={ROW}>
      <Icon size={17} strokeWidth={1.5} className="mt-0.5 shrink-0 text-black/55" />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-[#0a0a0a]">{title}</p>
        <p className={HINT}>{body}</p>
      </div>
      <div className="shrink-0 pt-0.5">{children}</div>
    </div>
  );
}

function BrandToneRow() {
  const { inboxAi, setInboxAi } = useAskWatiSettings();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(inboxAi.brandTone);

  return (
    <div className={`${ROW} flex-col !items-stretch`}>
      <div className="flex items-start gap-3">
        <Smile size={17} strokeWidth={1.5} className="mt-0.5 shrink-0 text-black/55" />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-[#0a0a0a]">Brand tone</p>
          <p className={HINT}>
            {inboxAi.brandTone && !editing
              ? inboxAi.brandTone
              : "Teach Wati AI to follow your brand's tone"}
          </p>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => {
              setDraft(inboxAi.brandTone);
              setEditing(true);
            }}
            className="shrink-0 text-[13px] font-medium text-wati-green hover:underline"
          >
            Edit
          </button>
        )}
      </div>
      {editing && (
        <div className="ml-[29px] mt-3 flex flex-col gap-2">
          <textarea
            autoFocus
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g. Warm and friendly, short sentences, no jargon. Sign off with the agent's first name."
            className={`${INPUT} resize-none`}
          />
          <div className="flex justify-end gap-2">
            <button type="button" className={BTN} onClick={() => setEditing(false)}>
              Cancel
            </button>
            <button
              type="button"
              className={BTN_PRIMARY}
              onClick={() => {
                setInboxAi({ brandTone: draft.trim() });
                setEditing(false);
              }}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
