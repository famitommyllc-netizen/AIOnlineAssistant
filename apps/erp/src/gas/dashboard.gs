var DASHBOARD_TZ = 'Asia/Tokyo';
var SETTING_DASHBOARD_SHOW_PAYABLE = 'DASHBOARD_SHOW_PAYABLE';
var SETTING_DASHBOARD_SHOW_SUPPLIER = 'DASHBOARD_SHOW_SUPPLIER';
var SETTING_DASHBOARD_SHOW_PLACE = 'DASHBOARD_SHOW_PLACE';

function getFiscalYearOptions() {
  var current = getCurrentFiscalYear_();
  var currentStart = Number(current.start.slice(0, 4));
  var options = [];
  for (var y = currentStart; y >= currentStart - 4; y--) {
    var f = buildFiscalYear_(y);
    options.push({ value: String(y), label: f.label });
  }
  return { options: options, currentValue: String(currentStart) };
}

function getDashboardData(fiscalStartYear) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('在庫表');
  if (!sheet || sheet.getLastRow() < 2) {
    return { error: '在庫表にデータがありません' };
  }

  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 21).getValues();
  var fiscal = fiscalStartYear
    ? buildFiscalYear_(Number(fiscalStartYear))
    : getCurrentFiscalYear_();
  var prevFiscal = getPrevFiscalYear_(fiscal);
  var settings = getDashboardSettings();

  // 月次集計（期内全月）
  var monthlyMap = {};
  fiscal.months.forEach(function(m) { monthlyMap[m] = emptyMonthlyStats_(); });

  // 前期の月次（前期比用）
  var prevMonthlyMap = {};
  prevFiscal.months.forEach(function(m) { prevMonthlyMap[m] = emptyMonthlyStats_(); });

  // 期集計
  var fiscalStats = emptyFiscalStats_();
  var prevFiscalStats = emptyFiscalStats_();

  // 在庫（未売上）
  var inventoryStats = { costTotal: 0, count: 0 };

  // オプション集計
  var supplierMap = {};
  var placeMap = {};

  rows.forEach(function(row) {
    var purchaseDateRaw = row[1];  // B: 仕入日
    var cost = roundDashYen_(toNumber_(row[7]));  // H: 原価
    var qty = toNumber_(row[8]);   // I: 在庫数
    var supplier = String(row[10] || '').trim(); // K: 仕入先
    var salesDateRaw = row[12];   // M: 売上日
    var salesAmount = roundDashYen_(toNumber_(row[13])); // N: 売上金額
    var place = String(row[14] || '').trim(); // O: 販売場所
    var profit = roundDashYen_(toNumber_(row[15])); // P: 利益

    var purchaseYmd = toYmdDash_(purchaseDateRaw);
    var salesYmd = toYmdDash_(salesDateRaw);
    var purchaseMonth = purchaseYmd ? purchaseYmd.slice(0, 7) : '';
    var salesMonth = salesYmd ? salesYmd.slice(0, 7) : '';

    // 仕入集計
    if (purchaseMonth && monthlyMap[purchaseMonth]) {
      monthlyMap[purchaseMonth].purchaseCost += cost;
      monthlyMap[purchaseMonth].purchaseCount += 1;
    }
    if (purchaseMonth && prevMonthlyMap[purchaseMonth]) {
      prevMonthlyMap[purchaseMonth].purchaseCost += cost;
    }
    if (purchaseYmd >= fiscal.start && purchaseYmd <= fiscal.end) {
      fiscalStats.purchaseCostTotal += cost;
      fiscalStats.purchaseCount += 1;
    }
    if (purchaseYmd >= prevFiscal.start && purchaseYmd <= prevFiscal.end) {
      prevFiscalStats.purchaseCostTotal += cost;
    }

    // 売上集計
    if (salesAmount > 0 && salesMonth) {
      if (monthlyMap[salesMonth]) {
        monthlyMap[salesMonth].salesAmount += salesAmount;
        monthlyMap[salesMonth].salesCost += cost;
        monthlyMap[salesMonth].salesProfit += profit;
        monthlyMap[salesMonth].salesCount += 1;
      }
      if (prevMonthlyMap[salesMonth]) {
        prevMonthlyMap[salesMonth].salesAmount += salesAmount;
      }
      if (salesYmd >= fiscal.start && salesYmd <= fiscal.end) {
        fiscalStats.salesAmountTotal += salesAmount;
        fiscalStats.salesCostTotal += cost;
        fiscalStats.salesProfitTotal += profit;
        fiscalStats.salesCount += 1;
        if (place && settings.showPlaceBreakdown) {
          placeMap[place] = (placeMap[place] || 0) + salesAmount;
        }
      }
      if (salesYmd >= prevFiscal.start && salesYmd <= prevFiscal.end) {
        prevFiscalStats.salesAmountTotal += salesAmount;
      }
    }

    // 在庫（現時点の未売上）
    if (!salesYmd && qty > 0) {
      inventoryStats.costTotal += cost;
      inventoryStats.count += 1;
    }

    // 月末時点の在庫スナップショット（仕入済み かつ その月末時点で未売上）
    if (purchaseMonth) {
      fiscal.months.forEach(function(m) {
        if (purchaseMonth <= m && (!salesMonth || salesMonth > m)) {
          monthlyMap[m].inventoryCount += 1;
          monthlyMap[m].inventoryCost += cost;
        }
      });
    }

    // 仕入先別
    if (supplier && settings.showSupplierBreakdown && purchaseYmd >= fiscal.start && purchaseYmd <= fiscal.end) {
      supplierMap[supplier] = (supplierMap[supplier] || 0) + cost;
    }
  });

  // 前月比計算
  var monthlyList = fiscal.months.map(function(m, idx) {
    var s = monthlyMap[m];
    var prevMonth = idx > 0 ? monthlyMap[fiscal.months[idx - 1]] : null;
    return {
      month: m,
      label: m.slice(5) + '月',
      salesAmount: s.salesAmount,
      purchaseCost: s.purchaseCost,
      profit: s.salesProfit,
      grossMargin: s.salesAmount > 0 ? roundPercent_(s.salesProfit / s.salesAmount * 100) : null,
      salesCount: s.salesCount,
      purchaseCount: s.purchaseCount,
      inventoryCount: s.inventoryCount,
      inventoryCost: s.inventoryCost,
      momSalesRate: (prevMonth && prevMonth.salesAmount > 0)
        ? roundPercent_((s.salesAmount - prevMonth.salesAmount) / prevMonth.salesAmount * 100)
        : null
    };
  });

  // 期集計
  fiscalStats.grossMarginRate = fiscalStats.salesAmountTotal > 0
    ? roundPercent_(fiscalStats.salesProfitTotal / fiscalStats.salesAmountTotal * 100)
    : null;
  var yoySalesRate = (prevFiscalStats.salesAmountTotal > 0)
    ? roundPercent_((fiscalStats.salesAmountTotal - prevFiscalStats.salesAmountTotal) / prevFiscalStats.salesAmountTotal * 100)
    : null;

  // 在庫回転率
  var avgInventory = inventoryStats.costTotal;
  var turnoverRate = avgInventory > 0
    ? roundPercent_(fiscalStats.salesAmountTotal / avgInventory)
    : null;
  var turnoverDays = turnoverRate && turnoverRate > 0
    ? Math.round(365 / turnoverRate)
    : null;

  // オプション：仕入先・販売場所をリスト化
  var supplierList = Object.keys(supplierMap).map(function(k) {
    return { name: k, amount: supplierMap[k] };
  }).sort(function(a, b) { return b.amount - a.amount; });

  var placeList = Object.keys(placeMap).map(function(k) {
    return { name: k, amount: placeMap[k] };
  }).sort(function(a, b) { return b.amount - a.amount; });

  return {
    monthly: monthlyList,
    fiscal: {
      label: fiscal.label,
      salesAmountTotal: fiscalStats.salesAmountTotal,
      purchaseCostTotal: fiscalStats.purchaseCostTotal,
      salesProfitTotal: fiscalStats.salesProfitTotal,
      grossMarginRate: fiscalStats.grossMarginRate,
      salesCount: fiscalStats.salesCount,
      purchaseCount: fiscalStats.purchaseCount,
      yoySalesRate: yoySalesRate
    },
    inventory: {
      costTotal: inventoryStats.costTotal,
      count: inventoryStats.count,
      turnoverRate: turnoverRate,
      turnoverDays: turnoverDays
    },
    optional: {
      showPayable: settings.showPayable,
      showSupplierBreakdown: settings.showSupplierBreakdown,
      showPlaceBreakdown: settings.showPlaceBreakdown,
      supplierList: supplierList,
      placeList: placeList
    },
    generatedAt: Utilities.formatDate(new Date(), DASHBOARD_TZ, 'yyyy-MM-dd HH:mm:ss')
  };
}

