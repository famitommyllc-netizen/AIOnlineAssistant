var ERP_OUTPUT_FOLDER_ID = '1he6UfP9Nm7FGMEVxvIukkI831-5b8CY6';
var ERP_PURCHASE_OUTPUT_DEFAULTS_ = {
  // 現在は登録時に自動生成しない。将来設定値で切り替え可能にする。
  generateOnRegister: false,
  generateSlipPdf: true,
  generateBarcodePdf: true
};

function getPurchaseRegisterOutputOptions_() {
  // 将来は設定シートから読み込む想定
  return {
    generateOnRegister: !!ERP_PURCHASE_OUTPUT_DEFAULTS_.generateOnRegister,
    generateSlipPdf: !!ERP_PURCHASE_OUTPUT_DEFAULTS_.generateSlipPdf,
    generateBarcodePdf: !!ERP_PURCHASE_OUTPUT_DEFAULTS_.generateBarcodePdf
  };
}

function normalizePurchaseOutputOptions_(options) {
  var base = getPurchaseRegisterOutputOptions_();
  var raw = options || {};
  return {
    generateOnRegister: (raw.generateOnRegister === undefined) ? base.generateOnRegister : !!raw.generateOnRegister,
    generateSlipPdf: (raw.generateSlipPdf === undefined) ? base.generateSlipPdf : !!raw.generateSlipPdf,
    generateBarcodePdf: (raw.generateBarcodePdf === undefined) ? base.generateBarcodePdf : !!raw.generateBarcodePdf
  };
}

// 仕入伝票データから出力をまとめて生成（登録処理/レポート画面どちらからでも再利用可能）
function generatePurchaseOutputBundle_(slipData, options) {
  var data = slipData || {};
  if (!data.slipNo) {
    throw new Error('出力対象の伝票データが不足しています');
  }
  var opts = normalizePurchaseOutputOptions_(options);
  if (!opts.generateOnRegister) {
    return {
      executed: false,
      skipped: true,
      reason: 'disabled',
      options: opts,
      pdf: null,
      barcodePdf: null
    };
  }

  var pdfInfo = null;
  var barcodePdfInfo = null;

  if (opts.generateSlipPdf) {
    try {
      pdfInfo = savePurchaseSlipPdf_(data);
    } catch (err) {
      pdfInfo = {
        success: false,
        error: err && err.message ? err.message : String(err)
      };
    }
  }

  if (opts.generateBarcodePdf) {
    try {
      barcodePdfInfo = savePurchaseBarcodePdf_(data);
    } catch (err2) {
      barcodePdfInfo = {
        success: false,
        error: err2 && err2.message ? err2.message : String(err2)
      };
    }
  }

  return {
    executed: true,
    skipped: false,
    options: opts,
    pdf: pdfInfo,
    barcodePdf: barcodePdfInfo
  };
}

// 外部呼び出し用ラッパー（登録完了後/レポート画面の双方から再利用する）
function generatePurchaseOutputs(slipData, options) {
  return generatePurchaseOutputBundle_(slipData, options);
}

