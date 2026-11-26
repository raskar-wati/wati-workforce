"use client";

import { Check, Info } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Switch } from "../ui/Switch";
import { HINT } from "./settings-styles";

type Rule = "load" | "no-response" | "owner";

/**
 * Settings > Workspace > Chat Assignment: who gets a new chat. Contact
 * owner sync, round-robin, reassignment rules and operator eligibility.
 */
export function ChatAssignmentSettings() {
  const [ownerSync, setOwnerSync] = useState(true);
  const [roundRobin, setRoundRobin] = useState(true);
  const [rule, setRule] = useState<Rule>("load");
  const [chatLimit, setChatLimit] = useState(10);
  const [noReplyMins, setNoReplyMins] = useState(10);
  const [eligibility, setEligibility] = useState({
    admins: false,
    outsideHours: false,
    skipOffline: true,
  });

  return (
    <div className="flex max-w-[640px] flex-col gap-4">
      <p className="-mt-5 text-[13px] text-black/60">
        Decide who new chats go to, and when they move to someone else.
      </p>

      <div className="flex items-center gap-3 rounded-xl bg-[var(--wati-surface-subtle)] px-4 py-3.5">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-[#0a0a0a]">
            Keep contact owner and assignee in sync
          </p>
          <p className={HINT}>
            Chats route to the contact&apos;s owner, with assignee and owner
            kept in sync automatically.
          </p>
        </div>
        <Switch
          checked={ownerSync}
          onChange={setOwnerSync}
          label="Keep contact owner and assignee in sync"
        />
      </div>

      <div className="flex flex-col gap-4 rounded-xl bg-[var(--wati-surface-subtle)] p-4">
        <div className="flex items-center gap-3">
          <span className="flex-1 text-[13px] font-semibold text-[#0a0a0a]">
            Assign to users of the team in round-robin
          </span>
          <Switch
            checked={roundRobin}
            onChange={setRoundRobin}
            label="Assign to users of the team in round-robin"
          />
        </div>

        <div
          className={`flex flex-col gap-2 ${roundRobin ? "" : "pointer-events-none opacity-50"}`}
        >
          <div className="flex items-center gap-2">
            <GroupLabel>Reassignment rules</GroupLabel>
            <span className="rounded-full bg-red-50 px-2 py-px text-[11px] font-medium text-red-600">
              New
            </span>
            <InfoTip label="Reassignment rules" />
          </div>
          <div className="flex flex-col gap-2">
            <RuleCard
              selected={rule === "load"}
              onSelect={() => setRule("load")}
              title="Load based routing"
              info
            >
              Default limit for new operators
              <NumberField
                value={chatLimit}
                onChange={setChatLimit}
                label="Open chat limit"
              />
              open chats
            </RuleCard>
            <RuleCard
              selected={rule === "no-response"}
              onSelect={() => setRule("no-response")}
              title="Auto-reassign on no response"
              info
            >
              Reassign if there&apos;s no reply within
              <NumberField
                value={noReplyMins}
                onChange={setNoReplyMins}
                label="Minutes"
              />
              minutes
            </RuleCard>
            <RuleCard
              selected={rule === "owner"}
              onSelect={() => setRule("owner")}
              title="Direct lead to contact owner"
            />
          </div>

          <div className="mt-2 flex items-center gap-2">
            <GroupLabel>Operator eligibility</GroupLabel>
            <InfoTip label="Operator eligibility" />
          </div>
          <div className="flex flex-col gap-3 rounded-xl border border-[var(--wati-border-default)] bg-white p-4">
            <Checkbox
              checked={eligibility.admins}
              onChange={(v) => setEligibility((e) => ({ ...e, admins: v }))}
            >
              Also assign chats to admins
            </Checkbox>
            <Checkbox
              checked={eligibility.outsideHours}
              onChange={(v) =>
                setEligibility((e) => ({ ...e, outsideHours: v }))
              }
            >
              Assign even if outside working hours
            </Checkbox>
            <Checkbox
              checked={eligibility.skipOffline}
              onChange={(v) =>
                setEligibility((e) => ({ ...e, skipOffline: v }))
              }
            >
              Skip users that are offline during assignment
            </Checkbox>
          </div>
        </div>
      </div>
    </div>
  );
}

function GroupLabel({ children }: { children: string }) {
  return (
    <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-black/50">
      {children}
    </span>
  );
}

function InfoTip({ label }: { label: string }) {
  return (
    <span title={label} className="text-black/40">
      <Info size={14} strokeWidth={1.75} />
    </span>
  );
}

function Checkbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-[#353735]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={`grid size-4 shrink-0 place-items-center rounded border peer-focus-visible:outline-2 peer-focus-visible:outline-[#1570EF] ${
          checked
            ? "border-wati-green bg-wati-green text-white"
            : "border-black/30 bg-white"
        }`}
      >
        {checked && <Check size={11} strokeWidth={3} />}
      </span>
      {children}
    </label>
  );
}

function RuleCard({
  selected,
  onSelect,
  title,
  info,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  info?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[var(--wati-border-default)] bg-white px-4 py-3">
      <label className="flex cursor-pointer items-center gap-2.5">
        <input
          type="radio"
          name="reassignment-rule"
          checked={selected}
          onChange={onSelect}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className={`grid size-4 shrink-0 place-items-center rounded-full border-[1.5px] ${
            selected ? "border-wati-green" : "border-black/35"
          }`}
        >
          {selected && <span className="size-2 rounded-full bg-wati-green" />}
        </span>
        <span className="text-[13px] font-medium text-[#0a0a0a]">{title}</span>
        {info && <InfoTip label={title} />}
      </label>
      {children && (
        <p className="mt-2 flex flex-wrap items-center gap-2 pl-[26px] text-[13px] text-black/60">
          {children}
        </p>
      )}
    </div>
  );
}

function NumberField({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <input
      type="number"
      min={1}
      aria-label={label}
      value={value}
      onChange={(e) => onChange(Math.max(1, Number(e.target.value) || 1))}
      className="h-7 w-16 rounded-lg border border-[var(--wati-border-default)] bg-white px-2 text-[13px] text-[#0a0a0a] outline-none focus:border-[#1570EF]"
    />
  );
}
