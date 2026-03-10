# API Contract (Current and Next)
- Updated: 2026-03-09 21:52:28 JST
- Purpose: APIの責務と将来の認証条件を明確化する

## 1. 現行主要API（抜粋）
- Chat:
  - `POST /api/chat`
  - `POST /api/normalize`
- State/Debug:
  - `GET /api/state`
  - `GET /api/debug/version`
  - `GET /api/debug/logs`
- Tasks:
  - `POST/PATCH/DELETE /api/tasks*`
- Memos:
  - `GET /api/notes`
  - `PATCH/DELETE /api/notes/:id`
- Number:
  - `GET/POST/PATCH/DELETE /api/tools/number*`
- Profit:
  - `GET/PUT /api/tools/profit`
  - `POST /api/tools/profit/preview`
  - `POST /api/tools/profit/calc`
  - `PATCH/DELETE /api/tools/profit/records/:id`

詳細は `spec_master_20260309_025258.md` を参照。

## 2. 次フェーズ契約ルール
- すべての業務APIは認証必須にする（preview等を含む）。
- API内で `req.user.id` を解決し、`user_id` 条件でアクセスする。
- クライアントからの `user_id` 指定は受け付けない。

## 3. レスポンス規約（目標）
- 成功: `{ ok: true, ... }`
- 失敗: `{ ok: false, error: { code, message } }`
- HTTPコード:
  - `200/201` 成功
  - `400` 入力不正
  - `401` 未認証
  - `403` 権限不足
  - `404` 対象なし
  - `500` サーバーエラー

## 4. 監査ログ要件
- 重要操作（作成/更新/削除）をユーザー単位で記録する。
- 記録最低項目:
  - timestamp
  - user_id
  - action
  - target_id
  - result(success/fail)

