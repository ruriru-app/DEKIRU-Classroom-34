# Interview Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 既存Games内のInterviewプリセット管理から、UnitのActivities、教師の名簿設定、URL配信、受信確認までを実装する。

**Architecture:** ブラウザJSの小さな共通モデル・保存・配信モジュールをGrade34配下に置き、Games／Grade56から参照する。作者の端末内データと公開用カタログを分離し、プリセット編集は既存Games内、授業の入口はActivitiesに限定する。既存ゲームエンジン・カードID・共有画面を維持する。

**Tech Stack:** 既存のHTML/CSS/JavaScript、localStorage、URL hash、TextEncoder/TextDecoder、既存QRコードライブラリ、Node assert、Playwright／Chrome。新規サーバー・外部API・npm依存は追加しない。

**Spec:** `docs/superpowers/specs/2026-09-19-interview-phase1-design.md`（同じrelease_repo内）

## Global Constraints

- プリセットは作成したブラウザ内に保存する。保存は一般公開を意味しない。
- 本ページへの収録はユーザーがこの会話で依頼したプリセットだけ実施する。自動アップロードはしない。
- 通常のGamesプレイ一覧にはInterviewを追加しない。
- 英語はAndika、戻るボタンは既存の共通SVGと全画面解除ルールに従う。
- 児童の文章作り／Interview Sheet本画面、回答操作、音声、PDF、Classroom提出、サブスクリプション、認証、パスワード画面は作らない。
- 名簿を公開カタログ・Git・更新情報・ログへ保存しない。
- `sources/` は読み取り専用。無関係な変更と既存の未追跡ファイルを保持する。

## Review Focus

1. 同名児童・番号重複・氏名中の空白を混同しない（Task 2）。
2. localStorageの破損・保存容量不足で既存名簿を黙って消さず、保存成功を偽らない（Task 2）。
3. 共有URLの不正形式・未知カード・過大データ・HTML文字列を安全に拒否／テキスト表示する（Task 1／4／6）。
4. 端末内プリセットを公開済みと誤認させず、名簿をプリセット書き出しへ混入させない（Task 3／5）。
5. 別端末・別配信・配信後の編集で発行済みの内容を変化させない（Task 4／6）。

## 実行環境とファイル方針

作業ルートは `C:/Users/withc/.codex/.chatgpt-projects/g-p-6aa08aad243481919856c7e8453ef444`。アプリの編集元は `grade34_site/`、`grade56_site/`、`games_site/`。`release_repo/` はビルド先Gitリポジトリ。現状、編集元にGit管理はないため、各タスクの確認後にビルドされた関連ファイルを明示指定してローカルコミットする。設計文書以外のユーザーファイルを含めない。

実行開始時にusing-git-worktreesの環境確認を行い、既存のsource→release生成手順を壊さない隔離方法を選ぶ。ビルドは既存rootページを変更しない。今回の完了時には公開プリセットを追加せず、公開操作はユーザーの指示に従う。

PowerShellで使用する実行環境:

```powershell
$taskNode='C:/Users/withc/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'
& $taskNode run-classroom-tests.cjs
```

新規責務の配置:

| ファイル | 責務 |
|---|---|
| `grade34_site/interview-model.js` | プリセット・名簿・配信の純粋な検証とスナップショット |
| `grade34_site/interview-store.js` | 作者プリセットとクラス名簿の独立した端末保存 |
| `grade34_site/interview-catalog.js` | 空の公開カタログ、公開依頼時のみ収録 |
| `grade34_site/interview-links.js` | Unit紐付け一覧と教師画面URL |
| `grade34_site/share-codec.js` | 既存Games由来のURL安全なバイト変換／JSON変換 |
| `grade34_site/interview-share.js` | 配信スナップショットの符号化・復号・URL生成 |
| `games_site/interview-creator.js` | 既存Create Games内のInterview編集・管理 |
| `games_site/interview-creator.css` | 上記に限定したスタイル |
| `grade34_site/interview.html`, `interview-teacher.js`, `interview.css` | 教師の読み取り専用プレビューと名簿管理 |
| `grade34_site/interview-receive.html`, `interview-receive.js` | 配信内容の受信確認だけを行う仮画面 |

## Task 1: プリセット契約とカード参照

**Files:** Create `grade34_site/interview-model.js`, `grade34_site/interview-catalog.js`, `grade34_site/test-interview-model.cjs`。

**Interfaces:** `InterviewModel.validatePreset(value, validCardIds)` → 正規化済みPreset。`InterviewModel.completeQuestion(preset, card)` → 完成文字列。`InterviewModel.validateDelivery(value, validCardIds)` → 配信の独立コピー。グローバルとCommonJSの両方からテスト可能な純粋モジュールにする。

