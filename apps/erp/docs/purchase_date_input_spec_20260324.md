# 仕入日入力仕様（確定）
- Updated: 2026-03-24 17:18:07 JST
- Status: 採用済み（現行実装を正とする）

## 1. 対象
- 画面: `src/gas/EntryForm.html`
- スタイル: `src/gas/style.css.html`
- 項目: 共通項目の `仕入日`

## 2. UI構成（1入力欄 + カレンダー連携）
- ユーザー入力欄は `#common-date`（`type="text"`）を1つだけ使用する。
- カレンダー連携は補助要素 `#common-date-picker`（`type="date"`）で実装し、表示はしない。
- カレンダー起動は `日付` ボタン（`.btn-date-picker`）で行う。

## 3. 入力仕様
- 手入力は数字のみを許可（`inputmode="numeric"` + 正規化）。
- 正規化関数 `normalizeDateDigits_` で非数字を除去し、最大8桁（`YYYYMMDD`）に統一。
- `onDateTextInput` でテキスト入力と日付ピッカー値を同期。
- `onDatePickerChange` で日付ピッカー選択を `YYYYMMDD` に戻して `#common-date` に反映。

## 4. 起動仕様（iPhone/Safari含む）
- `openDatePickerFromText` で以下の順で起動を試行:
1. `focus()`
2. `showPicker()`
3. `click()`（フォールバック）
- 起動不可時はアラートを表示して手入力へ誘導する。

## 5. 復元と登録
- 下書き復元時は `applyDraftPayload_` で `commonInfo.date` を `#common-date` に復元。
- 最終確認時は `showFinalConfirm` で `#common-date` を読み取り、`YYYYMMDD` で登録ペイロードへ格納。
- この項目は必須（仕入先・支払い方法と同時バリデーション）。

## 6. スタイル固定点
- `.date-input-wrap` は `position: relative; width: 100%;`。
- `#common-date` は `.inline-input` として `width: 100%; min-width: 0; box-sizing: border-box;` を維持。
- `.btn-date-picker` は入力欄内右寄せの補助ボタンとして重ね配置。
- `.date-picker-helper` は `1px` + `opacity: 0` で非表示運用。

## 7. 変更禁止ライン（保守ルール）
- 計算ロジック、登録ロジック、データ構造には影響を与えない。
- 仕入日の内部表現 `YYYYMMDD` は維持する。
- 日付入力欄は「見える入力欄1つ」を維持する。
- カレンダー連携は補助要素方式（`#common-date-picker`）を維持する。

## 8. 参照関数
- `renderCommonInfo`
- `formatDateInput`
- `normalizeDateDigits_`
- `digitsToIsoDate_`
- `isoDateToDigits_`
- `onDateTextInput`
- `syncDatePickerFromText_`
- `openDatePickerFromText`
- `onDatePickerChange`
- `showFinalConfirm`
