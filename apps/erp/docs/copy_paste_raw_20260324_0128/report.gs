var ERP_REPORT_TZ = 'Asia/Tokyo';

function getPeriodReport(periodType, periodValue) {
  var period = normalizeReportPeriod_(periodType, periodValue);
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var inventorySheet = ss.getSheetByName('在庫表');
  var expenseSheet = ss.getSheetByName('経費');

  var purchaseRows = [];
  var salesRows = [];
  var expenseRows = [];

  var purchasePriceTotal = 0;
  var purchaseCostTotal = 0;
  var purchaseQtyTotal = 0;
  var purchasePointTotal = 0;
  var purchaseExpenseAllocTotal = 0;

  var salesAmountTotal = 0;
  var salesCostTotal = 0;
  var salesProfitTotal = 0;
  var assumedSalesTotal = 0;

  var expenseTotal = 0;

  if (inventorySheet && inventorySheet.getLastRow() >= 2) {
    var invValues = inventorySheet.getRange(2, 1, inventorySheet.getLastRow() - 1, 19).getValues();
    invValues.forEach(function(row) {
      var purchaseDate = toYmd_(row[1]);
      var salesDate = toYmd_(row[12]);

      var purchaseMatch = isInPeriod_(purchaseDate, period);
      var salesMatch = isInPeriod_(salesDate, period);

      var price = roundReportYen_(row[4]);
      var point = roundReportYen_(row[5]);
      var expenseAlloc = roundReportYen_(row[6]);
      var cost = roundReportYen_(row[7]);
      var qty = Math.max(0, roundReportYen_(row[8]));

      if (purchaseMatch) {
        purchaseRows.push({
          inventoryId: String(row[0] || ''),
          purchaseDate: purchaseDate,
          productMasterNo: String(row[2] || ''),
          name: String(row[3] || ''),
          price: price,
          point: point,
          expenseAlloc: expenseAlloc,
          cost: cost,
          qty: qty,
          supplier: String(row[10] || ''),
          payment: String(row[11] || ''),
          slipNo: String(row[18] || '')
        });

        purchasePriceTotal += price;
        purchasePointTotal += point;
        purchaseExpenseAllocTotal += expenseAlloc;
        purchaseCostTotal += cost;
        purchaseQtyTotal += qty;
      }

      if (salesMatch) {
        var salesAmount = roundReportYen_(row[13]);
        var profitCell = roundReportYen_(row[15]);
        var assumedSales = roundReportYen_(row[16]);
        var estimatedProfit = (profitCell !== 0) ? profitCell : (salesAmount - cost);

        salesRows.push({
          salesDate: salesDate,
          inventoryId: String(row[0] || ''),
          productMasterNo: String(row[2] || ''),
          name: String(row[3] || ''),
          salesAmount: salesAmount,
          cost: cost,
          profit: estimatedProfit,
          assumedSales: assumedSales,
          place: String(row[14] || ''),
          slipNo: String(row[18] || '')
        });

        salesAmountTotal += salesAmount;
        salesCostTotal += cost;
        salesProfitTotal += estimatedProfit;
        assumedSalesTotal += (assumedSales > 0 ? assumedSales : salesAmount);
      }
    });
  }

  if (expenseSheet && expenseSheet.getLastRow() >= 2) {
    var expValues = expenseSheet.getRange(2, 1, expenseSheet.getLastRow() - 1, 5).getValues();
    expValues.forEach(function(row) {
      var expenseDate = toYmd_(row[0]);
      if (!isInPeriod_(expenseDate, period)) return;

      var amount = roundReportYen_(row[2]);
      expenseRows.push({
        date: expenseDate,
        name: String(row[1] || ''),
        amount: amount,
        memo: String(row[3] || '')
      });
      expenseTotal += amount;
    });
  }

  var grossProfit = salesAmountTotal - salesCostTotal;
  var operatingProfit = grossProfit - expenseTotal;
  var profitRate = salesAmountTotal > 0 ? (operatingProfit / salesAmountTotal) * 100 : 0;
  var depreciationRate = assumedSalesTotal > 0 ? ((assumedSalesTotal - salesAmountTotal) / assumedSalesTotal) * 100 : 0;
  var expenseRate = salesAmountTotal > 0 ? (expenseTotal / salesAmountTotal) * 100 : 0;

  return {
    period: {
      type: period.type,
      value: period.value,
      label: period.label
    },
    summary: {
      purchaseCount: purchaseRows.length,
      purchaseQtyTotal: purchaseQtyTotal,
      purchasePriceTotal: purchasePriceTotal,
      purchasePointTotal: purchasePointTotal,
      purchaseExpenseAllocTotal: purchaseExpenseAllocTotal,
      purchaseCostTotal: purchaseCostTotal,
      salesCount: salesRows.length,
      salesAmountTotal: salesAmountTotal,
      salesCostTotal: salesCostTotal,
      salesProfitTotal: salesProfitTotal,
      expenseCount: expenseRows.length,
      expenseTotal: expenseTotal,
      grossProfit: grossProfit,
      operatingProfit: operatingProfit,
      profitRate: roundPercent_(profitRate),
      depreciationRate: roundPercent_(depreciationRate),
      expenseRate: roundPercent_(expenseRate)
    },
    purchases: purchaseRows,
    sales: salesRows,
    expenses: expenseRows,
    generatedAt: Utilities.formatDate(new Date(), ERP_REPORT_TZ, 'yyyy-MM-dd HH:mm:ss')
  };
}