function buildPurchaseSlipData_(params) {
  var p = params || {};
  var entries = Array.isArray(p.entries) ? p.entries : [];
  var expenses = Array.isArray(p.expenses) ? p.expenses : [];
  var terminologyMode = '日本対応';
  if (typeof normalizeTerminologyModeInput_ === 'function') {
    terminologyMode = normalizeTerminologyModeInput_(p.terminologyMode) || '日本対応';
  }
  var inventoryIdMode = '明細単位';
  if (typeof normalizeInventoryIdModeInput_ === 'function') {
    inventoryIdMode = normalizeInventoryIdModeInput_(p.inventoryIdMode) || '明細単位';
  } else {
    var rawMode = String(p.inventoryIdMode || '').trim().toLowerCase();
    inventoryIdMode = (rawMode === 'unit') ? '個体単位' : '明細単位';
  }
  var inventoryIdModeLabel = String(p.inventoryIdModeLabel || '').trim();
  if (!inventoryIdModeLabel && typeof getInventoryIdModeLabel_ === 'function') {
    inventoryIdModeLabel = getInventoryIdModeLabel_(inventoryIdMode, terminologyMode);
  }
  if (!inventoryIdModeLabel) {
    inventoryIdModeLabel = inventoryIdMode;
  }

  var totals = {
    qty: 0,
    price: 0,
    point: 0,
    expenseAlloc: 0,
    cost: 0,
    unitWeightedTotal: 0,
    expenseInputTotal: 0
  };

  var lines = entries.map(function(item, index) {
    var qty = roundSlipYen_(item.qty || 1);
    var inventoryIds = Array.isArray(item.inventoryIds) ? item.inventoryIds.slice() : [];
    if (!inventoryIds.length && Array.isArray(item.barcodeValues)) {
      inventoryIds = item.barcodeValues.slice();
    }
    if (!inventoryIds.length) {
      var inventorySeed = String(item.inventoryId || item.barcodeValue || '').trim();
      if (inventorySeed) {
        inventoryIds = inventorySeed.split(/\r?\n/).filter(function(v) { return String(v || '').trim(); });
      }
    }
    if (!inventoryIds.length) {
      inventoryIds = [buildBarcodeValue_(p.slipNo, index + 1, item.productNo)];
    }
    var inventoryId = String(inventoryIds[0] || '').trim();
    var line = {
      lineNo: index + 1,
      inventoryId: inventoryId,
      inventoryIds: inventoryIds,
      productNo: String(item.productNo || '').trim(), // 商品マスタ番号
      name: String(item.name || '').trim(),
      price: roundSlipYen_(item.price),
      point: roundSlipYen_(item.point),
      expenseAlloc: roundSlipYen_(item.expenseAlloc),
      cost: roundSlipYen_(item.cost),
      qty: Math.max(1, qty),
      unitPrice: roundSlipYen_(item.unitPrice),
      barcodeValue: inventoryId,
      barcodeValues: inventoryIds
    };

    totals.qty += line.qty;
    totals.price += line.price;
    totals.point += line.point;
    totals.expenseAlloc += line.expenseAlloc;
    totals.cost += line.cost;
    totals.unitWeightedTotal += line.unitPrice * line.qty;
    return line;
  });

  var expenseLines = expenses.map(function(ex, index) {
    var amount = roundSlipYen_(ex.amount);
    totals.expenseInputTotal += amount;
    return {
      lineNo: index + 1,
      name: String(ex.name || '').trim(),
      amount: amount,
      memo: String(ex.memo || '').trim()
    };
  });

  var avgUnitPrice = totals.qty > 0 ? roundSlipYen_(totals.cost / totals.qty) : 0;

  return {
    slipNo: String(p.slipNo || '').trim(),
    purchaseDate: String(p.purchaseDate || '').trim(),
    supplier: String(p.supplier || '').trim(),
    payment: String(p.payment || '').trim(),
    terminologyMode: terminologyMode,
    inventoryIdMode: inventoryIdMode,
    inventoryIdModeLabel: inventoryIdModeLabel,
    lines: lines,
    expenses: expenseLines,
    totals: {
      qty: totals.qty,
      price: totals.price,
      point: totals.point,
      expenseAlloc: totals.expenseAlloc,
      expenseInputTotal: totals.expenseInputTotal,
      cost: totals.cost,
      avgUnitPrice: avgUnitPrice
    },
    createdAt: Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss')
  };
}

function savePurchaseSlipPdf_(slipData) {
  var data = slipData || {};
  if (!data.slipNo) {
    throw new Error('伝票PDF保存用データが不足しています');
  }

  var folder = getErpOutputFolder_();
  var title = 'ERP_仕入伝票_' + sanitizeFileToken_(data.slipNo) + '_' + Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyyMMdd_HHmmss');

  var doc = DocumentApp.create(title);
  var docFile = DriveApp.getFileById(doc.getId());
  var body = doc.getBody();

  body.appendParagraph('仕入伝票').setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph('作成日時: ' + data.createdAt);
  body.appendParagraph('');

  var itemTable = [['No', '商品個別番号', '商品マスタ番号', '商品名', '提示金額', 'ポイント', '経費分配', '原価', '個数', '単価']];
  (data.lines || []).forEach(function(line) {
    itemTable.push([
      String(line.lineNo),
      String(line.inventoryId || ''),
      line.productNo,
      line.name,
      formatYen_(line.price),
      formatYen_(line.point),
      formatYen_(line.expenseAlloc),
      formatYen_(line.cost),
      String(line.qty),
      formatYen_(line.unitPrice)
    ]);
  });
  body.appendParagraph('商品明細').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendTable(itemTable);
  body.appendParagraph('');

  var expenseTable = [['No', '内容', '金額', 'メモ']];
  if (data.expenses && data.expenses.length) {
    data.expenses.forEach(function(ex) {
      expenseTable.push([String(ex.lineNo), ex.name, formatYen_(ex.amount), ex.memo]);
    });
  } else {
    expenseTable.push(['', 'なし', '0', '']);
  }
  body.appendParagraph('経費明細').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendTable(expenseTable);
  body.appendParagraph('');

  body.appendParagraph('集計').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendTable([
    ['項目', '値'],
    ['総個数', String(data.totals.qty)],
    ['総提示金額', formatYen_(data.totals.price)],
    ['ポイント合計', formatYen_(data.totals.point)],
    ['経費入力合計', formatYen_(data.totals.expenseInputTotal)],
    ['経費分配合計', formatYen_(data.totals.expenseAlloc)],
    ['原価合計', formatYen_(data.totals.cost)],
    ['平均単価', formatYen_(data.totals.avgUnitPrice)]
  ]);
  body.appendParagraph('');

  body.appendParagraph('共通情報').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendTable([
    ['伝票番号', '仕入日', '仕入先', '支払い方法'],
    [
      String(data.slipNo || ''),
      String(data.purchaseDate || ''),
      String(data.supplier || ''),
      String(data.payment || '')
    ]
  ]);

  doc.saveAndClose();

  var pdfBlob = docFile.getAs(MimeType.PDF).setName(title + '.pdf');
  var pdfFile = folder.createFile(pdfBlob);

  // 一時GoogleドキュメントはPDF化後に削除して管理をシンプルに保つ
  docFile.setTrashed(true);

  return {
    success: true,
    fileId: pdfFile.getId(),
    fileName: pdfFile.getName(),
    url: pdfFile.getUrl(),
    folderId: folder.getId()
  };
}

