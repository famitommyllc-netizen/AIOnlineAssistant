# Architecture
- Updated: 2026-03-09 21:52:28 JST
- Purpose: 実装構造と責務分割を統一する

## 1. 採用構造
- モノリス + モジュール分割
- Nodeアプリは1つ（`server.js`）
- 認証は1つ、DBは1つ（次フェーズ）
- 機能はミニアプリ単位で分割

## 2. レイヤー責務
- Presentation: `public/*.html`, `public/*.js`, `public/styles.css`
- Application/API: `server.js` のルート・ユースケース処理
- Data: 現行 `data/store.json`（将来DBへ移行）
- Ops: `logs/`, `docs/`, `backup/`

## 3. チャットの責務
- 司令塔として意図判定と導線提供を担当。
- 業務ロジックと業務データ更新は各ミニアプリAPIへ委譲。

## 4. ミニアプリ境界
- tasks
- memos
- number-tool
- profit

profitはサブ機能を内包:
- calculation (`profit-tool`)
- history (`profit-history`)
- settings (`profit-settings`)

## 5. 共通レイヤーに集約するもの
- 認証/セッション
- DB接続
- ユーザー解決と権限チェック
- 共通UIコンポーネント
- ログ基盤
- ルーティング規約

## 6. 将来拡張の前提
- `user_id` を中心にデータ分離。
- 認証導入後は API が `req.user` ベースでのみデータアクセス。
- store.json 依存を段階移行でDBへ置換。

