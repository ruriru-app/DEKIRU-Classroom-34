# Interview Activity — 第１工程

## 今回の範囲

既存Gamesの「Create Games」でInterviewプリセットを作成・編集・削除し、UnitのActivitiesから教師が名簿を準備してURL配信できます。児童側は受信内容の確認用仮画面までです。第２工程の文章作り・Interview Sheet、第３工程のPDF提出は未実装です。

一般公開用カタログは空です。「Colorsサンプルを作成」を押して保存したものだけが、そのブラウザ内で利用できます。保存やJSONの取得は公開ではありません。GitHubへはまだ送信していません。

## 確認の流れ

1. Games → Create Games → Interviewを作る。
2. 「Colorsサンプルを作成」で9色、`Do you like (P)?`、YES／NO、Let’s Try 1 Unit 4が設定されます。確認後「プリセットを保存」。
3. 同じブラウザのLet’s Try 1 Unit 4 → Activities → Colorsを準備。作者の保存リストから「教師画面で試す」でも開けます。
4. クラス名と名簿を入力して「名簿を確認」。番号と氏名を行ごとに修正できます。必要なら「名簿を保存」。
5. 名簿入りURLの共有に関する注意を確認し「この内容で配信」。既存のURLコピー・QR・試す画面が開きます。
6. 別ブラウザでも受信仮画面で質問・カード数・回答エリア・人数を確認できます。

## 制約・個人情報

- プリセットと名簿は同一端末・ブラウザ・オリジン内に保存します。自動同期はありません。
- URLに名簿が含まれます。暗号化や閲覧制限はなく、URLを知る人が読み取れます。クラス内でのみ共有してください。
- QR容量を超える場合はURLコピーを利用できます。コピー機能が使えない場合は文字列を選択して手動コピーできます。
- PC内のfile URLは他端末へ配布できません。ローカル確認用HTTPのlocalhostも学校の別端末には配れません。実際の配布は公開後のURLを使用します。
- 作者画面には認証がありません。サブスク・パスワード・ログイン機能は今回の対象外です。
- 公開依頼用JSONはプリセットのみです。名簿を含みません。

## 追加したデータ構造

- InterviewPreset v1: ID、表示名・タイトル、説明、複数Unit割り当て、固定文または単一 `(P)` テンプレート、既存カードID、可変数の回答エリア、作成・更新日時。
- ClassRoster v1: クラスID、クラス名、安定した児童ID・任意番号・名前、作成・更新日時。同名の児童も別々に保持します。
- InterviewDelivery v1: 配信ID、配信日時、Presetの独立コピー、名簿の独立コピー。発行後の編集は既存URLに反映しません。
- 保存キー: `dekiru-interview-presets-v1` / `dekiru-class-rosters-v1`。既存ゲーム保存キーとは分離しています。

## 変更ファイル・再利用部分

- `grade34/interview-model.js`, `interview-store.js`, `interview-catalog.js`: 検証・保存・空の公開カタログ。
- `grade34/share-codec.js`, `interview-share.js`: 既存Games由来のURL変換、配信スナップショット。
- `grade34/interview-links.js`: ローカル／公開元の明示、UnitのActivities導線。
- `grade34/interview.html`, `interview-teacher.js`, `interview.css`: 教師の読み取り専用プレビューと名簿準備。
- `grade34/interview-receive.html`, `interview-receive.js`: 受信仮画面のみ。
- `games/interview-creator.js`, `interview-creator.css`, `games/index.html`, `games/shell.js`: 既存Create Gamesへの統合。
- `games/share.js`: 共通URL変換に委譲。既存の配信形式を維持。
- `grade34/index.html`, `grade34/app.js`, `grade56/index.html`, `grade56/app.js`: Activities接続。Grade56の教材準備中表示は維持。
- 英語フォントと戻るSVGは既存`common-ui.js`、配信ダイアログは`card-share.js`、カードは既存カタログを利用しています。

編集元とテストはプロジェクト内の専用作業ディレクトリ `interview_work/grade34_site/`, `interview_work/games_site/`, `interview_work/grade56_site/` にあります。従来の編集元は変更していません。公開用成果物は同じディレクトリ内の`release_repo/`、ブランチは`feature/interview-phase1`です。今後統合する際は公開用コミットだけでなく編集元とテスト・Gamesのビルド変更も引き継いでください。

## 検証

- 既存23項目＋新規8項目のテストファイル: 最終レビュー修正後、31/31成功。
- 公開用出力に対しても作者・教師・受信・統合・重複警告の5ブラウザテストが成功。
- 35人、番号付き／名前のみ、同名、再貼り付け、保存・編集・削除取り消し、破損データ・容量不足、別ブラウザ受信、不正／過大URL、QR／コピー失敗を確認。
- Chromeで1920×1080、1366×768、1024×768を確認。共通SVGの表示と押下範囲、Andika、横はみ出しなし、全画面から戻る操作を確認。
- 実機Chromebook・タブレットのタッチ操作確認は未実施。
- 独立レビューで見つかった「行編集後の番号重複を知らせない」問題は、失敗テストで再現後に修正。保存・再読込後も警告を維持し、番号を直すと消えることを確認しました。

## 次工程への接続点

### 実行時の判断記録

- Windows環境でBash用の進行記録スクリプトを利用できないため、同等の作業開始・失敗テスト・成功テスト・コミット記録を手動管理しました。判断が誤っている場合の負担は記録保守です。
- 実機と学校環境の検証は代替できません。今回はChromeの画面サイズ変更・別ブラウザ受信をもってローカル版の確認とし、端末固有の不具合は学校での確認事項として残しています。
- 公開・キャッシュの本番検証は公開時に行います。現段階では公開していません。
- 認証・公開プリセット・児童活動・音声・PDF・提出は承認済みの第１工程範囲外です。後続工程までは実際のInterview活動はできません。
- 別担当は重点箇所の独立試験を行い、全31項目と各画面サイズは実装担当が再検証しました。独立担当による全試験の重複実行はしていません。

軽微な指摘の保留はありません。

### 後続工程

第２工程は`InterviewShare.decode`の配信データから開始します。児童の回答は表示文字列ではなく児童IDと回答エリアIDで管理してください。配信IDと活動ID、回答者本人の情報、活動日時は別管理とします。

第３工程のPDF・Google Classroomへの手動提出は未着手です。詳細は承認済み設計書の後続工程条件を参照してください。
