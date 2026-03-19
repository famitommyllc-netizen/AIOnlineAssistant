# Apps Directory

このディレクトリはミニアプリの実体を格納します。

基本構造:

```text
apps/
  <miniapp-id>/
    public/
    src/
    data/
    docs/
```

現在配置済み:
- tasks
- memos
- number-tool
- profit

補足:
- 旧URL互換は `server.js` の `LEGACY_APP_STATIC_MAP` で管理します。
- データ正本は当面 `data/store.json`、同時に `apps/*/data` へ同期保存されます。
