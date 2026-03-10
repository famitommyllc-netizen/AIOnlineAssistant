# Rebuild Full Spec
- Updated At: 2026-03-08 21:23:32 JST
- Goal: docs参照のみで、現在のchatbotプロトタイプと同じ挙動を再構築する
- Baseline App Version: `chatbot-prototype-2026-03-03-v18`

## 1. 必読順（この順で読む）
1. `docs/docs_index_latest_20260308_190103.md`
2. `docs/spec_master_20260308_092116.md`
3. `docs/common_app_standards_20260308_212332.md`
4. `docs/change_log_20260308_185112.md`
5. `docs/rebuild_manifest_20260308_190103.sha256`

## 2. 完成形フォルダ
- `server.js`
- `public/`（HTML/JS/CSS/manifest/sw）
- `data/store.json`
- `logs/`（latest, runs, history）
- `docs/`
- `config/settings.example.json`

## 3. 実行条件
- Node.jsで `server.js` を直接起動できること。
- 既定URL: `http://localhost:3000`
- LAN確認時: `HOST=0.0.0.0 LAN_HOST=<LAN_IP> node server.js`

## 4. 主要機能（一致条件）
- 秘書口調のチャットUI（ユーザー右/秘書左）
- タスク作成（候補提示→承認/編集/見送り）
- メモ作成/一覧編集削除
- 数値集計（合計/件数/平均、履歴編集削除）
- 利益計算（計算→結果→保存、履歴編集削除、設定あり）
- 期限通知（日前/時間前/当日時刻/期限時刻/期限後スヌーズ）
- 設定（通知/アイコン/将来AI設定）

## 5. UI一致条件（重要）
- 共通ヘッダー運用: `MENU / 履歴 / 設定 / （ホーム時のみ位置変更） / ×`
- `×` は右端の真円表示
- 位置変更モード:
  - Section移動: 上下端で不可方向ボタンを非活性
  - Row移動: 左側3点ハンドル + 長押しドラッグ
  - モード中は入力不可
- スマホで主要操作が破綻しないこと（文字/ボタン視認性）

## 6. API再現ポイント
- `GET /api/state`（上限付きで状態返却）
- `POST /api/chat`（モード/曖昧表現/画面呼出）
- `POST /api/pending/:id/approve|edit|reject`
- `PATCH /api/tasks/:id/complete|reopen` 他CRUD
- `GET/POST/PATCH/DELETE /api/tools/number*`
- `GET/POST/PATCH/DELETE /api/tools/profit*`
- `PUT /api/settings` `PUT /api/icon-settings`

## 7. データ一致ポイント
- `data/store.json` に全状態を集約保存
- `settings` / `messages` / `tasks` / `pendingActions` / `notes` / `reminders`
- `calculators.numberMemo` / `calculators.profit` にUI順序設定を保存

## 8. 検証シナリオ
1. チャットで `何ができる` → 主要アプリボタン表示
2. `タスク作成` → 候補提示 → 承認で登録
3. タスク管理で完了/再開が反映
4. 数値集計のRow並び替え保存が再読込後も維持
5. 利益計算のSection/Row並び替え保存が再読込後も維持
6. 利益計算でインボイスON時のみ税額表示

## 9. 将来拡張の前提
- AI API接続は設定構造を維持したまま、`/api/chat` の応答生成部を差し替える。
- 新規ミニアプリは `common_app_standards` を先に適用してから機能実装する。