- [ ] 次の形の独立した固定fixtureで失敗テストを書く。実在カードIDはカタログをNode VMで読み、red／blueのIDが一意であることを確認してfixtureへ固定する。

```js
const p={version:1,type:'interview',id:'test-colors',name:'Colors',title:'INTERVIEW',description:'',assignedUnits:[{bookId:'lt1',unit:4}],question:{template:'Do you like (P)?',slots:[{id:'P',type:'picture-card',cardIds:['test-blue']}]},cardIds:['test-blue'],answerAreas:[{id:'yes',label:'YES',order:0},{id:'no',label:'NO',order:1}],createdAt:'2026-09-19T00:00:00Z',updatedAt:'2026-09-19T00:00:00Z'};
assert.equal(M.completeQuestion(M.validatePreset(p,new Set(['test-blue'])),{id:'test-blue',english:'blue'}),'Do you like blue?');
assert.throws(()=>M.validatePreset({...p,assignedUnits:[{bookId:'nh5',unit:9}]},new Set(['test-blue'])));
```

- [ ] `& $taskNode grade34_site/test-interview-model.cjs` を実行して未実装による失敗を確認。
- [ ] 必須文字列、安定ID、教科書範囲、カード集合、0または1スロット、回答ID一意を検証する。上限はタイトル80文字、説明500文字、質問200文字、カード100枚、回答エリア1～12個、回答名40文字とする。未知スロットを勝手に残した完成文を作らない。

```js
const books={lt1:9,lt2:9,nh5:8,nh6:8};
const validUnit=u=>Number.isInteger(u.unit)&&u.unit>=1&&u.unit<=books[u.bookId];
// validatePresetは受け取ったオブジェクトをそのまま返さず、許可フィールドだけコピーする。
// completeQuestionは検証済みスロットに指定カードのenglishを文字列として差し込む。
```

- [ ] 3／4分類、固定文、重複ID、不正カード、複数スロット、HTML風文字列の保持（表示は後段でtextContent）をテスト。`window.INTERVIEW_CATALOG=[]` を作成。
- [ ] テストを通し、モデルと空カタログのビルド成果物だけをローカルコミットする。

## Task 2: 名簿の貼り付けと保存

**Files:** Modify `interview-model.js`; Create `interview-store.js`, `test-interview-store.cjs`。

**Interfaces:** `InterviewModel.parseRoster(text, previousStudents=[])` → `{students,warnings}`。`InterviewStore.create(storage)` → `{listPresets,savePreset,deletePreset,listRosters,saveRoster,deleteRoster}`。各saveは保存されたコピーを返し、失敗は例外。ストレージを引数で受けて容量失敗をテスト可能にする。

- [ ] 貼り付けのテストを先に追加。

```js
const r=M.parseRoster('1\t青木 太郎\n2　伊藤\n\n佐藤\n佐藤');
assert.deepEqual(r.students.map(s=>s.name),['青木 太郎','伊藤','佐藤','佐藤']);
assert.equal(new Set(r.students.map(s=>s.id)).size,4);
assert.ok(M.parseRoster('1\t青木\n1\t伊藤').warnings.length);
```

- [ ] 未実装の失敗を確認後、空行除去、先頭番号＋タブ／全角空白の認識、名前中の空白保持、最大100人・氏名80文字の検証を実装。名前のみも受け付ける。任意テキストをヘッダーと推測して捨てない。
- [ ] 名簿確認テーブルの行編集はIDを保持する。再貼り付け時は既存の番号＋名前が一意一致した行だけIDを再利用し、曖昧な同名行は新IDにして注意表示する。
- [ ] 保存キーを `dekiru-interview-presets-v1` と `dekiru-class-rosters-v1` に分離。解析失敗時はエラーを返し、保存操作で壊れた内容を自動上書きしない。

```js
assert.throws(()=>Store.create({getItem:()=>'{bad',setItem(){}}).listRosters());
assert.throws(()=>Store.create({getItem:()=>null,setItem(){throw new Error('quota');}}).saveRoster(validRoster));
```

- [ ] 35人、重複名、保存・選択・編集・削除、既存ROULETTEキー不変を確認。テストを通し関連成果物をコミット。

## Task 3: 既存Games内の作者機能

**Files:** Modify `games_site/index.html`, `shell.js`, `boot.js`; Create `interview-creator.js`, `interview-creator.css`, `grade34_site/test-interview-author-browser.cjs`。

**Interfaces:** `InterviewCreator.open(id?)`, `InterviewCreator.renderLibrary()`。Task 1モデルとTask 2ストアを利用。カード候補は既存 `rouletteAvailableCards()`、Unitラベルは教科書ID別の既存タイトルを使用する。

