"use client";

import {
  ArrowUpRight,
  CalendarClock,
  Check,
  Hourglass,
  ListChecks,
  OctagonX,
  PencilLine,
  ShieldAlert,
  Stethoscope,
} from "lucide-react";
import MessageMarkdown from "../components/MessageMarkdown";
import {
  CardCtaChip,
  EvidenceRow,
  StatePill,
  WorkforceCard,
  type ObjectState,
} from "../components/cards/WorkforceCard";

/**
 * Design-review gallery for the typed-card family (PRD sub-page 6).
 * Every variant of the WorkforceCard chassis in one place, with demo
 * content — the anatomy reference for design and engineering.
 */

const ALL_STATES: ObjectState[] = ["draft", "live", "pending-meta", "armed", "failed"];

const TOKEN_SWATCHES: { name: string; varName: string }[] = [
  { name: "Green", varName: "--wati-green" },
  { name: "Green hover", varName: "--wati-green-hover" },
  { name: "Green text", varName: "--wati-green-text" },
  { name: "Green soft", varName: "--wati-green-soft" },
  { name: "Border", varName: "--wati-border-default" },
  { name: "Border strong", varName: "--wati-border-strong" },
  { name: "Draft", varName: "--wati-state-draft-bg" },
  { name: "Live", varName: "--wati-state-live-bg" },
  { name: "Pending", varName: "--wati-state-pending-bg" },
  { name: "Armed", varName: "--wati-state-armed-bg" },
  { name: "Danger", varName: "--wati-state-danger-bg" },
];

