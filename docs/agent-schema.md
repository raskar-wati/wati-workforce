# The Agent Schema

**One input shape, one output skeleton, for all seven Workforce agents.**

Status: proposal (design-owned) · Prototype: this repo, `/roster` reference page · Last updated: 2026-07-17

Every Workforce agent — Daily Digest plus the six creatable watchers (Hot Leads, Top Topics, Urgency Watcher, Response SLA, Delivery Issues, WhatsApp Ad Leads) — follows the same skeleton: a fixed **input schema** (what the agent needs before it can run) and a fixed **output skeleton** (the shape every report takes). Users can't create agent types we don't offer; free-typed instructions are matched against the roster with honest fallbacks instead of silently producing a hollow agent.

This document is the contract. The prototype (`wati-workforce.vercel.app`) is the canonical rendering of it.

---

## 1. Input schema — six slots, three authors

Every agent is fully described by six slots. The memorable compression: **the template writes 1–2, the user chooses 3–5, the machine prints 6.**

| # | Slot | Author | Contents | In the prototype |
|---|------|--------|----------|------------------|
| 1 | **Role** | Template (fixed) | Type id, label, one-line blurb, the signals it watches, match hints (what free text maps to it), and its report blueprint | `WatcherTypeDef` in `app/lib/watcher-types.ts` |
| 2 | **Grounding** | System (declared) | Tenant signal profile (top themes, dominant signal types, emergent themes) and inbox stats the agent reads each run | `tenant-signal-profile.tsx`, `inbox-context.tsx` — consumed silently today; the schema makes it a declared slot |
| 3 | **Permissions** | User | Achievements chosen at creation → the actions the agent may *propose*; auto-actions the user has pre-approved (governance Class A/B only — Class C can never be auto) | `actions`, `autoActions` on `Agent` |
| 4 | **Schedule** | User | Once / daily / weekly / every-other-day / custom description | `AgentSchedule` |
| 5 | **Identity** | User | Name, avatar, model label (cosmetic) | `name`, `avatarSeed`, `model` |
| 6 | **Brief** | Generated | The agent's instructions, printed from slots 1–5. Regenerates whenever a slot changes. The only free text is one bounded **focus note** ("emphasize weekend bookings") injected into the watch section | `generateInstructions()` in `agent-instructions.ts` |

**Why slot 6 is generated, not typed.** Editable instructions drift from the template and invite users to type jobs the agent can't do. Making the brief a printout of the packet keeps it always true; the focus note preserves legitimate customization without opening the job description itself.

**Why slot 2 is declared.** The tenant profile already decides which agents get suggested. Declaring it lets every agent cite its grounding ("your workspace shows 124 rising same-week requests") — the honesty layer stakeholders will ask about.

---

## 2. Free-text guardrail — the matching ladder

Custom agents are not supported. When a user types instructions instead of picking from the roster, the text is scored against every active type's match hints and lands on one of three rungs:

```
User types free text (agent mode)
│
├── entry already carries a type (suggestion chip, template shelf) → straight to creation
│
└── score text against the roster's match hints
    │
    ├── CONFIDENT — one type clearly ahead
    │     "Sounds like a job for Hot Leads."
    │     Prefilled confirm → normal 3-step creation. Escape hatch: "see all types".
    │
    ├── AMBIGUOUS — two or three types close
    │     "This could be one of these" — closest types with blurbs, plus "none of these".
    │
    └── NO MATCH
          "That's not something I can watch yet."
          Shows the full roster · files the verbatim request as a role request
          (feedback signal) · creates NOTHING. No hollow agents.
```

