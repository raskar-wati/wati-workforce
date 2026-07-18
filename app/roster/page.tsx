"use client";

import { CalendarClock, Sun } from "lucide-react";
import { getActionScript, type GovernanceClass } from "../lib/agent-actions";
import type { HandoffCta, WatcherTypeId } from "../lib/agents";
import {
  ACTIVE_WATCHER_TYPES,
  getWatcherType,
  type WatcherTypeDef,
} from "../lib/watcher-types";
import { WatcherMatchCard } from "../components/agents/WatcherMatchCard";
import { FindingsTable } from "../components/cards/FindingsTable";

/**
 * The contract page for docs/agent-schema.md: the seven-agent roster, the
 * six-slot input schema, the free-text matching ladder, and the annotated
 * output skeleton — the stakeholder walkthrough surface and the engineering
 * reference in one place.
 */

const ROSTER_ORDER: WatcherTypeId[] = [
  "urgency",
  "ready-to-buy",
  "delivery-issue",
  "paid-acq",
  "top-topics",
  "response-gap",
];

const INPUT_SLOTS: {
  n: number;
  name: string;
  author: string;
  contents: string;
}[] = [
  {
    n: 1,
    name: "Role",
    author: "Template",
    contents:
      "Type id, label, blurb, signals watched, match hints, report blueprint",
  },
  {
    n: 2,
    name: "Grounding",
    author: "System",
    contents:
      "Tenant signal profile (themes, signal types) + inbox stats — declared, not implicit",
  },
  {
    n: 3,
    name: "Permissions",
    author: "User",
    contents:
      "Achievements → actions the agent may propose. Auto-actions parked — every run starts from a human tap",
  },
  {
    n: 4,
    name: "Schedule",
    author: "User",
    contents: "Once / daily / weekly / every other day / custom",
  },
  { n: 5, name: "Identity", author: "User", contents: "Name, avatar, model label" },
  {
    n: 6,
    name: "Brief",
    author: "Generated",
    contents:
      "Instructions printed from slots 1–5; regenerate on any change; one bounded focus note",
  },
];

const GOVERNANCE_LABEL: Record<GovernanceClass, string> = {
  read: "Read — autonomous",
  A: "Class A — draft-first, human activates",
  B: "Class B — inert until referenced",
  C: "Class C — immediate effect, confirm every time",
};