- [ ] PlaywrightでCreate Gamesを開き、Interview入口がありROULETTE入口も残ることを確認するテストを先に作り、失敗を確認。

```js
await page.goto(base+'games_site/index.html#/createGames');
await page.getByRole('button',{name:'Interviewを作る',exact:true}).click();
await page.getByRole('button',{name:'Colorsサンプルを作成',exact:true}).click();
await page.getByRole('button',{name:'プリセットを保存',exact:true}).click();
await page.reload();
await page.getByRole('button',{name:'Colorsを編集',exact:true}).click();
```

- [ ] 既存HTMLの内部sectionとしてInterview編集欄を追加する。質問／回答行／カード選択／教科書Unitチェック／保存を実装し、ストアIDで編集する。新しい独立管理ページを作らない。
- [ ] Colorsは明示ボタンから9色を設定、lt1:4割当を表示し、保存前に確認可能にする。既存カードが不足する場合は不足語を表示して保存を停止する。
- [ ] 削除は確認付き。JSON取得はPresetの許可フィールドだけをBlobへ書き出す。ラベル「このブラウザに保存」「本ページへの公開は別途依頼」を表示する。

```js
const clean=InterviewModel.validatePreset(formValue,allowedIds);
const saved=store.savePreset(clean);
// 教師画面を試す導線に名簿を含めない。保存失敗は画面のrole=statusへ表示する。
```

- [ ] 回答4分類保存、他Unitへの割当、保存済み編集、テキストにHTMLを入力したときの非実行、ROULETTEの試す／編集／配信を確認してコミット。

## Task 4: 配信契約と既存URL方式の再利用

**Files:** Create `share-codec.js`, `interview-share.js`, `test-interview-share.cjs`; Modify `games_site/share.js`, `games_site/index.html`, `games_site/test.cjs`（共通変換の読込）。

**Interfaces:** `ShareCodec.bytesToBase64Url(bytes)`, `ShareCodec.base64UrlToBytes(text)`, `ShareCodec.encodeJson(value)`, `ShareCodec.decodeJson(token)`。`InterviewShare.snapshot(preset,roster)` → 検証済みDelivery、`encode(delivery)`／`decode(token)` → 同期変換、`buildUrl(delivery,baseUrl)` → URL。

- [ ] 既存ROULETTEのURL往復を基準テストとして保持。UTF-8名簿の往復、発行後編集の非反映、新しいブラウザに保存データがなくても復元できる契約のテストを書く。

```js
const d=Share.snapshot(preset,roster);
const token=Share.encode(d);
roster.students[0].name='変更後';
assert.equal(Share.decode(token).roster.students[0].name,'青木 太郎');
assert.throws(()=>Share.decode('%%%'));
assert.throws(()=>Share.decode('x'.repeat(220001)));
```

- [ ] 失敗を確認後、既存Gamesのバイト変換を共通ファイルへ移し、旧関数名から委譲する。既存ROULETTEのトークンを変更しない。Interviewはバージョン付きJSONをURLハッシュ `#interview=` に保存する。圧縮は必須にせず、まず既存Gamesと同じUTF-8/base64url形式を利用する。
- [ ] 生JSONは160KB、トークン220KBまで。受信時は未知version／type／カード／領域ID／児童IDを拒否する。URLに画像バイナリを含めない。
- [ ] 固定日時ではなく `issuedAt` と新しいdeliveryIdを発行し、名簿とPresetは許可項目だけの独立コピーにする。全テストを通しコミット。

## Task 5: UnitのActivities接続と教師準備

**Files:** Create `interview-links.js`, `interview.html`, `interview-teacher.js`, `interview.css`, `test-interview-teacher-browser.cjs`; Modify `grade34_site/app.js`, `index.html`, `grade56_site/app.js`, `index.html`。

**Interfaces:** `InterviewLinks.assigned(bookId,unit)` → `{id,title,description,href,source}` 配列、`InterviewLinks.get(id,source)` → Preset。sourceは `local`／`published` を明示する。公開版とローカル版を曖昧に混ぜず、ID衝突でも一意に解決する。教師URLは `interview.html?preset=ID&source=local|published`。

- [ ] 作者保存後、lt1:4のActivitiesにだけ表示されるブラウザテストを書く。Gamesの各欄に存在しないことを検証し、失敗を確認する。

```js
await page.goto(base+'grade34_site/index.html#/unit/lt1/4');
const activities=page.locator('details').filter({has:page.locator('summary').filter({hasText:/^Activities/})});
await activities.locator('summary').click();
await activities.getByRole('link',{name:'Colorsを準備'}).click();
await page.getByLabel('クラス名').fill('3年1組');
await page.getByLabel('名簿を貼り付け').fill('1\t青木\n2\t伊藤');
await page.getByRole('button',{name:'名簿を確認',exact:true}).click();
```

