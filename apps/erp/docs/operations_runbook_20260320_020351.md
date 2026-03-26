# Operations Runbook
- Updated: 2026-03-20 02:03:51 JST

## 1. 日次運用
- Apps Scriptを開いて最新デプロイを確認
- 対象シートのヘッダー変更有無を確認
- テスト登録1件で基本動作を確認

## 2. 障害時
- まず `backup/gas_source_locked_*` の原本で比較
- 失敗した入力値と対象シート行を保存
- 列定義変更の有無を先に確認

## 3. 変更管理
- 原本は編集しない
- 改修版は `src/` 側で管理し、反映時に差分記録を残す
- docs更新は `docs_index_latest.md` に追記する