export default function RosterPage() {
  return (
    <div className="min-h-screen bg-wati-surface-subtle px-6 py-10">
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-10">
        <header>
          <h1 className="text-[20px] font-semibold tracking-[-0.2px] text-[#0a0a0a]">
            Agent roster &amp; schema
          </h1>
          <p className="mt-1 text-[13px] leading-[19px] tracking-[-0.078px] text-black/55">
            The contract page for <code>docs/agent-schema.md</code>: seven
            agents, one input shape, one output skeleton. Users can&apos;t
            create types that aren&apos;t on this page — free text runs the
            matching ladder below.
          </p>
        </header>

        <Section
          title="Input schema — six slots, three authors"
          hint="The template writes 1–2, the user chooses 3–5, the machine prints 6"
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-2xl border border-wati-border bg-wati-border">
            {INPUT_SLOTS.map((slot) => (
              <div key={slot.n} className="flex items-start gap-3 bg-white px-4 py-3">
                <span className="w-4 shrink-0 pt-px text-[13px] tabular-nums text-black/40">
                  {slot.n}
                </span>
                <span className="w-[96px] shrink-0 text-[13px] font-medium tracking-[-0.078px] text-[#0a0a0a]">
                  {slot.name}
                </span>
                <span className="w-[80px] shrink-0">
                  <AuthorPill author={slot.author} />
                </span>
                <span className="min-w-0 flex-1 text-[12px] leading-[17px] tracking-[-0.06px] text-black/60">
                  {slot.contents}
                </span>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="The roster — seven agents"
          hint="Daily Digest is the pinned system agent; the other six are creatable templates"
        >
          <div className="flex flex-col gap-3">
            <DailyDigestCard />
            {ROSTER_ORDER.map((id) => (
              <RoleCard key={id} def={getWatcherType(id)} />
            ))}
          </div>
        </Section>

        <Section
          title="Free-text matching ladder"
          hint="Typed instructions score against the roster's match hints — three outcomes, none of them a hollow custom agent"
        >
          <LadderState
            label="Confident — one type clearly ahead"
            example="“watch for customers ready to buy”"
          >
            <WatcherMatchCard
              match={{ tier: "confident", typeId: "ready-to-buy" }}
              onPick={() => {}}
              onNone={() => {}}
            />
          </LadderState>
          <LadderState
            label="Ambiguous — closest matches offered"
            example="“urgent delivery complaints”"
          >
            <WatcherMatchCard
              match={{ tier: "ambiguous", typeIds: ["delivery-issue", "urgency"] }}
              onPick={() => {}}
              onNone={() => {}}
            />
          </LadderState>
          <LadderState
            label="No match — honest denial, request captured, nothing created"
            example="“monitor competitor prices”"
          >
            <WatcherMatchCard
              match={{ tier: "none" }}
              onPick={() => {}}
              onNone={() => {}}
            />
          </LadderState>
        </Section>

        <Section
          title="Output skeleton — the handoff"
          hint="Every run of every agent: coverage → findings (or all clear) → action row. Example below is Hot Leads' blueprint."
        >
          <OutputSkeleton def={getWatcherType("ready-to-buy")} />
        </Section>

        <footer className="pb-4 text-[12px] leading-[17px] tracking-[-0.06px] text-black/45">
          Known deviations (flagged in the spec, not silently absorbed): Daily
          Digest renders its report as a dashboard rather than a handoff;
          per-finding inline actions and agent auto-runs are modeled but
          deferred from first launch — the footer action block is the only
          CTA surface, and every run starts from a human tap.
        </footer>
      </div>
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-[15px] font-semibold tracking-[-0.09px] text-[#0a0a0a]">
          {title}
        </h2>
        {hint && (
          <p className="mt-0.5 text-[12px] tracking-[-0.06px] text-black/45">{hint}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function AuthorPill({ author }: { author: string }) {
  const tone =
    author === "Template"
      ? "bg-wati-state-pending-bg text-wati-state-pending-text"
      : author === "Generated"
        ? "bg-wati-green-soft text-wati-green-text"
        : author === "System"
          ? "bg-wati-chip-bg text-black/55"
          : "bg-wati-state-draft-bg text-wati-state-draft-text";
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.02em] ${tone}`}
    >
      {author}
    </span>
  );
}

function DailyDigestCard() {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-wati-border bg-white px-5 py-4">
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-wati-chip-bg text-black/55">
          <Sun size={12} strokeWidth={2.5} />
        </span>
        <p className="flex-1 text-[13px] font-medium tracking-[-0.078px] text-[#0a0a0a]">
          Daily Digest
        </p>
        <span className="rounded-full bg-wati-chip-bg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.02em] text-black/55">
          System agent
        </span>
      </div>
      <p className="text-[12px] leading-[17px] tracking-[-0.06px] text-black/60">
        Summarizes yesterday&apos;s conversations for everyone — pinned, not
        creatable, not matched by the ladder. Same semantic skeleton
        (coverage / findings / action row) presented as a dashboard; mapping
        it onto the handoff type is deferred work.
      </p>
    </div>
  );
}

function RoleCard({ def }: { def: WatcherTypeDef }) {
  const blueprint = def.buildDraft();
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-wati-border bg-white px-5 py-4">
      <div className="flex items-baseline gap-2">
        <p className="text-[13px] font-medium tracking-[-0.078px] text-[#0a0a0a]">
          {def.label}
        </p>
        <span className="text-[12px] tracking-[-0.06px] text-black/40">
          {def.defaultName}
        </span>
      </div>
      <p className="text-[12px] leading-[17px] tracking-[-0.06px] text-black/60">
        {def.blurb}
      </p>
      <div className="flex flex-col gap-1.5">
        <HintRow label="Matches on" values={def.matchHints.strong} strong />
        {def.matchHints.weak.length > 0 && (
          <HintRow label="Leans on" values={def.matchHints.weak} />
        )}
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-black/40">
          Default action row
        </p>
        <div className="flex flex-wrap gap-1.5">
          {blueprint.ctas.map((c) => (
            <GovernanceChip key={c.id} cta={c} />
          ))}
        </div>
      </div>
    </div>
  );
}

function HintRow({
  label,
  values,
  strong = false,
}: {
  label: string;
  values: readonly string[];
  strong?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="w-[72px] shrink-0 pt-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-black/40">
        {label}
      </span>
      <div className="flex min-w-0 flex-wrap gap-1">
        {values.map((v) => (
          <span
            key={v}
            className={`rounded-full px-2 py-0.5 text-[11px] tracking-[-0.055px] ${
              strong
                ? "bg-wati-green-soft text-wati-green-text"
                : "bg-wati-chip-bg text-black/55"
            }`}
          >
            {v}
          </span>
        ))}
      </div>
    </div>
  );
}

function GovernanceChip({ cta }: { cta: HandoffCta }) {
  const { governance } = getActionScript(cta.action);
  return (
    <span
      title={GOVERNANCE_LABEL[governance]}
      className="inline-flex items-center gap-1.5 rounded-full border border-wati-border bg-white px-2.5 py-1 text-[11px] tracking-[-0.055px] text-[#0a0a0a]"
    >
      {cta.label}
      <span className="rounded-full bg-wati-chip-bg px-1.5 text-[10px] font-semibold uppercase text-black/50">
        {governance === "read" ? "R" : governance}
      </span>
    </span>
  );
}

function LadderState({
  label,
  example,
  children,
}: {
  label: string;
  example: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[12px] tracking-[-0.06px] text-black/55">
        <span className="font-medium text-[#0a0a0a]">{label}</span> · e.g.{" "}
        {example}
      </p>
      {children}
    </div>
  );
}

function OutputSkeleton({ def }: { def: WatcherTypeDef }) {
  const draft = def.buildDraft();
  const did = draft.sections.find((s) => s.kind === "did");
  const attention = draft.sections.find((s) => s.kind === "attention");
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-wati-border bg-white px-5 py-4">
      <SkeletonSlot name="Stamp" note="run time + run number">
        <p className="flex items-center gap-1.5 text-[12px] tracking-[-0.06px] text-black/50">
          <CalendarClock size={12} strokeWidth={2} />
          Handoff #4 · 17 Jul, 5:30 AM
        </p>
      </SkeletonSlot>
      {did && (
        <SkeletonSlot
          name="Coverage"
          note="mandatory every run, day-0 included — the trust line"
        >
          <p className="text-[13px] leading-[19px] tracking-[-0.078px] text-black/70">
            {did.items.map((i) => i.label).join(". ")}.
          </p>
        </SkeletonSlot>
      )}
      {attention && (
        <SkeletonSlot
          name="Findings"
          note="a typed table — fixed column roles, headers named per agent type — or an explicit All Clear"
        >
          <FindingsTable items={attention.items} columns={attention.columns} />
        </SkeletonSlot>
      )}
      <SkeletonSlot
        name="Action row"
        note="2–3 proposals, filtered by Permissions, each carrying its governance class"
      >
        <div className="flex flex-wrap gap-1.5">
          {draft.ctas.map((c) => (
            <GovernanceChip key={c.id} cta={c} />
          ))}
        </div>
      </SkeletonSlot>
    </div>
  );
}

function SkeletonSlot({
  name,
  note,
  children,
}: {
  name: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 border-l-2 border-wati-border pl-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-black/40">
        {name} <span className="font-normal normal-case text-black/40">— {note}</span>
      </p>
      {children}
    </div>
  );
}
