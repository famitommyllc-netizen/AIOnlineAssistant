# ERP Entry A/B Test Playbook
- Updated: 2026-03-30 01:51:36 JST
- Purpose: 仕入入力系のA/Bテストを白画面なく運用し、他画面へ同じ方式を流用できるようにする

## 1. 適用範囲
- 対象: `apps/erp/src/gas/EntryFormA.html`, `EntryFormB.html`, `main.gs`
- 非対象: 見た目のみのA/B（同一ページ内DOM切替）は本運用では使わない

## 2. A/Bの基本方針（運用ルール）
- A/Bは「同一HTML内の分岐」ではなく「別ページ（`entry_a` / `entry_b`）」で管理する。
- A/Bボタンは状態トグルではなく、必ずページ遷移で切り替える。
- 旧ルート `page=entry` はホームへ寄せ、誤遷移時の白画面を防ぐ。

## 3. ルーティング標準（`main.gs`）
- `WEB_APP_PAGES_` にA/Bページを明示する。
- 必須キー:
  - `entry_a: { file: 'EntryFormA', ... }`
  - `entry_b: { file: 'EntryFormB', ... }`
- 互換キー:
  - `entry` は直接フォームを返さず `Home` へ寄せる。
- WebアプリURLは `getWebAppPageUrl(page, params)` を使って生成する。

## 4. 画面側の実装テンプレート
- 各ページに以下を持つ:
  - `ENTRY_PAGE_DEFAULT_VARIANT_`（A画面は`A`、B画面は`B`）
  - `ENTRY_PAGE_ROUTE_`（自身のpage key）
  - `ENTRY_ALT_PAGE_ROUTE_`（遷移先page key）
- A/Bボタン処理は以下の方針で統一する:
  - `navigateToWebAppPage_(ENTRY_ALT_PAGE_ROUTE_, {})` を実行
  - DOM再描画だけで終わらせない

## 5. 遷移実装の標準化
- `navigateToWebAppPage_` は次の順でURLを解決する:
  1. `buildWebAppPageUrl_` でローカルfallback URLを作る
  2. `/exec` または `/dev` 実行中はfallback URLへ直接遷移
  3. それ以外（モーダル等）は `google.script.run.getWebAppPageUrl(...)` で正規URL取得
  4. 取得失敗時はfallback URLへフォールバック
- 目的: GASモーダル/公開Webの差で遷移不能になる事故を防ぐ

## 6. 変種選択優先順位
- 本番運用の優先順位:
  1. URLクエリ（`ab` または `variant`）
  2. 画面定数（`ENTRY_PAGE_DEFAULT_VARIANT_`）
  3. 端末別補正（必要な場合のみ）
  4. `localStorage` の前回値
- 重要: A/Bテストで比較したい期間は「画面定数で固定し、手動で切替」する

## 7. QAチェックリスト（最低限）
- `Home -> entry_a` 遷移で表示崩れ/白画面がない
- `Home -> entry_b` 遷移で表示崩れ/白画面がない
- A画面のA/BボタンでB画面へ遷移できる
- B画面のA/BボタンでA画面へ遷移できる
- GASモーダル起動時でもA/B切替が機能する
- URLに `?page=entry` を直打ちしてもホームへ着地する

## 8. 他画面へ流用する手順
- 1. `main.gs` に `xxx_a`, `xxx_b` を追加
- 2. `XxxA.html`, `XxxB.html` を分離
- 3. それぞれに `ENTRY_PAGE_ROUTE_` / `ENTRY_ALT_PAGE_ROUTE_` 相当の定数を置く
- 4. A/Bボタンは `navigateToWebAppPage_` のみで実装
- 5. 本ドキュメントのQAチェックを実行してから公開

