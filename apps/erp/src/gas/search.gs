var SHEET_PRODUCT = '商品情報';
var SHEET_INVENTORY = '在庫表';
var SHEET_EXPENSE = '経費';
var SHEET_MASTER = 'マスタ';
var SHEET_MASTER_PAYMENT = '支払い方法候補';
var SHEET_MASTER_SALES_PLACE = '販売場所候補';
var SHEET_SALES_SLIP = '売上伝票';
var TZ = 'Asia/Tokyo';

// 商品情報検索（商品マスタ番号/JAN/商品名/検索名/読み仮名で部分一致検索）
function searchProduct(keyword) {
  var query = String(keyword || '').trim();
  if (!query) return [];

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PRODUCT);
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  var results = [];
  for (var i = 1; i < data.length; i++) {
    var productNo = data[i][0];   // A 商品マスタ番号
    var jan = data[i][1];         // B
    var name = data[i][2];        // C
    var searchName = data[i][10]; // K
    var yomi = data[i][11];       // L

    if (
      contains_(productNo, query) ||
      contains_(jan, query) ||
      contains_(name, query) ||
      contains_(searchName, query) ||
      contains_(yomi, query)
    ) {
      results.push([productNo || '', name || '']);
    }
  }
  return results;
}

// 商品新規登録（商品マスタ番号は受取値優先、未指定ならJAN下4桁 or ランダム）
function registerNewProduct(productInfo) {
  var info = productInfo || {};
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PRODUCT);
  if (!sheet) throw new Error('商品情報シートがありません');

  var name = String(info.name || '').trim();
  if (!name) throw new Error('商品名は必須です');

  var productNo = String(info.productNo || '').trim();
  if (!productNo) {
    var jan = String(info.jan || '').trim();
    productNo = jan.length >= 4 ? jan.slice(-4) : String(Math.floor(1000 + Math.random() * 9000));
  }

  var found = findProductRow_(sheet, productNo, name);
  if (found.found) {
    return { msg: '商品情報は既に登録済みです', name: found.name || name, productNo: found.productNo || productNo };
  }

  var row = [
    productNo,                                    // A 商品マスタ番号
    String(info.jan || '').trim(),               // B JAN
    name,                                         // C 商品名
    String(info.category || '').trim(),          // D カテゴリ
    String(info.maker || '').trim(),             // E メーカー
    String(info.brand || '').trim(),             // F ブランド
    String(info.sub || '').trim(),               // G サブ
    toNumberOrBlank_(info.retailPrice),          // H 希望小売価格
    String(info.note || '').trim(),              // I 備考
    formatYmd_(new Date()),                      // J 登録日
    String(info.searchName || name).trim(),      // K 検索名
    String(info.yomigana || '').trim(),          // L 読み仮名
    toNumberOrBlank_(info.assumedPrice)          // M 想定売価
  ];
  sheet.appendRow(row);
  return { msg: '商品情報を登録しました', name: name, productNo: productNo };
}

// 仕入先候補（検索・選択用）
function getSupplierList() {
  return getMasterCandidateList_('supplier', SHEET_INVENTORY, 11); // K列
}

// 支払い方法候補（検索・選択用）
function getPaymentList() {
  return getMasterCandidateList_('payment', SHEET_INVENTORY, 12); // L列
}

// 販売場所候補（売上入力用）
function getSalesPlaceList() {
  return getMasterCandidateList_('sales_place', SHEET_INVENTORY, 15); // O列
}

// 未売上在庫候補（売上入力用）
function getSalesInventoryCandidates() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_INVENTORY);
  if (!sheet || sheet.getLastRow() < 2) return [];

  ensureInventoryHeaders_(sheet);
  var janMap = buildProductJanMap_();

  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 21).getValues();
  var out = [];

  values.forEach(function(row, idx) {
    var rowNo = idx + 2;
    var inventoryId = String(row[0] || '').trim();
    var productNo = String(row[2] || '').trim();
    var name = String(row[3] || '').trim();
    var jan = String(janMap[productNo] || '').trim();
    var cost = roundYen_(toNumber_(row[7]));
    var qty = Math.max(1, roundYen_(toNumber_(row[8]) || 1));
    var salesDate = String(row[12] || '').trim();
    var salesAmount = roundYen_(toNumber_(row[13]));
    var assumedSales = roundYen_(toNumber_(row[16]));
    var purchaseSlipNo = String(row[18] || '').trim();

    if (!name) return;
    if (salesDate || salesAmount > 0) return; // 売上済み除外
    if (roundYen_(toNumber_(row[8])) <= 0) return; // 在庫ゼロ除外

    var id = inventoryId || ('ROW' + rowNo);
    var label = id + '：' + name;
    if (productNo) label += ' / ' + productNo;
    if (jan) label += ' / JAN:' + jan;
    if (qty > 1) label += ' x' + qty;

    out.push({
      rowNo: rowNo,
      inventoryId: id,
      productNo: productNo,
      jan: jan,
      name: name,
      cost: cost,
      qty: qty,
      assumedSales: assumedSales,
      purchaseSlipNo: purchaseSlipNo,
      label: label
    });
  });

  out.sort(function(a, b) {
    return String(a.inventoryId || '').localeCompare(String(b.inventoryId || ''), 'ja');
  });
  return out;
}

