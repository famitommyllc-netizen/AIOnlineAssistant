# Rebuild Full Spec
- Updated At: 2026-03-09 01:18:19 JST
- Goal: docsをCodexへ読み込ませるだけで同一アプリを再構築する
- Baseline: chatbot-prototype-2026-03-03-v18

## 1. Rebuild Order
1. docs/docs_index_latest.md
2. docs/spec_master_20260309_011819.md
3. docs/common_app_standards_20260309_011819.md
4. docs/change_log_20260309_011819.md
5. docs/rebuild_manifest_20260309_011819.sha256

## 2. Required Files
- Backend: server.js
- Frontend: public/*.html, public/*.js, public/styles.css
- Data: data/store.json
- Config sample: config/settings.example.json
- Runtime meta: package.json

## 3. Run / Verify
```bash
cd /Users/masamitomioka/workspace/chatbot
node server.js
# open http://localhost:3000
```

## 4. Critical UX Checkpoints
- [1] チャット: 固定ヘッダー/フッター + 中央スクロール。
- [2] モード終了: 入力欄上フロート。
- [3] 初期文言: 秘書口調 + アプリメニュー。
- [4] 日次アーカイブ痕跡: チャット先頭で表示。
- [5] 上スクロールで過去履歴を読込。
- [6] 利益履歴: その場編集で更新（新規化しない）。
- [7] すべての主要操作で中央通知。

## 5. Backend Behavior Notes
- [8] archiveOldItemsByDay() がメッセージ/通知を日次分離。
- [9] /api/state は件数上限付き返却（messages/reminders）。
- [10] /api/history/* で過去日の取得を提供。
- [11] タスク通知は30秒tickで判定。

## 6. Frontend Behavior Notes
- [12] app.js がチャット描画・モード・履歴読込を統括。
- [13] app-feedback.js が通知/確認ダイアログの共通基盤。
- [14] profit-history.js が履歴内編集PATCHを実行。

## 7. Non-Goals (Current)
- [15] AI会話本体は未接続（設定枠のみ）。
- [16] 税務機能は現時点で無効（将来拡張枠のみ保持）。
