// ===== 売上取消 =====

function searchSalesForCancel(query) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_SALES_SLIP);
  if (!sheet || sheet.getLastRow() < 2) return [];

  var q = query || {};
  var keyword = String(q.keyword || '').trim().toLowerCase();
  var date = String(q.date || '').trim().replace(/[^0-9]/g, '');

  var lastCol = sheet.getLastColumn();
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol).getValues();
  var out = [];

  values.forEach(function(row, idx) {
    var slipNo      = String(row[0] || '').trim();
    var salesDate   = row[1] instanceof Date ? Utilities.formatDate(row[1], TZ, 'yyyyMMdd') : String(row[1] || '').replace(/[^0-9]/g, '');
    var place       = String(row[2] || '').trim();
    var inventoryId = String(row[3] || '').trim();
    var productNo   = String(row[4] || '').trim();
    var name        = String(row[5] || '').trim();
    var unitCost    = Math.round(Number(row[6]) || 0);
    var unitAmount  = Math.round(Number(row[7]) || 0);
    var profit      = Math.round(Number(row[8]) || 0);
    var payment     = String(row[9] || '').trim();
    var purchaseSlipNo = String(row[10] || '').trim();

    if (!inventoryId && !slipNo) return;

    if (keyword) {
      var haystack = [slipNo, inventoryId, name, productNo, place].join(' ').toLowerCase();
      if (haystack.indexOf(keyword) < 0) return;
    }
    if (date) {
      if (salesDate.indexOf(date) < 0) return;
    }

    out.push({
      rowNo: idx + 2,
      slipNo: slipNo,
      salesDate: row[1],
      place: place,
      inventoryId: inventoryId,
      productNo: productNo,
      name: name,
      unitCost: unitCost,
      unitAmount: unitAmount,
      profit: profit,
      payment: payment,
      purchaseSlipNo: purchaseSlipNo
    });
  });

  out.sort(function(a, b) {
    return String(b.salesDate || '').localeCompare(String(a.salesDate || ''));
  });
  return out;
}

function cancelSalesRows(rowKeys) {
  if (!rowKeys || !rowKeys.length) throw new Error('取消対象が空です');

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var slipSheet = ss.getSheetByName(SHEET_SALES_SLIP);
  var invSheet = ss.getSheetByName(SHEET_INVENTORY);
  if (!slipSheet) throw new Error('売上伝票シートがありません');
  if (!invSheet) throw new Error('在庫表シートがありません');

  // rowKeys を {slipNo+inventoryId} → rowKey でマップ
  var keySet = {};
  rowKeys.forEach(function(k) {
    var key = String(k.slipNo || '') + '|' + String(k.inventoryId || '');
    keySet[key] = true;
  });

  // 売上伝票シートから対象行番号を収集
  var lastCol = slipSheet.getLastColumn();
  var slipValues = slipSheet.getRange(2, 1, slipSheet.getLastRow() - 1, lastCol).getValues();
  var targetSlipRows = [];
  var restoreMap = {};

  slipValues.forEach(function(row, idx) {
    var slipNo      = String(row[0] || '').trim();
    var inventoryId = String(row[3] || '').trim();
    var key = slipNo + '|' + inventoryId;
    if (!keySet[key]) return;

    targetSlipRows.push(idx + 2);

    var unitCost   = Math.round(Number(row[6]) || 0);
    var unitAmount = Math.round(Number(row[7]) || 0);
    var unitProfit = Math.round(Number(row[8]) || 0);

    if (!restoreMap[inventoryId]) {
      restoreMap[inventoryId] = { qty: 0, totalCost: 0, totalAmount: 0, totalProfit: 0 };
    }
    restoreMap[inventoryId].qty        += 1;
    restoreMap[inventoryId].totalCost  += unitCost;
    restoreMap[inventoryId].totalAmount += unitAmount;
    restoreMap[inventoryId].totalProfit += unitProfit;
  });

  if (!targetSlipRows.length) throw new Error('対象行が見つかりません');

  // 在庫表を復元
  var invColCount = Math.min(invSheet.getLastColumn(), 22);
  var invValues = invSheet.getRange(2, 1, invSheet.getLastRow() - 1, invColCount).getValues();
  var invMap = {};
  invValues.forEach(function(row, idx) {
    var id = String(row[0] || '').trim();
    if (id) invMap[id] = { rowNo: idx + 2, row: row };
  });

  Object.keys(restoreMap).forEach(function(inventoryId) {
    var r = restoreMap[inventoryId];
    var hit = invMap[inventoryId];
    if (!hit) return;

    var row    = hit.row;
    var rowNo  = hit.rowNo;
    var curCost     = Math.round(Number(row[7]) || 0);
    var curStock    = Math.round(Number(row[8]) || 0);
    var curSalesAmt = Math.round(Number(row[13]) || 0);
    var curProfit   = Math.round(Number(row[15]) || 0);
    var curSoldQty  = invColCount >= 22 ? Math.round(Number(row[21]) || 0) : 0;

    var newCost     = curCost + r.totalCost;
    var newStock    = curStock + r.qty;
    var newSalesAmt = Math.max(0, curSalesAmt - r.totalAmount);
    var newProfit   = Math.max(0, curProfit - r.totalProfit);
    var newSoldQty  = Math.max(0, curSoldQty - r.qty);

    invSheet.getRange(rowNo, 8).setValue(newCost);
    invSheet.getRange(rowNo, 9).setValue(newStock);
    invSheet.getRange(rowNo, 14).setValue(newSalesAmt);
    invSheet.getRange(rowNo, 16).setValue(newProfit);
    invSheet.getRange(rowNo, 22).setValue(newSoldQty);

    if (newSoldQty === 0) {
      invSheet.getRange(rowNo, 13).clearContent(); // M: 売上日
      invSheet.getRange(rowNo, 15).clearContent(); // O: 販売場所
      if (newSalesAmt === 0) {
        invSheet.getRange(rowNo, 14).clearContent();
        invSheet.getRange(rowNo, 16).clearContent();
      }
    }
  });

  // 売上伝票から対象行を削除（下から順）
  targetSlipRows.sort(function(a, b) { return b - a; });
  targetSlipRows.forEach(function(r) { slipSheet.deleteRow(r); });

  return { success: true, message: targetSlipRows.length + '行の売上取消が完了しました' };
}

