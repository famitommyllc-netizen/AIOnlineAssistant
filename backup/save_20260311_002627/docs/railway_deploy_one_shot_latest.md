# Railway Deploy One Shot Guide (Latest)
- Updated: 2026-03-11 00:26:27 JST
- Canonical Ref: `docs/railway_deploy_one_shot_20260311_002627.md`
- Goal: 次回のRailway移行準備を最短で再開する

## 0. 現在の状態
- startコマンド: OK（`node server.js`）
- PORT対応: OK（`process.env.PORT || 3000`）
- Git初期化: 未実施（`.git` なし）
- .gitignore: 必須項目は反映済み

## 1. これだけ実行すれば準備開始できる
```bash
sudo xcodebuild -license
cd /Users/masamitomioka/workspace/chatbot
git init
git add .
git commit -m "init: railway deploy baseline"
```

## 2. その後
```bash
git remote add origin <YOUR_GITHUB_REPO_URL>
git branch -M main
git push -u origin main
```

## 3. Railway
- GitHub連携でデプロイ
- Start Command: `npm start`
- Root Directoryはリポジトリ構成に合わせて指定

## 4. 注意
- 現在は認証未導入。
- 公開運用前に「認証 + DB + user_id分離」を優先実装。

