# chatbot 叩き台

ルールベースで動く Web チャット + タスク + リマインダーの最小実装です。

## 現在できること
- Web チャット
- 曖昧表現の整形保存（例: 明日、夕方、なるはや）
- チャット内容からタスク候補を自動作成（件名・期限・通知間隔）
- 担当者の自動抽出（`@name` または `担当:name`）
- チャット内の承認ボタンでタスク登録（見送りも可能）
- 承認ボタン横の「編集」から、口語で候補編集
- タスク編集（件名/担当者/期限メモ/通知間隔）
- チャット入力から通知条件を抽出（`○日前 / ○時間前 / 当日○時 / 期限切れ後○分`）
- 未完了タスクの継続リマインダー（完了ボタンを押すまで）
- 設定画面から AI API 情報の保存（Provider / Model / Base URL / API Key / Secret）
- 設定画面から通知方式の保存（○日前/○時間前/期限時/期限切れ後スヌーズ）
- 「設定画面を教えて」入力で、チャット内に設定画面ボタンを表示

## 起動方法
```bash
cd /Users/masamitomioka/workspace/chatbot
npm start
```

ブラウザで `http://localhost:3000` を開いてください。
- 設定画面は `http://localhost:3000/settings.html` です。

## データ保存先
- `data/store.json`
- ログ（最新）: `logs/latest.log`
- ログ（run単位）: `logs/runs/<run_id>.log`

## デバッグログ確認
- バージョン確認: `GET /api/debug/version`
- 現在runログ: `GET /api/debug/logs`
- 最新統合ログ: `GET /api/debug/logs/latest`

## AI API 拡張ポイント
- `data/store.json` の `settings.ai` に将来の設定を保持
- `server.js` の `makeRuleBasedReply()` を AI ルーティングに差し替え可能
- 設定の保存/取得 API:
  - `GET /api/settings`
  - `PUT /api/settings`
- チャット内承認 API:
  - `POST /api/pending/:id/approve`
  - `POST /api/pending/:id/reject`

## core準拠フォルダ（最小）
- `docs/`
- `progress/`
- `logs/`
- `backup/`
- `config/`
- `specs/`
- `src/`

差し替え想定:
1. `settings.ai.enabled === true` なら API 呼び出し
2. 失敗時は現在のルールベース応答にフォールバック
