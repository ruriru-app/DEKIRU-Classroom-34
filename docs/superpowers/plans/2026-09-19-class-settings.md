# Class Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 共通設定で7列のクラス名簿を管理し、Interviewで出席番号付きの名前表記を選んで安全に配信する。

**Architecture:** 名簿専用モデルを追加し、既存v1名簿・配信形式を維持したまま保存名簿v2に対応する。クラス設定は共通の単独ページ、Interviewは保存クラスの選択と配信用名簿への変換を担当する。氏名の全表記はローカル保存に限定する。

**Tech Stack:** 既存のHTML/CSS/JavaScript、localStorage、Node assert、Playwright/Chrome。追加依存なし。

**Spec:** `docs/superpowers/specs/2026-09-19-class-settings-design.md`

## Global Constraints

- 「児童活動、第3工程、認証、クラウド同期、GitHub公開はこの変更に含めない。」
- 「出席番号は必須で、クラス内で重複しない正の整数とする。」
- 「英語はAndika、戻るボタンは共通SVGを使う。」
- 「配信スナップショットは既存v1配信形式を維持する。」
- 「読み込みだけでは書き換えない。」
- 「未選択の名前表記はURLへ含めない。」
- 「専用作業領域で完成させ、未公開の状態で結果を提示する。」

## Working Area / Commands

既存の `interview_work` を使う。新規作業領域を作らず、元のソース、`sources/`、ジャンクション先を編集しない。公開用Git作業領域は `interview_work/release_repo`、ブランチ `feature/interview-phase1`。以下のソースパスは `interview_work` 相対。

PowerShellでは以下の実行ファイルを `node` の代わりに使用する。

```powershell
& 'C:/Users/withc/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe' grade34_site/test-class-roster.cjs
```

テストは既存 `grade34_site/interview-test-helper.cjs` の `setup()` と `colors(t)` を使う。公開用では `INTERVIEW_BUILT=1`、終了後に解除する。コミット前に対象サイトをビルドして `git diff` を確認し、今回の成果物だけを `git add --sparse` する。`safe.directory` は絶対パスの `interview_work/release_repo` を指定する。既存の未追跡phonicsファイルは含めない。コミットは公開用コード、編集元とテストは専用作業領域に維持し、引継ぎ文書に両方の場所を記す。

## Review Focus

1. Excelの末尾空欄・CRLF・ヘッダー・不正列数で名前の列がずれない（Task 1）。
2. `01` と `1` を別番号として保存しない。再貼り付け時の重複番号で別児童を結合しない（Task 1）。
3. バックアップ後に本保存が容量不足となっても、既存名簿を失わない（Task 2）。
4. 設定を別タブで更新・削除した後、古いプレビューのまま配信しない（Task 4）。
5. 戻り先URLの改変や氏名に含まれるHTMLで外部遷移・スクリプト実行しない（Tasks 3, 4）。

## File Map

- Create `grade34_site/class-roster.js`: v2検証、7列解析、v1編集用変換、配信用名簿生成。
- Modify `grade34_site/interview-store.js`: v1/v2保存と移行前バックアップ。配信用 `interview-model.js` のv1契約は変更しない。
- Create `grade34_site/class-settings.html`, `class-settings.js`, `class-settings.css`: 名簿編集・保存画面。
- Create `grade34_site/class-settings-links.js`: 共通設定のリンクと安全な戻り先処理。
- Modify `grade34_site/index.html`, `app.js`, `grade56_site/index.html`: 設定への入口。既存プレースホルダーイベントを除く。
- Modify `grade34_site/interview.html`, `interview-teacher.js`, `interview.css`: 編集からクラス選択への変更。
- Modify `games_site/index.html`: storeを使うためclass-rosterをstoreより先に読み込む。
- Modify `grade56_site/index.html`、他のstore読込HTML: 同じ依存順序を守る。
- New tests: `test-class-roster.cjs`, `test-class-store.cjs`, `test-class-settings-browser.cjs`, `test-class-delivery-browser.cjs`。
- Update existing teacher/delivery/integration/roster-warning browser tests to register through Settings first.

## Task 1: 名簿モデルと配信用変換

