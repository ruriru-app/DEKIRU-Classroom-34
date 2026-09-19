# Interview Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 児童の文章作り・Interview Sheetを完成させ、クラス設定から空の名簿Excelを取得できるようにする。

**Architecture:** 既存の受信URLと配信スナップショットを維持し、受信ページを２画面へ拡張する。状態遷移と保存、読み上げ、画面を分離し、既存カード・音声SVGを再利用する。Excelは静的ファイルとして配布し、名簿の外部送信を追加しない。

**Tech Stack:** Vanilla JavaScript / CSS / HTML、localStorage、Web Speech API、Node assert、Playwright、Spreadsheet Artifact Tool（テンプレート生成時のみ）。

**Spec:** `docs/superpowers/specs/2026-09-19-interview-phase2-design.md`

## Global Constraints

- 第３工程の終了・本人情報入力・PDF・Google Classroom提出、認証、クラウド保存、GitHub公開は今回に含めない。
- 英語はAndika。
- 操作は常に「名前をタップ→移動先全体をタップ」。
- 主な確認サイズはChromebookの1366×768、タブレット横1024×768、縦768×1024。
- 期限後は質問、名簿、回答を非表示にして「活動時間が終了しました」。読み上げも停止する。
- 35人・２～４分類を主対象、既存上限100人・12エリアは安全な領域内スクロールで扱う。
- `sources/`は読み取り専用。既存名簿・未コミットの期限変更・元の公開用作業領域を保護する。

## Review Focus

1. 同じ配信IDで内容が異なるURL：以前の回答を別の質問・名簿へ混ぜない（Task 1）。
2. 全員が同じ回答／極端に長い名前：名前を隠さずタップ可能にする（Task 3）。
3. 読み上げ待ち中の期限切れ／画面離脱：次の単語を再生しない（Tasks 2, 3）。
4. 空欄列を含む名簿コピー：７列と名前のみの入力を維持する（Task 4）。
5. 保存容量不足／破損／同一ブラウザ共有：無言で回答消失・別活動への混入を起こさない（Tasks 1, 3）。

## 作業領域と実行コマンド

編集元はプロジェクト内 `interview_work/grade34_site/`。公開用Gitは `interview_work/release_repo/`、現在のブランチは `feature/interview-phase1`。ファイル表は `interview_work/` を基準に記載する。既存の期限変更は未コミットなので実行開始時に差分を確認し、今回の新機能と混同しない。

以下のNodeコマンドはPowerShellで、`interview_work/`を作業ディレクトリとして実行する。`node`は必要なら次の実体へ置き換える。

`C:/Users/withc/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe`

ビルドは `node grade34_site/build-preview.cjs`、依存ハッシュ更新は `node games_site/build.cjs` と `node grade56_site/build.cjs`。Gitには公開用出力が入り、編集元・テストはその外にある。各タスクで編集元を保持し、該当する公開用ファイルだけ明示的にステージしてコミットする。全ファイルの一括追加はしない。

## ファイル構成

- 新規 `grade34_site/interview-session.js`：純粋な質問トークン・進捗遷移・結果取得。
- 新規 `grade34_site/interview-progress.js`：配信単位の保存・検証・破損扱い。
- 新規 `grade34_site/interview-audio.js`：既存の音声選択・速度・区切り仕様を再利用する児童画面用アダプター。
- 変更 `grade34_site/interview-receive.html/js`、新規 `interview-student.css`：２画面、期限監視、操作。
- 新規 `grade34_site/create-roster-template.mjs`、`assets/templates/class-roster-template.xlsx`：再生成可能な空テンプレート。
- 変更 `grade34_site/class-settings.html`、`build-preview.cjs`：ダウンロードと配布。
- 新規テストは各タスクに記載。既存受信テストは仮画面の件数表示依存を更新し、本来の配信・互換性・期限の検証を残す。

### Task 1: 質問・進捗・保存のモデル

**Files:** Create `grade34_site/interview-session.js`, `interview-progress.js`, `interview-student-fixture.cjs`, `test-interview-session.cjs`, `test-interview-progress.cjs`.

