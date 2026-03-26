# ERP Project Bootstrap
- Created At: 2026-03-20 01:47:17 JST
- Location: `chatbot/apps/erp`
- Goal: 将来の単体販売を前提に、ERPミニアプリを独立可能な構成で開始する

## Initial Decision
1. ミニアプリIDは `erp` とする。
2. ERPの実装・仕様・進捗は `apps/erp/` 配下へ集約する。
3. 親アプリ側の変更は導線追加時のみ行う。

## Next Inputs Needed
- 既存GASコード一式（編集不可で保全）
- 対象スプレッドシート構成（シート名、列番号、採番ルール）
- 運用アカウントと権限範囲
