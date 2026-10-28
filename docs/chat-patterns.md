# Chat use-case patterns

Running list of the UI and flow patterns the chat use cases share. The use
cases are built first; after about three, the patterns that recur get pulled
into shared components. Until then, each use case lives in its own folder
under `app/components/chat/usecases/`.

Legend: **Seen in**: which use cases use it so far. **Lives in**: where it
is today.

## Flow patterns

### Draft first, ask later
Wati makes a complete first version from the ask, using defaults it can infer,
and only asks a question when it can't infer the answer.
- Seen in: template
- Lives in: `lib/template-draft.ts` (`draftTemplate`, `detectPurpose`)

### One clarifying question, as chips
When the ask is too vague, Wati asks a single question with 3–4 answer chips.
Typing an answer works the same as tapping a chip.
- Seen in: template (purpose: Promotion / Order update / Reminder / General)
- Lives in: `WatiMessage` + `template-pick-purpose` action in `ChatArea.tsx`

### Each edit posts a new card, earlier drafts collapse
Each change posts a new card below the user's turn, so the chat keeps its
trail. The UI never calls these "versions". There is no "Updated: …"
note: the user's own turn just above already says what changed.
The earlier card collapses to an "Earlier draft of …" line that can be expanded.
- Seen in: template
- Lives in: `TemplateDraftCard`, `SupersededTemplateCard`

### Refine by chip or by typing
Suggested edits appear as small chips under the draft. A chip posts as a user
turn, so tapping one and typing the same thing take the same path.
The user's own wording always wins. Text they supply ("update the draft to
…", "body: …", or any long message) goes in as written, before any keyword
parsing. Scripted rewrites then step aside rather than overwrite it. Edits
that can't be understood get a reply showing how to send exact text.
- Seen in: template
- Lives in: `refineSuggestions` / `refineTemplate`, `templateTurn` in `ChatArea.tsx`

### Edit → review → commit, on the same card
"Looks good" turns the card into its review step without posting a new
message. The review step has only what the platform requires, prefilled (for
templates, sample values), plus flags for real problems only. Nothing is shown when
all is well. The commit actions sit last.
- Seen in: template (Submit to Meta / Save as draft / Keep editing)
- Lives in: `TemplateDraftCard` (`stage`)

### Status card that resolves on its own
After commit, the card shows the object's live state (pending → approved),
read from an app-wide store. The result also reaches the island and the bell,
so the user can leave the chat.
- Seen in: template (Meta review)
- Lives in: `lib/templates.tsx`

### Entry from an agent run
An agent CTA opens a new chat thread with the use case seeded from the run,
and a lead line saying where it came from.
- Seen in: template ("Draft … template" CTAs)
- Lives in: `fireCta` → `startTemplateFromAgent` in `ChatArea.tsx`

### Model-first, scripted fallback
The open-weight model drafts and applies every change in the user's own words.
The scripted drafter runs too: its result shows instantly when there's no model
and is the fallback if the call fails. Wati says once per session why it fell
back. A card waiting on the model shows the drafting beat, and a model-written
draft is labelled "Drafted with <model>".
- Seen in: template
- Lives in: `app/api/template/route.ts` (any OpenAI-compatible provider), `lib/template-ai.ts`, `runTemplateAi` in `ChatArea.tsx`

### Formats within a category
The category decides which formats are offered. Marketing has Standard,
Catalog, Carousel, Limited time offer, Orders details and Checkout. Utility has
Standard, Orders details and Orders status. Authentication has a single fixed
format. Wati picks the format from the request, and the Type chip changes it.
Each format adds only what it needs: an offer strip with an end date, carousel
cards, an order block, or a fixed button. Switching keeps the user's work: custom
buttons are set aside, not deleted, and leaving Authentication restores the
earlier draft.
- Seen in: template
- Lives in: `TEMPLATE_TYPES`, `withType` / `withCategory`, `detectType` in `lib/template-draft.ts`; `FormatDetails` in `TemplateDraftCard.tsx`; format blocks in `TemplatePreview.tsx`