// ===== 仕入取消 =====

function searchPurchaseItemsForCancel(query) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var invSheet = ss.getSheetByName(SHEET_INVENTORY);
  if (!invSheet || invSheet.getLastRow() < 2) return [];

  var q = query || {};
  var keyword = String(q.keyword || '').trim().toLowerCase();
  var date    = String(q.date || '').trim().replace(/[^0-9]/g, '');

  var invColCount = Math.min(invSheet.getLastColumn(), 22);
  var values = invSheet.getRange(2, 1, invSheet.getLastRow() - 1, invColCount).getValues();

  var items = [];
  values.forEach(function(row, idx) {
    var slipNo      = String(row[18] || '').trim(); // S
    if (!slipNo) return;

    var inventoryId  = String(row[0] || '').trim();  // A
    var purchaseDate = row[1];                        // B
    var purchaseDateStr = row[1] instanceof Date ? Utilities.formatDate(row[1], TZ, 'yyyyMMdd') : String(row[1] || '').replace(/[^0-9]/g, '');
    var productNo    = String(row[2] || '').trim();  // C
    var name         = String(row[3] || '').trim();  // D
    var price        = Math.round(Number(row[4]) || 0); // E
    var point        = Math.round(Number(row[5]) || 0); // F
    var expenseAlloc = Math.round(Number(row[6]) || 0); // G
    var cost         = Math.round(Number(row[7]) || 0); // H
    var qty          = Math.round(Number(row[8]) || 0); // I
    var unitPrice    = Math.round(Number(row[9]) || 0); // J
    var supplier     = String(row[10] || '').trim(); // K
    var payment      = String(row[11] || '').trim(); // L
    var soldQty      = invColCount >= 22 ? Math.round(Number(row[21]) || 0) : 0; // V

    if (keyword) {
      var haystack = [slipNo, supplier, name, inventoryId, productNo].join(' ').toLowerCase();
      if (haystack.indexOf(keyword) < 0) return;
    }
    if (date && purchaseDateStr.indexOf(date) < 0) return;

    items.push({
      rowNo: idx + 2,
      inventoryId: inventoryId,
      purchaseDate: purchaseDate,
      productNo: productNo,
      name: name,
      price: price,
      point: point,
      expenseAlloc: expenseAlloc,
      cost: cost,
      qty: qty,
      unitPrice: unitPrice,
      supplier: supplier,
      payment: payment,
      slipNo: slipNo,
      soldQty: soldQty
    });
  });

  items.sort(function(a, b) {
    return String(b.purchaseDate || '').localeCompare(String(a.purchaseDate || ''));
  });
  return items;
}

