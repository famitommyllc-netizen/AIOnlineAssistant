# Mini App Structure Policy
- Saved At: 2026-03-09 21:32:11 JST
- Scope: ミニアプリ構造の方針確定（設計ルールのみ）
- Source: ユーザー提示方針をそのまま保存（Codex共有用）

## 前提
- Codexは現在のアプリ構造（Node / server.js / 各ページ / store.json）を把握している。
- フォルダ構成や具体的なファイル分割は Codexが提案・生成する前提とする。
- このメモは設計ルールだけ共有するためのもの。

## 基本方針

### 採用構造
- モノリス + モジュール分割

意味:
- Nodeアプリは1つ
- 認証は1つ
- DBは1つ
- 機能だけをミニアプリ単位で分割

## チャットの役割
- チャットは司令塔。

やること:
- ユーザーの指示を受ける
- 適切なミニアプリへ誘導
- 必要なら結果を表示

やらないこと:
- 業務ロジックを持たない
- データ処理を直接持たない

## ミニアプリの定義
条件:
- 1つの目的
- 単体画面を持つ
- 独自データを持つ

例:
- tasks
- memos
- number-tool
- profit

補足:
- profit のように1アプリ内に複数サブ機能を持つ場合もある。
- tasks
- memos
- number-tool
- profit-tool
- profit-history
- profit-settings

## 共通土台
ミニアプリに持たせないもの:
- 認証
- セッション
- DB接続
- ユーザー取得
- 権限チェック
- 共通UI
- ルーティング
- ログ

これらはアプリ共通レイヤーにまとめる。

## データ設計ルール

### 全データに user_id を持たせる
すべての業務データ:
- tasks
- memos
- profit
- number records

に user_id を必須とする。

取得ルール:
```sql
WHERE user_id = ログインユーザー
```

禁止:
- フロントから渡された user_id を信用
- URLの user_id を信用

## 認証
採用:
- セッション認証

理由:
- Webアプリに適している
- 実装がシンプル
- 管理しやすい

補足:
- JWTは将来必要なら検討。

## store.json → DB移行方針
段階:
1. store.json を user_id 前提構造へ変更
2. 認証導入
3. APIをユーザー分離対応
4. DB作成
5. JSON → DB移行
6. JSON廃止

## ミニアプリ追加ルール
新機能は以下で判断:
1. 単体で使えるか
2. 独自データを持つか
3. 将来拡張されそうか

YESならミニアプリ。

## 固定ルール
1. 認証は1つ
2. DBは1つ
3. 1機能1モジュール
4. 全データ user_id
5. チャットは司令塔

## 現在のミニアプリ
ミニアプリは次の単位で考える:
- tasks
- memos
- number-tool
- profit

補足:
- profit は1つのミニアプリで、その中に以下の機能を含む。
- profit-tool（利益計算）
- profit-history（履歴）
- profit-settings（設定）

つまり:
```text
profit
├─ calculation
├─ history
└─ settings
```

のような1アプリ内サブ機能構造とする。

## 目的
この構造により:
- ユーザー分離
- 外部公開
- AI連携
- PWA化
- スマホアプリ化

を安全に拡張できる。

---

実装の具体的フォルダ構成やコード生成は Codex に任せる。