function savePurchaseBarcodePdf_(slipData) {
  var data = slipData || {};
  if (!data.slipNo) {
    throw new Error('バーコードPDF保存用データが不足しています');
  }
  if (!data.lines || !data.lines.length) {
    throw new Error('バーコード対象の商品明細がありません');
  }

  var folder = getErpOutputFolder_();
  var title = 'ERP_バーコード_' + sanitizeFileToken_(data.slipNo) + '_' + Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyyMMdd_HHmmss');

  var doc = DocumentApp.create(title);
  var docFile = DriveApp.getFileById(doc.getId());
  var body = doc.getBody();

  body.appendParagraph('仕入バーコード印刷').setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph('伝票番号: ' + data.slipNo);
  body.appendParagraph('仕入日: ' + data.purchaseDate);
  body.appendParagraph('');

  var table = [['No', '商品個別番号', '商品マスタ番号', '商品名', 'バーコード値']];
  data.lines.forEach(function(line) {
    var barcodeText = Array.isArray(line.inventoryIds) && line.inventoryIds.length
      ? line.inventoryIds.join('\n')
      : String(line.inventoryId || '');
    table.push([
      String(line.lineNo || ''),
      String(line.inventoryId || ''),
      String(line.productNo || ''),
      String(line.name || ''),
      barcodeText
    ]);
  });
  body.appendTable(table);

  body.appendParagraph('');
  body.appendParagraph('ラベル（切り取り用）').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  data.lines.forEach(function(line) {
    var values = Array.isArray(line.inventoryIds) && line.inventoryIds.length
      ? line.inventoryIds
      : [String(line.inventoryId || '')];
    values.forEach(function(code, idx) {
      body.appendParagraph('--------------------------------');
      body.appendParagraph('商品個別番号: ' + String(code || ''));
      body.appendParagraph('商品マスタ番号: ' + String(line.productNo || ''));
      body.appendParagraph('商品名: ' + String(line.name || ''));
      if (values.length > 1) {
        body.appendParagraph('個体番号: ' + (idx + 1) + '/' + values.length);
      }
      body.appendParagraph('バーコード値');
      body.appendParagraph(String(code || '')).setFontSize(18);
    });
  });

  doc.saveAndClose();

  var pdfBlob = docFile.getAs(MimeType.PDF).setName(title + '.pdf');
  var pdfFile = folder.createFile(pdfBlob);
  docFile.setTrashed(true);

  return {
    success: true,
    fileId: pdfFile.getId(),
    fileName: pdfFile.getName(),
    url: pdfFile.getUrl(),
    folderId: folder.getId()
  };
}

function getErpOutputFolder_() {
  var folderId = String(ERP_OUTPUT_FOLDER_ID || '').trim();
  if (!folderId) {
    throw new Error('出力先フォルダIDが未設定です');
  }
  return DriveApp.getFolderById(folderId);
}

function formatYen_(value) {
  return String(roundSlipYen_(value));
}

function roundSlipYen_(value) {
  var num = Number(value);
  return isNaN(num) ? 0 : Math.round(num);
}

function sanitizeFileToken_(value) {
  return String(value || 'NO_SLIP')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 80);
}
