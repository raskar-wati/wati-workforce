"use client";

import { Clock, Megaphone, Users } from "lucide-react";
import { useEffect, useRef } from "react";
import {
  AUDIENCE_SEGMENTS,
  DAILY_MESSAGING_LIMIT,
  CALENDAR_TODAY,
} from "../../../../lib/campaigns-data";
import { useTemplates } from "../../../../lib/templates";
import { CardCtaChip, EvidenceRow, WorkforceCard } from "../../../cards/WorkforceCard";
import { DateChip, EditableTitle, FactRow, SelectChip } from "../../FactChips";

export type BroadcastSetup = {
  name: string;
  audienceId: string;
  /** YYYY-MM-DD */
  date: string;
  time: string;
};

export type BroadcastState = "setup" | "scheduled" | "removed";

/** Half-hour send slots, 8 AM to 10 PM. */
const TIMES = Array.from({ length: 29 }, (_, i) => {
  const mins = 8 * 60 + i * 30;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
});

const DATE_LABEL = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" });

/**
 * Sets up a broadcast for a template, in chat: name, audience, date and time
 * as editable facts, flags only when something will go wrong, then Schedule.
 */
export function BroadcastSetupCard({
  setup,
  templateId,
  templateName,
  state,
  onChange,
  onSchedule,
  onRemove,
}: {
  setup: BroadcastSetup;
  /** The template it sends, once submitted — its Meta status shows here. */
  templateId?: string;
  templateName: string;
  state: BroadcastState;
  onChange: (setup: BroadcastSetup) => void;
  onSchedule: () => void;
  onRemove: () => void;
}) {
  const { getTemplate } = useTemplates();
  // It arrives below the template card, under the fold — bring it up.
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state === "setup") rootRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    // Only on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const templateStatus = templateId ? getTemplate(templateId)?.status : undefined;
  const audience = AUDIENCE_SEGMENTS.find((s) => s.id === setup.audienceId) ?? AUDIENCE_SEGMENTS[0];
  const editable = state === "setup";
  const times = TIMES.includes(setup.time) ? TIMES : [setup.time, ...TIMES];

  const overLimit = audience.contacts > DAILY_MESSAGING_LIMIT;
  const awaitingMeta = templateStatus === "pending-meta";

  return (
    <div ref={rootRef}>
    <WorkforceCard
      icon={<Megaphone size={11} strokeWidth={2.25} />}
      tone={state === "scheduled" ? "info" : state === "removed" ? "neutral" : "neutral"}
      // The broadcast's name leads; the template it sends is context.
      title={
        editable ? (
          <EditableTitle label="Broadcast name" value={setup.name} onChange={(name) => onChange({ ...setup, name })} />
        ) : (
          setup.name
        )
      }
      subtitle={
        state === "scheduled"
          ? `${DATE_LABEL.format(new Date(`${setup.date}T00:00:00`))} · ${setup.time} · ${audience.contacts.toLocaleString("en-IN")} contacts`
          : `Broadcast · ${templateName}`
      }
      state={state === "scheduled" ? "armed" : state === "removed" ? "expired" : undefined}
      stateLabel={state === "scheduled" ? "Scheduled" : state === "removed" ? "Removed" : undefined}
      actions={
        editable ? (
          <>
            <CardCtaChip primary onClick={onSchedule}>
              Schedule broadcast
            </CardCtaChip>
            <button
              type="button"
              onClick={onRemove}
              className="text-[13px] tracking-[-0.078px] text-wati-state-danger-text hover:underline"
            >
              Remove from calendar
            </button>
          </>
        ) : null
      }
    >
      {editable && (
        <dl className="flex flex-col gap-3 pt-1">
          <FactRow label="Audience">
            <div className="flex flex-wrap items-center gap-2">
              <SelectChip
                label="Audience"
                icon={<Users size={11} className="text-black/45" />}
                value={audience.id}
                options={AUDIENCE_SEGMENTS.map((s) => ({ value: s.id, label: s.name }))}
                onChange={(audienceId) => onChange({ ...setup, audienceId })}
              />
              <span className="text-[13px] text-black/55">
                {audience.contacts.toLocaleString("en-IN")} contacts
              </span>
            </div>
            {overLimit && (
              <EvidenceRow verdict="warn">
                Over your daily limit of {DAILY_MESSAGING_LIMIT.toLocaleString("en-IN")}. Some contacts
                won&apos;t receive it.
              </EvidenceRow>
            )}
          </FactRow>
          <FactRow label="Send">
            <div className="flex flex-wrap items-center gap-1.5">
              <DateChip
                label="Send date"
                value={setup.date}
                min={CALENDAR_TODAY}
                onChange={(date) => onChange({ ...setup, date })}
              />
              <SelectChip
                label="Send time"
                icon={<Clock size={11} className="text-black/45" />}
                value={setup.time}
                options={times.map((t) => ({ value: t, label: t }))}
                onChange={(time) => onChange({ ...setup, time })}
              />
            </div>
            {awaitingMeta && <EvidenceRow verdict="info">Sends once Meta approves the template</EvidenceRow>}
          </FactRow>
        </dl>
      )}
    </WorkforceCard>
    </div>
  );
}