**Interfaces:**
- Consumes `InterviewModel.validateDelivery(d)`, `completeQuestion(preset,card)`, `InterviewShare.isExpired(d,now)`。
- Produces `InterviewSession.create(delivery, nowISO)`, `choose(delivery,state,card,nowISO)`, `start(delivery,state,nowISO)`, `move(delivery,state,studentId,areaIdOrNull,nowISO)`, `reset(delivery,nowISO)`, `validate(delivery,state,cards)`, `tokens(delivery,cardOrNull)`, `result(delivery,state,cards)`。
- 各遷移は新しい状態を返し入力を変更しない。stateは設計書のversion=1、phase=`compose|sheet`、selectedCardId、completedQuestion、assignments、日時、識別子を持つ。選択中の名前はUIだけの一時状態。
- `tokens`は `{kind:'word'|'picture'|'punctuation',text,cardId?}` の配列。複語カードは１枚を維持する。
- `InterviewProgress.create(storage).read(delivery,cards)` は `{status:'empty'|'saved'|'corrupt',state?}`、`.save(delivery,state)` は `{ok,error?}`、`.remove(delivery)` は `{ok,error?}`。キーは `dekiru-interview-progress-v1:<deliveryId>`。保存時に配信全体の正規化文字列も持ち、復元時に比較する。

- [ ] 架空35人、blue/redカード、YES/NO、固定文のfixtureを定義し、以下の失敗テストを作る。
```js
const s=Session.create(delivery,now);
assert.throws(()=>Session.start(delivery,s,now));
const ready=Session.choose(delivery,s,blue,now);
const active=Session.start(delivery,ready,now);
const yes=Session.move(delivery,active,'kid-1','yes',now);
const no=Session.move(delivery,yes,'kid-1','no',now);
assert.equal(yes.assignments['kid-1'],'yes');
assert.equal(no.assignments['kid-1'],'no');
assert.equal(Session.move(delivery,no,'kid-1',null,now).assignments['kid-1'],null);
assert.equal(Session.result(delivery,no,cards).interviewedCount,1);
assert.equal(Session.result(delivery,no,cards).unassigned.length,34);
```
- [ ] `node grade34_site/test-interview-session.cjs`で未実装による失敗を確認する。
- [ ] 各遷移に配信検証・期限確認を入れる。選択カードは許可リストのみ、配置は名簿IDと回答エリアIDのみ受け付ける。Sheet中の`choose`は拒否し、質問変更は確認後のresetで行う。結果は `{preset,title,selectedCard,completedQuestion,answerAreas:[{id,label,students}],unassigned,interviewedCount,startedAt,updatedAt,timeZone}` とする。
```js
function move(d,s,studentId,areaId,nowISO){
  assertActive(d,s,nowISO); // 同ファイルで期限・phase・IDを検証
  if(!Object.hasOwn(s.assignments,studentId))throw Error('名前を確認してください');
  if(areaId!==null&&!d.preset.answerAreas.some(a=>a.id===areaId))throw Error('回答先を確認してください');
  return {...s,assignments:{...s.assignments,[studentId]:areaId},updatedAt:nowISO};
}
```
- [ ] 保存失敗・破損・配信内容変更・別配信・同名の追加テストを作り、REDを確認する。
```js
const store=Progress.create(memoryStorage);
assert.equal(store.save(delivery,no).ok,true);
assert.equal(store.read(delivery,cards).status,'saved');
assert.equal(store.read({...delivery,preset:{...delivery.preset,title:'Changed'}},cards).status,'corrupt');
assert.equal(Progress.create({getItem(){return null},setItem(){throw Error('Quota')}}).save(delivery,no).ok,false);
```
- [ ] JSON解析失敗をcorruptで返し、read中は書き込まない。save失敗は状態を変更しない。両テストをGREENにする。固定文開始、期限境界、未知ID、完成文改変、再開時phaseも追加で確認する。
- [ ] ビルドし、新規モデル２ファイルを明示的に追加して `feat: add interview student progress model` としてコミットする。

### Task 2: 既存仕様に沿った読み上げアダプター

**Files:** Create `grade34_site/interview-audio.js`, `test-interview-audio.cjs`。

**Interfaces:** `InterviewAudio.create({onUnavailable,onSpeaking})` → `{speak(text,parts),stop(),setOptions({enabled,wordByWord,rate}),getOptions()}`。partsは発音する単語文字列配列。rateは `.55/.85/1.20`、初期はenabled=true、wordByWord=false、rate=.55。

- [ ] 既存 `sentence-player.js` の音声選択・中断・区切り処理全体を読んで、VMのSpeechSynthesisテストでREDを作る。
```js
audio.setOptions({enabled:true,wordByWord:false,rate:.55});
audio.speak('Do you like blue?',['Do','you','like','blue?']);
assert.equal(spoken[0].text,'Do you like blue?');
assert.equal(spoken[0].rate,.55);
audio.stop();
assert.equal(cancelled,true);
```
- [ ] `node grade34_site/test-interview-audio.cjs`で失敗を確認する。
- [ ] 既存と同じen-US優先順位、360msの単語間隔、中断世代番号を使う。音声OFF・再生し直し・画面離脱でタイマーとキューを中断し、古いonendから次の語を再生しない。API未提供時は操作不能の案内を返す。既存SentencePlayerを無関係に改修しない。
```js
function stop(){generation++;clearTimeout(pause);speechSynthesis?.cancel();}
// 各onendで自身のgenerationと現在値を比較してから次語を予約する。
```
- [ ] 単語モードの順序、末尾疑問符、速度３種類、OFF、古いonend、APIなし、onerrorの回復を追加してGREENを確認する。
- [ ] ビルドして `feat: add interview speech controls adapter` として新規ファイルをコミットする。

