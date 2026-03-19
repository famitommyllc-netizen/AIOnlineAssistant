# Project Status Summary
- Updated At: 2026-03-20 00:55:00 JST
- Scope: これまでの実装・運用・デプロイ準備の統合要約

## 1. 現在のアプリ像
- 形式: Node.jsモノリス + ミニアプリ分割（チャット司令塔モデル）
- 実行: `node server.js`
- ポート: `process.env.PORT || 3000` 対応済み
- 公開UI: チャット本体 + ミニアプリ群（タスク/メモ/数値集計/利益計算）

## 2. ここまでの主要実装
- チャットUI・モード制御を中心に、スマホ前提の操作性を継続改善。
- 利益計算アプリを最重点で強化（入力/結果/履歴/設定/並び替え/保存導線/通知表示の統一）。
- タスク・メモ・数値集計をチャットから呼び出せる設計で整備。
- 曖昧表現入力を前提にした呼び出し/モード切替の改善を反復。
- ログ運用・履歴保存・バックアップ作成フローをdocs化。

## 3. ミニアプリ構成（最新）
- ミニアプリ実体を `apps/<miniapp-id>/` へ移行。
- 主要ミニアプリは `tasks / memos / number-tool / profit` を作成済み。
- `public/` 直下にあった対象HTML/JSは `apps/*/public` へ移動済み。
- 既存URL（例: `/tasks.html`）は `server.js` の互換マップで継続利用可能。

## 4. データ・運用
- 正本: `data/store.json`（当面維持）
- ミニアプリ別データ: `apps/<miniapp-id>/data/*.json` へ移行/同期開始
- `writeStore()` 時にミニアプリ別データへ同期保存する実装を追加済み
- docs・logs・backup の運用を継続

## 5. デプロイ/リポジトリ状況
- Railway向け前提確認: `package.json` の `start`、`server.js` のPORT対応を確認済み。
- GitHub接続: `origin` 設定済み。
- GitHub CLI: 導入・認証・`git push -u origin main` 成功済み。
- 現在 `main` は `origin/main` と追跡関係が設定済み。

## 6. 参照優先ドキュメント
1. `docs/spec_master_20260309_025258.md`
2. `docs/spec_addendum_20260311_002627.md`
3. `docs/change_log_20260311_002627.md`
4. `docs/miniapp_structure_policy_20260309_213155.md`
5. `docs/miniapp_storage_policy_20260320_002936.md`
6. `docs/docs_index_latest.md`

## 7. 次の実務で迷わないための運用ルール
- 仕様変更時は、実装だけでなく `spec` と `change_log` も同時更新する。
- 新しい方針（UI/運用/配置）を決めたら、単独の方針ドキュメントを作成して index に追加する。
- 翌日再開時は `docs/docs_index_latest.md` → `next_actions_now_blockers` の順で確認する。
