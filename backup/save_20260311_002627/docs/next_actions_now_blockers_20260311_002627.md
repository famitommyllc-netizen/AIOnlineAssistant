# Next Actions / Current Blockers (Railway Focus)
- Updated: 2026-03-11 00:26:27 JST
- Purpose: 次回開始時に「次は何をやるか」を即決する

## 1. 次にやること（優先順）
1. Git実行環境の復旧（Xcode license同意）。
2. `chatbot` を Git初期化してGitHubへpush。
3. Railwayへ接続し、初回デプロイ成功まで確認。
4. 本番公開前に認証導入計画へ着手。

## 2. 現在のブロッカー
- `.git` が存在せず、GitHub push不可。
- ローカル `git` がXcode license未同意で停止。
- データ保存が `store.json` のため、公開運用には不向き。
- 認証未導入のため公開URLの安全性が不足。

## 3. Railway前提のチェック済み項目
- `package.json` の start OK
- `server.js` の PORT対応 OK
- `.gitignore` 最低必須項目 OK

## 4. 参照
- `docs/railway_deploy_one_shot_latest.md`
- `docs/spec_addendum_20260311_002627.md`
- `docs/change_log_20260311_002627.md`