**Interfaces:** `ClassRoster.validate(v) -> RosterV2`; `parse(text, previous=[]) -> {students,warnings}`; `editLegacy(v1) -> editable V2`; `toDeliveryRoster(roster, {script, scope}) -> RosterV1`。scriptは `kanji|hiragana|english|legacy`、scopeは `full|given`。legacyはv1だけで使用し、番号必須検査は適用する。

v2児童は `{id,number,names:{kanji:{family,given},hiragana:{family,given},english:{family,given}},legacyName?}`。各氏名欄80字、番号12桁以内、クラス名80字、1～100人。`legacyName` は編集時に失われないよう保存するが配信用変換で明示選択した場合以外は送らない。v1と同じクラスID・児童ID・作成日時を維持する。

- [ ] Add model test with fixed timestamps and minimal v2 fixture. Use exported CommonJS API and browser global, following existing module convention.

```js
const assert=require('node:assert/strict');
const R=require('./class-roster.js');
const input='1\t山田\tはる\tやまだ\tはる\tYamada\tHaru\r\n2\t田中\tはる\tたなか\tはる\tTanaka\tHaru';
const parsed=R.parse(input);
assert.equal(parsed.students.length,2);
assert.equal(parsed.students[0].names.english.given,'Haru');
assert.notEqual(parsed.students[0].id,parsed.students[1].id);
assert.throws(()=>R.parse('1\t山田\tはる'),/行|列/);
assert.throws(()=>R.parse(input+'\n01\t別\t人\tべつ\tひと\tOther\tChild'),/番号|重複/);
assert.equal(R.parse(input,parsed.students).students[0].id,parsed.students[0].id);
```

- [ ] Run `node grade34_site/test-class-roster.cjs`; confirm failure due to missing API.
- [ ] Implement parser: split rows by CRLF/LF, preserve tabs, skip fully empty rows, remove exact header only; require7 columns; trim cells; canonicalize digit strings with `String(Number(value))`; reject zero/non-digit/duplicate values. Construct clean allowlisted fields. Match prior IDs only by unique canonical number, otherwise unique complete names; never merge ambiguous prior matches.

```js
const columns=row.split('\t');
if(columns.length!==7) throw Error(`${line}行目：7列で貼り付けてください`);
const number=columns[0].trim();
if(!/^\d{1,12}$/.test(number)||Number(number)<1) throw Error(`${line}行目：出席番号を確認してください`);
```

- [ ] Implement `toDeliveryRoster`: validate numbers even on v1, assemble selected name, collect missing-field errors with numbers, return only v1 allowed fields. Return old v1 IDs and timestamps; no name-source mutation.

```js
const parts=student.names[script];
const name=scope==='given'?parts.given:[parts.family,parts.given].join(' ');
// Check required parts before constructing the allowlisted student.
return {id:student.id,number:student.number,name};
```

- [ ] Add assertions for all6 combinations, missing selected fields, same given names, unknown fields excluded, legacy name untouched, no auto romanization, zero/negative/noninteger number, 100/101 rows, headers, final empty language cells. Use `assert.equal(JSON.stringify(result).includes('Tanaka'),false)` for hiragana output.
- [ ] Rerun model + existing `test-interview-model.cjs` and `test-interview-share.cjs`; commit built module as `feat: add multilingual class roster model`.

## Task 2: 既存保存の互換性と保護

**Files:** `interview-store.js`, new `test-class-store.cjs`, all HTML consumers found by `rg -n 'interview-store.js' grade34_site games_site grade56_site -g '*.html'`.

**Interfaces:** Existing `InterviewStore.create(storage)` public methods unchanged. `listRosters()` returns validated v1/v2. `saveRoster(v2)` validates strictly. `dekiru-class-rosters-v1` stays primary; `dekiru-class-rosters-backup-v1` stores the original primary raw string on first v1 replacement, never overwrites prior backup.

- [ ] Write tests with injected in-memory storage and captured set calls. Read v1 without writes; save v2 under same class ID; assert backup equals original raw string.

```js
const raw=JSON.stringify([legacy]);
const map=new Map([['dekiru-class-rosters-v1',raw]]);
const storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};
const store=S.create(storage);
assert.equal(store.listRosters()[0].version,1);
assert.equal(map.size,1);
store.saveRoster(updated);
assert.equal(map.get('dekiru-class-rosters-backup-v1'),raw);
assert.equal(store.listRosters()[0].version,2);
```