function getDashboardSettings() {
  return {
    showPayable: getSettingValue_(SETTING_DASHBOARD_SHOW_PAYABLE, 'off') === 'on',
    showSupplierBreakdown: getSettingValue_(SETTING_DASHBOARD_SHOW_SUPPLIER, 'off') === 'on',
    showPlaceBreakdown: getSettingValue_(SETTING_DASHBOARD_SHOW_PLACE, 'off') === 'on'
  };
}

function saveDashboardSettings(payload) {
  var p = payload || {};
  var sheet = ensureSettingsSheet_();
  setSettingValue_(sheet, SETTING_DASHBOARD_SHOW_PAYABLE, p.showPayable ? 'on' : 'off', 'ダッシュボード: 買掛売掛表示');
  setSettingValue_(sheet, SETTING_DASHBOARD_SHOW_SUPPLIER, p.showSupplierBreakdown ? 'on' : 'off', 'ダッシュボード: 仕入先別表示');
  setSettingValue_(sheet, SETTING_DASHBOARD_SHOW_PLACE, p.showPlaceBreakdown ? 'on' : 'off', 'ダッシュボード: 販売場所別表示');
  return { ok: true };
}

function getCurrentFiscalYear_() {
  var now = new Date();
  var y = now.getFullYear();
  var m = now.getMonth() + 1; // 1-12
  var startYear = m >= 5 ? y : y - 1;
  return buildFiscalYear_(startYear);
}

