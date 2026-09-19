# Interview usability update — 2026-09-19

## Scope
- Separate Create Games and Create Activities routes; Interview belongs to Activities.
- Preset v2 supports repeated (P) and independent (P1) through (P9). Existing v1 presets/deliveries keep their canonical serialization and progress keys.
- Session v2 stores selections by slot; v1 progress migrates on read. Question changes still reset answers through the existing confirmation.
- Compact class settings and number-only Excel instructions (A column alone).
- Explicit sky-blue fullscreen background, classroom fixed-word artwork where available, larger answer areas and live counts, compact names/numbers.
- Shared SVG controls crop each supplied illustration to the actual button bounds. Existing handlers, audio state, and keyboard focus remain intact.
- Long questions wrap in portrait view instead of clipping horizontally.

## Editable source and build
The source work is under `interview_work/grade34_site`, `games_site`, and `grade56_site` in the local project mirror. This repository contains the generated deployable site.

`clock_app` is a junction. Build it using `node --preserve-symlinks-main clock_app/build.cjs` from `interview_work` so its embedded shared UI is read from the current work area's `grade34_site/common-ui.js` rather than the older source tree.

Then run `node grade34_site/build-preview.cjs`, `node games_site/build.cjs`, and `node grade56_site/build.cjs`.

## Verification
- `INTERVIEW_BUILT=1 node run-classroom-tests.cjs` runs the full local suite against built pages where supported.
- `INTERVIEW_BUILT=1 node grade34_site/test-interview-usability-browser.cjs hub` verifies the separated authoring pages and compact roster UI.
- New regressions cover repeated and independent slots, partial reload, keyboard focus, number-only/mixed rosters, fullscreen background, image loading, counts, and exact SVG bounds (including the portable clock).
- `node check-public-usability.cjs` compares deployed bytes and exercises a synthetic student activity, fullscreen, portrait, restore, and workbook download. No real roster is used.
- Real-device voice quality depends on browser/OS voices. Tests verify speech requests, not audible quality on every classroom device.

## Recovery
The pre-update published commit is `46acea4`, tagged `backup-before-interview-usability-20260919`. Keep this tag and the working directory. To undo this update, revert its application commit and publish the revert; do not force-push or delete teachers' browser data.

Generated previews and local regression helpers are kept under `interview_work/qa` and `interview_work/grade34_site`; they are not student-facing production assets. Stage only the intended app files, not unrelated phonics generation logs.

## Follow-up: sentence fields and selection UI
Requested features are recorded in [interview-future-requirements.md](interview-future-requirements.md). Side-by-side editing/preview is implemented in the following update; configurable answer-card grids with an Other option remain future work.

- Authoring provides one sentence field plus an add/remove control. The existing `question.template` stores explicit newline boundaries, so no new schema or link format is needed. Existing single-field two-sentence templates are displayed as separate sentences; common abbreviations such as Mr. do not create false breaks. Old stored payloads are not rewritten when received.
- Every sentence renders a separate row and speaker. Speech reads only that sentence; global sound, speed, and word-by-word options are reused. Repeated P references share the selected card across rows.
- Word, picture, and waiting cards use equal fixed dimensions. Waiting cards display two centered lines. Punctuation remains unboxed.
- Categories support select-all / clear-all with mixed state, and individual words use pressed-state capsule buttons. Card data and saved selections remain unchanged.
- Saved activity actions are title-independent and use a fixed right column: edit/delete, teacher preview, settings download. Small screens place the same controls below the description.
- New local regressions: `test-interview-sentences-browser.cjs` and `test-interview-sentence-boundaries.cjs`. Set `INTERVIEW_PUBLIC=1` to run the former on the published site using synthetic data in an isolated browser.
- Recovery point for this follow-up: `bbb7740`, tag `backup-before-interview-sentences-20260919`.

## Follow-up: live author previews

