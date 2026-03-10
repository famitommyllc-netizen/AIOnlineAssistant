# Roadmap
- Updated: 2026-03-09 21:52:28 JST
- Purpose: 本格化に向けた段階計画を固定する

## Phase 0: 現行安定化（進行中）
- UI回帰修正
- 利益計算フロー改善
- docs整備

## Phase 1: 認証導入
- セッション認証導入
- ログイン/ログアウト画面
- 未認証アクセス制御

## Phase 2: ユーザー分離
- 全業務データへ user_id 追加
- API user_id 条件適用
- クロスユーザー参照防止

## Phase 3: DB移行
- スキーマ作成
- JSON -> DB移行
- JSON保存停止

## Phase 4: 外部公開
- 公開先決定（Railway等）
- HTTPS/環境変数/運用監視
- バックアップ運用確立

## Phase 5: 拡張
- AI連携強化
- PWA化
- スマホアプリ展開検討

