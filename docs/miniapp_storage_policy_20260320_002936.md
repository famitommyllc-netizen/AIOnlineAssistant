# Mini App Storage Policy
- Updated At: 2026-03-20 00:55:00 JST
- Purpose: ミニアプリを将来の単体販売/切り出し前提で管理する正式ルール

## 1. 結論（正式格納先）
今後のミニアプリは **縦割り構成** で `apps/` 配下に置く。

```text
apps/
  <miniapp-id>/
    public/   # 画面・フロント資産
    src/      # サーバー側ロジック（必要時）
    data/     # ミニアプリ固有データ
    docs/     # ミニアプリ固有ドキュメント
```

## 2. 現在の配置（移行済み）
- `apps/tasks/public/tasks.html`
- `apps/tasks/public/tasks.js`
- `apps/tasks/data/tasks.json`
- `apps/memos/public/memos.html`
- `apps/memos/public/memos.js`
- `apps/memos/data/memos.json`
- `apps/number-tool/public/number-tool.html`
- `apps/number-tool/public/number-tool.js`
- `apps/number-tool/data/number-tool.json`
- `apps/profit/public/profit-tool.html`
- `apps/profit/public/profit-tool.js`
- `apps/profit/public/profit-history.html`
- `apps/profit/public/profit-history.js`
- `apps/profit/public/profit-settings.html`
- `apps/profit/public/profit-settings.js`
- `apps/profit/public/profit-manual.html`
- `apps/profit/data/profit.json`

## 3. 互換運用（既存URLを壊さない）
既存の `/tasks.html` など旧URLは、`server.js` の静的配信互換マップで新配置ファイルへ解決する。

正規URLは `apps/...` を使用する。
- 例: `/apps/tasks/public/tasks.html`
- 例: `/apps/profit/public/profit-tool.html`

対象（例）:
- `/tasks.html` -> `apps/tasks/public/tasks.html`
- `/memos.html` -> `apps/memos/public/memos.html`
- `/number-tool.html` -> `apps/number-tool/public/number-tool.html`
- `/profit-tool.html` -> `apps/profit/public/profit-tool.html`

## 4. データ移行ルール
- 既存の正本は当面 `data/store.json`。
- ミニアプリ別の分割データを `apps/<miniapp-id>/data/*.json` に同期保存する。
- `writeStore()` 実行時にアプリ別データへ同期する。

分割データ例:
- `apps/tasks/data/tasks.json`
- `apps/memos/data/memos.json`
- `apps/number-tool/data/number-tool.json`
- `apps/profit/data/profit.json`

## 5. 新規ミニアプリ追加規約
新規作成時は次の順で作る。
1. `apps/<miniapp-id>/public/` を作成
2. `apps/<miniapp-id>/data/` を作成
3. `apps/<miniapp-id>/docs/` を作成
4. 必要なら `apps/<miniapp-id>/src/` を作成
5. 旧URL互換が必要なら `server.js` の互換マップへ追加

## 6. この構成にした理由
- 将来の単体販売/別リポジトリ化が容易
- ミニアプリごとの責務が明確
- 依存範囲を小さく保てる
- 既存チャット統合を維持したまま段階分離できる