function getPurchaseSlipDetailForCancel(slipNo) {
  if (!slipNo) throw new Error('伝票番号が指定されていません');

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var invSheet = ss.getSheetByName(SHEET_INVENTORY);
  var expSheet = ss.getSheetByName(SHEET_EXPENSE);
  if (!invSheet) throw new Error('在庫表シートがありません');

  var invColCount = Math.min(invSheet.getLastColumn(), 22);
  var invValues = invSheet.getRange(2, 1, invSheet.getLastRow() - 1, invColCount).getValues();

  var inventoryRows = [];
  var canCancel = true;

  invValues.forEach(function(row, idx) {
    if (String(row[18] || '').trim() !== slipNo) return;
    var soldQty = invColCount >= 22 ? Math.round(Number(row[21]) || 0) : 0;
    if (soldQty > 0) canCancel = false;
    inventoryRows.push({
      rowNo: idx + 2,
      inventoryId: String(row[0] || '').trim(),
      name: String(row[3] || '').trim(),
      cost: Math.round(Number(row[7]) || 0),
      qty: Math.round(Number(row[8]) || 0),
      unitPrice: Math.round(Number(row[9]) || 0),
      soldQty: soldQty
    });
  });

  var expenseRows = [];
  if (expSheet && expSheet.getLastRow() >= 2) {
    var expValues = expSheet.getRange(2, 1, expSheet.getLastRow() - 1, 5).getValues();
    expValues.forEach(function(row, idx) {
      var memo = String(row[3] || '');
      if (memo.indexOf(slipNo) < 0) return;
      expenseRows.push({
        rowNo: idx + 2,
        date: row[0],
        name: String(row[1] || '').trim(),
        amount: Math.round(Number(row[2]) || 0)
      });
    });
  }

  return { slipNo: slipNo, inventoryRows: inventoryRows, expenseRows: expenseRows, canCancel: canCancel };
}

function cancelPurchaseSlip(slipNo) {
  if (!slipNo) throw new Error('伝票番号が指定されていません');

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var invSheet = ss.getSheetByName(SHEET_INVENTORY);
  var expSheet = ss.getSheetByName(SHEET_EXPENSE);
  if (!invSheet) throw new Error('在庫表シートがありません');

  var invColCount = Math.min(invSheet.getLastColumn(), 22);
  var invValues = invSheet.getRange(2, 1, invSheet.getLastRow() - 1, invColCount).getValues();

  var targetInvRows = [];
  invValues.forEach(function(row, idx) {
    if (String(row[18] || '').trim() !== slipNo) return;
    var soldQty = invColCount >= 22 ? Math.round(Number(row[21]) || 0) : 0;
    if (soldQty > 0) throw new Error('売上済みの商品があるため取消できません: ' + String(row[3] || ''));
    targetInvRows.push(idx + 2);
  });

  if (!targetInvRows.length) throw new Error('対象の仕入データが見つかりません: ' + slipNo);

  // 経費行を収集
  var targetExpRows = [];
  if (expSheet && expSheet.getLastRow() >= 2) {
    var expValues = expSheet.getRange(2, 1, expSheet.getLastRow() - 1, 5).getValues();
    expValues.forEach(function(row, idx) {
      if (String(row[3] || '').indexOf(slipNo) >= 0) targetExpRows.push(idx + 2);
    });
  }

  // 削除（下から順）
  targetInvRows.sort(function(a, b) { return b - a; });
  targetInvRows.forEach(function(r) { invSheet.deleteRow(r); });

  targetExpRows.sort(function(a, b) { return b - a; });
  targetExpRows.forEach(function(r) { if (expSheet) expSheet.deleteRow(r); });

  return {
    success: true,
    message: '仕入取消完了: ' + slipNo + ' (' + targetInvRows.length + '件削除)'
  };
}
