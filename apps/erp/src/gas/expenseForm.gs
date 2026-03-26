// 経費内容の候補一覧を取得（重複なし・最新順）
function getExpenseItems() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('経費');
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  var names = {};
  for (var i = data.length - 1; i >= 1; i--) {
    var val = String(data[i][1] || '').trim(); // B列: 内容
    if (val && !names[val]) names[val] = true;
  }
  return Object.keys(names);
}

// 経費をシートへ登録（A:日付, B:内容, C:金額, D:メモ, E:登録日）
function registerExpense(info) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('経費');
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('経費');
    sheet.getRange(1, 1, 1, 5).setValues([['日付', '内容', '金額', 'メモ', '登録日']]);
  }

  var date = String((info && info.date) || '').trim();
  var name = String((info && info.name) || '').trim();
  var amount = Number((info && info.amount) || 0);
  var memo = String((info && info.memo) || '').trim();

  if (!date || !name || !amount) {
    throw new Error('日付・内容・金額は必須です');
  }

  var row = [
    date,
    name,
    Math.round(amount),
    memo,
    Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd')
  ];
  sheet.appendRow(row);

  // masterシートがある場合は候補として追加
  try {
    if (typeof upsertMasterValue_ === 'function') {
      upsertMasterValue_('expense', name);
    }
  } catch (e) {
    // no-op
  }

  return '経費を登録しました';
}

// 経費を複数行まとめて登録（UI統一用）
function registerExpensesBatch(list) {
  var rows = Array.isArray(list) ? list : [];
  if (!rows.length) throw new Error('経費明細が空です');

  var count = 0;
  rows.forEach(function(item) {
    registerExpense(item || {});
    count += 1;
  });

  return {
    success: true,
    count: count,
    message: '経費を' + count + '件登録しました'
  };
}
