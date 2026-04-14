# Operations Runbook
- Updated: 2026-04-12 17:42:09 JST
- Purpose: 開発/検証/復旧を迷わず実行する運用手順

## 1. 起動
```bash
cd /Users/masamitomioka/workspace/chatbot
node server.js
```

## 2. 基本確認
- ブラウザで `http://localhost:3000`
- ログ: `logs/latest.log` または `logs/runs/*.log`

## 3. 停止
- 実行ターミナルで `Ctrl + C`

## 4. バックアップ
- 推奨: `rsync` でプロジェクト全体を `backup/` へ同期
- 例:
```bash
rsync -a --delete --exclude 'backup/' \
  /Users/masamitomioka/workspace/chatbot/ \
  /Users/masamitomioka/workspace/chatbot/backup/<snapshot_name>/
```

## 5. 復旧
1. 直近バックアップを確認
2. 復旧対象を上書き復元
3. サーバー再起動
4. スモークテストを実施

## 6. リリース前チェック（最小）
- 主要画面表示
- 主要API正常
- 主要保存系（タスク/メモ/利益/数値）成功
- 重大エラーなし

## 7. 次フェーズ（外部公開）運用追加予定
- 認証の有効化
- HTTPS化
- 本番ログ監視
- 定期バックアップ

## 8. Snapshot復元（ERP運用）
- Snapshot台帳: `docs/backup_restore_20260412_174209.md`
- 復元コマンド:
```bash
cd /Users/masamitomioka/workspace/chatbot
backup/restore_snapshot.sh <YYYYMMDD-HHMMSS>
```
- GASへ反映が必要な場合:
```bash
cd /Users/masamitomioka/workspace/chatbot/apps/erp/src/gas
clasp push
```
