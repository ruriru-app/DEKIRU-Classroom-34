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