function savePeriodReportPdf(periodType, periodValue) {
  var report = getPeriodReport(periodType, periodValue);
  var folder = getErpOutputFolder_();

  var title = 'ERP_経営レポート_' + sanitizeFileToken_(report.period.value) + '_' + Utilities.formatDate(new Date(), ERP_REPORT_TZ, 'yyyyMMdd_HHmmss');
  var doc = DocumentApp.create(title);
  var docFile = DriveApp.getFileById(doc.getId());
  var body = doc.getBody();

  body.appendParagraph('ERP 日次/月次レポート').setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph('対象期間: ' + report.period.label);
  body.appendParagraph('生成日時: ' + report.generatedAt);
  body.appendParagraph('');

  body.appendParagraph('集計').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph('仕入件数: ' + report.summary.purchaseCount);
  body.appendParagraph('仕入個数合計: ' + report.summary.purchaseQtyTotal);
  body.appendParagraph('仕入総提示金額: ' + report.summary.purchasePriceTotal);
  body.appendParagraph('仕入総原価: ' + report.summary.purchaseCostTotal);
  body.appendParagraph('売上件数: ' + report.summary.salesCount);
  body.appendParagraph('売上総額: ' + report.summary.salesAmountTotal);
  body.appendParagraph('売上総利益: ' + report.summary.salesProfitTotal);
  body.appendParagraph('経費件数: ' + report.summary.expenseCount);
  body.appendParagraph('経費総額: ' + report.summary.expenseTotal);
  body.appendParagraph('営業利益: ' + report.summary.operatingProfit);
  body.appendParagraph('利益率: ' + report.summary.profitRate + '%');
  body.appendParagraph('減価率: ' + report.summary.depreciationRate + '%');
  body.appendParagraph('経費率: ' + report.summary.expenseRate + '%');
  body.appendParagraph('');

  body.appendParagraph('仕入明細').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendTable(buildPurchaseTableForDoc_(report.purchases));

  body.appendParagraph('');
  body.appendParagraph('売上明細').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendTable(buildSalesTableForDoc_(report.sales));

  body.appendParagraph('');
  body.appendParagraph('経費明細').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendTable(buildExpenseTableForDoc_(report.expenses));

  doc.saveAndClose();

  var pdfBlob = docFile.getAs(MimeType.PDF).setName(title + '.pdf');
  var pdfFile = folder.createFile(pdfBlob);
  docFile.setTrashed(true);

  return {
    success: true,
    fileId: pdfFile.getId(),
    fileName: pdfFile.getName(),
    url: pdfFile.getUrl(),
    folderId: folder.getId(),
    periodLabel: report.period.label
  };
}