// 商品候補（入力補助用）
function getProductCandidates() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PRODUCT);
  if (!sheet || sheet.getLastRow() < 2) return [];

  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues(); // A-C
  var seen = {};
  var out = [];

  values.forEach(function(row) {
    var productNo = String(row[0] || '').trim(); // 商品マスタ番号
    var jan = String(row[1] || '').trim();
    var name = String(row[2] || '').trim();
    if (!name) return;

    var key = (productNo || '-') + '|' + (jan || '-') + '|' + name;
    if (seen[key]) return;
    seen[key] = true;

    var label = '';
    if (jan) {
      label = jan + '：' + name;
    } else if (productNo) {
      label = productNo + '：' + name;
    } else {
      label = name;
    }

    out.push({
      productNo: productNo,
      jan: jan,
      name: name,
      label: label
    });
  });

  out.sort(function(a, b) {
    return String(a.label).localeCompare(String(b.label), 'ja');
  });
  return out;
}

// 候補編集（仕入先/支払い方法）
function addMasterCandidate(type, value) {
  var itemType = normalizeMasterType_(type);
  var itemValue = String(value || '').trim();
  if (!itemType || !itemValue) throw new Error('候補種別と値は必須です');

  upsertMasterValue_(itemType, itemValue);
  removeMasterExclusion_(itemType, itemValue);
  return { ok: true, type: itemType, value: itemValue };
}

function removeMasterCandidate(type, value) {
  var itemType = normalizeMasterType_(type);
  var itemValue = String(value || '').trim();
  if (!itemType || !itemValue) throw new Error('候補種別と値は必須です');

  removeMasterValue_(itemType, itemValue);
  upsertMasterValue_(itemType + '_exclude', itemValue);
  return { ok: true, type: itemType, value: itemValue };
}

