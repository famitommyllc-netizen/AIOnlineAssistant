# Data and Auth Model
- Updated: 2026-03-09 21:52:28 JST
- Purpose: 認証方式とユーザー分離の実装ルールを固定する

## 1. 認証方針
- 採用: セッション認証
- 理由:
  - Webアプリで扱いやすい
  - 実装と運用がシンプル
  - 権限管理を集中しやすい

## 2. データ分離ルール（最重要）
- 全業務データに `user_id` を必須とする。
- 取得は必ずログインユーザーで絞る。
- フロント入力/URLの `user_id` は信用しない。

必須クエリ形:
```sql
SELECT * FROM <table> WHERE user_id = :login_user_id
```

## 3. 対象データ
- tasks
- memos
- number records
- profit records
- user settings

## 4. セッション設計（目標）
- Cookie: `HttpOnly`, `Secure`, `SameSite=Lax`
- セッションストア: DBまたはRedis
- API側で `req.user` を解決してアクセス制御

## 5. store.json -> DB 移行段階
1. store構造を `user_id` 前提にする
2. 認証導入
3. APIをユーザー分離対応
4. DB作成
5. JSONデータ移行
6. JSON保存停止

## 6. 禁止事項
- 認証前提データを匿名アクセスで返す
- APIパラメータの `user_id` で対象ユーザーを切替える
- 業務更新処理で `user_id` 条件なし更新を行う

