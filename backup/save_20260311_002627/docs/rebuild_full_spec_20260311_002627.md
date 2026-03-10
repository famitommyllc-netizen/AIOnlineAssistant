# Rebuild Full Spec (Latest Snapshot)
- Saved At: 2026-03-11 00:26:27 JST
- Purpose: この時点のアプリ再現に必要な最小参照セット

## 1. 必読順
1. `docs/spec_master_20260309_025258.md`（ベース仕様）
2. `docs/spec_addendum_20260311_002627.md`（最新差分）
3. `docs/change_log_20260311_002627.md`（直近変更）
4. `docs/history_master_20260311_002627.md`（統合履歴）
5. `docs/railway_deploy_one_shot_latest.md`（デプロイ準備）

## 2. 現在の重要状態
- `package.json` start は `node server.js`。
- `server.js` は `process.env.PORT || 3000` 対応済み。
- Git未初期化（`.git`なし）。
- `.gitignore` は最低必須項目を満たす。

## 3. 再開コマンド
```bash
cd /Users/masamitomioka/workspace/chatbot
node server.js
```

## 4. Railway準備の最短入口
- `docs/railway_deploy_one_shot_latest.md`

## 5. 証跡
- ファイルハッシュ: `docs/rebuild_manifest_20260311_002627.sha256`