// 仕入リストを在庫表に登録（商品個別番号/仕入伝票番号を自動採番）
// entryList item: [商品マスタ番号, 商品名, 提示金額, ポイント/割引, 原価, 個数, 単価, 経費分配, 支払い方法]
function registerEntries(entryList, commonInfo, expenseList) {
  if (!entryList || !entryList.length) throw new Error('仕入リストが空です');

  var info = commonInfo || {};
  var purchaseDate = normalizeDateInput_(info.date);
  var supplier = String(info.supplier || '').trim();
  var payment = String(info.payment || '').trim();
  if (!purchaseDate || !supplier || !payment) {
    throw new Error('共通項目（仕入日/仕入先/支払い方法）が不足しています');
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var inventorySheet = ss.getSheetByName(SHEET_INVENTORY);
  if (!inventorySheet) throw new Error('在庫表シートがありません');
  var productSheet = ss.getSheetByName(SHEET_PRODUCT);
  if (!productSheet) throw new Error('商品情報シートがありません');

  ensureInventoryHeaders_(inventorySheet);
  ensureProductHeaders_(productSheet);

  var slipNo = issueSlipNo_(inventorySheet, purchaseDate, supplier);
  var inventoryIdSeqState = {
    current: getMaxInventoryIdSequence_(inventorySheet)
  };
  var inventoryIdMode = '明細単位';
  var terminologyMode = '日本対応';
  if (typeof getInventoryIdMode_ === 'function') {
    inventoryIdMode = getInventoryIdMode_();
  }
  if (typeof getTerminologyMode_ === 'function') {
    terminologyMode = getTerminologyMode_();
  }
  var inventoryIdModeLabel = inventoryIdMode;
  if (typeof getInventoryIdModeLabel_ === 'function') {
    inventoryIdModeLabel = getInventoryIdModeLabel_(inventoryIdMode, terminologyMode);
  }

  var normalizedEntries = entryList.map(normalizeEntryItem_);
  normalizedEntries.forEach(function(item, idx) {
    item.productNo = upsertProductMasterByEntry_(item.productNo, item.name);
    var rowPayment = String(item.paymentMethod || '').trim();
    if (!rowPayment) {
      if (payment === '個別入力') {
        throw new Error('商品' + (idx + 1) + ' の支払い方法が未入力です');
      }
      rowPayment = payment;
    }
    item.paymentMethod = rowPayment;
    var inventoryIds = buildInventoryIdsByMode_(inventoryIdSeqState, item.qty, inventoryIdMode);
    item.inventoryId = String(inventoryIds[0] || '').trim();
    item.inventoryIds = inventoryIds.slice();
    item.barcodeValues = inventoryIds.slice();
    item.barcodeValue = inventoryIds.join('\n');
  });

  var normalizedExpenses = normalizeExpenseList_(expenseList);
  var slipData = buildPurchaseSlipData_({
    slipNo: slipNo,
    purchaseDate: purchaseDate,
    supplier: supplier,
    payment: payment,
    terminologyMode: terminologyMode,
    inventoryIdMode: inventoryIdMode,
    inventoryIdModeLabel: inventoryIdModeLabel,
    entries: normalizedEntries,
    expenses: normalizedExpenses
  });

  var pdfInfo = null;
  var barcodePdfInfo = null;
  var firstDataRow = inventorySheet.getLastRow() + 1;

  // 検索せず入力された値もマスタへ追加
  upsertMasterValue_('supplier', supplier);
  if (payment && payment !== '個別入力') {
    upsertMasterValue_('payment', payment);
  }
  normalizedEntries.forEach(function(item) {
    if (item.paymentMethod && item.paymentMethod !== '個別入力') {
      upsertMasterValue_('payment', item.paymentMethod);
    }
  });
  normalizedExpenses.forEach(function(ex) { upsertMasterValue_('expense', ex.name); });

  normalizedEntries.forEach(function(item) {
    var linePayment = String(item.paymentMethod || payment).trim() || payment;
    var row = [
      item.inventoryId,         // A 商品個別番号
      purchaseDate,             // B 仕入日
      item.productNo,           // C 商品マスタ番号
      item.name,                // D 商品名
      item.price,               // E 提示金額
      item.point,               // F ポイント/割引
      item.expenseAlloc,        // G 経費分配
      item.cost,                // H 原価
      item.qty,                 // I 在庫数
      item.unitPrice,           // J 単価
      supplier,                 // K 仕入先
      linePayment,              // L 支払い方法
      '',                       // M 売上日
      '',                       // N 売上金額
      '',                       // O 販売場所
      '',                       // P 利益
      '',                       // Q 想定売価
      '',                       // R 想定利益
      slipNo,                   // S 仕入伝票番号
      item.barcodeValue,        // T バーコード値一覧（商品個別番号の主参照は禁止）
      '未作成'                  // U ラベル印刷状態
    ];
    inventorySheet.appendRow(row);
  });

  appendExpenseRows_(normalizedExpenses, {
    date: purchaseDate,
    slipNo: slipNo,
    supplier: supplier,
    inventoryIds: normalizedEntries.map(function(item) { return item.inventoryId; })
  });

  try {
    pdfInfo = savePurchaseSlipPdf_(slipData);
  } catch (err) {
    pdfInfo = {
      success: false,
      error: err && err.message ? err.message : String(err)
    };
  }

  try {
    barcodePdfInfo = savePurchaseBarcodePdf_(slipData);
    markBarcodePrintStatus_(inventorySheet, firstDataRow, normalizedEntries.length, 'PDF作成');
  } catch (err2) {
    barcodePdfInfo = {
      success: false,
      error: err2 && err2.message ? err2.message : String(err2)
    };
    markBarcodePrintStatus_(inventorySheet, firstDataRow, normalizedEntries.length, '作成失敗');
  }

  var firstInventoryId = normalizedEntries.length ? normalizedEntries[0].inventoryId : '';
  var message = '仕入登録完了: 仕入伝票番号=' + slipNo + ' / 商品' + normalizedEntries.length + '件';
  if (firstInventoryId) {
    message += ' / 商品個別番号(先頭)=' + firstInventoryId;
  }
  if (pdfInfo && pdfInfo.success === false) {
    message += ' / PDF保存失敗:' + pdfInfo.error;
  }
  if (barcodePdfInfo && barcodePdfInfo.success === false) {
    message += ' / バーコードPDF保存失敗:' + barcodePdfInfo.error;
  }

  return {
    success: true,
    message: message,
    inventoryIdStart: firstInventoryId,
    slipNo: slipNo,
    terminologyMode: terminologyMode,
    inventoryIdMode: inventoryIdMode,
    inventoryIdModeLabel: inventoryIdModeLabel,
    slipData: slipData,
    pdf: pdfInfo,
    barcodePdf: barcodePdfInfo
  };
}

// 売上リストを在庫表へ登録（複数行一括）
// salesList item: [商品個別番号, 売上金額, 販売場所]
function registerSalesEntries(salesList, commonInfo) {
  if (!salesList || !salesList.length) throw new Error('売上リストが空です');

  var info = commonInfo || {};
  var salesDate = normalizeDateInput_(info.date);
  var commonPlace = String(info.place || '').trim();
  if (!salesDate) {
    throw new Error('売上日を入力してください');
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var inventorySheet = ss.getSheetByName(SHEET_INVENTORY);
  if (!inventorySheet) throw new Error('在庫表シートがありません');
  ensureInventoryHeaders_(inventorySheet);

  var salesSlipSheet = ensureSalesSlipSheet_();
  var salesSlipNo = issueSalesSlipNo_(salesSlipSheet, salesDate, commonPlace || 'UNKNOWN');

  var inventoryLast = inventorySheet.getLastRow();
  if (inventoryLast < 2) throw new Error('在庫データがありません');

  var invValues = inventorySheet.getRange(2, 1, inventoryLast - 1, 21).getValues();
  var invMap = {};
  invValues.forEach(function(row, idx) {
    var rowNo = idx + 2;
    var id = String(row[0] || '').trim();
    var fallbackId = 'ROW' + rowNo;
    var payload = { rowNo: rowNo, row: row };
    if (id && !invMap[id]) invMap[id] = payload;
    if (!invMap[fallbackId]) invMap[fallbackId] = payload;
  });

  var normalized = salesList.map(normalizeSalesEntryItem_);
  var seen = {};
  var updatedCount = 0;
  var totalSales = 0;
  var totalProfit = 0;

  normalized.forEach(function(item) {
    var inventoryId = item.inventoryId;
    if (seen[inventoryId]) {
      throw new Error('同じ商品個別番号が重複しています: ' + inventoryId);
    }
    seen[inventoryId] = true;

    var hit = invMap[inventoryId];
    if (!hit) {
      throw new Error('該当在庫が見つかりません: ' + inventoryId);
    }

    var row = hit.row;
    var rowNo = hit.rowNo;
    var existedSalesDate = String(row[12] || '').trim();
    var existedSalesAmount = roundYen_(toNumber_(row[13]));
    if (existedSalesDate || existedSalesAmount > 0) {
      throw new Error('既に売上済みです: ' + inventoryId);
    }

    var place = item.place || commonPlace;
    if (!place) {
      throw new Error('販売場所を入力してください（商品個別番号: ' + inventoryId + '）');
    }

    var cost = roundYen_(toNumber_(row[7]));
    var salesAmount = item.salesAmount;
    var profit = salesAmount - cost;
    var assumedSalesCell = row[16];
    var assumedProfitCell = row[17];
    var assumedSalesNum = roundYen_(toNumber_(assumedSalesCell));
    if ((assumedProfitCell === '' || assumedProfitCell === null) && assumedSalesNum > 0) {
      assumedProfitCell = assumedSalesNum - cost;
    }

    // I:在庫数を0化（売上済み）
    inventorySheet.getRange(rowNo, 9).setValue(0);
    // M:売上日 N:売上金額 O:販売場所 P:利益 Q:想定売価 R:想定利益
    inventorySheet.getRange(rowNo, 13, 1, 6).setValues([[
      salesDate,
      salesAmount,
      place,
      profit,
      assumedSalesCell,
      assumedProfitCell
    ]]);

    salesSlipSheet.appendRow([
      salesSlipNo,
      salesDate,
      place,
      inventoryId,
      String(row[2] || '').trim(), // 商品マスタ番号
      String(row[3] || '').trim(), // 商品名
      cost,
      salesAmount,
      profit,
      String(row[18] || '').trim(), // 仕入伝票番号
      formatYmd_(new Date())
    ]);

    upsertMasterValue_('sales_place', place);
    updatedCount += 1;
    totalSales += salesAmount;
    totalProfit += profit;
  });

  return {
    success: true,
    message: '売上登録完了: 売上伝票番号=' + salesSlipNo + ' / ' + updatedCount + '件 / 売上合計=' + totalSales + ' / 利益合計=' + totalProfit,
    salesSlipNo: salesSlipNo,
    count: updatedCount,
    totals: {
      salesAmount: totalSales,
      profit: totalProfit
    }
  };
}

function buildProductJanMap_() {
  var map = {};
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PRODUCT);
  if (!sheet || sheet.getLastRow() < 2) return map;

  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues(); // A:商品マスタ番号 B:JAN
  values.forEach(function(row) {
    var productNo = String(row[0] || '').trim();
    var jan = String(row[1] || '').trim();
    if (!productNo || !jan) return;
    if (!map[productNo]) map[productNo] = jan;
  });
  return map;
}

function normalizeEntryItem_(item) {
  var productNo = '';
  var name = '';
  var price = 0;
  var point = 0;
  var cost = 0;
  var qty = 1;
  var unitPrice = 0;
  var expenseAlloc = 0;
  var paymentMethod = '';

  if (Array.isArray(item)) {
    productNo = String(item[0] || '').trim(); // 商品マスタ番号
    name = String(item[1] || '').trim();
    price = roundYen_(toNumber_(item[2]));
    point = roundYen_(toNumber_(item[3]));
    cost = roundYen_(toNumber_(item[4]));
    qty = Math.max(1, roundYen_(toNumber_(item[5]) || 1));
    unitPrice = roundYen_(toNumber_(item[6]));
    expenseAlloc = roundYen_(toNumber_(item[7]));
    paymentMethod = String(item[8] || '').trim();
  } else {
    productNo = String(item.productNo || '').trim();
    name = String(item.name || '').trim();
    price = roundYen_(toNumber_(item.price));
    point = roundYen_(toNumber_(item.point));
    cost = roundYen_(toNumber_(item.cost));
    qty = Math.max(1, roundYen_(toNumber_(item.qty) || 1));
    unitPrice = roundYen_(toNumber_(item.unitPrice));
    expenseAlloc = roundYen_(toNumber_(item.expenseAlloc));
    paymentMethod = String(item.paymentMethod || '').trim();
  }

  if (!name) throw new Error('商品名が空の行があります');

  if (!cost) {
    cost = Math.max(0, price - point + expenseAlloc);
  }
  if (!unitPrice) {
    unitPrice = qty > 0 ? roundYen_(cost / qty) : cost;
  }

  return {
    productNo: productNo,
    name: name,
    price: price,
    point: point,
    cost: cost,
    qty: qty,
    unitPrice: unitPrice,
    expenseAlloc: expenseAlloc,
    paymentMethod: paymentMethod,
    barcodeValue: Array.isArray(item) ? String(item[9] || '').trim() : String(item.barcodeValue || '').trim(),
    barcodeValues: Array.isArray(item) ? [] : (Array.isArray(item.barcodeValues) ? item.barcodeValues.slice() : [])
  };
}

function normalizeExpenseList_(expenseList) {
  if (!expenseList || !expenseList.length) return [];
  return expenseList
    .map(function(item) {
      return {
        name: String(item.name || '').trim(),
        amount: roundYen_(toNumber_(item.amount)),
        memo: String(item.memo || '').trim()
      };
    })
    .filter(function(item) {
      return item.name && item.amount > 0;
    });
}

function normalizeSalesEntryItem_(item) {
  var inventoryId = '';
  var salesAmount = 0;
  var place = '';

  if (Array.isArray(item)) {
    inventoryId = String(item[0] || '').trim();
    salesAmount = roundYen_(toNumber_(item[1]));
    place = String(item[2] || '').trim();
  } else {
    inventoryId = String(item.inventoryId || '').trim();
    salesAmount = roundYen_(toNumber_(item.salesAmount));
    place = String(item.place || '').trim();
  }

  if (!inventoryId) {
    throw new Error('商品個別番号が空の行があります');
  }
  if (salesAmount <= 0) {
    throw new Error('売上金額は1円以上で入力してください（商品個別番号: ' + inventoryId + '）');
  }

  return {
    inventoryId: inventoryId,
    salesAmount: salesAmount,
    place: place
  };
}

function appendExpenseRows_(expenseList, info) {
  if (!expenseList.length) return;

  var sheet = ensureExpenseSheet_();
  var date = info.date;
  var slipNo = info.slipNo;
  var supplier = info.supplier;
  var inventoryIds = Array.isArray(info.inventoryIds) ? info.inventoryIds : [];
  var inventoryIdMemo = inventoryIds.slice(0, 3).join(',');
  if (inventoryIds.length > 3) inventoryIdMemo += '...';

  expenseList.forEach(function(item) {
    var memoParts = [];
    if (item.memo) memoParts.push(item.memo);
    memoParts.push('仕入伝票:' + slipNo);
    if (inventoryIdMemo) memoParts.push('商品個別番号:' + inventoryIdMemo);
    memoParts.push('仕入先:' + supplier);

    var row = [
      date,
      item.name,
      item.amount,
      memoParts.join(' / '),
      formatYmd_(new Date())
    ];
    sheet.appendRow(row);
  });
}

function ensureExpenseSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_EXPENSE);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_EXPENSE);
  }
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, 5).setValues([['日付', '内容', '金額', 'メモ', '登録日']]);
  }
  return sheet;
}

function ensureSalesSlipSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_SALES_SLIP);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_SALES_SLIP);
  }
  if (sheet.getMaxColumns() < 11) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), 11 - sheet.getMaxColumns());
  }
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, 11).setValues([[
      '売上伝票番号',
      '売上日',
      '販売場所',
      '商品個別番号',
      '商品マスタ番号',
      '商品名',
      '原価',
      '売上金額',
      '利益',
      '仕入伝票番号',
      '登録日'
    ]]);
  }
  return sheet;
}

function ensureInventoryHeaders_(sheet) {
  // 旧レイアウト（G列=原価）なら G列に「経費分配」列を挿入して右へシフト
  var gHeader = String(sheet.getRange(1, 7).getValue() || '').trim();
  var hasExpenseAllocColumn = String(sheet.getRange(1, 7).getValue() || '').trim() === '経費分配' ||
    String(sheet.getRange(1, 19).getValue() || '').trim() === '経費分配';
  if (!hasExpenseAllocColumn && gHeader === '原価') {
    sheet.insertColumnBefore(7);
  }

  if (sheet.getMaxColumns() < 21) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), 21 - sheet.getMaxColumns());
  }

  var headers = [[
    '商品個別番号', // A
    '仕入日',       // B
    '商品マスタ番号', // C
    '商品名',       // D
    '提示金額',     // E
    'ポイント/割引', // F
    '経費分配',     // G
    '原価',         // H
    '在庫数',       // I
    '単価',         // J
    '仕入先',       // K
    '支払い方法',   // L
    '売上日',       // M
    '売上金額',     // N
    '販売場所',     // O
    '利益',         // P
    '想定売価',     // Q
    '想定利益',     // R
    '仕入伝票番号', // S
    'バーコード値一覧', // T（補助列。主キー参照は禁止）
    'ラベル印刷状態' // U
  ]];
  sheet.getRange(1, 1, 1, 21).setValues(headers);
  if (sheet.getMaxColumns() >= 20) {
    sheet.hideColumns(20, 1);
  }
}

