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

### Versioned card, older versions collapse
Each change posts a new version of the object card with an "Updated: …" note.
The previous version collapses to a single line that can be expanded.
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

## Component candidates

| Candidate | What it is | Seen in |
| --- | --- | --- |
| Object card chassis | `WorkforceCard`: icon, title, state pill, note, body, actions. Already shared. | template |
| Editable fact chips | Inferred settings shown as chips, editable in place: text input or select. | template (channel, name, category, language) |
| Refine chips | Two groups under a draft. **+ Field** chips (dashed outline, plus icon) add a part of the object. **Rewrite** chips (grey secondary, no icon) rework the copy. A divider separates the groups. | template |
| Required-fields form | Compact label → input rows, prefilled. | template (sample values) |
| Issue flags | `EvidenceRow`s shown only for problems: a blocker disables commit, a warn means a likely platform flag. No all-clear rows. Already shared. | template |
| Drafting beat | `StatusIndicator` shown for about 1s before a new version appears. | template |
| Channel preview | How the message lands in WhatsApp. Parts the user owns (buttons) can be edited in place: tap to edit, × to remove. The same edits also work by chat ("rename 'Shop now' to …"). | template |
| Contextual composer hint | The composer placeholder says what the open flow needs next: missing input first, then example edits the flow supports. | template |
| Text action | Low-emphasis button next to the CTA chips ("Keep editing"). | template |