### Task 3: 児童２画面・操作・期限と表示

**Files:** Modify `grade34_site/interview-receive.html/js`、Create `interview-student.css`, `test-interview-student-browser.cjs`、Modify `test-interview-expiry-browser.cjs`, `test-interview-delivery-browser.cjs`, `test-interview-integration-browser.cjs` の受信期待値。

**Interfaces:** Tasks 1–2を利用。DOM識別子は `#composeScreen`, `#sheetScreen`, `#startInterview`, `#questionCards`, `#studentStatus`, `#receiveError`。カードは `[data-picture-id]`、名前は `[data-student-id]`、移動先は `[data-area-id]`（未実施は空文字）。外部表示する文字列はtextContentで描画。

- [ ] `interview-test-helper.cjs`のsetupで別browser contextの受信試験を追加する。fixture配信をShare.buildUrlで生成し、次をREDにする。
```js
assert.equal(await page.locator('#startInterview').isEnabled(),false);
await page.locator('[data-picture-id="color-blue"]').click(); // fixtureも同じ既存IDを使う
await page.locator('#startInterview').click();
await page.locator('[data-student-id="kid-1"]').click();
await page.locator('[data-area-id="yes"]').click();
assert.equal(await page.locator('[data-area-id="yes"] [data-student-id="kid-1"]').count(),1);
await page.reload();
assert.equal(await page.locator('[data-area-id="yes"] [data-student-id="kid-1"]').count(),1);
```
- [ ] 実際のカードIDはdata/app-data.jsで確認し、fixtureとテストで共用する。`node grade34_site/test-interview-student-browser.cjs`でREDを確認する。
- [ ] HTMLに必要なカタログ（lt2-data/picture-links含む）、モデル、状態、音声スクリプトを読み込む。受信成功後に保存を検証してcompose/sheetを復元する。未選択時のスロットを示し、開始時だけSheetへ遷移する。
- [ ] 回答移動イベントを実装する。名前のクリックはstopPropagationし選択状態だけ変える。移動先クリックは期限・選択IDを確認してSession.move→保存→描画の順とする。未選択時は何もしない。
```js
nameButton.onclick=e=>{e.stopPropagation();selectedStudent=id;renderSelection();};
area.onclick=()=>{if(!checkExpiry()||!selectedStudent)return;
  state=Session.move(delivery,state,selectedStudent,areaId,new Date().toISOString());
  selectedStudent=null;persistAndRender();
};
```
- [ ] 質問変更・共有端末のやり直しに確認ダイアログを付ける。取消では状態を変えず、了承後にresetしcomposeへ戻す。破損保存のやり直しも確認後のみ。保存エラーは画面の回答を保持し継続表示する。
- [ ] 共通の戻る・スピーカー・音声設定SVG、速度選択、全画面を接続する。音声アダプターへtokenのword/picture文字列を渡し、単語モードでは複語カードの発音も空白で分割する。句読点だけは発音単位にしない。
- [ ] 既存のcheckExpiryを初回・タイマー・focus/pageshow/visibilitychange・各操作前に通し、期限後は両画面を空にしてaudio.stopする。保存された回答は削除しない。hashchangeで別配信に変わる際も古い再生・選択・タイマーを破棄する。
- [ ] CSSをviewport内のグリッドで構成する。名前は最小44px高、回答エリア内はmin-height:0/overflow:auto、２～４分類は均等配置。100人・12分類はスクロール退避し、長い名前は折り返す。
```css
.student-sheet{height:100dvh;display:grid;grid-template-rows:auto auto minmax(0,1fr) minmax(0,1fr);gap:8px}
.student-area{min-width:0;min-height:0;overflow:auto}
.student-name{min-height:44px;overflow-wrap:anywhere}
```
- [ ] YES→NO→未実施、全員YES、同名、長名、３・４・12分類、固定文、質問変更取消、保存失敗、期限中の音声停止、hash切替、キーボード、各画面サイズのテストを追加する。通常35人でbodyの縦横はみ出しがないことを計測する。
- [ ] 既存仮画面向けテストの「2人」等を新画面のカード候補・名簿タイル検証へ置き換え、v1/v2の受信条件は維持する。ブラウザテストGREEN後、ビルドし `feat: enable student interview activity` として明示したファイルをコミットする。