function ensureProductHeaders_(sheet) {
  if (sheet.getMaxColumns() < 13) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), 13 - sheet.getMaxColumns());
  }

  var headers = [[
    '商品マスタ番号', // A
    'JAN',           // B
    '商品名',         // C
    'カテゴリ',       // D
    'メーカー',       // E
    'ブランド',       // F
    'サブ',           // G
    '希望小売価格',   // H
    '備考',           // I
    '登録日',         // J
    '検索名',         // K
    '読み仮名',       // L
    '想定売価'        // M
  ]];
  sheet.getRange(1, 1, 1, 13).setValues(headers);
}

function getMaxInventoryIdSequence_(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;

  var maxNo = 0;
  var colA = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  colA.forEach(function(row) {
    var n = parseInventoryIdSequence_(row[0]);
    if (n > maxNo) maxNo = n;
  });

  if (sheet.getMaxColumns() >= 20) {
    var colT = sheet.getRange(2, 20, lastRow - 1, 1).getValues();
    colT.forEach(function(row) {
      var text = String(row[0] || '');
      if (!text) return;
      text.split(/\r?\n/).forEach(function(token) {
        var n = parseInventoryIdSequence_(token);
        if (n > maxNo) maxNo = n;
      });
    });
  }

  return maxNo;
}

function issueSlipNo_(sheet, date, supplier) {
  var dateToken = date.replace(/[^0-9]/g, '').slice(0, 8);
  if (dateToken.length !== 8) dateToken = formatYmd_(new Date()).replace(/-/g, '');

  var placeToken = String(supplier || '').trim().replace(/\s+/g, '');
  if (!placeToken) placeToken = 'UNKNOWN';

  var prefix = 'SD-' + dateToken + '-' + placeToken + '-';

  var lastRow = sheet.getLastRow();
  var maxNo = 0;
  if (lastRow >= 2 && sheet.getMaxColumns() >= 19) {
    var values = sheet.getRange(2, 19, lastRow - 1, 1).getValues();
    values.forEach(function(row) {
      var slip = String(row[0] || '');
      if (slip.indexOf(prefix) === 0) {
        var tail = slip.substring(prefix.length);
        var n = parseInt(tail, 10);
        if (!isNaN(n) && n > maxNo) maxNo = n;
      }
    });
  }

  return prefix + padLeft_(maxNo + 1, 4);
}

