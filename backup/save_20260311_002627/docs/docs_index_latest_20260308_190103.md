# Docs Index (Latest)
- Updated: 2026-03-08 21:23:32 JST
- Purpose: docsだけで同一再現と次アプリ流用を可能にする入口

## A. 同一アプリ再現（まず読む）
1. `docs/rebuild_full_spec_20260308_190103.md`
2. `docs/spec_master_20260308_092116.md`
3. `docs/change_log_20260308_185112.md`
4. `docs/rebuild_manifest_20260308_190103.sha256`

## B. 次アプリへの共通流用（最初に読む）
1. `docs/common_app_standards_20260308_212332.md`
2. `docs/spec_master_20260308_092116.md` の共通ヘッダー/×/位置変更章

## C. 補助資料
- `docs/scope_memo.md`
- `docs/precheck_checklist.md`
- `docs/README_template.md`
- `docs/chat_history_*.md`

## D. 運用ルール
- 仕様変更時は `spec_master` と `common_app_standards` を同時更新する。
- 実装差分は `change_log_YYYYMMDD_*.md` を追加して残す。
- 再現性に影響する変更は `rebuild_manifest` を再生成する。
- `docs/tax_extension_runbook_20260308_225033.md`（消費税機能の再導入手順）