function buildPurchaseTableForDoc_(rows) {
  var table = [['商品個別番号', '仕入日', '商品マスタ番号', '商品名', '提示金額', 'ポイント', '経費分配', '原価', '個数', '仕入先', '伝票番号']];
  if (!rows.length) {
    table.push(['-', '-', '-', 'データなし', '0', '0', '0', '0', '0', '-', '-']);
    return table;
  }
  rows.forEach(function(r) {
    table.push([
      r.inventoryId,
      r.purchaseDate,
      r.productMasterNo,
      r.name,
      String(r.price),
      String(r.point),
      String(r.expenseAlloc),
      String(r.cost),
      String(r.qty),
      r.supplier,
      r.slipNo
    ]);
  });
  return table;
}

function buildSalesTableForDoc_(rows) {
  var table = [['売上日', '商品個別番号', '商品マスタ番号', '商品名', '売上金額', '原価', '利益', '想定売価', '販売場所', '伝票番号']];
  if (!rows.length) {
    table.push(['-', '-', '-', 'データなし', '0', '0', '0', '0', '-', '-']);
    return table;
  }
  rows.forEach(function(r) {
    table.push([
      r.salesDate,
      r.inventoryId,
      r.productMasterNo,
      r.name,
      String(r.salesAmount),
      String(r.cost),
      String(r.profit),
      String(r.assumedSales),
      r.place,
      r.slipNo
    ]);
  });
  return table;
}

function buildExpenseTableForDoc_(rows) {
  var table = [['日付', '内容', '金額', 'メモ']];
  if (!rows.length) {
    table.push(['-', 'データなし', '0', '']);
    return table;
  }
  rows.forEach(function(r) {
    table.push([r.date, r.name, String(r.amount), r.memo]);
  });
  return table;
}

function normalizeReportPeriod_(periodType, periodValue) {
  var type = String(periodType || '').toLowerCase() === 'month' ? 'month' : 'day';
  var value = String(periodValue || '').trim();
  var digits = value.replace(/[^0-9]/g, '');

  if (type === 'month') {
    if (digits.length >= 6) {
      value = digits.slice(0, 6).replace(/(\d{4})(\d{2})/, '$1-$2');
    } else {
      value = Utilities.formatDate(new Date(), ERP_REPORT_TZ, 'yyyy-MM');
    }
    return { type: 'month', value: value, label: value + ' 月' };
  }

  if (digits.length >= 8) {
    value = digits.slice(0, 8).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
  } else {
    value = Utilities.formatDate(new Date(), ERP_REPORT_TZ, 'yyyy-MM-dd');
  }
  return { type: 'day', value: value, label: value + ' 日' };
}

function isInPeriod_(ymd, period) {
  if (!ymd) return false;
  if (period.type === 'month') {
    return ymd.indexOf(period.value) === 0;
  }
  return ymd === period.value;
}

function toYmd_(value) {
  if (value === null || value === undefined || value === '') return '';

  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, ERP_REPORT_TZ, 'yyyy-MM-dd');
  }

  if (typeof value === 'number' && value > 20000) {
    var ms = Math.round((value - 25569) * 86400 * 1000);
    return Utilities.formatDate(new Date(ms), ERP_REPORT_TZ, 'yyyy-MM-dd');
  }

  var text = String(value).trim();
  var digits = text.replace(/[^0-9]/g, '');
  if (digits.length >= 8) {
    return digits.slice(0, 8).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
  }
  return text;
}

function roundReportYen_(value) {
  var n = Number(value);
  return isNaN(n) ? 0 : Math.round(n);
}

function roundPercent_(value) {
  var n = Number(value);
  if (isNaN(n)) return 0;
  return Math.round(n * 100) / 100;
}