- Author editor has an independently scrolling left menu and real teacher/student page previews on the right. Tabs cover teacher preparation, student composition and student interview; portrait/landscape changes preserve the interactive preview state.
- Fields identify their audience. Existing `description` remains the teacher-only displayed memo; optional `studentInstructions` is validated, saved, shared and displayed on student composition. Missing optional fields remain omitted so old payload serialization and progress identities are unchanged. Existing text is not silently reclassified.
- Categories retain capsule selection and bulk actions, with subgroups from each card's database `displayGroup` (`standard` / `plus`), not grade-specific Basic/Advance mappings. Completed senior cards remain selectable.
- Preview pages require both `authorPreview=1` and an embedded frame. Messages require the parent source and same origin; presets are validated. Teacher preview does not read real roster storage and disables distribution/settings navigation. Student preview uses a dummy 35-number roster and a no-write progress adapter. Preview instructions/results are not saved as real student progress.
- Incomplete drafts display a validation note instead of an inaccurate preview. Editing the draft resets the trial interaction; changing orientation does not. Preview scale fits the available display area.
- Regression `test-interview-live-preview.cjs` covers live audience-specific text, direct sheet tab, interactive movement, orientation preservation, bulk refresh, persistence/reopen, and storage isolation. Existing author tests use the clearer field labels.
- Recovery point: `2102b01`, tag `backup-before-interview-preview-20260919`. Preserve the worktree and unrelated phonics logs.

## Follow-up: compact activity layouts

- Editor and Create Activities headings include their storage notes on one compact row. Narrow screens retain the note in a horizontally scrollable area rather than enlarging the heading.
- Teacher preview hides its own app-brand header; the real teacher page retains it. Pupil instructions now sit immediately below the student title in a 48px maximum-height block; long title/instruction text remains scrollable. The compose-screen resume hint is removed, but progress saving remains unchanged.
- Unit assignments use four textbook accordions without changing the stored Unit identifiers.
- The creator tile is named INTERVIEW Yes/No. Creation and saved Activities tiles share a white, 16:9 landscape shape with a straight-edged blue left stripe. Saved tiles show assigned Unit/title, activity title, question sentences, slot categories/words and the fixed right action stack. Long metadata scrolls within the tile.
- Grade34/56 Interview activity links show the activity title (not the saved-item name), sentences and teacher memo. The entire tile is a link; there is no preparation button. Desktop activity grids accommodate three columns and reduce columns on smaller screens.
- New browser regression: `test-interview-layout.cjs`; updated existing link tests to verify whole-tile navigation rather than removed preparation-button text.
- Recovery point: `acd0056`, tag `backup-before-interview-layout-20260919`.

## Follow-up: four-column tiles and file-opened preview

- Creation and saved tiles now use four desktop columns with 24px gaps, retaining the 16:9 landscape ratio. Smaller viewports use three, two or one column; the action stack remains inside each saved tile.
- Direct `file:` opening produced an opaque message origin, so the preview rejected its draft. Only file-opened editors now send with a wildcard target; embedded receivers still require their exact parent, validated preset and message type, permitting the opaque `null` origin only when the receiver itself is a local file. HTTP(S) same-origin restrictions remain unchanged.
- `test-interview-local-preview.cjs` reproduces the original failures and covers local-file teacher/compose/sheet previews plus saved button containment at desktop and mobile sizes. Regular HTTP preview tests remain in the full suite.

## Follow-up: compact menus and simpler activity identity

- Category bulk controls are checkboxes before category labels; partial selection is indeterminate, and toggling selection does not expand/collapse the group. Individual words retain capsules and Standard/Plus groups.
- Sidebar labels, controls, headings and category spacing are smaller. The Unit assignment heading fits on one line.
- Saved tiles use a full-width Unit/title heading above smaller detail text and a narrow right action stack. Four-column landscape sizing is retained.
- Removed the separate saved-name field and all teacher/library displays of that name. New saves derive the legacy `name` property from the activity title to retain model/export compatibility; existing presets remain readable and are not migrated in bulk. Stable IDs still identify presets.
- Added `test-interview-compact-menu.cjs`; adapted existing tests for title-based identification and category versus tier checkboxes.