const MARKDOWN_SAMPLE = `Your **welcome drip** is outperforming the promo track this week.

| Template | Sent | Read rate |
| --- | --- | --- |
| welcome_offer_v2 | 1,204 | 71% |
| festive_promo | 890 | 43% |

Two things worth doing next:
1. Retire \`festive_promo\` — bottom quartile for the third week.
2. Duplicate the welcome template into Hindi (312 Hindi-first contacts).`;

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-[15px] font-semibold tracking-[-0.09px] text-[#0a0a0a]">{title}</h2>
        {hint && <p className="mt-0.5 text-[12px] tracking-[-0.06px] text-black/45">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-wati-surface-subtle px-6 py-10">
      <div className="mx-auto flex w-full max-w-[640px] flex-col gap-10">
        <header>
          <h1 className="text-[20px] font-semibold tracking-[-0.2px] text-[#0a0a0a]">
            Workforce card gallery
          </h1>
          <p className="mt-1 text-[13px] leading-[19px] tracking-[-0.078px] text-black/55">
            One chassis, every variant — the component family from PRD sub-page 6. Header
            grammar (icon + title + state pill), evidence-row grammar, action-row grammar.
          </p>
        </header>

        <Section title="Tokens" hint="globals.css — the only colors cards may use">
          <div className="flex flex-wrap gap-2">
            {TOKEN_SWATCHES.map((s) => (
              <div
                key={s.varName}
                className="flex items-center gap-2 rounded-full border border-wati-border bg-white py-1 pl-1.5 pr-3"
              >
                <span
                  className="h-4 w-4 rounded-full border border-black/10"
                  style={{ background: `var(${s.varName})` }}
                />
                <span className="text-[12px] tracking-[-0.06px] text-black/60">{s.name}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="State pills"
          hint="Receipt/draft object states — DRAFT / LIVE / PENDING META / ARMED (+ failure)"
        >
          <div className="flex flex-wrap items-center gap-2">
            {ALL_STATES.map((s) => (
              <StatePill key={s} state={s} />
            ))}
            <StatePill state="failed" label="Rejected" />
          </div>
        </Section>

        <Section title="Evidence rows" hint="Verdict icon + finding + right-aligned metric">
          <div className="rounded-2xl border border-wati-border bg-white px-5 py-4">
            <div className="flex flex-col gap-2">
              <EvidenceRow verdict="ok" metric="14 rules">
                No shadowing conflicts among active rules
              </EvidenceRow>
              <EvidenceRow verdict="warn" metric="38 msgs/wk">
                Top unhandled keyword: “refund” has no matching rule
              </EvidenceRow>
              <EvidenceRow verdict="blocker">
                Referenced template <strong>order_update_v1</strong> is not approved yet
              </EvidenceRow>
              <EvidenceRow verdict="info" metric="09:00–18:00 IST">
                Business hours configured
              </EvidenceRow>
            </div>
          </div>
        </Section>

        <Section
          title="Run result — draft-first (shipped)"
          hint="AgentActionRun refit onto the chassis; identical to production behavior"
        >
          <WorkforceCard
            tone="draft"
            icon={<PencilLine size={12} strokeWidth={2.5} />}
            title="Re-engagement campaign drafted"
            subtitle="Broadcasts → Drafts"
            note="Draft — needs your approval to go live"
            state="draft"
            actions={
              <>
                <CardCtaChip>
                  Review draft <ArrowUpRight size={12} strokeWidth={2} />
                </CardCtaChip>
                <span className="text-[13px] tracking-[-0.078px] text-black/60">
                  Always do this
                </span>
              </>
            }
          />
        </Section>

        <Section
          title="Run result — gated (shipped)"
          hint="Cannot be promoted to an auto-action; confirmed every run"
        >
          <WorkforceCard
            tone="success"
            icon={<Check size={12} strokeWidth={2.5} />}
            title="Bulk message sent to 46 hot leads"
            subtitle="Inbox → Sent messages"
            actions={
              <>
                <CardCtaChip>
                  View messages <ArrowUpRight size={12} strokeWidth={2} />
                </CardCtaChip>
                <span className="text-[13px] tracking-[-0.078px] text-black/40">
                  Needs your confirmation each run
                </span>
              </>
            }
          />
        </Section>

        <Section
          title="Draft card — dual commit (new)"
          hint="Class A pre-write: dependency list, shadowing verdict, both commit options; defaults to draft"
        >
          <WorkforceCard
            tone="draft"
            icon={<PencilLine size={12} strokeWidth={2.5} />}
            title="Automation rule: route “refund” to Support"
            subtitle="Will create: keyword action “refund” · routing action → Support team"
            state="draft"
            actions={
              <>
                <CardCtaChip primary>Create as draft</CardCtaChip>
                <CardCtaChip>Create and enable</CardCtaChip>
              </>
            }
          >
            <EvidenceRow verdict="ok">No conflicts — “refund” is unclaimed by other rules</EvidenceRow>
            <EvidenceRow verdict="warn">
              Your catch-all rule currently answers these messages; this rule will take priority
            </EvidenceRow>
          </WorkforceCard>
        </Section>

        <Section
          title="Receipt card (new)"
          hint="Post-write: state pill + mandatory deep link + undo affordance; updates in place on state change"
        >
          <WorkforceCard
            tone="success"
            icon={<Check size={12} strokeWidth={2.5} />}
            title="Welcome drip sequence"
            subtitle="Automations → Sequences · created just now"
            state="live"
            actions={
              <>
                <CardCtaChip>
                  Open in Automations <ArrowUpRight size={12} strokeWidth={2} />
                </CardCtaChip>
                <button
                  type="button"
                  className="text-[13px] tracking-[-0.078px] text-black/60 hover:text-[#0a0a0a]"
                >
                  Disable
                </button>
              </>
            }
          />
        </Section>

        <Section
          title="Waiting-state card (new)"
          hint="External decision pending; self-resolves — dependent drafts show it as a blocker"
        >
          <WorkforceCard
            tone="info"
            icon={<Hourglass size={12} strokeWidth={2.5} />}
            title="Template “order_update_v1” submitted to Meta"
            subtitle="Typically resolves within 48 hours — I'll update this card and notify you"
            state="pending-meta"
            actions={
              <CardCtaChip>
                Track in Templates <ArrowUpRight size={12} strokeWidth={2} />
              </CardCtaChip>
            }
          />
        </Section>

        <Section
          title="Diagnostic card (new)"
          hint="dry_run / shadowing audit / validation: verdict rows + suggested-fix action chip"
        >
          <WorkforceCard
            tone="info"
            icon={<Stethoscope size={12} strokeWidth={2.5} />}
            title="Shadowing audit — 14 active rules"
            subtitle="Automations → Rules"
            actions={<CardCtaChip primary>Fix rule order</CardCtaChip>}
          >
            <EvidenceRow verdict="blocker" metric="212 msgs/wk">
              “Hi” catch-all fires before 3 keyword rules — they can never match
            </EvidenceRow>
            <EvidenceRow verdict="warn" metric="2 rules">
              Two rules match “order status” — first one wins, second is dead
            </EvidenceRow>
            <EvidenceRow verdict="ok">Remaining 9 rules are reachable</EvidenceRow>
          </WorkforceCard>
        </Section>

        <Section
          title="Plan / partial-state card (new)"
          hint="wati_create_with_dependencies: created objects, failed step + reason, resume for the remainder"
        >
          <WorkforceCard
            tone="danger"
            icon={<ListChecks size={12} strokeWidth={2.5} />}
            title="Lead-routing setup stopped at step 3 of 4"
            subtitle="2 objects created, 1 failed, 1 not started"
            actions={
              <>
                <CardCtaChip primary>Resume remaining steps</CardCtaChip>
                <CardCtaChip>
                  View created objects <ArrowUpRight size={12} strokeWidth={2} />
                </CardCtaChip>
              </>
            }
          >
            <EvidenceRow verdict="ok">Team “Sales” created</EvidenceRow>
            <EvidenceRow verdict="ok">Routing action → Sales created</EvidenceRow>
            <EvidenceRow verdict="blocker">
              Notification action failed — server: operator limit reached on your plan
            </EvidenceRow>
            <EvidenceRow verdict="info">Rule “route new leads” not created yet</EvidenceRow>
          </WorkforceCard>
        </Section>

        <Section
          title="Denial card — role-denied (new)"
          hint="One of four defined denial renderings; draft attached, never a raw error"
        >
          <WorkforceCard
            tone="danger"
            icon={<ShieldAlert size={12} strokeWidth={2.5} />}
            title="Creating this rule needs an admin"
            subtitle="I've kept the full draft — share it with someone who can enable it"
            note="Your role can draft content but not create objects"
            actions={
              <>
                <CardCtaChip primary>Share draft</CardCtaChip>
                <CardCtaChip>Copy rule details</CardCtaChip>
              </>
            }
          />
        </Section>

        <Section
          title="Confirmation card — Class C (new)"
          hint="Immediate-effect action: states exactly what happens, confirmed before execution"
        >
          <WorkforceCard
            tone="info"
            icon={<CalendarClock size={12} strokeWidth={2.5} />}
            title="Schedule broadcast “Diwali preview” for Oct 18, 10:00 IST?"
            subtitle="1,204 recipients · estimated cost ₹1,082 · template festive_promo (approved)"
            state="armed"
            stateLabel="Will arm"
            actions={
              <>
                <CardCtaChip primary>Confirm &amp; schedule</CardCtaChip>
                <CardCtaChip>Not now</CardCtaChip>
              </>
            }
          />
        </Section>

        <Section
          title="Answer markdown (fixed)"
          hint="Chat answers now render GFM — narrative + table, per the answer-card anatomy"
        >
          <div className="rounded-2xl border border-wati-border bg-white px-5 py-4">
            <MessageMarkdown content={MARKDOWN_SAMPLE} />
          </div>
        </Section>
      </div>
    </div>
  );
}