function issueSalesSlipNo_(sheet, date, place) {
  var dateToken = String(date || '').replace(/[^0-9]/g, '').slice(0, 8);
  if (dateToken.length !== 8) dateToken = formatYmd_(new Date()).replace(/-/g, '');

  var placeToken = String(place || '').trim().replace(/\s+/g, '');
  if (!placeToken) placeToken = 'UNKNOWN';

  var prefix = 'SV-' + dateToken + '-' + placeToken + '-';
  var lastRow = sheet.getLastRow();
  var maxNo = 0;
  if (lastRow >= 2) {
    var values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    values.forEach(function(row) {
      var slip = String(row[0] || '');
      if (slip.indexOf(prefix) === 0) {
        var tail = slip.substring(prefix.length);
        var n = parseInt(tail, 10);
        if (!isNaN(n) && n > maxNo) maxNo = n;
      }
    });
  }
  return prefix + padLeft_(maxNo + 1, 4);
}

function upsertProductMasterByEntry_(productNo, name) {
  var trimmedName = String(name || '').trim();
  if (!trimmedName) return '';

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PRODUCT);
  if (!sheet) return '';
  ensureProductHeaders_(sheet);

  var requestedNo = String(productNo || '').trim();
  var found = findProductRow_(sheet, requestedNo, trimmedName);
  if (found.found) {
    var existedNo = String(found.productNo || '').trim();
    if (existedNo) return existedNo;

    var assignedNo = requestedNo || issueProductMasterNo_(sheet);
    sheet.getRange(found.row, 1).setValue(assignedNo);
    return assignedNo;
  }

  var newProductNo = requestedNo || issueProductMasterNo_(sheet);

  var row = [
    newProductNo,
    '',
    trimmedName,
    '',
    '',
    '',
    '',
    '',
    '',
    formatYmd_(new Date()),
    trimmedName,
    '',
    ''
  ];
  sheet.appendRow(row);
  return newProductNo;
}

function findProductRow_(sheet, productNo, name) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return { found: false };

  var values = sheet.getRange(2, 1, lastRow - 1, 3).getValues(); // A-C
  var targetNo = String(productNo || '').trim();
  var targetName = String(name || '').trim();

  for (var i = 0; i < values.length; i++) {
    var rowNo = String(values[i][0] || '').trim();
    var rowName = String(values[i][2] || '').trim();

    if (targetNo && rowNo && targetNo === rowNo) {
      return { found: true, row: i + 2, productNo: rowNo, name: rowName };
    }
    if (targetName && rowName && targetName === rowName) {
      return { found: true, row: i + 2, productNo: rowNo, name: rowName };
    }
  }
  return { found: false };
}

function getMasterCandidateList_(type, sourceSheetName, sourceCol) {
  ensureSeparatedMasterSheets_();

  var fromMaster = getMasterValues_(type);
  var fromSource = [];
  var excluded = getLegacyMasterValues_(type + '_exclude');
  var excludedMap = {};
  excluded.forEach(function(v) {
    excludedMap[String(v)] = true;
  });

  var sourceSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sourceSheetName);
  if (sourceSheet && sourceSheet.getLastRow() >= 2) {
    var values = sourceSheet.getRange(2, sourceCol, sourceSheet.getLastRow() - 1, 1).getValues();
    values.forEach(function(row) {
      var v = String(row[0] || '').trim();
      if (v && !excludedMap[v]) fromSource.push(v);
    });
  }

  return uniqueValues_(fromMaster.concat(fromSource))
    .filter(function(v) {
      return !excludedMap[String(v)];
    })
    .sort();
}

function upsertMasterValue_(type, value) {
  ensureSeparatedMasterSheets_();

  var itemType = String(type || '').trim();
  var itemValue = String(value || '').trim();
  if (!itemType || !itemValue) return;

  if (itemType.indexOf('_exclude') === -1) {
    removeMasterExclusion_(itemType, itemValue);
  }

  if (hasDedicatedMasterSheet_(itemType)) {
    upsertDedicatedMasterValue_(itemType, itemValue);
    return;
  }

  var sheet = ensureMasterSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    var values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
    for (var i = 0; i < values.length; i++) {
      if (String(values[i][0]).trim() === itemType && String(values[i][1]).trim() === itemValue) {
        return;
      }
    }
  }

  sheet.appendRow([itemType, itemValue, formatYmd_(new Date())]);
}

function removeMasterValue_(type, value) {
  ensureSeparatedMasterSheets_();

  var itemType = String(type || '').trim();
  var itemValue = String(value || '').trim();
  if (!itemType || !itemValue) return;

  if (hasDedicatedMasterSheet_(itemType)) {
    removeDedicatedMasterValue_(itemType, itemValue);
  }

  var sheet = ensureMasterSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  var values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  for (var i = values.length - 1; i >= 0; i--) {
    var rowType = String(values[i][0] || '').trim();
    var rowValue = String(values[i][1] || '').trim();
    if (rowType === itemType && rowValue === itemValue) {
      sheet.deleteRow(i + 2);
    }
  }
}

function removeMasterExclusion_(type, value) {
  removeMasterValue_(String(type || '').trim() + '_exclude', value);
}

function normalizeMasterType_(type) {
  var t = String(type || '').trim().toLowerCase();
  if (t === 'supplier' || t === 'payment' || t === 'sales_place' || t === 'salesplace' || t === 'place') {
    return t === 'salesplace' || t === 'place' ? 'sales_place' : t;
  }
  return '';
}

function getMasterValues_(type) {
  var itemType = String(type || '').trim();
  if (!itemType) return [];

  ensureSeparatedMasterSheets_();
  var legacy = getLegacyMasterValues_(itemType);
  if (!hasDedicatedMasterSheet_(itemType)) {
    return uniqueValues_(legacy);
  }
  var dedicated = getDedicatedMasterValues_(itemType);
  return uniqueValues_(dedicated.concat(legacy));
}