- [ ] Grade34のUnit内Activitiesと左メニューからのActivitiesを同じ取得処理に接続。Grade56は割当があるUnitだけActivities欄を表示し、未作成教材の案内を維持する。教師準備画面へのリンクには児童へ配るボタンを直接付けない。
- [ ] 教師画面はタイトル・テンプレート・カード・回答エリアを読み取り専用にし、名簿の新規／貼り付け確認／行編集／保存／クラス選択／削除を提供する。配信前に未保存の変更があれば「この内容で配信」と明示する。
- [ ] 外部公開しない注意を確認チェック付きで表示する。名簿未入力・入力エラー・未確認なら配信しない。

```js
const delivery=InterviewShare.snapshot(preset,currentRoster);
const url=InterviewShare.buildUrl(delivery,new URL('interview-receive.html',location.href));
CardShare.openUrl(url,preset.title,currentRoster.students.length+'人の名簿を含む配信URLです');
```

- [ ] 名簿保存再読込、容量失敗、別クラス切替、同じUnitの複数Interview、空カタログの既存表示不変を確認。名簿削除取り消しでデータが残ることを確認しコミット。

## Task 6: 受信仮画面と別端末試験

**Files:** Create `interview-receive.html`, `interview-receive.js`, `test-interview-delivery-browser.cjs`。

**Interfaces:** `InterviewShare.decode(token)` と既存カードカタログを消費。出力は「受信確認用・本画面は準備中」、タイトル／質問テンプレート／カード数／回答エリア／人数のみ。進捗ストアや回答操作は追加しない。

- [ ] 教師URLの配信ダイアログからhrefを取得し、保存データのない別コンテキストで開くテストを書く。

```js
const student=await browser.newContext();
const tab=await student.newPage();await tab.goto(sharedUrl);
assert.ok(await tab.getByText('受信確認用・本画面は準備中',{exact:true}).isVisible());
assert.ok(await tab.getByText('35人',{exact:true}).isVisible());
assert.equal(await tab.locator('[data-interview-answer-action]').count(),0);
```

- [ ] 失敗確認後、ハッシュ復号と安全なテキスト表示だけを実装。外部リクエスト・外部解析を追加しない。不正URLでは日本語の再配信依頼を表示する。
- [ ] URLコピー失敗時の既存手動コピー、QR容量超過時のURL代替、`file:` の配信不可注意を検証。ブラウザコンテキスト間でlocalStorageが共有されなくても動くことを確認してコミット。

## Task 7: ビルド・回帰検証・第1工程で停止

**Files:** Modify `grade34_site/build-preview.cjs`, `grade56_site/build.cjs`, `games_site/build.cjs`, `run-classroom-tests.cjs`（必要なテスト列挙のみ）。Create `release_repo/docs/interview-phase1-handoff.md`。

- [ ] ビルド済み環境に対する全導線のテストを追加し、source用パスが残った場合に失敗することを確認する。
- [ ] GamesとGrade56からの共通モジュール参照を `../grade34_site/` → `../grade34/` に変換し、配信ページも既存のキャッシュ更新対象にする。

```powershell
& $taskNode grade34_site/build-preview.cjs
& $taskNode games_site/build.cjs
& $taskNode grade56_site/build.cjs
& $taskNode run-classroom-tests.cjs
```

- [ ] 同一オリジンのローカルHTTP環境で作者→Unit→名簿→共有URL→別コンテキスト受信を確認する。任意公開環境へ名簿を送らない。テストには架空名のみを使用する。
- [ ] 1366×768／1920×1080／タブレット相当で切れ、押下対象、Andika、共通戻る、35人リストを確認する。Chromeでの代替試験と実機Chromebook確認の有無を区別して報告する。
- [ ] 読み取り専用レビューを1回実施し、重大な指摘を修正して再試験。差分に名簿・不要な公開プリセット・sources変更がないことを確認する。
- [ ] 最終コミット後に停止。変更ファイル、追加データ構造、再利用部分、試験結果、端末保存／URLの制約、次工程の接続点を報告する。第2・第3工程も、Colorsの一般公開も自動開始しない。

## 計画セルフレビュー

- 第1工程の15項目はTask 1～7へ割当済み。作成場所／表示分類の分離はTask 3／5で検証する。
- 後続工程は契約の確認だけで、本画面・結果・PDFの実装タスクは含めていない。
- 公開カタログは空、Colorsは作者が明示的に作成するローカルサンプル。
- 保存・配信・UIの引数名を各TaskのInterfacesに統一。
- Review Focusの5項目にそれぞれ失敗テストと確認手順を設定済み。
