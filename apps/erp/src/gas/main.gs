function onOpen() {
  try {
    if (typeof ensureErpSettingsSetup_ === 'function') {
      ensureErpSettingsSetup_();
    }
  } catch (e) {
    // no-op
  }
  try {
    if (typeof ensureSeparatedMasterSheets_ === 'function') {
      ensureSeparatedMasterSheets_();
    }
  } catch (e2) {
    // no-op
  }

  SpreadsheetApp.getUi()
    .createMenu('カスタムメニュー')
    .addItem('仕入登録', 'showEntryForm')
    .addItem('商品登録', 'showProductRegister')
    .addItem('売上登録', 'showSalesForm')
    .addItem('経費登録', 'showExpenseForm')
    .addItem('設定', 'showSettingsForm')
    .addItem('日次/月次レポート', 'showReport')
    .addItem('ダッシュボード', 'showDashboard')
    .addToUi();
}

// Webアプリ公開用エントリーポイント
// 例:
//   /exec            -> ホーム (Home)
//   /exec?page=entry -> 仕入入力
//   /exec?page=sales -> 売上登録
function doGet(e) {
  var page = getWebAppPage_(e);
  var pageConfig = WEB_APP_PAGES_[page] || WEB_APP_PAGES_.home;
  return createTemplateFromPageConfig_(pageConfig)
    .evaluate()
    .setTitle(pageConfig.title);
}

var WEB_APP_PAGES_ = {
  home: { file: 'Home', title: 'ERP ホーム' },
  entry: { file: 'EntryForm', title: '仕入入力' },
  // 互換ルートは単一ページへ集約
  entry_a: { file: 'EntryForm', title: '仕入入力' },
  entry_b: { file: 'EntryForm', title: '仕入入力' },
  entry_confirm: { file: 'EntryForm', title: '仕入入力' },
  product: { file: 'ProductRegister', title: '商品登録' },
  sales: { file: 'SalesForm', title: '売上登録' },
  expense: { file: 'ExpenseForm', title: '経費登録' },
  report: { file: 'Report', title: '日次/月次レポート' },
  settings: { file: 'SettingsForm', title: '設定' },
  ocr_test: { file: 'OcrTest', title: 'OCR検証' },
  dashboard: { file: 'Dashboard', title: 'ダッシュボード' },
  cancel: { file: 'CancelForm', title: '取消' },
  today: { file: 'TodayForm', title: '今日の登録' }
};

function getWebAppPage_(e) {
  var value = '';
  if (e && e.parameter && e.parameter.page) {
    value = String(e.parameter.page);
  }
  value = value.trim().toLowerCase();
  if (!value) return 'home';
  if (WEB_APP_PAGES_[value]) return value;
  return 'home';
}

function getWebAppPageUrl(page, params) {
  var pageKey = String(page || 'home').trim().toLowerCase();
  if (!WEB_APP_PAGES_[pageKey]) {
    pageKey = 'home';
  }

  var baseUrl = '';
  try {
    baseUrl = ScriptApp.getService().getUrl();
  } catch (e) {
    baseUrl = '';
  }
  if (!baseUrl) return '';

  var query = [];
  query.push('page=' + encodeURIComponent(pageKey));

  var p = params || {};
  Object.keys(p).forEach(function(key) {
    if (String(key) === 'page') return;
    var raw = p[key];
    if (raw === undefined || raw === null) return;
    var value = String(raw).trim();
    if (!value) return;
    query.push(encodeURIComponent(String(key)) + '=' + encodeURIComponent(value));
  });

  var normalizedBase = String(baseUrl).replace(/[?&]+$/, '');
  var separator = normalizedBase.indexOf('?') >= 0 ? '&' : '?';
  return normalizedBase + separator + query.join('&');
}

var ENTRY_DRAFT_CACHE_PREFIX_ = 'erp-entry-draft:';
var ENTRY_DRAFT_CACHE_TTL_SECONDS_ = 1800;

function saveEntryDraftForConfirm(payload) {
  var normalized = normalizeEntryDraftPayload_(payload);
  var token = Utilities.getUuid().replace(/-/g, '');
  var cache = CacheService.getScriptCache();
  cache.put(entryDraftCacheKey_(token), JSON.stringify(normalized), ENTRY_DRAFT_CACHE_TTL_SECONDS_);
  return { token: token };
}

function getEntryDraftForConfirm(token) {
  return loadEntryDraftByToken_(token);
}