function getLegacyMasterValues_(type) {
  var itemType = String(type || '').trim();
  if (!itemType) return [];

  var sheet = ensureMasterSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  var out = [];
  values.forEach(function(row) {
    if (String(row[0]).trim() === itemType) {
      var v = String(row[1] || '').trim();
      if (v) out.push(v);
    }
  });
  return uniqueValues_(out);
}

function ensureMasterSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_MASTER);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_MASTER);
  }
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, 3).setValues([['種別', '値', '登録日']]);
  }
  return sheet;
}

function ensureSeparatedMasterSheets_() {
  ensureMasterSheet_();
  ensureDedicatedMasterSheetByType_('payment');
  ensureDedicatedMasterSheetByType_('sales_place');
  migrateLegacyMasterTypeToDedicated_('payment');
  migrateLegacyMasterTypeToDedicated_('sales_place');
}

function hasDedicatedMasterSheet_(type) {
  return !!getDedicatedMasterSheetNameByType_(type);
}

function getDedicatedMasterSheetNameByType_(type) {
  var itemType = normalizeMasterType_(type);
  if (itemType === 'payment') return SHEET_MASTER_PAYMENT;
  if (itemType === 'sales_place') return SHEET_MASTER_SALES_PLACE;
  return '';
}

function ensureDedicatedMasterSheetByType_(type) {
  var sheetName = getDedicatedMasterSheetNameByType_(type);
  if (!sheetName) return null;
  return ensureDedicatedMasterSheetByName_(sheetName);
}

function ensureDedicatedMasterSheetByName_(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, 2).setValues([['値', '登録日']]);
  }
  return sheet;
}

function getDedicatedMasterValues_(type) {
  var sheet = ensureDedicatedMasterSheetByType_(type);
  if (!sheet || sheet.getLastRow() < 2) return [];
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
  var out = [];
  values.forEach(function(row) {
    var v = String(row[0] || '').trim();
    if (v) out.push(v);
  });
  return uniqueValues_(out);
}

function upsertDedicatedMasterValue_(type, value) {
  var sheet = ensureDedicatedMasterSheetByType_(type);
  if (!sheet) return;
  var itemValue = String(value || '').trim();
  if (!itemValue) return;

  var lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    var values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < values.length; i++) {
      if (String(values[i][0] || '').trim() === itemValue) {
        return;
      }
    }
  }

  sheet.appendRow([itemValue, formatYmd_(new Date())]);
}

function removeDedicatedMasterValue_(type, value) {
  var sheet = ensureDedicatedMasterSheetByType_(type);
  if (!sheet || sheet.getLastRow() < 2) return;

  var itemValue = String(value || '').trim();
  if (!itemValue) return;

  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
  for (var i = values.length - 1; i >= 0; i--) {
    if (String(values[i][0] || '').trim() === itemValue) {
      sheet.deleteRow(i + 2);
    }
  }
}

function migrateLegacyMasterTypeToDedicated_(type) {
  if (!hasDedicatedMasterSheet_(type)) return;

  var values = getLegacyMasterValues_(type);
  values.forEach(function(v) {
    upsertDedicatedMasterValue_(type, v);
  });

  if (!values.length) return;

  var master = ensureMasterSheet_();
  var lastRow = master.getLastRow();
  if (lastRow < 2) return;

  var itemType = String(normalizeMasterType_(type) || type || '').trim();
  var rows = master.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = rows.length - 1; i >= 0; i--) {
    if (String(rows[i][0] || '').trim() === itemType) {
      master.deleteRow(i + 2);
    }
  }
}

function contains_(value, keyword) {
  if (value === null || value === undefined) return false;
  return String(value).indexOf(keyword) !== -1;
}

function normalizeDateInput_(v) {
  var s = String(v || '').trim();
  if (!s) return '';
  var digits = s.replace(/[^0-9]/g, '');
  if (digits.length >= 8) {
    return digits.slice(0, 8).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
  }
  return s;
}

function toNumberOrBlank_(v) {
  var n = toNumber_(v);
  return n ? n : '';
}

function toNumber_(v) {
  var n = Number(v);
  return isNaN(n) ? 0 : n;
}

function roundYen_(v) {
  return Math.round(toNumber_(v));
}

function padLeft_(n, len) {
  return ('000000000000' + n).slice(-len);
}

