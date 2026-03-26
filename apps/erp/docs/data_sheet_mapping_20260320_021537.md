# Data Sheet Mapping (Observed From Live Spreadsheet)
- Updated: 2026-03-20 02:15:37 JST
- Source Spreadsheet ID: `1QAjUArFxnttcl5kTAFzbYibhlIDLDfpRLUkKlwg86qw`
- Source: 公開閲覧URLからの `xlsx/csv` 実測

## 1. 商品情報（13列）
1. 商品番号
2. JAN
3. 商品名
4. カテゴリ
5. メーカー
6. ブランド
7. サブ
8. 希望小売価格
9. 備考
10. 登録日
11. 検索名
12. 読み仮名
13. 想定売価

コード対応:
- `searchProduct` は A/B/C/K/L を検索対象として参照。
- `registerNewProduct` は A〜M を append する設計。

## 2. 在庫表（17列）
1. 仕入No
2. 仕入日
3. 商品番号
4. 商品名
5. 提示金額
6. ポイント/割引
7. 原価
8. 在庫数
9. 単価
10. 仕入先
11. 支払い方法
12. 売上日
13. 売上金額
14. 販売場所
15. 利益
16. 想定売価
17. 想定利益

コード対応:
- `registerEntries` は A〜Q へ1行追加。
- 現状フロント `entryList` は6要素のみを生成しているため、I列の単価は空になる（`item[6]` 未設定）。

## 3. 経費（実測は6列。6列目ヘッダ空）
1. 日付
2. 内容
3. 金額
4. メモ
5. 登録日
6. (空ヘッダ)

コード対応:
- `registerExpense` は A〜E を append する。
- `getExpenseItems` は B列を内容として候補化する。

## 4. 売上
- 実測でヘッダ/データなし（空シート）。

## 5. ダッシュボード
- 実測でヘッダ/データなし（空シート）。

## 6. シート6
- 実測で管理用メモに近い内容（1列目に「商品情報」「在庫表」等の文字列）。
- 本番データシートとしては未使用前提で要確認。

## 7. 重要差分メモ
1. `expenseForm.gs` コメントの列説明に `B:No` 記載があるが、実シートB列は「内容」。
2. `registerEntries` コメントに「entryList itemは7要素」とあるが、現フロントは6要素作成。
3. 日付列はエクスポートでシリアル値に見える場合がある（例: 45780）。シート上の表示形式確認が必要。
