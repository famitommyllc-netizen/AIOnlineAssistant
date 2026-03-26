# settings.gs

```gs
var SHEET_SETTINGS = '設定';
var SETTING_INVENTORY_ID_MODE = 'inventory_id_mode';
var SETTING_TERMINOLOGY_MODE = 'terminology_mode';

var INVENTORY_ID_MODE_DETAIL = '明細単位';
var INVENTORY_ID_MODE_UNIT = '個体単位';

var TERMINOLOGY_MODE_JP = '日本対応';
var TERMINOLOGY_MODE_GLOBAL = '国際対応';

function ensureErpSettingsSetup_() {
  var sheet = ensureSettingsSheet_();
  ensureSettingRow_(sheet, SETTING_TERMINOLOGY_MODE, TERMINOLOGY_MODE_JP, '用語表示方式: 日本対応 / 国際対応');
  ensureSettingRow_(sheet, SETTING_INVENTORY_ID_MODE, INVENTORY_ID_MODE_DETAIL, '在庫ID方式: 明細単位 / 個体単位');
}

function getErpSettingsForUi() {
  ensureErpSettingsSetup_();
  var terminologyMode = getTerminologyMode_();
  var inventoryMode = getInventoryIdMode_();
  return {
    terminologyMode: terminologyMode,
    terminologyOptions: [
      { value: TERMINOLOGY_MODE_JP, label: '日本対応（日本の管理用語）' },
      { value: TERMINOLOGY_MODE_GLOBAL, label: '国際対応（line/unit表現）' }
    ]
      .map(function(opt) {
        return { value: opt.value, label: opt.label };
      }),
    inventoryIdMode: inventoryMode,
    options: getInventoryModeOptions_(terminologyMode)
  };
}

function saveErpSettings(payload) {
  var p = payload || {};
  var terminologyMode = normalizeTerminologyModeInput_(p.terminologyMode);
  if (!terminologyMode) {
    throw new Error('用語表示方式は「日本対応」または「国際対応」を指定してください');
  }
  var mode = normalizeInventoryIdModeInput_(p.inventoryIdMode);
  if (!mode) throw new Error('在庫ID方式は「明細単位」または「個体単位」を指定してください');

  var sheet = ensureSettingsSheet_();
  setSettingValue_(sheet, SETTING_TERMINOLOGY_MODE, terminologyMode, '用語表示方式: 日本対応 / 国際対応');
  setSettingValue_(sheet, SETTING_INVENTORY_ID_MODE, mode, '在庫ID方式: 明細単位 / 個体単位');
  return {
    ok: true,
    terminologyMode: terminologyMode,
    inventoryIdMode: mode,
    inventoryIdModeLabel: getInventoryIdModeLabel_(mode, terminologyMode)
  };
}

function getInventoryIdMode_() {
  ensureErpSettingsSetup_();
  var mode = normalizeInventoryIdModeInput_(getSettingValue_(SETTING_INVENTORY_ID_MODE, INVENTORY_ID_MODE_DETAIL));
  return mode || INVENTORY_ID_MODE_DETAIL;
}

function getTerminologyMode_() {
  ensureErpSettingsSetup_();
  var mode = normalizeTerminologyModeInput_(getSettingValue_(SETTING_TERMINOLOGY_MODE, TERMINOLOGY_MODE_JP));
  return mode || TERMINOLOGY_MODE_JP;
}

function getInventoryIdModeLabel_(inventoryMode, terminologyMode) {
  var mode = normalizeInventoryIdModeInput_(inventoryMode) || INVENTORY_ID_MODE_DETAIL;
  var termMode = normalizeTerminologyModeInput_(terminologyMode) || getTerminologyMode_();

  if (termMode === TERMINOLOGY_MODE_GLOBAL) {
    return mode === INVENTORY_ID_MODE_UNIT ? 'unit' : 'line';
  }
  return mode;
}

function getInventoryModeOptions_(terminologyMode) {
  var termMode = normalizeTerminologyModeInput_(terminologyMode) || TERMINOLOGY_MODE_JP;
  if (termMode === TERMINOLOGY_MODE_GLOBAL) {
    return [
      { value: INVENTORY_ID_MODE_DETAIL, label: 'line（1 line = 1 inventory ID）' },
      { value: INVENTORY_ID_MODE_UNIT, label: 'unit（1 quantity = 1 inventory ID）' }
    ];
  }
  return [
    { value: INVENTORY_ID_MODE_DETAIL, label: '明細単位（1行 = 1在庫ID）' },
    { value: INVENTORY_ID_MODE_UNIT, label: '個体単位（数量1つ = 1在庫ID）' }
  ];
}

function normalizeInventoryIdModeInput_(value) {
  var v = String(value || '').trim();
  if (!v) return '';
  var lower = v.toLowerCase();

  if (
    v === INVENTORY_ID_MODE_DETAIL ||
    v === '明細' ||
    v === '行単位' ||
    lower === 'line' ||
    lower === 'detail'
  ) {
    return INVENTORY_ID_MODE_DETAIL;
  }
  if (
    v === INVENTORY_ID_MODE_UNIT ||
    v === '個体' ||
    v === '個数単位' ||
    lower === 'unit' ||
    lower === 'item'
  ) {
    return INVENTORY_ID_MODE_UNIT;
  }
  return '';
}

function normalizeTerminologyModeInput_(value) {
  var v = String(value || '').trim();
  if (!v) return '';
  var lower = v.toLowerCase();

  if (
    v === TERMINOLOGY_MODE_JP ||
    v === '日本' ||
    v === '日本語' ||
    v === '日本管理用語' ||
    lower === 'jp' ||
    lower === 'ja'
  ) {
    return TERMINOLOGY_MODE_JP;
  }
  if (
    v === TERMINOLOGY_MODE_GLOBAL ||
    v === '国際' ||
    v === '汎用' ||
    v === '英語' ||
    lower === 'global' ||
    lower === 'en'
  ) {
    return TERMINOLOGY_MODE_GLOBAL;
  }
  return '';
}

function ensureSettingsSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_SETTINGS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_SETTINGS);
  }

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, 4).setValues([['キー', '値', '説明', '更新日']]);
  }
  return sheet;
}

function ensureSettingRow_(sheet, key, defaultValue, description) {
  var row = findSettingRow_(sheet, key);
  if (row > 0) return;
  sheet.appendRow([
    key,
    defaultValue,
    description || '',
    Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss')
  ]);
}

function getSettingValue_(key, defaultValue) {
  var sheet = ensureSettingsSheet_();
  var row = findSettingRow_(sheet, key);
  if (row <= 0) {
    return defaultValue;
  }
  var value = String(sheet.getRange(row, 2).getValue() || '').trim();
  return value || defaultValue;
}

function setSettingValue_(sheet, key, value, description) {
  var row = findSettingRow_(sheet, key);
  if (row <= 0) {
    sheet.appendRow([
      key,
      value,
      description || '',
      Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss')
    ]);
    return;
  }

  sheet.getRange(row, 2).setValue(value);
  if (description) {
    sheet.getRange(row, 3).setValue(description);
  }
  sheet.getRange(row, 4).setValue(
    Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss')
  );
}

function findSettingRow_(sheet, key) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;

  var values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  var target = String(key || '').trim();
  for (var i = 0; i < values.length; i++) {
    var current = String(values[i][0] || '').trim();
    if (current === target) return i + 2;
  }
  return -1;
}

```
