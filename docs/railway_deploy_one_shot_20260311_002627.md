# Railway Deploy One Shot Guide
- Saved At: 2026-03-11 00:26:27 JST
- Target: `chatbot`（Node monolith）
- Goal: 次回この1ファイルを読むだけでRailway移行準備を完了できる状態にする

## 0. 現在の確認済み事項
- `package.json`:
  - `"start": "node server.js"` を満たす。
- `server.js`:
  - `const PORT = process.env.PORT || 3000;` を満たす。
- `.git`:
  - 未作成（Git初期化が必要）。
- `.gitignore`:
  - `node_modules/`, `.env`, `.env.*`, `*.log` を含む。

## 1. 事前準備（ローカル）
1. Xcode license 同意（gitコマンド停止対策）
```bash
sudo xcodebuild -license
```
2. Git初期化
```bash
cd /Users/masamitomioka/workspace/chatbot
git init
git add .
git commit -m "init: railway deploy baseline"
```

## 2. .gitignore 推奨（追加検討）
現在必須は満たしている。運用安全性のため以下追記を推奨:
- `backup/`
- `logs/`
- `data/store.json`（本番でDB移行前は特に注意）

## 3. GitHub 連携
```bash
git remote add origin <YOUR_GITHUB_REPO_URL>
git branch -M main
git push -u origin main
```

## 4. Railway 側設定
1. New Project -> Deploy from GitHub Repo
2. Root Directory: `chatbot`（リポジトリ構成次第）
3. Start Command: Railway既定で `npm start`（package.jsonから解決）

## 5. Railway 環境変数（最小）
- `PORT` はRailwayが自動注入
- 任意: `HOST=0.0.0.0`
- 将来追加:
  - 認証シークレット
  - DB接続文字列
  - 外部APIキー

## 6. デプロイ後確認
1. ルート画面表示
2. `POST /api/chat` 応答
3. `GET /api/tools/profit` 応答
4. 利益計算 `計算 -> 保存` 成立
5. エラーログ有無確認

## 7. 失敗時チェック
- 起動失敗: Startコマンド/Root Directory誤り
- 500系: 環境変数不足
- データ消失: ファイル保存依存（Railway再デプロイ時に非永続）

## 8. 重要注意（本番前）
- 現状は認証未導入のため公開URLを広く配布しない。
- 本番化前に「認証 + DB + user_id分離」を実装する。

## 9. 次フェーズに進む順序
1. 認証導入（セッション）
2. 全データ `user_id` 分離
3. DB移行（store.json廃止）
4. Railway本番化