- [ ] Run `node grade34_site/test-class-store.cjs`; verify missing v2 support fails.
- [ ] Implement version dispatch for storage only; preserve existing corruption/quota messages. If backup write fails, do not attempt primary write. If primary write fails, leave original primary and backup intact. localStorage setItem is atomic per key; do not delete primary during migration.

```js
const validateRoster=v=>v?.version===2?R.validate(v):M.validateRoster(v);
if(replacingLegacy && storage.getItem(backupKey)===null){
  storage.setItem(backupKey,originalRaw);
}
storage.setItem(primaryKey,JSON.stringify(rows));
```

- [ ] Add failures for backup quota, primary quota, corrupt primary, duplicate IDs, invalid version, and existing backup preservation. Confirm `deleteRoster` retains confirmation responsibility in UI and affects no URLs.
- [ ] Load class-roster before interview-store in every consuming HTML; module CommonJS require fallback mirrors existing model import. Run new test and `test-interview-store.cjs`; build affected sites and commit `feat: preserve legacy rosters during class settings migration`.

## Task 3: 共通クラス設定画面

**Interfaces:** `ClassSettingsLinks.url(returnTo, classId='')` returns same-app Settings URL; `safeReturn(value, base)` accepts only same-origin app index routes and Interview teacher path, never arbitrary schemes, hosts or paths. Use URL parsing plus pathname allowlist, not prefix string matching. Preserve teacher preset/source/book/unit query. Settings returns saved class ID through a dedicated query parameter.

- [ ] Write browser test using setup(): open grade34 settings button, paste7-column35-person fixture, confirm rows, save, reload, edit, and delete with cancel/confirm. Assert labels and buttons through roles. First run must fail because Settings is not implemented.

```js
await page.goto(t.base+t.grade+'/index.html#/');
await page.getByRole('button',{name:'設定',exact:true}).click();
await page.getByLabel('クラス名',{exact:true}).fill('4年1組');
await page.getByLabel('名簿を貼り付け',{exact:true}).fill(input);
await page.getByRole('button',{name:'名簿を確認',exact:true}).click();
await page.getByRole('button',{name:'名簿を保存',exact:true}).click();
assert.match(await page.getByRole('status').innerText(),/保存しました/);
```

- [ ] Implement semantic table with7 labeled inputs per row inside overflow container, existing roster select/save/delete/new buttons, error role and status role. Use textContent/input.value only. Keep parsed edits until explicit save; failed parsing does not destroy current rows. Render old v1 original names next to unfilled split fields so manual conversion remains possible.
- [ ] Track dirty + unconfirmed paste separately; prevent save while pastePending. Guard class changes/back/home/delete and use beforeunload for browser exit. Cancel leaves current edits and selected class unchanged. Save clears dirty only after storage success.
- [ ] Add setting icons to grade56 and teacher, wire grade34 existing `#settings-button`, remove obsolete `[data-settings]` toast handler. Use shared links script and existing SVG assets. Ensure common-ui normalizes back button hit area.
- [ ] Test malicious return targets, HTML-looking names, empty class, number errors, dirty-navigation cancellation, full-screen back exits first, v1 edit, Grade56 roundtrip. Assert no horizontal document overflow at1024/1366/1920 widths; only table may scroll.

```js
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
await page.goto(t.base+t.grade+'/class-settings.html?returnTo=https://example.com');
await page.getByRole('button',{name:'戻る',exact:true}).click();
assert.equal(new URL(page.url()).origin,new URL(t.base).origin);
```

- [ ] Run `node grade34_site/test-class-settings-browser.cjs`; build and commit `feat: manage class rosters in shared settings`.

## Task 4: Interviewのクラス・表記選択と配信

**Files:** `interview.html`, `interview-teacher.js`, `interview.css`, new `test-class-delivery-browser.cjs`; existing teacher/delivery/integration/warning browser tests.

**Interfaces:** Consume store + `ClassRoster.toDeliveryRoster`. Continue `InterviewShare.snapshot(preset, rosterV1)` and existing CardShare. New controls `#rosterScript`, `#rosterScope`, `#rosterSettings`; keep rosterSelect/rosterConsent/interviewSend/status. No inline roster editing or student Activity implementation.

