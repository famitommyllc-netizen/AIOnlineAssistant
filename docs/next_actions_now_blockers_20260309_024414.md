# Next Actions / Current Blockers (Quick Answer)
- Updated: 2026-03-09 02:44:14 JST
- Purpose: 「明日次は何をやる？」「今止まってることは何？」に即答するための1枚

## 1. 明日すぐやること（優先順）
1. 動作スモーク確認
   - メモモードで `ログメモ` を送っても初期化されないこと
   - 削除ボタン（タスク/メモ/数値集計）が AppFeedback 確認モーダルで動くこと
2. メモ運用確認
   - ログメモが常に1件で維持されること
   - 個別メモが記録セッション単位で分かれること
3. 利益計算アプリ最終UI確認
   - 位置変更・保存・通知・履歴編集の再確認
4. docs同期
   - 変更点が出たら `spec_master` と `change_log` を同時更新

## 2. 今止まっていること（未実装/保留）
- AI API の実接続
- Google Maps 連携（移動履歴/距離）
- 複数ユーザー対応（認証・ユーザー別データ）
- インターネット公開の本番設計（SSL、認証、運用）
- 全アプリ横断マニュアル一覧の拡張

## 3. 直近の不具合起点（解消済み）
- メモ中 `ログメモ` 入力で再初期化される
- 削除UIが画面ごとに不統一
- ログメモが一覧で埋もれる

## 4. 再開コマンド
```bash
cd /Users/masamitomioka/workspace/chatbot
node server.js
```

## 5. 明日最初に読む docs
1. `docs/docs_index_latest.md`
2. `docs/next_actions_now_blockers_20260309_024414.md`（このファイル）
3. `docs/spec_master_20260309_024414.md`
4. `docs/change_log_20260309_024414.md`
5. `docs/full_chat_requests_20260309_024414.md`

## 6. 明日の最初の確認質問（推奨）
- 「今日は 1) 不具合潰し優先 2) AI連携準備 3) 公開運用準備 のどれから開始しますか？」
