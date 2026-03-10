# Tax Extension Runbook
- Saved At: 2026-03-08 22:50:33 JST
- Current Status: 消費税関連機能は一時停止（UI/計算/表示から除外）
- Purpose: 後で安全に再導入するための拡張ポイントと手順

## 1. 現在の無効化内容
- 利益計算画面から税関連入力を削除。
  - `taxRate`, `taxMode`
- 利益結果から税関連行を削除。
  - `納付予定消費税額`, `税差し引きボタン`
- 利益設定画面から `インボイス対応` 設定を削除。
- 履歴表示から税項目を削除。
- サーバー計算は税関連値を0固定。
  - `invoiceEnabled=false`, `taxRate=0`, `taxMode='inclusive'`, `taxAmount=0`

## 2. 拡張ポイント（再導入箇所）
- `server.js`
  - `normalizeProfitUi(ui)`
  - `buildProfitRecord(input, options)`
  - `/api/tools/profit/preview` `/api/tools/profit/calc`
- `public/profit-tool.html`
  - 税入力row / 税結果row
- `public/profit-tool.js`
  - 税行の表示制御
  - 税差し引き後の利益率/ROI再計算
- `public/profit-settings.html`, `public/profit-settings.js`
  - インボイスON/OFF設定
- `public/profit-history.js`
  - 履歴内税項目表示

## 3. 再導入手順（推奨）
1. 設定画面へ `インボイス対応` を復活。
2. 利益計算画面へ `税率/税区分` 入力を復活。
3. `buildProfitRecord` で税ロジックを復活。
4. 結果表示と履歴表示へ税項目を復活。
5. 表示ON/OFF切替と移動モード整合を確認。
6. テストケース（税抜/税込/0円/端数）を追加して検証。

## 4. 注意点
- 税計算は要件依存（簡易課税/本則/軽減税率/対象経費）の差が大きい。
- 再導入時は計算根拠をUI上に明示し、前提の切替設定を持たせる。
- 端数処理（切捨て/四捨五入）は仕様で固定してから実装する。