Contract: the matcher returns `{typeId, score}[]`. The prototype scores keyword hits (strong hint = 2, weak = 1); production can swap in an LLM classifier that reads the same match hints and blurbs off the type definitions — the roster **is** the classifier prompt. This follows the PRD §3.3 pattern (schemas self-describe what's constructible, keeping the matcher thin).

Retired: the `custom` type. It produced agents with no real watch logic and a faked "no matches" finding — exactly the failure the ladder prevents. The id survives (parked) so persisted demos don't break; no path creates a new one.

---

## 3. Output skeleton — the handoff

Every run of every agent produces one handoff with the same four parts:

```
Handoff
├─ STAMP       runAt, run number
├─ COVERAGE    exactly one "did" section, two items, rendered as one paragraph.
│              Mandatory on every run, including day-0 — this is the trust line
│              ("Analyzed 1,247 conversations from the last 24h…").
├─ FINDINGS    exactly one "attention" section — a TYPED TABLE, 1–5 rows.
│              Fixed column roles for every agent:
│                SUBJECT · FINDING · MEASURE · SOURCE · ACTION
│              Column labels are named per agent type in its blueprint
│              (Hot Leads: Contact/Signal/Strength/Source; Delivery:
│              Courier/Issue/Complaints/Zone; …). Narrow surfaces (the
│              drawer, <512px) collapse the table to a stacked layout —
│              subject + finding as the line, source · measure right-aligned.
│              ─ OR ─
│              ALL CLEAR   an explicit zero-findings state with a note.
│              Phantom findings ("No actionable matches" as a finding row) are banned.
└─ ACTION ROW  2–3 footer CTAs, filtered to the agent's Permissions slot.
               Every CTA carries its governance class:
               A — prepared as a draft, human approves activation
               B — created inert, no effect until referenced
               C — immediate effect, confirmed every time, never auto
```

Rules:

- **Coverage before findings, always.** An agent that reports findings without coverage is asking for trust it hasn't earned.
- **Evidence lives in the Measure and Source columns.** A finding that can't fill them is an opinion — the table enforces the evidence rule structurally. Per-row Actions (act on one finding vs. the whole cohort) live in the Action column.
- **Force-fit is the discipline.** Every agent — current and future — must express findings as rows in the five fixed roles; only the column labels vary. If a proposed agent's output can't fill Subject + Measure, that's a spec smell to resolve before it ships.
- **The action row can only propose what the badge permits** (`filterHandoffByAchievements`), and every action inherits the A/B/C approval sequence from the governance layer — the handoff never executes anything by itself.
- The `summary` section kind is **retired** (defined and styled today, produced by nothing; All Clear covers its only job).

**Known deviations, flagged not hidden:**

1. **Daily Digest** renders `DailyDigestData` (hero metrics / top performers / trending topics), not a handoff. Semantically it is the same skeleton — coverage ("summarized yesterday's N conversations"), findings (trending topics with deltas), action row — presented as a dashboard because it is the pinned system agent. Explicitly parked; it gets its own design pass later.

---

## 4. Proposed vocabulary (severable analogy layer)

The schema stands on the neutral names above. If we adopt a single metaphor for decks and specs, the employment frame is the leading candidate — the product already speaks it (Workforce, hiring, handoff; the PRD notes draft-first "mirrors the agent's own lifecycle — created Paused → human activates"). Adopting or dropping this table changes no schema semantics.

| Neutral term | Analogy term | One-liner |
|---|---|---|
| Agent type template | **Role Card** | The job description for an open role |
| The 7 supported agents | **The Roster** | The roles currently open |
| Parked types | Future openings | Written, not yet hiring |
| Agent instance | **A Hire** | A team member in a role |
| Input schema | **Hiring Packet** | Everything a hire needs on day one |
| Grounding slot | Onboarding pack | Workplace context they're handed |
| Permissions slot | Access badge | What doors their badge opens |
| Schedule slot | Shift | When they work |
| Brief slot | Working brief | Printed from the packet, never hand-typed |
| Free-text guardrail | **The Recruiter** | Matches your ask against open roles; files unmet asks with HQ |
| Handoff | **Shift report** | Filed at the end of every shift |
| Coverage | "What I worked through" | The report's trust line |
| Findings / All clear | "Needs a human" / "All clear" | Evidence-backed, or honestly empty |
| Action row | Sign-off requests | Work prepared for the manager's signature |
| Approval queue | Sign-off tray | Where prepared work waits |
| Daily Digest | The morning standup | Reports to everyone, hired by no one |

Pitch line: *"You don't program these agents — you hire them into one of seven roles, hand them a badge and a shift, and they file a shift report you sign off on."*

---

## 5. What's PRD-backed vs. what this doc proposes

| PRD-backed — cite it | This doc's proposal — own it |
|---|---|
| The out-of-box roster is exactly seven agents (UI Spec sub-page 6) | The six-slot input schema (grouping and naming) |
| Handoff as the agent's report artifact | Coverage/Findings/All-Clear/Action-Row formalization; retiring `summary`; banning phantom findings |
| Governance classes A/B/C and the approval model (reads autonomous; data writes conversational; builder writes draft-first; scheduled sends restate count + cost before arming) | CTAs visibly carrying their class inside the report skeleton |
| Draft-first mirrors the agent lifecycle (created Paused → human activates) | Extending the employment frame into a full vocabulary |
| §3.3: schemas self-describe what's constructible | The matcher reading match hints off the type definitions |
| No skill ships without an approved Skill Spec + eval bank | "No agent type ships without a Role Card" — same culture, one level up |
| Hiring gated to admins; one agent per thread *(v1 PRD, secondhand — re-cite when accessible)* | The three-rung ladder; retiring custom; role-request feedback capture; generated brief + focus note; grounding as a declared slot |

---

## 6. Reference

- **Prototype contract page:** `/roster` — all seven role cards, the ladder states, and the annotated handoff skeleton.
- **Code anchors:** `app/lib/watcher-types.ts` (types + match hints + matcher), `app/lib/agent-instructions.ts` (brief printer), `app/lib/agents.tsx` (agent + handoff types, approval queues), `app/lib/agent-actions.ts` (governance classes), `app/lib/role-requests.ts` (captured no-match asks).
- **Open items:** analogy adoption decision · Daily Digest → handoff mapping (parked) · re-cite v1 PRD facts.