function submitEntryDraftForConfirm(token) {
  var payload = loadEntryDraftByToken_(token);
  var result = registerEntries(payload.entries, payload.commonInfo, payload.expenses);
  CacheService.getScriptCache().remove(entryDraftCacheKey_(token));
  return result;
}

function normalizeEntryDraftPayload_(payload) {
  var p = payload || {};
  var entries = Array.isArray(p.entries) ? p.entries : [];
  if (!entries.length) {
    throw new Error('確認対象の仕入明細がありません');
  }

  var info = p.commonInfo || {};
  var date = String(info.date || '').trim();
  var supplier = String(info.supplier || '').trim();
  var payment = String(info.payment || '').trim();
  if (!date || !supplier || !payment) {
    throw new Error('共通項目（仕入日/仕入先/支払い方法）が不足しています');
  }

  return {
    entries: entries,
    commonInfo: {
      date: date,
      supplier: supplier,
      payment: payment
    },
    expenses: Array.isArray(p.expenses) ? p.expenses : [],
    pointMode: String(p.pointMode || 'allocation'),
    expenseMode: String(p.expenseMode || 'allocation')
  };
}

function loadEntryDraftByToken_(token) {
  var safeToken = String(token || '').trim();
  if (!safeToken) {
    throw new Error('確認トークンが不足しています');
  }

  var raw = CacheService.getScriptCache().get(entryDraftCacheKey_(safeToken));
  if (!raw) {
    throw new Error('確認データの有効期限が切れました。仕入入力からやり直してください');
  }
  return JSON.parse(raw);
}

function entryDraftCacheKey_(token) {
  return ENTRY_DRAFT_CACHE_PREFIX_ + String(token || '').trim();
}

function showEntryForm() {
  var html = HtmlService.createHtmlOutputFromFile('EntryForm')
    .setWidth(900)
    .setHeight(760);
  SpreadsheetApp.getUi().showModalDialog(html, '仕入登録');
}

function createTemplateFromPageConfig_(pageConfig) {
  var file = String((pageConfig && pageConfig.file) || '').trim();
  if (!file) {
    file = 'Home';
  }
  return HtmlService.createTemplateFromFile(file);
}

function showProductRegister() {
  var html = HtmlService.createHtmlOutputFromFile('ProductRegister')
    .setWidth(560)
    .setHeight(640);
  SpreadsheetApp.getUi().showModalDialog(html, '商品登録');
}

function showSalesForm() {
  var html = HtmlService.createHtmlOutputFromFile('SalesForm')
    .setWidth(980)
    .setHeight(760);
  SpreadsheetApp.getUi().showModalDialog(html, '売上登録');
}

function showExpenseForm() {
  var html = HtmlService.createHtmlOutputFromFile('ExpenseForm')
    .setWidth(560)
    .setHeight(560);
  SpreadsheetApp.getUi().showModalDialog(html, '経費登録');
}

function showDashboard() {
  var html = HtmlService.createHtmlOutputFromFile('Dashboard')
    .setWidth(980)
    .setHeight(760);
  SpreadsheetApp.getUi().showModalDialog(html, 'ダッシュボード');
}

function showReport() {
  var html = HtmlService.createHtmlOutputFromFile('Report')
    .setWidth(980)
    .setHeight(760);
  SpreadsheetApp.getUi().showModalDialog(html, '日次/月次レポート');
}

function showSettingsForm() {
  var html = HtmlService.createHtmlOutputFromFile('SettingsForm')
    .setWidth(560)
    .setHeight(420);
  SpreadsheetApp.getUi().showModalDialog(html, '設定');
}

// HTML共通部品を安全に読み込む（TableComponents / TableComponents.html の両対応）
function includeHtml_(name) {
  var base = String(name || '').trim();
  if (!base) throw new Error('includeHtml_ requires name');

  var candidates = [base];
  if (base.slice(-5).toLowerCase() !== '.html') {
    candidates.push(base + '.html');
  }

  var lastErr = null;
  for (var i = 0; i < candidates.length; i++) {
    try {
      return HtmlService.createHtmlOutputFromFile(candidates[i]).getContent();
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('HTML include not found: ' + base);
}

// シート整備を一括実行（手動実行用）
function runSalesSchemaAndMaintenanceNow() {
  var schema = applyErpSchemaUpdates();
  var maintenance = runSalesSheetMaintenance();
  var result = {
    schema: schema,
    maintenance: maintenance
  };
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}
