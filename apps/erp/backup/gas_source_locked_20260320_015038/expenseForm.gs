// 経費内容の候補一覧を取得（重複なし・最新順）
// 使用例：経費入力フォームの「内容」プルダウンに活用
function getExpenseItems() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('経費');
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  var names = {};
  for (var i = data.length - 1; i >= 1; i--) { // 最新→過去へ
    var val = data[i][1]; // B列: 経費内容（A:日付, B:No, C:内容, ...）
    if (val && !names[val]) names[val] = true;
  }
  // Object.keys(names)で重複のない内容一覧を返す
  return Object.keys(names);
}

// 経費をシートへ登録（A:日付, B:内容, C:金額, D:メモ, E:登録日）
function registerExpense(info) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('経費');
  if (!sheet) throw new Error("経費シートがありません");
  var row = [
    info.date,                  // A列: 日付
    info.name,                  // B列: 内容
    info.amount,                // C列: 金額
    info.memo || '',            // D列: メモ
    Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyy-MM-dd") // E列: 登録日
  ];
  sheet.appendRow(row);
  return '経費を登録しました';
}