function getPrevFiscalYear_(fiscal) {
  var startYear = Number(fiscal.start.slice(0, 4)) - 1;
  return buildFiscalYear_(startYear);
}

function buildFiscalYear_(startYear) {
  var start = startYear + '-05-01';
  var end = (startYear + 1) + '-04-30';
  var months = [];
  for (var m = 5; m <= 12; m++) {
    months.push(startYear + '-' + pad2_(m));
  }
  for (var m2 = 1; m2 <= 4; m2++) {
    months.push((startYear + 1) + '-' + pad2_(m2));
  }
  return {
    start: start,
    end: end,
    months: months,
    label: startYear + '年5月〜' + (startYear + 1) + '年4月期'
  };
}

function emptyMonthlyStats_() {
  return { salesAmount: 0, salesCost: 0, salesProfit: 0, salesCount: 0, purchaseCost: 0, purchaseCount: 0, inventoryCount: 0, inventoryCost: 0 };
}

function emptyFiscalStats_() {
  return { salesAmountTotal: 0, salesCostTotal: 0, salesProfitTotal: 0, salesCount: 0, purchaseCostTotal: 0, purchaseCount: 0 };
}

function toYmdDash_(value) {
  if (!value && value !== 0) return '';
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, DASHBOARD_TZ, 'yyyy-MM-dd');
  }
  if (typeof value === 'number' && value > 20000) {
    var ms = Math.round((value - 25569) * 86400 * 1000);
    return Utilities.formatDate(new Date(ms), DASHBOARD_TZ, 'yyyy-MM-dd');
  }
  var text = String(value).trim();
  var digits = text.replace(/[^0-9]/g, '');
  if (digits.length >= 8) {
    return digits.slice(0, 8).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
  }
  return text;
}

function roundDashYen_(value) {
  var n = Number(value);
  return isNaN(n) ? 0 : Math.round(n);
}

function pad2_(n) {
  return n < 10 ? '0' + n : String(n);
}