- [ ] Add failing browser test: register7-column fixture in settings, create Colors, open teacher, select saved class, choose hiragana/given, check preview includes `1 はる`, consent, send, decode generated URL. Confirm numbers and chosen names present, other scripts absent.

```js
await page.locator('#rosterScript').selectOption('hiragana');
await page.locator('#rosterScope').selectOption('given');
assert.match(await page.locator('#rosterRows').innerText(),/1\s+はる/);
await page.locator('#rosterConsent').check();
await page.locator('#interviewSend').click();
// Decode URL with existing InterviewShare; compare only allowlisted roster fields.
assert.equal(delivery.roster.students[0].name,'はる');
assert.equal(delivery.roster.students[0].number,'1');
assert.equal(JSON.stringify(delivery).includes('Yamada'),false);
```

- [ ] Replace editable roster panel with class selector, script/scope selectors and numbered preview. Default kanji/full; legacy-only choice appears for v1, disabled split display until edited. Missing selected fields show numbered errors and disable send; duplicate resulting names show warning, not block.
- [ ] On every class/script/scope change clear consent and refresh. On page focus and storage events reload current roster. If changed since consent, clear consent and show updated preview. Before send reread store and compare validated roster to consent-time snapshot; if changed or removed, stop and require review.

```js
const latest=store.listRosters().find(r=>r.id===selectedClassId);
if(!latest||JSON.stringify(latest)!==reviewedRosterJson){
  consent.checked=false;
  throw Error('名簿が変更されました。内容を確認してください。');
}
const roster=ClassRoster.toDeliveryRoster(latest,displayOptions);
const delivery=InterviewShare.snapshot(preset,roster);
```

- [ ] Test saved-clone immutability, another tab edit/delete, disabled send on missing numbers, empty settings link, return preserving preset/class, changing selections clears consent, all6 options and v1 compatibility. A separate browser context can decode the received URL without teacher storage.
- [ ] Rewrite prior editable-teacher tests to use Settings; retain original regression intents (duplicate warning, quota, malformed URL) rather than delete them. Run all Interview/browser tests and commit `feat: select numbered roster names for interview delivery`.

## Task 5: 回帰確認・成果物・最終レビュー

**Files:** built `release_repo/grade34`, `grade56`, `games`, `docs/interview-phase1-handoff.md`.

- [ ] Run full source regression `node run-classroom-tests.cjs`. Confirm runner includes four new files; if not, extend its explicit list. Fix failures using failing regression before code changes.
- [ ] Build in order:

```powershell
node grade34_site/build-preview.cjs
node games_site/build.cjs
node grade56_site/build.cjs
```

- [ ] Set `INTERVIEW_BUILT=1`, run new browser tests and existing author/teacher/delivery/integration/warning tests against built paths; unset afterward. Inspect browser requests for missing new dependencies and rewrite cross-site Settings paths in build scripts only if required by observed failures.
- [ ] View Settings and teacher screenshots at1920×1080,1366×768,1024×768. Verify35 rows, long names, English Andika, back/settings matching visible hit area, bounded table scrolling, keyboard labels. Do not claim hardware touch tests occurred.
- [ ] Search built URLs and output for unintended inclusion of all name scripts. Confirm public preset catalog remains empty and no real student names enter source/fixtures/commits.
- [ ] Update handoff with schema, backup key, seven-column instructions, default numbered labels, legacy conversion limits, tested sizes and untested hardware. Record exact test outcomes.
- [ ] Review diff and repository status; commit only scoped output/docs. Request one fresh final independent review if native execution is selected, resolve important findings with regression tests, rerun affected tests.
- [ ] Hand off local preview and results. Do not push, merge main, publish, or start phases2/3 without separate direction.

## Plan Self-Review

All approved sections map to tasks1–5: parsing/names/IDs to1, persistence/legacy to2, common UI/navigation to3, name choice/privacy/URLs to4, regression/build/handoff to5. Review Focus cases each have tests above. Number is separate from name in all interfaces; old delivery v1 validator stays unchanged. No new authentication, actual student sheet, cloud upload or sync is introduced.
