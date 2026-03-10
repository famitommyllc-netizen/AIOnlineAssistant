# Decision Log
- Updated: 2026-03-09 21:52:28 JST
- Purpose: 設計判断の根拠を残し、将来の迷いを減らす

## D-001 モノリス + モジュール分割を採用
- Decision: 単一Nodeアプリを維持し、機能単位で分割する
- Why: 開発速度と運用シンプルさを優先
- Impact: ルーティング/認証/DB接続は共通化しやすい

## D-002 チャットは司令塔に限定
- Decision: チャットは意図判定と遷移導線中心
- Why: 業務ロジックの分散を防ぎ、保守性を高める
- Impact: 各ミニアプリAPIへ責務を明確に委譲

## D-003 認証はセッション認証
- Decision: JWT先行ではなくセッション認証を採用
- Why: Web中心運用で実装/運用負荷が低い
- Impact: Cookieとサーバーセッション管理が必要

## D-004 全業務データへ user_id 必須
- Decision: tasks/memos/number/profit全てに user_id
- Why: 複数ユーザー運用の基盤を先に固定
- Impact: API/DBクエリの全面見直しが必要

## D-005 store.json からDBへ段階移行
- Decision: 一括置換せず段階移行
- Why: 既存機能停止リスクを抑える
- Impact: 一時的に移行コードと互換期間が必要