### Task 4: 空の名簿Excelとダウンロード

**Files:** Create `grade34_site/create-roster-template.mjs`, `grade34_site/assets/templates/class-roster-template.xlsx`, `grade34_site/test-roster-template.cjs`, `test-roster-template-browser.cjs`。Modify `grade34_site/class-settings.html`, `build-preview.cjs`。

**Interfaces:** 既存ClassRoster.headersと完全一致するA1:G1、空欄A2:G36。「使い方」は別シート。静的リンク `assets/templates/class-roster-template.xlsx`。

- [ ] Spreadsheetスキル全文・新規作成手順・API・スタイル指針を読み、load_workspace_dependenciesでランタイムを特定する。作成前にダウンロードリンク欠如でREDを作る。
```js
const link=page.getByRole('link',{name:'名簿入力用テンプレートをダウンロード'});
const download=page.waitForEvent('download');await link.click();
assert.equal((await download).suggestedFilename(),'class-roster-template.xlsx');
```
- [ ] `node grade34_site/test-roster-template-browser.cjs`でREDを確認する。
- [ ] Artifact Toolで２シートを生成する。名簿見出しはClassRoster.headersを読み込んで設定し、番号列と名前列の幅・見出し折り返し・35行の入力欄・固定見出しを整える。データ、番号、数式は空のまま。使い方には７列全体をコピーする手順と使う名前表記のみ入力する案内を記載する。スキル指定の再計算・検査・両シート描画・xlsx出力を行い、検証済みファイルを配布先へコピーする。
- [ ] class-settings.htmlにリンクを追加し、ビルドで同じファイルをコピーする。
```html
<a href="assets/templates/class-roster-template.xlsx" download="class-roster-template.xlsx">名簿入力用テンプレートをダウンロード</a>
```
```js
copy(path.join(__dirname,'assets/templates/class-roster-template.xlsx'),'assets/templates/class-roster-template.xlsx');
```
- [ ] 保存済みxlsxを読み直し見出し、空欄、シート名を確認する。コピー相当の入力は次で番号＋ひらがなのみと英語のみを検証する。
```js
assert.equal(ClassRoster.parse('1\t\t\t\tはる\t\t').students[0].names.hiragana.given,'はる');
assert.equal(ClassRoster.parse('2\t\t\t\t\t\tHaru').students[0].names.english.given,'Haru');
```
- [ ] 元・公開用のリンク、ファイル一致、空欄列保持を確認してGREENにする。両シートの描画を視覚確認し、Excel/Google実機で未確認ならその点を記録する。
- [ ] ビルドしxlsx、リンク、ビルド出力を `feat: provide blank class roster workbook` としてコミットする。生成ツール・テストは編集元に保持する。

### Task 5: 統合確認と引き継ぎ

**Files:** Modify `release_repo/docs/interview-phase1-handoff.md`、必要なら失敗したテストが指すTask 1–4の所有ファイル。

- [ ] `node run-classroom-tests.cjs`を実行し全テストの終了結果を確認する。失敗は原因を調べ、回帰テスト→修正→再実行の順で解消する。
- [ ] ３サイトを再ビルドし、`INTERVIEW_BUILT=1`で児童・期限・配信・統合・クラス設定・テンプレートのブラウザテストを実行する。
- [ ] Colorsの別端末相当contextで35人操作、３画面サイズのスクリーンショット、全画面戻る、質問変更と取消、期限切れを最終確認する。音声API呼び出し検証と実際に耳で聞いた確認を区別する。
- [ ] 独立レビューを１回依頼し、重大・重要な指摘を修正して関連テストを再実行する。未確認の実機条件は残存制約として記録する。
- [ ] 引き継ぎへ新しいデータ契約、復元キー、有効期限の扱い、Excel再生成方法、テスト結果を記録しコミットする。GitHub公開や第３工程の実装はしない。
- [ ] ユーザーへローカル版の完了、利用入口、検証結果と未確認条件を報告して停止する。

## 計画セルフレビュー

仕様の文章作り・名前移動・質問変更・レスポンシブ・共通UIはTask 3、状態・結果はTask 1、読み上げはTask 2、期限はTasks 1/3、ExcelはTask 4、回帰・停止条件はTask 5に対応。Review Focusの５条件は各タスクの試験に含めた。提出機能や公開作業を混入させない。

実行方法はユーザー確認待ち。推奨は、この会話の担当が順に実装し、最後に別担当が点検する方式。状態・音声・画面の接続が多く、途中の担当交代より一貫した実装が適する。
