# Chatbot README Template

## 目的
- チャットからタスク候補を作成し、承認で登録する。

## セットアップ
- Node.js / npm
- `npm start`

## 実行
- `http://localhost:3000`
- 設定画面: `http://localhost:3000/settings.html`

## ログ
- 最新ログ: `logs/latest.log`
- runログ: `logs/runs/<run_id>.log`

## フォルダ用途
- docs/: 仕様・運用資料
- progress/: 進捗記録
- logs/: 実行ログ
- specs/: 要件・テスト観点
- config/: 設定テンプレート
- backup/: 退避
- src/: 拡張実装領域

## 再現資料
- docs/rebuild_full_spec_YYYYMMDD_HHMMSS.md
- docs/rebuild_manifest_YYYYMMDD_HHMMSS.sha256
- docs/docs_index_latest_YYYYMMDD_HHMMSS.md