### Recommendation hand-off into chat
A recommendation picked on a module page opens the Ask Wati drawer over the
page, in its own thread with one lead line ("Recommended for Thu 29 Oct,
11:00 AM.") and the object's card, prefilled. "Edit" starts on the card;
"Approve" commits it and moves straight to the next step. Whatever is
decided in chat writes back to the page (here the calendar) through an
app-wide store.
- Seen in: Campaigns (recommended broadcast → template card → broadcast card)
- Lives in: `setUpCampaign` in `lib/ask-wati-drawer.tsx`, the `pendingCampaign` effect in `ChatArea.tsx`, `lib/campaigns.tsx`

### One step leads to the next card
When committing one card unlocks the next step, the next card follows in the
same thread, prefilled, and scrolls into view. It doesn't wait for slow
external steps; a pending one shows as a flag instead ("Sends once Meta
approves the template").
- Seen in: Campaigns (Submit to Meta → Set up broadcast)
- Lives in: `onSaved` → `broadcastCardMessage` in `ChatArea.tsx`, `BroadcastSetupCard`

## Component candidates

| Candidate | What it is | Seen in |
| --- | --- | --- |
| Object card chassis | `WorkforceCard`: icon, title, state pill, note, body, actions. Already shared. | template |
| Editable fact chips | Inferred settings shown as chips, editable in place: text, select or date. **Extracted** to `components/chat/FactChips.tsx` (`SelectChip`, `TextChip`, `DateChip`, `FACT_CHIP`). | template (channel, name, category, language), broadcast (name, audience, date, time) |
| Fact sections | When a card's facts are decisions rather than settings, show each as a section, not a chip: a small uppercase label, the value in plain 14px text (clickable, with a chevron), and one muted line under it for what it means, with any problem in amber ("1,180 contacts · 180 over your daily limit"). Sections sit below a divider. The title names the task ("Schedule campaign"), and the object's own name is the editable subtitle. What it builds on (the template, with its Meta status) is the first section. In `components/chat/FactChips.tsx` (`FactSection`, `FACT_VALUE`, `EditableTitle`). | broadcast (Template, Audience, Send) |
| Refine chips | Inside the card: **+ Field** chips (dashed outline, plus icon) add a part of the object. | template |
| Suggested replies | Below the latest card, outside it: copy rewrites as grey reply chips, worded as the full message they send (e.g. "Make it shorter and easier to skim"). Tapping one sends it as the user's next message. They hide on the review step and on earlier cards. | template |
| Typed add menu | A "+ Button" field chip that opens every type the platform offers, grouped as the platform shows them. It opens upward, above the composer. Types at their limit stay listed but disabled, with the reason. Picking one posts as a user turn. | template (7 button types) |
| Group reorder | One arrow on the movable group's first row flips its position, here quick replies above or below the call-to-action buttons. It also works by chat. | template |
| Required value opens itself | A part that can't be valid without user input (here the coupon code) starts in edit mode with a placeholder and a counter. It is also flagged and named in the composer hint until it's filled. No made-up defaults. | template (Copy offer code) |
| Required-fields form | Compact label → input rows, prefilled. | template (sample values) |
| Issue flags | `EvidenceRow`s shown only for problems: a blocker disables commit, a warn means a likely platform flag. No all-clear rows. Already shared. | template |
| Drafting beat | `StatusIndicator` shown for about 1s before a new card appears. | template |
| Channel preview | How the message lands in WhatsApp. The preview is also the editor: hover the body to edit it, hover an existing image header to replace or remove it (adding one is the "+ Image header" chip), tap a button to edit it, × to remove. The same edits also work by chat ("rename 'Shop now' to …"). | template |
| Contextual composer hint | The composer placeholder says what the open flow needs next: missing input first, then example edits the flow supports. | template |
| Text action | Low-emphasis button next to the CTA chips ("Keep editing"). | template |