function parseNumberToken_(v) {
  if (v === null || v === undefined) return 0;
  var m = String(v).match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

function uniqueValues_(list) {
  var seen = {};
  var out = [];
  list.forEach(function(v) {
    var key = String(v || '').trim();
    if (!key) return;
    if (!seen[key]) {
      seen[key] = true;
      out.push(key);
    }
  });
  return out;
}

function buildBarcodeValue_(idToken, lineNo, productNo) {
  var pNo = String(idToken || '').trim() || 'S000000';
  var lNo = padLeft_(Math.max(1, parseNumberToken_(lineNo)), 3);
  var prod = String(productNo || '').trim().replace(/\s+/g, '');
  if (!prod) prod = 'NOITEM';
  return ['ERP', pNo, lNo, prod].join('-');
}

function buildBarcodeValuesByMode_(idToken, lineNo, productNo, qty, mode) {
  var normalizedMode = String(mode || '').trim();
  if (typeof normalizeInventoryIdModeInput_ === 'function') {
    normalizedMode = normalizeInventoryIdModeInput_(normalizedMode);
  }
  if (!normalizedMode) {
    var lower = String(mode || '').trim().toLowerCase();
    normalizedMode = (lower === 'unit') ? '個体単位' : '明細単位';
  }

  if (normalizedMode !== '個体単位') {
    return [buildBarcodeValue_(idToken, lineNo, productNo)];
  }

  var count = Math.max(1, roundYen_(toNumber_(qty || 1)));
  var base = buildBarcodeValue_(idToken, lineNo, productNo);
  var out = [];
  for (var i = 1; i <= count; i++) {
    out.push(base + '-U' + padLeft_(i, 3));
  }
  return out;
}

function buildInventoryIdsByMode_(seqState, qty, mode) {
  var normalizedMode = String(mode || '').trim();
  if (typeof normalizeInventoryIdModeInput_ === 'function') {
    normalizedMode = normalizeInventoryIdModeInput_(normalizedMode);
  }
  if (!normalizedMode) {
    normalizedMode = '明細単位';
  }

  var count = 1;
  if (normalizedMode === '個体単位') {
    count = Math.max(1, roundYen_(toNumber_(qty || 1)));
  }

  var out = [];
  for (var i = 0; i < count; i++) {
    seqState.current += 1;
    out.push('I' + padLeft_(seqState.current, 8));
  }
  return out;
}

function parseInventoryIdSequence_(value) {
  var text = String(value || '').trim();
  var m = text.match(/^I(\d{4,})$/);
  if (m) return parseInt(m[1], 10);
  return 0;
}

function issueProductMasterNo_(sheet) {
  var lastRow = sheet.getLastRow();
  var maxNo = 999;
  if (lastRow >= 2) {
    var values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    values.forEach(function(row) {
      var token = String(row[0] || '').trim();
      if (!token) return;
      var n = parseInt(token, 10);
      if (!isNaN(n) && n > maxNo && token.length <= 6) {
        maxNo = n;
      }
    });
  }
  return padLeft_(maxNo + 1, 4);
}

// 在庫表/商品情報のヘッダを現行仕様へ揃える（メニュー未実装のため手動実行用）
function applyErpSchemaUpdates() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var inventorySheet = ss.getSheetByName(SHEET_INVENTORY);
  if (!inventorySheet) {
    inventorySheet = ss.insertSheet(SHEET_INVENTORY);
  }
  ensureInventoryHeaders_(inventorySheet);

  var productSheet = ss.getSheetByName(SHEET_PRODUCT);
  if (!productSheet) {
    productSheet = ss.insertSheet(SHEET_PRODUCT);
  }
  ensureProductHeaders_(productSheet);

  var salesSlipSheet = ensureSalesSlipSheet_();
  ensureSeparatedMasterSheets_();

  var setupOk = false;
  try {
    if (typeof ensureErpSettingsSetup_ === 'function') {
      ensureErpSettingsSetup_();
      setupOk = true;
    }
  } catch (e) {
    setupOk = false;
  }

  return {
    ok: true,
    inventorySheet: SHEET_INVENTORY,
    productSheet: SHEET_PRODUCT,
    salesSlipSheet: SHEET_SALES_SLIP,
    paymentMasterSheet: SHEET_MASTER_PAYMENT,
    salesPlaceMasterSheet: SHEET_MASTER_SALES_PLACE,
    settingsPrepared: setupOk,
    inventoryHeaders: inventorySheet.getRange(1, 1, 1, 21).getValues()[0],
    productHeaders: productSheet.getRange(1, 1, 1, 13).getValues()[0],
    salesSlipHeaders: salesSlipSheet.getRange(1, 1, 1, 11).getValues()[0]
  };
}

// スプレッドシート編集メンテナンス（売上系）
// - 売上済み行の在庫数を0に統一
// - 販売場所候補をマスタへ再登録
// - 売上伝票シートヘッダを整備
function runSalesSheetMaintenance() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var inventorySheet = ss.getSheetByName(SHEET_INVENTORY);
  if (!inventorySheet) throw new Error('在庫表シートがありません');
  ensureInventoryHeaders_(inventorySheet);
  ensureSalesSlipSheet_();

  var lastRow = inventorySheet.getLastRow();
  var fixedQtyRows = 0;
  var placeCount = 0;
  if (lastRow >= 2) {
    var values = inventorySheet.getRange(2, 1, lastRow - 1, 21).getValues();
    values.forEach(function(row, idx) {
      var rowNo = idx + 2;
      var salesDate = String(row[12] || '').trim();
      var salesAmount = roundYen_(toNumber_(row[13]));
      var qty = roundYen_(toNumber_(row[8]));
      var place = String(row[14] || '').trim();

      if ((salesDate || salesAmount > 0) && qty !== 0) {
        inventorySheet.getRange(rowNo, 9).setValue(0);
        fixedQtyRows += 1;
      }
      if (place) {
        upsertMasterValue_('sales_place', place);
        placeCount += 1;
      }
    });
  }

  return {
    success: true,
    message: '売上メンテナンス完了',
    fixedQtyRows: fixedQtyRows,
    scannedRows: Math.max(0, lastRow - 1),
    placeRowsScanned: placeCount
  };
}

function markBarcodePrintStatus_(sheet, startRow, count, status) {
  var row = Math.max(2, parseNumberToken_(startRow));
  var n = Math.max(0, parseNumberToken_(count));
  if (!n) return;
  var value = String(status || '').trim();
  var values = [];
  for (var i = 0; i < n; i++) {
    values.push([value]);
  }
  sheet.getRange(row, 21, n, 1).setValues(values);
}

function formatYmd_(date) {
  return Utilities.formatDate(date, TZ, 'yyyy-MM-dd');
}
