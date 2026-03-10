const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const LAN_HOST = process.env.LAN_HOST || '192.168.1.42';
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const DATA_FILE = path.join(ROOT, 'data', 'store.json');
const LOG_DIR = path.join(ROOT, 'logs');
const LOG_RUNS_DIR = path.join(LOG_DIR, 'runs');
const HISTORY_DIR = path.join(LOG_DIR, 'history');
const LATEST_LOG_FILE = path.join(LOG_DIR, 'latest.log');
const REMINDER_CHECK_MS = 30 * 1000;
const APP_VERSION = 'chatbot-prototype-2026-03-03-v18';
const MAX_MESSAGES_IN_STATE = 200;
const MAX_REMINDERS_IN_STATE = 200;
const MAX_REMINDERS_STORED = 5000;
const RUN_ID = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const DEBUG_LOG_FILE = path.join(LOG_RUNS_DIR, `${RUN_ID}.log`);

function nowIso() {
  return new Date().toISOString();
}

function ensureLogDir() {
  fs.mkdirSync(LOG_DIR, { recursive: true });
  fs.mkdirSync(LOG_RUNS_DIR, { recursive: true });
  fs.mkdirSync(HISTORY_DIR, { recursive: true });
}

function safePreview(input, max = 120) {
  const v = String(input || '').replace(/\s+/g, ' ').trim();
  return v.length > max ? `${v.slice(0, max)}...` : v;
}

function logEvent(level, event, payload = {}) {
  ensureLogDir();
  const record = {
    ts: nowIso(),
    runId: RUN_ID,
    level,
    event,
    payload
  };
  const line = JSON.stringify(record);
  fs.appendFileSync(DEBUG_LOG_FILE, `${line}\n`, 'utf-8');
  fs.appendFileSync(LATEST_LOG_FILE, `${line}\n`, 'utf-8');
  if (level === 'error' || level === 'warn') {
    console.error(line);
  } else {
    console.log(line);
  }
}

function readRecentLogFile(filePath, lines = 200) {
  ensureLogDir();
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, 'utf-8');
  const arr = raw.trim() ? raw.trim().split('\n') : [];
  return arr.slice(Math.max(0, arr.length - lines));
}

function readRecentLogs(lines = 200) {
  return readRecentLogFile(DEBUG_LOG_FILE, lines);
}

function toJstYmd(value) {
  try {
    const d = value ? new Date(value) : new Date();
    if (Number.isNaN(d.getTime())) return null;
    return new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(d);
  } catch {
    return null;
  }
}

function appendHistoryJsonl(ymd, record) {
  if (!ymd || !record) return;
  ensureLogDir();
  const file = path.join(HISTORY_DIR, `${ymd}.jsonl`);
  fs.appendFileSync(file, `${JSON.stringify(record)}\n`, 'utf-8');
}

function archiveOldItemsByDay(store) {
  const today = toJstYmd(nowIso());
  if (!today) return false;
  let changed = false;
  const nextMessages = [];
  for (const msg of Array.isArray(store.messages) ? store.messages : []) {
    const day = toJstYmd(msg?.createdAt);
    if (!day || day === today) {
      nextMessages.push(msg);
      continue;
    }
    appendHistoryJsonl(day, {
      kind: 'message',
      day,
      archivedAt: nowIso(),
      data: msg
    });
    changed = true;
  }
  store.messages = nextMessages;

  const nextReminders = [];
  for (const rem of Array.isArray(store.reminders) ? store.reminders : []) {
    const stamp = rem?.sentAt || rem?.scheduledAt;
    const day = toJstYmd(stamp);
    if (!day || day === today) {
      nextReminders.push(rem);
      continue;
    }
    appendHistoryJsonl(day, {
      kind: 'reminder',
      day,
      archivedAt: nowIso(),
      data: rem
    });
    changed = true;
  }
  store.reminders = nextReminders;
  return changed;
}

function listHistoryDates() {
  ensureLogDir();
  const files = fs.readdirSync(HISTORY_DIR).filter((name) => /^\d{4}-\d{2}-\d{2}\.jsonl$/.test(name));
  return files
    .map((name) => name.replace(/\.jsonl$/, ''))
    .sort((a, b) => (a < b ? 1 : -1));
}

function readHistoryForDay(ymd, max = 1000) {
  ensureLogDir();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return [];
  const file = path.join(HISTORY_DIR, `${ymd}.jsonl`);
  if (!fs.existsSync(file)) return [];
  const lines = fs.readFileSync(file, 'utf-8').split('\n').filter(Boolean);
  const out = [];
  for (const line of lines.slice(Math.max(0, lines.length - max))) {
    try {
      out.push(JSON.parse(line));
    } catch {}
  }
  return out;
}

function defaultNotifyConfig() {
  return {
    daysBefore: [1],
    hoursBefore: [1],
    sameDayTimes: [],
    atDue: true,
    overdueSnoozeMinutes: 60
  };
}

function defaultIconSettings() {
  return {
    chat: '/assets/icons/chat.svg',
    tasks: '/assets/icons/tasks.svg',
    memos: '/assets/icons/memos.svg',
    number: '/assets/icons/number.svg',
    profit: '/assets/icons/profit.svg',
    profitSettings: '/assets/icons/profit-settings.svg',
    help: '/assets/icons/help.svg',
    settings: '/assets/icons/settings.svg',
    iconSettings: '/assets/icons/icon-settings.svg'
  };
}

function defaultAppMenuConfig() {
  return {
    order: ['task_create', 'memo_create', 'profit', 'number'],
    enabled: ['task_create', 'memo_create', 'profit', 'number'],
    layout: 'grid3',
    iconSize: 102
  };
}

function defaultWebSearchSettings() {
  return {
    enabled: false,
    provider: 'google_cse',
    apiKey: '',
    cx: '',
    defaultStart: 1,
    defaultCount: 10,
    language: 'ja',
    country: 'jp',
    safe: 'off'
  };
}

function defaultMemoSession() {
  return {
    recording: false,
    type: '',
    targetNoteId: '',
    startedAt: '',
    lineCount: 0
  };
}

function defaultModeControlSettings() {
  return {
    lockIntentsInMode: true
  };
}

function normalizeModeControlSettings(input) {
  const base = defaultModeControlSettings();
  const src = input || {};
  return {
    lockIntentsInMode: src.lockIntentsInMode !== false
  };
}

function normalizeAppMenuConfig(input) {
  const allowed = ['task_create', 'memo_create', 'profit', 'number', 'help', 'settings'];
  const base = defaultAppMenuConfig();
  const src = input || {};
  const orderRaw = Array.isArray(src.order)
    ? src.order
    : String(src.order || '')
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
  const enabledRaw = Array.isArray(src.enabled)
    ? src.enabled
    : String(src.enabled || '')
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);

  const order = [];
  for (const key of orderRaw) {
    if (!allowed.includes(key)) continue;
    if (order.includes(key)) continue;
    order.push(key);
  }
  for (const key of base.order) {
    if (!order.includes(key)) order.push(key);
  }

  const enabled = [];
  for (const key of enabledRaw) {
    if (!allowed.includes(key)) continue;
    if (enabled.includes(key)) continue;
    enabled.push(key);
  }
  if (!enabled.length) {
    for (const key of base.enabled) enabled.push(key);
  }

  const layout = ['grid3', 'single'].includes(String(src.layout || ''))
    ? String(src.layout)
    : base.layout;
  const rawSize = Number(src.iconSize);
  const iconSize = Number.isFinite(rawSize) ? Math.max(40, Math.min(120, Math.round(rawSize))) : base.iconSize;

  return { order, enabled, layout, iconSize };
}

function normalizeWebSearchSettings(input) {
  const base = defaultWebSearchSettings();
  const src = input || {};
  const enabled = Boolean(src.enabled);
  const provider = String(src.provider || base.provider).trim() || base.provider;
  const apiKey = String(src.apiKey || '').trim();
  const cx = String(src.cx || '').trim();
  const defaultStartRaw = Number(src.defaultStart);
  const defaultCountRaw = Number(src.defaultCount);
  const defaultStart = Number.isFinite(defaultStartRaw) ? Math.max(1, Math.min(50, Math.floor(defaultStartRaw))) : 1;
  const defaultCount = Number.isFinite(defaultCountRaw) ? Math.max(1, Math.min(20, Math.floor(defaultCountRaw))) : 10;
  const language = String(src.language || base.language).trim() || base.language;
  const country = String(src.country || base.country).trim() || base.country;
  const safe = ['off', 'medium', 'high'].includes(String(src.safe || '')) ? String(src.safe) : base.safe;
  return {
    enabled,
    provider,
    apiKey,
    cx,
    defaultStart,
    defaultCount,
    language,
    country,
    safe
  };
}

function defaultShippingOptions() {
  return [
    { id: 'ship_nk_210', name: 'ネコポス', cost: 210 },
    { id: 'ship_yup_230', name: 'ゆうパケットポスト', cost: 230 },
    { id: 'ship_tak_750', name: '宅急便コンパクト', cost: 750 }
  ];
}

function defaultPackingOptions() {
  return [
    { id: 'pack_envelope_50', name: '封筒/袋', cost: 50 },
    { id: 'pack_box_120', name: '小箱', cost: 120 },
    { id: 'pack_cushion_80', name: '緩衝材セット', cost: 80 }
  ];
}

function defaultProfitFolders() {
  return [{ id: 'folder_inbox', name: 'inbox' }];
}

function normalizeOptionList(options, fallback) {
  if (!Array.isArray(options) || !options.length) return fallback;
  const out = [];
  for (const raw of options) {
    const name = String(raw?.name || '').trim();
    const cost = Number(raw?.cost);
    if (!name || !Number.isFinite(cost) || cost < 0) continue;
    out.push({
      id: String(raw?.id || createId('opt')),
      name,
      cost: Math.round(cost)
    });
  }
  return out.length ? out : fallback;
}

function normalizeProfitFolderList(folders, fallback) {
  const base = Array.isArray(fallback) && fallback.length ? fallback : defaultProfitFolders();
  if (!Array.isArray(folders) || !folders.length) return base;
  const out = [];
  for (const raw of folders) {
    const id = String(raw?.id || createId('folder')).trim();
    const name = String(raw?.name || '').trim();
    if (!id || !name) continue;
    if (out.some((f) => f.id === id)) continue;
    out.push({ id, name });
  }
  if (!out.length) return base;
  const hasInboxName = out.some((f) => String(f.name).toLowerCase() === 'inbox');
  const hasInboxId = out.some((f) => f.id === 'folder_inbox');
  if (!hasInboxName && !hasInboxId) {
    out.unshift(defaultProfitFolders()[0]);
  }
  return out;
}

function resolveProfitFolderId(folderId, folders) {
  const list = Array.isArray(folders) && folders.length ? folders : defaultProfitFolders();
  const fallbackId = String((list.find((f) => String(f.name).toLowerCase() === 'inbox') || list[0]).id);
  const targetId = String(folderId || '').trim();
  if (targetId && list.some((f) => f.id === targetId)) return targetId;
  return fallbackId;
}

function normalizeNumberEntries(entries) {
  if (!Array.isArray(entries)) return [];
  return entries
    .map((e) => ({
      id: String(e?.id || createId('num')),
      title: String(e?.title || '無題').trim() || '無題',
      value: Number(e?.value),
      createdAt: String(e?.createdAt || nowIso()),
      updatedAt: String(e?.updatedAt || e?.createdAt || nowIso())
    }))
    .filter((e) => Number.isFinite(e.value));
}

function normalizeNumberMemoUi(ui) {
  const base = ['kpi', 'form', 'summary', 'list'];
  const formBase = ['title', 'value', 'actions'];
  const order = Array.isArray(ui?.sectionOrder) ? ui.sectionOrder : [];
  const formOrderRaw = Array.isArray(ui?.formRowOrder) ? ui.formRowOrder : [];
  const out = [];
  const formOut = [];
  for (const raw of order) {
    const key = String(raw || '');
    if (!base.includes(key)) continue;
    if (out.includes(key)) continue;
    out.push(key);
  }
  for (const key of base) {
    if (!out.includes(key)) out.push(key);
  }
  for (const raw of formOrderRaw) {
    const key = String(raw || '');
    if (!formBase.includes(key)) continue;
    if (formOut.includes(key)) continue;
    formOut.push(key);
  }
  for (const key of formBase) {
    if (!formOut.includes(key)) formOut.push(key);
  }
  return { sectionOrder: out, formRowOrder: formOut };
}

function normalizeProfitRecords(records, folders) {
  if (!Array.isArray(records)) return [];
  const list = Array.isArray(folders) && folders.length ? folders : defaultProfitFolders();
  return records
    .map((r) => {
      const folderId = resolveProfitFolderId(r?.folderId, list);
      const folder = list.find((f) => f.id === folderId);
      return {
        id: String(r?.id || createId('profit')),
        itemName: String(r?.itemName || ''),
        cost: Number(r?.cost || 0),
        feeRate: Number(r?.feeRate || 0),
        feeAmount: Number(r?.feeAmount || 0),
        shippingId: String(r?.shippingId || ''),
        shippingName: String(r?.shippingName || ''),
        shippingCost: Number(r?.shippingCost || 0),
        packingId: String(r?.packingId || ''),
        packingName: String(r?.packingName || ''),
        packingCost: Number(r?.packingCost || 0),
        salePrice: Number(r?.salePrice || 0),
        otherCost: Number(r?.otherCost || 0),
        taxRate: Number(r?.taxRate || 10),
        taxMode: String(r?.taxMode || 'inclusive'),
        taxAmount: Number(r?.taxAmount || 0),
        taxOutput: Number(r?.taxOutput || 0),
        taxInput: Number(r?.taxInput || 0),
        invoiceEnabled: Boolean(r?.invoiceEnabled),
        locale: String(r?.locale || 'ja-JP'),
        currency: String(r?.currency || 'JPY'),
        folderId,
        folderName: String(folder?.name || 'inbox'),
        totalCost: Number(r?.totalCost || 0),
        profit: Number(r?.profit || 0),
        marginRate: Number(r?.marginRate || 0),
        roiRate: Number(r?.roiRate || 0),
        createdAt: String(r?.createdAt || nowIso()),
        updatedAt: String(r?.updatedAt || r?.createdAt || nowIso())
      };
    })
    .filter((r) => Number.isFinite(r.profit));
}

function normalizeProfitUi(ui) {
  const placement = String(ui?.resultPlacement || '').trim();
  const inputAlign = String(ui?.inputAlign || 'right').trim() === 'right' ? 'right' : 'left';
  const resultAlign = String(ui?.resultAlign || 'right').trim() === 'left' ? 'left' : 'right';
  const detailAlign = String(ui?.detailAlign || 'left').trim() === 'right' ? 'right' : 'left';
  const detailPack = String(ui?.detailPack || 'right').trim() === 'left' ? 'left' : 'right';
  // Tax feature is currently disabled; keep this key for future extension only.
  const invoiceEnabled = false;
  const locale = String(ui?.locale || 'ja-JP').trim() || 'ja-JP';
  const currency = String(ui?.currency || 'JPY').trim().toUpperCase() || 'JPY';
  const restoreLastResult = ui?.restoreLastResult === true || String(ui?.restoreLastResult || '').trim().toLowerCase() === 'on';
  const base = ['form', 'result'];
  const formBase = ['heading', 'itemName', 'cost', 'feeRate', 'shippingId', 'packingId', 'salePrice', 'otherCost', 'folderId', 'actions'];
  const resultBase = ['profitValue', 'marginRate', 'roiRate', 'resultText'];
  const order = Array.isArray(ui?.sectionOrder) ? ui.sectionOrder : [];
  const formOrderRaw = Array.isArray(ui?.formRowOrder) ? ui.formRowOrder : [];
  const resultOrderRaw = Array.isArray(ui?.resultRowOrder) ? ui.resultRowOrder : [];
  const sectionOrder = [];
  const formRowOrder = [];
  const resultRowOrder = [];
  for (const raw of order) {
    const key = String(raw || '');
    if (!base.includes(key)) continue;
    if (sectionOrder.includes(key)) continue;
    sectionOrder.push(key);
  }
  if (!sectionOrder.length) {
    if (placement === 'top') {
      sectionOrder.push('result', 'form');
    } else {
      sectionOrder.push('form', 'result');
    }
  } else {
    for (const key of base) {
      if (!sectionOrder.includes(key)) sectionOrder.push(key);
    }
  }
  return {
    resultPlacement: sectionOrder.indexOf('result') < sectionOrder.indexOf('form') ? 'top' : 'bottom',
    sectionOrder,
    inputAlign,
    resultAlign,
    detailAlign,
    detailPack,
    invoiceEnabled,
    locale,
    currency,
    showMarginRate: ui?.showMarginRate !== false,
    showRoiRate: ui?.showRoiRate !== false,
    restoreLastResult,
    formRowOrder: (() => {
      for (const raw of formOrderRaw) {
        const key = String(raw || '');
        if (!formBase.includes(key)) continue;
        if (formRowOrder.includes(key)) continue;
        formRowOrder.push(key);
      }
      for (const key of formBase) {
        if (!formRowOrder.includes(key)) formRowOrder.push(key);
      }
      return formRowOrder;
    })(),
    resultRowOrder: (() => {
      for (const raw of resultOrderRaw) {
        const key = String(raw || '');
        if (!resultBase.includes(key)) continue;
        if (resultRowOrder.includes(key)) continue;
        resultRowOrder.push(key);
      }
      for (const key of resultBase) {
        if (!resultRowOrder.includes(key)) resultRowOrder.push(key);
      }
      return resultRowOrder;
    })()
  };
}

function ensureCalculatorStore(store) {
  store.calculators = store.calculators || {};
  store.calculators.numberMemo = store.calculators.numberMemo || {};
  store.calculators.numberMemo.entries = normalizeNumberEntries(store.calculators.numberMemo.entries);
  store.calculators.numberMemo.ui = normalizeNumberMemoUi(store.calculators.numberMemo.ui);
  store.calculators.profit = store.calculators.profit || {};
  store.calculators.profit.shippingOptions = normalizeOptionList(
    store.calculators.profit.shippingOptions,
    defaultShippingOptions()
  );
  store.calculators.profit.packingOptions = normalizeOptionList(
    store.calculators.profit.packingOptions,
    defaultPackingOptions()
  );
  store.calculators.profit.folders = normalizeProfitFolderList(
    store.calculators.profit.folders,
    defaultProfitFolders()
  );
  store.calculators.profit.records = normalizeProfitRecords(
    store.calculators.profit.records,
    store.calculators.profit.folders
  );
  store.calculators.profit.ui = normalizeProfitUi(store.calculators.profit.ui);
}

function summarizeNumberMemo(entries) {
  const safe = normalizeNumberEntries(entries);
  const total = safe.reduce((sum, e) => sum + e.value, 0);
  const average = safe.length ? total / safe.length : 0;
  return {
    entries: safe,
    count: safe.length,
    total,
    average
  };
}

function parseMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

function normalizeIconSettings(input) {
  const base = defaultIconSettings();
  const src = input || {};
  const out = { ...base };
  for (const key of Object.keys(base)) {
    const v = String(src[key] || '').trim();
    if (!v) continue;
    out[key] = v;
  }
  return out;
}

function buildProfitRecord(input, options) {
  const itemName = String(input.itemName || '').trim();
  const cost = parseMoney(input.cost);
  const feeRate = parseMoney(input.feeRate);
  const salePrice = parseMoney(input.salePrice);
  const otherCost = parseMoney(input.otherCost);
  // Tax feature is currently disabled. Keep fields as extension hooks.
  const invoiceEnabled = false;
  const taxRate = 0;
  const taxMode = 'inclusive';
  const locale = String(input.locale || 'ja-JP');
  const currency = String(input.currency || 'JPY').toUpperCase();
  const shippingId = String(input.shippingId || '');
  const packingId = String(input.packingId || '');
  const shipping = (options?.shippingOptions || []).find((o) => o.id === shippingId);
  const packing = (options?.packingOptions || []).find((o) => o.id === packingId);
  const folderId = resolveProfitFolderId(input.folderId, options?.folders);
  const folder = (options?.folders || []).find((f) => f.id === folderId);
  const shippingCost = parseMoney(input.shippingCost ?? shipping?.cost ?? 0);
  const packingCost = parseMoney(input.packingCost ?? packing?.cost ?? 0);
  const feeAmount = parseMoney((salePrice * feeRate) / 100);
  const taxOutput = 0;
  const taxInput = 0;
  const taxAmount = 0;
  const totalCost = Math.floor(parseMoney(cost + feeAmount + shippingCost + packingCost + otherCost));
  const profit = Math.floor(parseMoney(salePrice - totalCost));
  const marginRate = salePrice > 0 ? parseMoney((profit / salePrice) * 100) : 0;
  const roiRate = totalCost > 0 ? parseMoney((profit / totalCost) * 100) : 0;

  return {
    itemName,
    cost,
    feeRate,
    feeAmount,
    shippingId,
    shippingName: shipping?.name || '未選択',
    shippingCost,
    packingId,
    packingName: packing?.name || '未選択',
    packingCost,
    salePrice,
    otherCost,
    taxRate,
    taxMode,
    taxAmount,
    taxOutput,
    taxInput,
    invoiceEnabled,
    locale,
    currency,
    folderId,
    folderName: String(folder?.name || 'inbox'),
    totalCost,
    profit,
    marginRate,
    roiRate
  };
}

function parseIntList(value, fallback) {
  if (Array.isArray(value)) {
    const arr = value
      .map((n) => Number(n))
      .filter((n) => Number.isFinite(n) && n > 0)
      .map((n) => Math.floor(n));
    return arr.length ? arr : fallback;
  }
  if (typeof value === 'string') {
    const arr = value
      .split(',')
      .map((v) => Number(v.trim()))
      .filter((n) => Number.isFinite(n) && n > 0)
      .map((n) => Math.floor(n));
    return arr.length ? arr : fallback;
  }
  return fallback;
}

function normalizeTimeToken(token) {
  const m = String(token || '').match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function parseTimeList(value, fallback) {
  if (Array.isArray(value)) {
    const arr = value.map(normalizeTimeToken).filter(Boolean);
    return arr.length ? Array.from(new Set(arr)) : fallback;
  }
  if (typeof value === 'string') {
    const arr = value
      .split(',')
      .map((v) => normalizeTimeToken(v.trim()))
      .filter(Boolean);
    return arr.length ? Array.from(new Set(arr)) : fallback;
  }
  return fallback;
}

function normalizeNotifyConfig(input) {
  const base = defaultNotifyConfig();
  const src = input || {};
  return {
    daysBefore: parseIntList(src.daysBefore, base.daysBefore),
    hoursBefore: parseIntList(src.hoursBefore, base.hoursBefore),
    sameDayTimes: parseTimeList(src.sameDayTimes, base.sameDayTimes),
    atDue: src.atDue !== false,
    overdueSnoozeMinutes: Math.max(1, Number(src.overdueSnoozeMinutes || base.overdueSnoozeMinutes))
  };
}

function formatNotifySummary(config) {
  const c = normalizeNotifyConfig(config);
  const parts = [];
  if (c.daysBefore.length) parts.push(`${c.daysBefore.join(',')}日前`);
  if (c.hoursBefore.length) parts.push(`${c.hoursBefore.join(',')}時間前`);
  if (c.sameDayTimes.length) parts.push(`当日 ${c.sameDayTimes.join(',')}`);
  if (c.atDue) parts.push('期限時刻');
  parts.push(`期限後${c.overdueSnoozeMinutes}分おき`);
  return parts.join(' / ');
}

function formatDueAtHuman(iso) {
  if (!iso) return '未確定';
  try {
    const dt = new Date(iso);
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZoneName: 'short'
    }).format(dt);
  } catch {
    return String(iso).replace('T', ' ');
  }
}

function ensureTaskDefaults(task) {
  task.assignee = String(task.assignee || '未設定');
  task.notifyConfig = normalizeNotifyConfig(task.notifyConfig);
  task.sentNotificationKeys = Array.isArray(task.sentNotificationKeys) ? task.sentNotificationKeys : [];
  task.taskNo = Number.isFinite(Number(task.taskNo)) ? Number(task.taskNo) : null;
  return task;
}

function ensureNoteDefaults(note) {
  const kindRaw = String(note?.memoKind || 'individual').trim();
  const memoKind = ['append', 'individual'].includes(kindRaw) ? kindRaw : 'individual';
  const titleRaw = String(note?.title || '').trim();
  const title = titleRaw || (memoKind === 'append' ? 'ログメモ' : '個別メモ');
  return {
    id: String(note?.id || createId('note')),
    text: String(note?.text || '').trim(),
    title,
    memoKind,
    normalized: note?.normalized || null,
    createdAt: String(note?.createdAt || nowIso()),
    updatedAt: String(note?.updatedAt || note?.createdAt || nowIso())
  };
}

function memoTimestamp(iso) {
  const t = new Date(String(iso || '')).getTime();
  return Number.isFinite(t) ? t : 0;
}

function buildIndividualMemoTitle(iso) {
  const at = iso || nowIso();
  try {
    return `個別メモ ${new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date(at))}`;
  } catch {
    return '個別メモ';
  }
}

function enforceSingleAppendMemo(notes) {
  if (!Array.isArray(notes) || !notes.length) return notes;
  const appendNotes = notes.filter((n) => n.memoKind === 'append');
  if (appendNotes.length <= 1) return notes;

  let primary = appendNotes[0];
  for (const n of appendNotes) {
    if (memoTimestamp(n.updatedAt || n.createdAt) > memoTimestamp(primary.updatedAt || primary.createdAt)) {
      primary = n;
    }
  }

  for (const n of appendNotes) {
    if (n.id === primary.id) continue;
    n.memoKind = 'individual';
    const title = String(n.title || '').trim();
    if (!title || title === 'ログメモ') {
      n.title = buildIndividualMemoTitle(n.updatedAt || n.createdAt || nowIso());
    }
    n.updatedAt = nowIso();
  }
  return notes;
}

function normalizeMemoSession(session, notes) {
  const src = session || {};
  const typeRaw = String(src.type || '').trim();
  const type = ['append', 'individual'].includes(typeRaw) ? typeRaw : '';
  const targetNoteId = String(src.targetNoteId || '').trim();
  const targetExists = targetNoteId && Array.isArray(notes) && notes.some((n) => n.id === targetNoteId);
  return {
    recording: Boolean(src.recording),
    type,
    targetNoteId: targetExists ? targetNoteId : '',
    startedAt: String(src.startedAt || ''),
    lineCount: Math.max(0, Number(src.lineCount || 0))
  };
}

function memoTypeLabel(type) {
  if (type === 'append') return 'ログメモ（追記）';
  if (type === 'individual') return '個別メモ（分割）';
  return '未選択';
}

function startMemoRecordingSession(store, type) {
  const t = type === 'append' ? 'append' : 'individual';
  let targetNoteId = '';
  if (t === 'append') {
    const existing = (store.notes || []).find((n) => n.memoKind === 'append');
    if (existing) targetNoteId = existing.id;
  }
  store.memoSession = {
    recording: true,
    type: t,
    targetNoteId,
    startedAt: nowIso(),
    lineCount: 0
  };
  return store.memoSession;
}

function appendMemoLine(store, text, normalized) {
  const line = String(text || '').trim();
  if (!line) return null;
  const session = normalizeMemoSession(store.memoSession, store.notes);
  if (!session.recording || !session.type) return null;

  let note = null;
  if (session.targetNoteId) {
    note = (store.notes || []).find((n) => n.id === session.targetNoteId) || null;
  }

  if (!note) {
    const createdAt = nowIso();
    const memoKind = session.type === 'append' ? 'append' : 'individual';
    const title =
      memoKind === 'append'
        ? 'ログメモ'
        : buildIndividualMemoTitle(createdAt);
    note = ensureNoteDefaults({
      id: createId('note'),
      text: '',
      title,
      memoKind,
      normalized: normalized || null,
      createdAt,
      updatedAt: createdAt
    });
    store.notes.push(note);
    session.targetNoteId = note.id;
  }

  note.text = note.text ? `${note.text}\n${line}` : line;
  note.updatedAt = nowIso();
  note.normalized = normalized || note.normalized || null;
  note.memoKind = session.type === 'append' ? 'append' : 'individual';
  if (!note.title) note.title = note.memoKind === 'append' ? 'ログメモ' : '個別メモ';

  session.lineCount = Math.max(0, Number(session.lineCount || 0)) + 1;
  store.memoSession = session;
  return note;
}

function stopMemoRecordingSession(store) {
  const before = normalizeMemoSession(store.memoSession, store.notes);
  store.memoSession = defaultMemoSession();
  return before;
}

function ensureTaskNumbering(store) {
  let maxNo = Number.isFinite(Number(store.taskCounter)) ? Number(store.taskCounter) : 0;
  for (const t of store.tasks) {
    if (Number.isFinite(Number(t.taskNo)) && Number(t.taskNo) > maxNo) {
      maxNo = Number(t.taskNo);
    }
  }
  for (const t of store.tasks) {
    if (!Number.isFinite(Number(t.taskNo))) {
      maxNo += 1;
      t.taskNo = maxNo;
    }
  }
  store.taskCounter = maxNo;
}

function allocateTaskNo(store) {
  const next = Math.max(0, Number(store.taskCounter || 0)) + 1;
  store.taskCounter = next;
  return next;
}

function ensureStoreFile() {
  if (!fs.existsSync(DATA_FILE)) {
    const initial = {
      settings: {
        ai: { enabled: false, provider: '', apiKey: '', model: '' },
        notify: defaultNotifyConfig(),
        icons: defaultIconSettings(),
        appMenu: defaultAppMenuConfig(),
        webSearch: defaultWebSearchSettings(),
        modeControl: defaultModeControlSettings()
      },
      messages: [],
      tasks: [],
      reminders: [],
      pendingActions: [],
      notes: [],
      memoSession: defaultMemoSession(),
      chatMode: 'normal',
      calculators: {
        numberMemo: { entries: [] },
        profit: {
          shippingOptions: defaultShippingOptions(),
          packingOptions: defaultPackingOptions(),
          folders: defaultProfitFolders(),
          records: []
        }
      }
    };
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf-8');
  }
}

function readStore() {
  ensureStoreFile();
  const store = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  store.settings = store.settings || { ai: {}, notify: defaultNotifyConfig() };
  store.settings.ai = store.settings.ai || {};
  store.settings.notify = normalizeNotifyConfig(store.settings.notify);
  store.settings.icons = normalizeIconSettings(store.settings.icons);
  store.settings.appMenu = normalizeAppMenuConfig(store.settings.appMenu);
  store.settings.webSearch = normalizeWebSearchSettings(store.settings.webSearch);
  store.settings.modeControl = normalizeModeControlSettings(store.settings.modeControl);
  store.messages = Array.isArray(store.messages) ? store.messages : [];
  store.tasks = (Array.isArray(store.tasks) ? store.tasks : []).map(ensureTaskDefaults);
  store.taskCounter = Number(store.taskCounter || 0);
  ensureTaskNumbering(store);
  store.reminders = Array.isArray(store.reminders) ? store.reminders : [];
  store.pendingActions = Array.isArray(store.pendingActions) ? store.pendingActions : [];
  store.notes = (Array.isArray(store.notes) ? store.notes : [])
    .map(ensureNoteDefaults)
    .filter((n) => n.text);
  store.notes = enforceSingleAppendMemo(store.notes);
  store.memoSession = normalizeMemoSession(store.memoSession, store.notes);
  store.chatMode = ['normal', 'task_create', 'memo'].includes(store.chatMode) ? store.chatMode : 'normal';
  ensureCalculatorStore(store);
  const archived = archiveOldItemsByDay(store);
  if (archived) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
    logEvent('info', 'daily_archive_compacted', {
      messages: store.messages.length,
      reminders: store.reminders.length
    });
  }
  return store;
}

function writeStore(store) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
}

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1e6) {
        reject(new Error('payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function formatYmd(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function shiftDate(base, diffDays) {
  const d = new Date(base);
  d.setDate(d.getDate() + diffDays);
  return d;
}

function parseWeekdayDate(original, baseDate) {
  const m = String(original).match(/(再来週|来週)?の?(月|火|水|木|金|土|日)曜日/);
  if (!m) return null;
  const prefix = m[1] || '';
  const weekday = m[2];
  const weekdayMap = { 月: 0, 火: 1, 水: 2, 木: 3, 金: 4, 土: 5, 日: 6 };
  const target = weekdayMap[weekday];
  const base = new Date(baseDate);
  const day = base.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const thisMonday = shiftDate(base, mondayOffset);
  let weekOffset = 0;
  if (prefix === '来週') weekOffset = 1;
  if (prefix === '再来週') weekOffset = 2;
  const result = shiftDate(thisMonday, weekOffset * 7 + target);
  return formatYmd(result);
}

function normalizeExpression(text, baseDate = new Date()) {
  const original = text.trim();
  const ambiguities = [];
  const tags = [];

  let date = null;
  const absoluteDate = original.match(/\b(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})\b/);
  if (absoluteDate) {
    const y = absoluteDate[1];
    const m = String(Math.min(12, Number(absoluteDate[2]))).padStart(2, '0');
    const d = String(Math.min(31, Number(absoluteDate[3]))).padStart(2, '0');
    date = `${y}-${m}-${d}`;
    tags.push('absolute_date');
  }

  const weekdayDate = parseWeekdayDate(original, baseDate);
  if (weekdayDate) {
    date = weekdayDate;
    tags.push('weekday_phrase');
  }

  if (original.includes('今日')) {
    date = formatYmd(baseDate);
    tags.push('today');
  }
  if (original.includes('明日')) {
    date = formatYmd(shiftDate(baseDate, 1));
    tags.push('tomorrow');
  }
  if (original.includes('昨日')) {
    date = formatYmd(shiftDate(baseDate, -1));
    tags.push('yesterday');
  }

  let time = null;
  let timeRange = null;
  const hhmmRangeMatch = original.match(/\b(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})\b/);
  if (hhmmRangeMatch) {
    const sh = String(Math.min(23, Number(hhmmRangeMatch[1]))).padStart(2, '0');
    const sm = String(Math.min(59, Number(hhmmRangeMatch[2]))).padStart(2, '0');
    const eh = String(Math.min(23, Number(hhmmRangeMatch[3]))).padStart(2, '0');
    const em = String(Math.min(59, Number(hhmmRangeMatch[4]))).padStart(2, '0');
    timeRange = `${sh}:${sm}-${eh}:${em}`;
  }

  const hhmmMatch = original.match(/\b(\d{1,2}):(\d{2})\b/);
  if (hhmmMatch && !timeRange) {
    const hh = String(Math.min(23, Number(hhmmMatch[1]))).padStart(2, '0');
    const mm = String(Math.min(59, Number(hhmmMatch[2]))).padStart(2, '0');
    time = `${hh}:${mm}`;
  }

  const hmMatch = original.match(/(\d{1,2})時(?:(\d{1,2})分?)?/);
  if (hmMatch) {
    const hh = String(Math.min(23, Number(hmMatch[1]))).padStart(2, '0');
    const mm = String(Math.min(59, Number(hmMatch[2] || 0))).padStart(2, '0');
    time = `${hh}:${mm}`;
  }

  const rangeMap = [
    { key: '朝', value: '06:00-09:00' },
    { key: '午前', value: '09:00-12:00' },
    { key: '昼', value: '12:00-13:00' },
    { key: '午後', value: '13:00-17:00' },
    { key: '夕方', value: '17:00-19:00' },
    { key: '夜', value: '19:00-22:00' }
  ];
  for (const r of rangeMap) {
    if (original.includes(r.key)) {
      timeRange = r.value;
      break;
    }
  }

  let urgency = 'normal';
  if (/なるはや|至急|急ぎ/.test(original)) {
    urgency = 'high';
  }

  if (/なるはや|後で|今度|できれば|時間があれば/.test(original)) {
    ambiguities.push('priority_or_timing_ambiguous');
  }
  if (/いつか|そのうち/.test(original)) {
    ambiguities.push('date_ambiguous');
  }
  if (/朝|昼|夕方|夜/.test(original) && !time) {
    ambiguities.push('time_range_only');
  }
  if (!date && /明日|今日|昨日/.test(original) === false && /\d{1,2}時/.test(original) === false) {
    ambiguities.push('datetime_missing');
  }

  const normalizedText = JSON.stringify(
    {
      date,
      time,
      timeRange,
      urgency,
      ambiguities,
      tags
    },
    null,
    0
  );

  return {
    original,
    normalizedText,
    parsed: { date, time, timeRange, urgency, tags },
    ambiguities,
    needsConfirmation: ambiguities.length > 0
  };
}

function chooseDueAt(normalized) {
  const { date, time, timeRange } = normalized.parsed;
  if (!date) return null;
  if (time) return `${date}T${time}:00`;
  if (timeRange) {
    const start = timeRange.split('-')[0];
    return `${date}T${start}:00`;
  }
  return `${date}T09:00:00`;
}

function formatNormalizedSummary(normalized) {
  const parts = [];
  const p = normalized.parsed || {};
  if (p.date) parts.push(`日付: ${p.date}`);
  if (p.time) parts.push(`時刻: ${p.time}`);
  if (p.timeRange) parts.push(`時間帯: ${p.timeRange}`);
  parts.push(`優先度: ${p.urgency || 'normal'}`);
  if (normalized.needsConfirmation) {
    parts.push(`要確認: ${normalized.ambiguities.join(', ')}`);
  }
  return parts.join('\n');
}

function makeRuleBasedReply(text, normalized) {
  if (/タスク一覧|タスク見せて|一覧/.test(text)) {
    return 'かしこまりました。タスク一覧を右側パネルへご用意いたしました。';
  }
  if (/完了/.test(text)) {
    return '承知いたしました。完了のご指定は、タスクの「完了」ボタンで確定できます。';
  }

  return `かしこまりました。内容を整形して記録いたしました。\n${formatNormalizedSummary(normalized)}`;
}

function appMenuIntroMessage() {
  return [
    'いつでも、どのようなご用件でもお申し付けくださいませ。',
    'ご相談、情報検索、各種サポートまで、順次お手伝いいたします。',
    'ご要望はそのままお送りいただければ、こちらで整理して対応いたします。',
    '',
    '連携アプリをご利用の際は、下記ボタンよりお選びくださいませ。'
  ].join('\n');
}

function addBotMessage(store, text, action = null) {
  store.messages.push({
    id: createId('msg'),
    role: 'assistant',
    text,
    action,
    createdAt: nowIso()
  });
}

function extractRemindMinutes(text) {
  const m = text.match(/(\d{1,3})\s*分(?:ごと|おき)?/);
  if (!m) return 60;
  return Math.max(1, Number(m[1]));
}

function extractTaskTitle(text) {
  let v = String(text || '');
  // Remove common trailing notification clauses first.
  v = v.replace(/(、|,)?\s*(?:\d{1,3}\s*日前.*|通知.*)$/g, ' ');
  v = v.replace(/(、|,)?\s*(?:なるはや|至急|急ぎ).*/g, ' ');

  const strips = [
    /\b\d{4}[\/-]\d{1,2}[\/-]\d{1,2}\b/g,
    /\b\d{1,2}:\d{2}(?:\s*-\s*\d{1,2}:\d{2})?\b/g,
    /\d{1,2}時(?:\d{1,2}分?)?/g,
    /(再来週|来週)?の?(月|火|水|木|金|土|日)曜日/g,
    /今日|明日|昨日|朝|午前|昼|午後|夕方|夜/g,
    /来週|再来週|今週/g,
    /なるはや|至急|急ぎ|リマインド|メモ|タスク/g,
    /\d{1,3}\s*(?:分(?:ごと|おき)?|日前|時間前)/g,
    /提出期限/g,
    /当日/g,
    /通知/g,
    /までに|まで|を|に|で|へ|から|まで|担当|さん|様/g,
    /[@＠][^\s、。]+/g
  ];
  for (const p of strips) {
    v = v.replace(p, ' ');
  }
  // Remove simple assignee subject phrase like "父が提出", "田中が連絡"
  v = v.replace(/(?:[、,\s]|に|は|で|を)([^\s、。]{1,12})が(?=(資料提出|提出|連絡|返信|確認|作成|更新|支払))/g, ' ');
  v = v.replace(/^([^\s、。]{1,12})が(?=(資料提出|提出|連絡|返信|確認|作成|更新|支払))/g, ' ');
  v = v.replace(/(?:[、,\s]|^)([^\s、。]{1,12}?)に(?=[^。]*(連絡|返信|提出|確認|作成|更新|支払))/g, ' ');
  v = v.replace(/[、。,:：]/g, ' ').replace(/\s+/g, ' ').trim();
  v = v.replace(/^([^\s、。]{1,8})\s+の\s+(連絡|返信|提出|確認|作成|更新|支払)$/, '$2');
  v = v.replace(/^(の|を|に|へ|で|が|は)\s*/g, '').replace(/\s*(の|を|に|へ|で|が|は)$/g, '');
  const actionMatch = v.match(/([^\s、。,:：]{1,24}(提出|連絡|返信|予約|確認|作成|更新|支払|入金|購入))/);
  if (actionMatch) return actionMatch[1];
  if (!v) return '未命名タスク';
  if (v.length > 28) return `${v.slice(0, 28)}…`;
  return v;
}

function extractAssignee(text) {
  const src = String(text || '').trim();
  const actor = src.match(/(?:[、,\s]|に|は|で|を)([^\s、。]{1,12})が(?=(資料提出|提出|連絡|返信|確認|作成|更新|支払))/);
  if (actor) return actor[1];
  const actorAtStart = src.match(/^([^\s、。]{1,12})が(?=(資料提出|提出|連絡|返信|確認|作成|更新|支払))/);
  if (actorAtStart) return actorAtStart[1];
  const targetPerson = src.match(/(?:^|[、,\s])([^\s、。]{1,12}?)に(?=[^。]*(連絡|返信|提出|確認|作成|更新|支払))/);
  if (targetPerson) return targetPerson[1];
  const mention = src.match(/[@＠]([^\s、。]+)/);
  if (mention) return mention[1];
  const byRole = src.match(/(?:担当者?|担当)\s*[:：は]?\s*([^\s、。]+)/);
  if (byRole) return byRole[1];
  const reverse = src.match(/([^\s、。]+)\s*(?:は|が)\s*担当者?/);
  if (reverse) return reverse[1];
  const subject = src.match(/([^\s、。]+)\s*(?:は|が)\s*.+/);
  if (subject && !/(今日|明日|昨日|来週|再来週|今週|当日|資料|提出|通知|期限)/.test(subject[1])) {
    return subject[1];
  }
  return '未設定';
}

function parseNotifyConfigFromText(text, baseConfig) {
  const source = String(text || '');
  const cfg = normalizeNotifyConfig(baseConfig);

  const days = Array.from(source.matchAll(/(\d{1,3})\s*日前/g)).map((m) => Number(m[1]));
  if (days.length) cfg.daysBefore = Array.from(new Set(days)).filter((n) => n > 0).sort((a, b) => b - a);

  const hours = Array.from(source.matchAll(/(\d{1,3})\s*時間前/g)).map((m) => Number(m[1]));
  if (hours.length) cfg.hoursBefore = Array.from(new Set(hours)).filter((n) => n > 0).sort((a, b) => b - a);

  const sameDayTimes = [];
  for (const m of source.matchAll(/当日(?:の)?(?:朝|午前|午後|夕方|夜)?\s*(\d{1,2})時(?:(\d{1,2})分?)?/g)) {
    let hh = Number(m[1]);
    const mm = Number(m[2] || 0);
    const full = m[0];
    if ((/午後|夕方|夜/.test(full)) && hh < 12) hh += 12;
    if ((/朝|午前/.test(full)) && hh === 12) hh = 0;
    const token = normalizeTimeToken(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);
    if (token) sameDayTimes.push(token);
  }
  if (sameDayTimes.length) cfg.sameDayTimes = Array.from(new Set(sameDayTimes));

  const snooze = source.match(/期限切れ後\s*(\d{1,3})\s*分/);
  if (snooze) cfg.overdueSnoozeMinutes = Math.max(1, Number(snooze[1]));

  if (/期限時|期限ちょうど|提出時|締切時/.test(source)) cfg.atDue = true;

  return cfg;
}

function hasDueHint(text) {
  return /(今日|明日|明後日|昨日|来週|再来週|曜日|\d{4}[/-]\d{1,2}[/-]\d{1,2}|\d{1,2}時|\d{1,2}:\d{2}|朝|午前|午後|夕方|夜)/.test(
    String(text || '')
  );
}

function extractTaskDuePhrase(text) {
  const src = String(text || '');
  const firstClause = src.split(/[、,]/)[0] || src;
  return firstClause.trim();
}

function applyProposalEditFromText(proposal, editText, settingsNotify) {
  const next = {
    ...proposal,
    notifyConfig: normalizeNotifyConfig(proposal.notifyConfig || settingsNotify)
  };
  const text = String(editText || '').trim();
  if (!text) return next;

  if (/[@＠]|担当/.test(text) || /.+(?:は|が)\s*担当者?/.test(text)) {
    next.assignee = extractAssignee(text);
  }

  if (hasDueHint(text) && !/当日/.test(text)) {
    const normalized = normalizeExpression(extractTaskDuePhrase(text), new Date());
    const dueAt = chooseDueAt(normalized);
    if (dueAt) {
      next.dueAt = dueAt;
      next.dueInput = text;
    }
  }

  if (/通知|日前|時間前|当日|期限切れ後|スヌーズ/.test(text)) {
    next.notifyConfig = parseNotifyConfigFromText(text, next.notifyConfig || settingsNotify);
  }

  const titleMatch = text.match(/(?:件名|タイトル|タスク名)\s*[:：は]\s*(.+)$/);
  if (titleMatch) {
    const title = titleMatch[1].trim();
    if (title) next.title = title;
  }

  const minutes = extractRemindMinutes(text);
  if (/分(?:ごと|おき)/.test(text)) {
    next.remindEveryMinutes = minutes;
  }

  return next;
}

function detectTaskIntent(text, normalized) {
  const intentPattern = /する|提出|連絡|返信|予約|買う|支払|入金|確認|作成|更新|締切|忘れ|リマインド|覚えて/;
  return (
    intentPattern.test(text) ||
    Boolean(normalized.parsed.date || normalized.parsed.time || normalized.parsed.timeRange)
  );
}

function detectSettingsIntent(text) {
  const source = String(text || '');
  return /(設定画面|設定変更|設定変えたい|設定を変えたい|設定したい|設定どこ|オプション|環境設定|APIキー|通知設定|^設定$|設定$)/.test(
    source
  );
}

function detectProfitSettingsIntent(text) {
  const source = String(text || '');
  return /(利益計算の設定|利益設定|送料設定|梱包設定|利益計算設定|メルカリ設定|利益ツール設定|^送料$|^梱包$|送料を設定|梱包を設定)/.test(
    source
  );
}

function detectProfitHistoryIntent(text) {
  const source = String(text || '').trim();
  return /(利益履歴|計算履歴|売上履歴|商品の履歴|利益の履歴|履歴を見せて|履歴ページ|^履歴$)/.test(source);
}

function detectIconSettingsIntent(text) {
  const source = String(text || '');
  return /(アイコン設定|アイコン変更|画面アイコン|アイコンを変えたい|アイコンカスタム)/.test(source);
}

function detectHelpIntent(text) {
  const source = String(text || '').trim();
  if (detectProfitManualIntent(source) || detectManualIndexIntent(source)) return false;
  return /(使い方|利用方法|操作方法|ヘルプ|ガイド|操作ガイド|使い方を教えて|使い方を説明して|どう使う)/.test(source);
}

function detectProfitManualIntent(text) {
  const source = String(text || '').trim();
  return /(利益計算.*(マニュアル|取説|説明書|使い方|ガイド)|利益.*(マニュアル|取説|使い方)|メルカリ.*(使い方|マニュアル)|フリマ.*(使い方|マニュアル)|profit\s*manual)/i.test(
    source
  );
}

function detectManualIndexIntent(text) {
  const source = String(text || '').trim();
  return /(^マニュアル$|マニュアル一覧|取説一覧|説明書一覧|manual\s*list|ヘルプ一覧|ガイド一覧|マニュアルを見せて)/i.test(source);
}

function detectNotifyPageIntent(text) {
  const source = String(text || '').trim();
  return /(通知設定|端末通知|通知ページ|通知を有効化|通知を設定|プッシュ通知設定)/.test(source);
}

function detectMemoPageIntent(text) {
  const source = String(text || '').trim();
  return /(メモ一覧画面|メモ一覧|メモ画面|メモ管理|メモを見せて|メモページ)/.test(source);
}

function detectTaskPageIntent(text) {
  const source = String(text || '');
  return /(タスク管理|タスク画面|タスク一覧|タスクを見せて|タスクページ|やること一覧|todo|ToDo|^タスク$)/i.test(source);
}

function detectTaskCreateModeIntent(text) {
  const source = String(text || '').trim();
  return /(タスク作成モード|タスク作成|タスク追加モード|タスク登録モード)/.test(source);
}

function detectMemoModeIntent(text) {
  const source = String(text || '').trim();
  return /(メモモード|メモ作成|メモ開始|メモして|メモしたい|^メモ$)/.test(source);
}

function detectMemoAppendTypeIntent(text) {
  const source = String(text || '').trim();
  return /(追記メモ|ログメモ|連続メモ|一つに追記|ひとつに追記|まとめてメモ)/.test(source);
}

function detectMemoIndividualTypeIntent(text) {
  const source = String(text || '').trim();
  return /(個別メモ|分割メモ|別メモ|新規メモ|個別ノート|大事メモ)/.test(source);
}

function detectMemoRecordEndIntent(text) {
  const source = String(text || '').trim();
  return /(記録終了|メモ記録終了|記録おわり|メモ終了|保存終了)/.test(source);
}

function detectModeExitIntent(text) {
  const source = String(text || '').trim();
  return /(通常モード|モード解除|モード終了|終了モード|メモモード終了|タスク作成モード終了)/.test(source);
}

function detectAppMenuIntent(text) {
  const source = String(text || '').trim();
  return /(何ができる|どんなお手伝い|アプリ一覧|メニュー|機能一覧|何をすればいい)/.test(source);
}

function detectWebSearchIntent(text) {
  const source = String(text || '').trim();
  return /(google|グーグル|検索|調べて|サイトリンク|リンクを教えて|ランキング|ググって)/i.test(source);
}

function parseSearchRangeFromText(text, fallbackStart = 1, fallbackCount = 10) {
  const source = String(text || '');
  const between = source.match(/(\d{1,3})\s*(?:位|番|件)?\s*(?:〜|～|~|-|ー|から|to)\s*(\d{1,3})\s*(?:位|番|件)?/i);
  if (between) {
    const a = Math.max(1, Math.min(50, Number(between[1])));
    const b = Math.max(1, Math.min(50, Number(between[2])));
    const start = Math.min(a, b);
    const end = Math.max(a, b);
    return { start, end };
  }

  const around = source.match(/ランキング?\s*(\d{1,3})\s*(?:前後|くらい|付近)/);
  if (around) {
    const n = Math.max(1, Math.min(50, Number(around[1])));
    return { start: n, end: Math.min(50, n + 9) };
  }

  const start = Math.max(1, Math.min(50, Number(fallbackStart) || 1));
  const count = Math.max(1, Math.min(20, Number(fallbackCount) || 10));
  return { start, end: Math.min(50, start + count - 1) };
}

function extractWebSearchQuery(text) {
  const source = String(text || '').trim();
  if (!source) return '';

  const about = source.match(/^(.+?)(?:について|に関する|に関して)/);
  if (about && about[1]) {
    return about[1].trim();
  }

  let q = source;
  q = q.replace(/https?:\/\/\S+/g, ' ');
  q = q.replace(/ランキング?\s*\d{1,3}\s*(?:〜|～|~|-|ー|から|to)\s*\d{1,3}\s*(?:位|番|件)?(?:前後)?/gi, ' ');
  q = q.replace(/ランキング?\s*\d{1,3}\s*(?:前後|くらい|付近)/gi, ' ');
  q = q.replace(/(google|グーグル)(で|検索)?/gi, ' ');
  q = q.replace(/(検索|調べて|調べる|ググって|教えて|教えてください|お願いします|サイトリンク|リンクを教えて|リンク|ランキング)/gi, ' ');
  q = q.replace(/[、。！？!?]/g, ' ');
  q = q.replace(/\s+/g, ' ').trim();
  return q;
}

function parseWebSearchRequest(text, settings) {
  const ws = normalizeWebSearchSettings(settings);
  const { start, end } = parseSearchRangeFromText(text, ws.defaultStart, ws.defaultCount);
  const query = extractWebSearchQuery(text);
  return { query, start, end };
}

async function runGoogleCseSearch(query, start, end, settings) {
  const ws = normalizeWebSearchSettings(settings);
  if (typeof fetch !== 'function') {
    throw new Error('fetch_unavailable');
  }
  if (!ws.apiKey || !ws.cx) {
    throw new Error('google_cse_not_configured');
  }

  const maxEnd = Math.min(50, Math.max(start, end));
  const out = [];
  let cursor = Math.max(1, start);

  while (cursor <= maxEnd) {
    const num = Math.min(10, maxEnd - cursor + 1);
    const params = new URLSearchParams({
      key: ws.apiKey,
      cx: ws.cx,
      q: query,
      start: String(cursor),
      num: String(num),
      hl: ws.language || 'ja',
      gl: ws.country || 'jp',
      safe: ws.safe || 'off'
    });
    const url = `https://www.googleapis.com/customsearch/v1?${params.toString()}`;
    const resp = await fetch(url);
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      const msg = String(data?.error?.message || `HTTP ${resp.status}`).slice(0, 220);
      throw new Error(`google_cse_http_error:${msg}`);
    }
    const items = Array.isArray(data?.items) ? data.items : [];
    if (!items.length) break;
    let rank = cursor;
    for (const item of items) {
      out.push({
        rank,
        title: String(item?.title || '').trim() || `検索結果 ${rank}`,
        link: String(item?.link || '').trim(),
        snippet: String(item?.snippet || '').trim()
      });
      rank += 1;
    }
    cursor = rank;
    if (items.length < num) break;
  }

  return out.filter((r) => r.link).slice(0, Math.max(1, maxEnd - start + 1));
}

function decideCalculatorIntent(text) {
  const source = String(text || '');
  const hasCalcWord = /計算/.test(source);
  const numberStrong =
    /(数値|数字|合計|集計|合計計算|合計と平均|平均|表計算)/.test(source) ||
    (hasCalcWord && /(家計簿|数量)/.test(source));
  const profitStrong =
    /(利益|利益計算|メルカリ|フリマ|ネットショップの利益|ネットショップ|原価|手数料|送料|梱包)/.test(source);

  if (numberStrong && !profitStrong) return 'number';
  if (profitStrong && !numberStrong) return 'profit';
  if (numberStrong && profitStrong) return 'ask';
  if (hasCalcWord) return 'ask';
  return 'none';
}

function runReminderTick() {
  const store = readStore();
  const now = new Date();
  let changed = false;

  for (const task of store.tasks) {
    if (task.isCompleted) continue;
    ensureTaskDefaults(task);

    const dueAt = task.dueAt ? new Date(task.dueAt) : null;
    const reasons = [];

    if (dueAt) {
      for (const d of task.notifyConfig.daysBefore) {
        const key = `d-${d}`;
        const triggerAt = new Date(dueAt.getTime() - d * 24 * 60 * 60 * 1000);
        if (now >= triggerAt && !task.sentNotificationKeys.includes(key)) {
          reasons.push(`${d}日前`);
          task.sentNotificationKeys.push(key);
        }
      }
      for (const h of task.notifyConfig.hoursBefore) {
        const key = `h-${h}`;
        const triggerAt = new Date(dueAt.getTime() - h * 60 * 60 * 1000);
        if (now >= triggerAt && !task.sentNotificationKeys.includes(key)) {
          reasons.push(`${h}時間前`);
          task.sentNotificationKeys.push(key);
        }
      }
      for (const t of task.notifyConfig.sameDayTimes) {
        const key = `same-day-${t}`;
        const [hh, mm] = t.split(':').map((v) => Number(v));
        const triggerAt = new Date(
          dueAt.getFullYear(),
          dueAt.getMonth(),
          dueAt.getDate(),
          hh,
          mm,
          0,
          0
        );
        if (now >= triggerAt && !task.sentNotificationKeys.includes(key)) {
          reasons.push(`当日 ${t}`);
          task.sentNotificationKeys.push(key);
        }
      }
      if (task.notifyConfig.atDue && now >= dueAt && !task.sentNotificationKeys.includes('at-due')) {
        reasons.push('期限時刻');
        task.sentNotificationKeys.push('at-due');
      }
      if (now >= dueAt) {
        const bucket = Math.floor((now.getTime() - dueAt.getTime()) / (task.notifyConfig.overdueSnoozeMinutes * 60 * 1000));
        const overdueKey = `overdue-${bucket}`;
        if (!task.sentNotificationKeys.includes(overdueKey)) {
          reasons.push('期限切れ後');
          task.sentNotificationKeys.push(overdueKey);
        }
      }
    } else {
      // 期限未設定タスクは間隔通知でフォールバック
      const intervalMs = Math.max(1, Number(task.remindEveryMinutes || 60)) * 60 * 1000;
      const lastAt = task.lastRemindedAt ? new Date(task.lastRemindedAt) : null;
      const shouldRemind = !lastAt || now.getTime() - lastAt.getTime() >= intervalMs;
      if (shouldRemind) reasons.push(`${task.remindEveryMinutes || 60}分間隔`);
    }

    if (reasons.length > 0) {
      const reminder = {
        id: createId('rem'),
        taskId: task.id,
        scheduledAt: nowIso(),
        status: 'sent',
        sentAt: nowIso(),
        reasons
      };
      store.reminders.push(reminder);
      if (store.reminders.length > MAX_REMINDERS_STORED) {
        store.reminders = store.reminders.slice(-MAX_REMINDERS_STORED);
      }
      task.lastRemindedAt = nowIso();
      task.updatedAt = nowIso();

      addBotMessage(
        store,
        `ご報告申し上げます。未完了タスク「${task.title}」の通知でございます（${reasons.join(' / ')}）。期限: ${formatDueAtHuman(task.dueAt)}。完了のご連絡を頂戴するまで、継続してお知らせいたします。`
      );
      changed = true;
    }
  }

  if (changed) {
    writeStore(store);
  }
}

function serveStatic(req, res, pathname) {
  let target = pathname === '/' ? '/index.html' : pathname;
  target = path.normalize(target).replace(/^\.+/, '');
  const fullPath = path.join(PUBLIC_DIR, target);

  if (!fullPath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('forbidden');
    return;
  }

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('not found');
      return;
    }

    const ext = path.extname(fullPath);
    const types = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
      '.webmanifest': 'application/manifest+json; charset=utf-8',
      '.ico': 'image/x-icon'
    };

    const headers = {
      'Content-Type': types[ext] || 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      Pragma: 'no-cache',
      Expires: '0'
    };
    res.writeHead(200, headers);
    res.end(data);
  });
}

async function handleApi(req, res, pathname) {
  const store = readStore();
  const isNoisyPoll =
    req.method === 'GET' && (pathname === '/api/state' || pathname === '/api/icon-settings');
  if (!isNoisyPoll) {
    logEvent('info', 'api_request', { method: req.method, pathname });
  }

  if (req.method === 'GET' && pathname === '/api/state') {
    const safeSettings = store.settings || {};
    const messages = Array.isArray(store.messages)
      ? store.messages.slice(-MAX_MESSAGES_IN_STATE)
      : [];
    const reminders = Array.isArray(store.reminders)
      ? store.reminders.slice(-MAX_REMINDERS_IN_STATE)
      : [];
    return json(res, 200, {
      appVersion: APP_VERSION,
      runId: RUN_ID,
      settings: {
        ai: {
          enabled: Boolean(safeSettings.ai?.enabled),
          provider: String(safeSettings.ai?.provider || ''),
          model: String(safeSettings.ai?.model || ''),
          baseUrl: String(safeSettings.ai?.baseUrl || '')
        },
        notify: normalizeNotifyConfig(safeSettings.notify),
        appMenu: normalizeAppMenuConfig(safeSettings.appMenu),
        webSearch: {
          enabled: Boolean(safeSettings.webSearch?.enabled),
          provider: String(safeSettings.webSearch?.provider || 'google_cse'),
          configured: Boolean(safeSettings.webSearch?.apiKey && safeSettings.webSearch?.cx),
          defaultStart: Number(safeSettings.webSearch?.defaultStart || 1),
          defaultCount: Number(safeSettings.webSearch?.defaultCount || 10)
        },
        modeControl: normalizeModeControlSettings(safeSettings.modeControl)
      },
      messages,
      tasks: store.tasks,
      reminders,
      pendingActions: store.pendingActions,
      notes: store.notes,
      memoSession: store.memoSession || defaultMemoSession(),
      chatMode: store.chatMode,
      calculators: {
        numberMemo: summarizeNumberMemo(store.calculators?.numberMemo?.entries || []),
        profit: {
          shippingOptions: store.calculators?.profit?.shippingOptions || defaultShippingOptions(),
          packingOptions: store.calculators?.profit?.packingOptions || defaultPackingOptions(),
          folders: store.calculators?.profit?.folders || defaultProfitFolders(),
          recordsCount: Array.isArray(store.calculators?.profit?.records) ? store.calculators.profit.records.length : 0
        }
      },
      history: {
        dates: listHistoryDates().slice(0, 30)
      }
    });
  }

  if (req.method === 'GET' && pathname === '/api/history/dates') {
    return json(res, 200, {
      dates: listHistoryDates()
    });
  }

  if (req.method === 'GET' && /^\/api\/history\/\d{4}-\d{2}-\d{2}$/.test(pathname)) {
    const ymd = pathname.split('/').pop();
    const items = readHistoryForDay(ymd, 2000);
    return json(res, 200, {
      date: ymd,
      count: items.length,
      items
    });
  }

  if (req.method === 'GET' && pathname === '/api/debug/version') {
    return json(res, 200, {
      appVersion: APP_VERSION,
      runId: RUN_ID,
      now: nowIso(),
      debugLogFile: DEBUG_LOG_FILE,
      latestLogFile: LATEST_LOG_FILE
    });
  }

  if (req.method === 'GET' && pathname === '/api/debug/logs') {
    return json(res, 200, {
      appVersion: APP_VERSION,
      runId: RUN_ID,
      file: DEBUG_LOG_FILE,
      lines: readRecentLogs(300)
    });
  }

  if (req.method === 'GET' && pathname === '/api/debug/logs/latest') {
    return json(res, 200, {
      appVersion: APP_VERSION,
      runId: RUN_ID,
      file: LATEST_LOG_FILE,
      lines: readRecentLogFile(LATEST_LOG_FILE, 300)
    });
  }

  if (req.method === 'GET' && pathname === '/api/settings') {
    const ai = store.settings?.ai || {};
    const notify = normalizeNotifyConfig(store.settings?.notify);
    const webSearch = normalizeWebSearchSettings(store.settings?.webSearch);
    const modeControl = normalizeModeControlSettings(store.settings?.modeControl);
    return json(res, 200, {
      ai: {
        enabled: Boolean(ai.enabled),
        provider: String(ai.provider || ''),
        model: String(ai.model || ''),
        baseUrl: String(ai.baseUrl || ''),
        apiKey: String(ai.apiKey || ''),
        apiSecret: String(ai.apiSecret || '')
      },
      notify,
      appMenu: normalizeAppMenuConfig(store.settings?.appMenu),
      webSearch,
      modeControl
    });
  }

  if (req.method === 'GET' && pathname === '/api/icon-settings') {
    return json(res, 200, { icons: normalizeIconSettings(store.settings?.icons) });
  }

  if (req.method === 'GET' && pathname === '/api/tools/number') {
    return json(res, 200, {
      ...summarizeNumberMemo(store.calculators.numberMemo.entries),
      ui: normalizeNumberMemoUi(store.calculators.numberMemo.ui)
    });
  }

  if (req.method === 'POST' && pathname === '/api/tools/number') {
    const body = await parseBody(req);
    const value = Number(body.value);
    const title = String(body.title || '無題').trim() || '無題';
    if (!Number.isFinite(value)) {
      return json(res, 400, { error: 'value must be a number' });
    }
    store.calculators.numberMemo.entries.push({
      id: createId('num'),
      title,
      value,
      createdAt: nowIso(),
      updatedAt: nowIso()
    });
    writeStore(store);
    return json(res, 201, {
      ...summarizeNumberMemo(store.calculators.numberMemo.entries),
      ui: normalizeNumberMemoUi(store.calculators.numberMemo.ui)
    });
  }

  if (req.method === 'PUT' && pathname === '/api/tools/number/ui') {
    const body = await parseBody(req);
    store.calculators.numberMemo.ui = normalizeNumberMemoUi(body || {});
    writeStore(store);
    return json(res, 200, {
      ok: true,
      ui: store.calculators.numberMemo.ui
    });
  }

  if (req.method === 'PATCH' && /^\/api\/tools\/number\/[^/]+$/.test(pathname)) {
    const entryId = pathname.split('/')[4];
    const body = await parseBody(req);
    const entry = (store.calculators.numberMemo.entries || []).find((e) => e.id === entryId);
    if (!entry) return json(res, 404, { error: 'entry not found' });
    const title = String(body.title ?? entry.title).trim() || '無題';
    const value = Number(body.value ?? entry.value);
    if (!Number.isFinite(value)) {
      return json(res, 400, { error: 'value must be a number' });
    }
    entry.title = title;
    entry.value = value;
    entry.updatedAt = nowIso();
    writeStore(store);
    return json(res, 200, {
      ...summarizeNumberMemo(store.calculators.numberMemo.entries),
      ui: normalizeNumberMemoUi(store.calculators.numberMemo.ui)
    });
  }

  if (req.method === 'DELETE' && /^\/api\/tools\/number\/[^/]+$/.test(pathname)) {
    const entryId = pathname.split('/')[4];
    const before = store.calculators.numberMemo.entries.length;
    store.calculators.numberMemo.entries = store.calculators.numberMemo.entries.filter((e) => e.id !== entryId);
    if (store.calculators.numberMemo.entries.length === before) {
      return json(res, 404, { error: 'entry not found' });
    }
    writeStore(store);
    return json(res, 200, {
      ...summarizeNumberMemo(store.calculators.numberMemo.entries),
      ui: normalizeNumberMemoUi(store.calculators.numberMemo.ui)
    });
  }

  if (req.method === 'POST' && pathname === '/api/tools/number/clear') {
    store.calculators.numberMemo.entries = [];
    writeStore(store);
    return json(res, 200, {
      ...summarizeNumberMemo(store.calculators.numberMemo.entries),
      ui: normalizeNumberMemoUi(store.calculators.numberMemo.ui)
    });
  }

  if (req.method === 'GET' && pathname === '/api/tools/profit') {
    return json(res, 200, {
      shippingOptions: store.calculators.profit.shippingOptions,
      packingOptions: store.calculators.profit.packingOptions,
      folders: store.calculators.profit.folders,
      records: store.calculators.profit.records,
      ui: normalizeProfitUi(store.calculators.profit.ui)
    });
  }

  if (req.method === 'PUT' && pathname === '/api/tools/profit/options') {
    const body = await parseBody(req);
    store.calculators.profit.shippingOptions = normalizeOptionList(
      body.shippingOptions,
      store.calculators.profit.shippingOptions
    );
    store.calculators.profit.packingOptions = normalizeOptionList(
      body.packingOptions,
      store.calculators.profit.packingOptions
    );
    store.calculators.profit.folders = normalizeProfitFolderList(body.folders, store.calculators.profit.folders);
    store.calculators.profit.records = normalizeProfitRecords(
      store.calculators.profit.records,
      store.calculators.profit.folders
    );
    const currentUi = normalizeProfitUi(store.calculators.profit.ui || {});
    const nextUiInput = { ...currentUi, ...(body.ui || {}) };
    store.calculators.profit.ui = normalizeProfitUi(nextUiInput);
    writeStore(store);
    return json(res, 200, {
      ok: true,
      shippingOptions: store.calculators.profit.shippingOptions,
      packingOptions: store.calculators.profit.packingOptions,
      folders: store.calculators.profit.folders,
      ui: store.calculators.profit.ui
    });
  }

  if (req.method === 'POST' && pathname === '/api/tools/profit/preview') {
    const body = await parseBody(req);
    const ui = normalizeProfitUi(store.calculators.profit.ui);
    const record = buildProfitRecord(
      {
        ...body,
        invoiceEnabled: ui.invoiceEnabled,
        locale: ui.locale,
        currency: ui.currency
      },
      {
      shippingOptions: store.calculators.profit.shippingOptions,
      packingOptions: store.calculators.profit.packingOptions,
      folders: store.calculators.profit.folders
      }
    );
    return json(res, 200, { record });
  }

  if (req.method === 'POST' && pathname === '/api/tools/profit/calc') {
    const body = await parseBody(req);
    const ui = normalizeProfitUi(store.calculators.profit.ui);
    const computed = buildProfitRecord(
      {
        ...body,
        invoiceEnabled: ui.invoiceEnabled,
        locale: ui.locale,
        currency: ui.currency
      },
      {
      shippingOptions: store.calculators.profit.shippingOptions,
      packingOptions: store.calculators.profit.packingOptions,
      folders: store.calculators.profit.folders
      }
    );
    const record = {
      id: createId('profit'),
      ...computed,
      createdAt: nowIso()
    };
    store.calculators.profit.records.unshift(record);
    store.calculators.profit.records = store.calculators.profit.records.slice(0, 100);
    writeStore(store);
    return json(res, 201, { record });
  }

  if (req.method === 'PATCH' && /^\/api\/tools\/profit\/records\/[^/]+$/.test(pathname)) {
    const recordId = pathname.split('/')[5];
    const body = await parseBody(req);
    const idx = store.calculators.profit.records.findIndex((r) => r.id === recordId);
    if (idx < 0) return json(res, 404, { error: 'record not found' });

    const current = store.calculators.profit.records[idx];
    const merged = {
      ...current,
      itemName: body.itemName ?? current.itemName,
      cost: body.cost ?? current.cost,
      feeRate: body.feeRate ?? current.feeRate,
      shippingId: body.shippingId ?? current.shippingId,
      packingId: body.packingId ?? current.packingId,
      folderId: body.folderId ?? current.folderId,
      salePrice: body.salePrice ?? current.salePrice,
      otherCost: body.otherCost ?? current.otherCost,
      invoiceEnabled: body.invoiceEnabled ?? current.invoiceEnabled,
      taxRate: body.taxRate ?? current.taxRate,
      taxMode: body.taxMode ?? current.taxMode,
      shippingCost: body.shippingCost ?? current.shippingCost,
      packingCost: body.packingCost ?? current.packingCost
    };
    const computed = buildProfitRecord(merged, {
      shippingOptions: store.calculators.profit.shippingOptions,
      packingOptions: store.calculators.profit.packingOptions,
      folders: store.calculators.profit.folders
    });
    store.calculators.profit.records[idx] = {
      ...current,
      ...computed,
      updatedAt: nowIso()
    };
    writeStore(store);
    return json(res, 200, { ok: true, record: store.calculators.profit.records[idx] });
  }

  if (req.method === 'DELETE' && /^\/api\/tools\/profit\/records\/[^/]+$/.test(pathname)) {
    const recordId = pathname.split('/')[5];
    const before = store.calculators.profit.records.length;
    store.calculators.profit.records = store.calculators.profit.records.filter((r) => r.id !== recordId);
    if (store.calculators.profit.records.length === before) {
      return json(res, 404, { error: 'record not found' });
    }
    writeStore(store);
    return json(res, 200, { ok: true, recordId });
  }

  if (req.method === 'POST' && pathname === '/api/memo/session/start') {
    const body = await parseBody(req);
    const rawType = String(body?.type || '').trim();
    const type = rawType === 'append' ? 'append' : rawType === 'individual' ? 'individual' : '';
    if (!type) {
      return json(res, 400, { error: 'type must be append or individual' });
    }
    if (store.chatMode !== 'memo') {
      store.chatMode = 'memo';
    }
    const session = startMemoRecordingSession(store, type);
    addBotMessage(
      store,
      `承知いたしました。${memoTypeLabel(type)}で記録を開始いたします。記録終了ボタンを押すまで、1投稿ごとに改行して追記いたします。`
    );
    writeStore(store);
    return json(res, 200, { ok: true, chatMode: store.chatMode, memoSession: session });
  }

  if (req.method === 'POST' && pathname === '/api/memo/session/stop') {
    const before = normalizeMemoSession(store.memoSession, store.notes);
    if (!before.recording) {
      addBotMessage(store, '現在、メモ記録は開始されておりません。新規記録の種類をお選びくださいませ。', {
        kind: 'choose_memo_type'
      });
      writeStore(store);
      return json(res, 200, { ok: true, memoSession: store.memoSession || defaultMemoSession() });
    }
    const ended = stopMemoRecordingSession(store);
    addBotMessage(
      store,
      `記録を終了いたしました。記録行数: ${ended.lineCount}行。続けて新規記録する場合は、下記より種類をお選びくださいませ。`,
      {
        kind: 'choose_memo_type'
      }
    );
    writeStore(store);
    return json(res, 200, { ok: true, memoSession: store.memoSession || defaultMemoSession() });
  }

  if (req.method === 'PUT' && pathname === '/api/settings') {
    const body = await parseBody(req);
    const incoming = body.ai || {};
    const notifyIncoming = body.notify || {};
    const appMenuIncoming = body.appMenu || {};
    const webSearchIncoming = body.webSearch || {};
    const modeControlIncoming = body.modeControl || {};
    store.settings = store.settings || {};
    store.settings.ai = {
      enabled: Boolean(incoming.enabled),
      provider: String(incoming.provider || '').trim(),
      model: String(incoming.model || '').trim(),
      baseUrl: String(incoming.baseUrl || '').trim(),
      apiKey: String(incoming.apiKey || '').trim(),
      apiSecret: String(incoming.apiSecret || '').trim()
    };
    store.settings.notify = normalizeNotifyConfig(notifyIncoming);
    store.settings.appMenu = normalizeAppMenuConfig(appMenuIncoming);
    store.settings.webSearch = normalizeWebSearchSettings(webSearchIncoming);
    store.settings.modeControl = normalizeModeControlSettings(modeControlIncoming);
    writeStore(store);
    return json(res, 200, { ok: true, settings: store.settings });
  }

  if (req.method === 'PUT' && pathname === '/api/icon-settings') {
    const body = await parseBody(req);
    const incoming = body.icons || {};
    store.settings = store.settings || {};
    store.settings.icons = normalizeIconSettings(incoming);
    writeStore(store);
    return json(res, 200, { ok: true, icons: store.settings.icons });
  }

  if (req.method === 'POST' && pathname === '/api/chat') {
    const body = await parseBody(req);
    const text = String(body.text || '').trim();
    if (!text) {
      return json(res, 400, { error: 'text is required' });
    }

    const normalized = normalizeExpression(text, new Date());
    logEvent('info', 'chat_received', {
      textPreview: safePreview(text),
      normalized: {
        date: normalized.parsed.date,
        time: normalized.parsed.time,
        timeRange: normalized.parsed.timeRange,
        urgency: normalized.parsed.urgency,
        ambiguities: normalized.ambiguities
      }
    });
    store.messages.push({
      id: createId('msg'),
      role: 'user',
      text,
      normalized,
      createdAt: nowIso()
    });

    const modeControl = normalizeModeControlSettings(store.settings?.modeControl);
    const isModeIntentLocked = Boolean(modeControl.lockIntentsInMode && store.chatMode !== 'normal');

    if (detectModeExitIntent(text)) {
      store.chatMode = 'normal';
      store.memoSession = defaultMemoSession();
      addBotMessage(store, `承知いたしました。${appMenuIntroMessage()}`, {
        kind: 'open_app_menu'
      });
      writeStore(store);
      return json(res, 200, { ok: true, normalized, chatMode: store.chatMode });
    }

    if (!isModeIntentLocked && detectTaskCreateModeIntent(text)) {
      store.chatMode = 'task_create';
      addBotMessage(
        store,
        '承知いたしました。タスク作成モードに切り替えました。以後の入力をタスク候補として作成いたします。終了する際は「通常モード」とお申し付けくださいませ。'
      );
      writeStore(store);
      return json(res, 200, { ok: true, normalized, chatMode: store.chatMode });
    }

    if (!isModeIntentLocked && detectMemoModeIntent(text)) {
      store.chatMode = 'memo';
      store.memoSession = defaultMemoSession();
      addBotMessage(
        store,
        '承知いたしました。メモモードに切り替えました。新規記録の種類をお選びくださいませ。',
        {
          kind: 'choose_memo_type'
        }
      );
      writeStore(store);
      return json(res, 200, { ok: true, normalized, chatMode: store.chatMode });
    }

    if (!isModeIntentLocked && store.chatMode === 'normal' && detectAppMenuIntent(text)) {
      addBotMessage(store, appMenuIntroMessage(), {
        kind: 'open_app_menu'
      });
      writeStore(store);
      return json(res, 200, { ok: true, normalized, chatMode: store.chatMode });
    }

    if (!isModeIntentLocked && store.chatMode === 'normal' && detectWebSearchIntent(text)) {
      const request = parseWebSearchRequest(text, store.settings?.webSearch);
      if (!request.query) {
        addBotMessage(
          store,
          '検索キーワードを判定できませんでした。例えば「ガンプラ塗装法についてランキング10〜20のサイトリンクを教えて」のようにお申し付けくださいませ。'
        );
        writeStore(store);
        return json(res, 200, { ok: true, normalized, chatMode: store.chatMode });
      }

      const ws = normalizeWebSearchSettings(store.settings?.webSearch);
      if (!ws.enabled || !ws.apiKey || !ws.cx) {
        addBotMessage(
          store,
          [
            'Google検索設定が未完了でございます。',
            '設定画面で以下をご入力くださいませ。',
            '・Google API Key',
            '・Custom Search Engine ID（CX）',
            '・Google検索を有効化'
          ].join('\n'),
          { kind: 'open_settings' }
        );
        writeStore(store);
        return json(res, 200, { ok: true, normalized, chatMode: store.chatMode });
      }

      try {
        const results = await runGoogleCseSearch(request.query, request.start, request.end, ws);
        if (!results.length) {
          addBotMessage(
            store,
            `「${request.query}」で検索いたしましたが、該当結果を取得できませんでした。キーワードを少し変えてお試しくださいませ。`
          );
          writeStore(store);
          return json(res, 200, { ok: true, normalized, chatMode: store.chatMode });
        }

        const first = results[0]?.rank || request.start;
        const last = results[results.length - 1]?.rank || first;
        addBotMessage(
          store,
          `「${request.query}」の検索結果（${first}〜${last}位相当）でございます。下記リンクをご利用くださいませ。`,
          {
            kind: 'web_search_results',
            query: request.query,
            start: first,
            end: last,
            results: results.slice(0, 20)
          }
        );
        writeStore(store);
        return json(res, 200, { ok: true, normalized, chatMode: store.chatMode });
      } catch (error) {
        logEvent('error', 'web_search_failed', {
          textPreview: safePreview(text),
          query: request.query,
          start: request.start,
          end: request.end,
          message: String(error?.message || error)
        });
        addBotMessage(
          store,
          '検索中にエラーが発生いたしました。API設定または利用上限をご確認くださいませ。',
          { kind: 'open_settings' }
        );
        writeStore(store);
        return json(res, 200, { ok: true, normalized, chatMode: store.chatMode });
      }
    }

    if (!isModeIntentLocked && detectIconSettingsIntent(text)) {
      addBotMessage(store, 'アイコン設定画面をご用意いたしました。ボタンから移動いただけます。', {
        kind: 'open_icon_settings'
      });
      writeStore(store);
      return json(res, 200, { ok: true, normalized });
    }

    if (!isModeIntentLocked && detectHelpIntent(text)) {
      addBotMessage(store, '使い方ページをご用意いたしました。ボタンから移動いただけます。', {
        kind: 'open_help'
      });
      writeStore(store);
      return json(res, 200, { ok: true, normalized });
    }

    if (!isModeIntentLocked && detectNotifyPageIntent(text)) {
      addBotMessage(store, '端末通知設定ページをご用意いたしました。ボタンから移動いただけます。', {
        kind: 'open_notify'
      });
      writeStore(store);
      return json(res, 200, { ok: true, normalized });
    }

    if (!isModeIntentLocked && detectMemoPageIntent(text)) {
      addBotMessage(store, 'メモ一覧画面をご用意いたしました。ボタンから移動いただけます。', {
        kind: 'open_memos'
      });
      writeStore(store);
      return json(res, 200, { ok: true, normalized });
    }

    if (!isModeIntentLocked && detectProfitSettingsIntent(text)) {
      addBotMessage(store, '利益計算の設定画面をご用意いたしました。ボタンから移動いただけます。', {
        kind: 'open_profit_settings'
      });
      writeStore(store);
      return json(res, 200, { ok: true, normalized });
    }

    if (!isModeIntentLocked && detectProfitHistoryIntent(text)) {
      addBotMessage(store, '利益計算の履歴ページをご用意いたしました。ボタンから移動いただけます。', {
        kind: 'open_profit_history'
      });
      writeStore(store);
      return json(res, 200, { ok: true, normalized });
    }

    if (!isModeIntentLocked && detectProfitManualIntent(text)) {
      addBotMessage(store, '利益計算アプリのマニュアルをご用意いたしました。ボタンから移動いただけます。', {
        kind: 'open_profit_manual'
      });
      writeStore(store);
      return json(res, 200, { ok: true, normalized });
    }

    if (!isModeIntentLocked && detectManualIndexIntent(text)) {
      addBotMessage(store, 'マニュアル一覧をご用意いたしました。必要な手順書をお選びいただけます。', {
        kind: 'open_manual_index'
      });
      writeStore(store);
      return json(res, 200, { ok: true, normalized });
    }

    if (!isModeIntentLocked && detectSettingsIntent(text)) {
      logEvent('info', 'settings_intent_detected', { textPreview: safePreview(text) });
      addBotMessage(store, '設定画面はこちらでございます。ボタンを押して移動できます。', {
        kind: 'open_settings'
      });
      writeStore(store);
      return json(res, 200, { ok: true, normalized });
    }

    if (!isModeIntentLocked && detectTaskPageIntent(text)) {
      addBotMessage(store, 'タスク管理画面をご用意いたしました。ボタンから移動いただけます。', {
        kind: 'open_tasks'
      });
      writeStore(store);
      return json(res, 200, { ok: true, normalized });
    }

    const calculatorIntent = !isModeIntentLocked ? decideCalculatorIntent(text) : 'none';
    if (calculatorIntent === 'ask') {
      addBotMessage(store, '「計算」のご用命を承りました。どちらを開きますか。', {
        kind: 'choose_tool'
      });
      writeStore(store);
      return json(res, 200, { ok: true, normalized });
    }

    if (calculatorIntent === 'profit') {
      addBotMessage(store, '利益計算画面をご用意いたしました。ボタンから移動いただけます。', {
        kind: 'open_profit_tool'
      });
      writeStore(store);
      return json(res, 200, { ok: true, normalized });
    }

    if (calculatorIntent === 'number') {
      addBotMessage(store, '数値集計画面をご用意いたしました。ボタンから移動いただけます。', {
        kind: 'open_number_tool'
      });
      writeStore(store);
      return json(res, 200, { ok: true, normalized });
    }

    if (store.chatMode === 'memo') {
      if (detectMemoRecordEndIntent(text)) {
        const ended = stopMemoRecordingSession(store);
        addBotMessage(
          store,
          `記録を終了いたしました。記録行数: ${ended.lineCount}行。続けて記録する場合は、下記より種類をお選びくださいませ。`,
          { kind: 'choose_memo_type' }
        );
        writeStore(store);
        return json(res, 200, { ok: true, normalized, chatMode: store.chatMode, memoSession: store.memoSession });
      }

      const session = normalizeMemoSession(store.memoSession, store.notes);
      // In mode-lock ON, memo type switching by ambiguous text is disabled
      // until mode exit; only explicit UI actions (buttons) are accepted.
      const allowMemoTypeByText = !session.recording && !isModeIntentLocked;
      if (allowMemoTypeByText && (detectMemoAppendTypeIntent(text) || detectMemoIndividualTypeIntent(text))) {
        const type = detectMemoAppendTypeIntent(text) ? 'append' : 'individual';
        const session = startMemoRecordingSession(store, type);
        addBotMessage(
          store,
          `承知いたしました。${memoTypeLabel(type)}で記録を開始いたします。記録終了ボタンを押すまで、1投稿ごとに改行して追記いたします。`
        );
        writeStore(store);
        return json(res, 200, { ok: true, normalized, chatMode: store.chatMode, memoSession: session });
      }

      if (!session.recording || !session.type) {
        addBotMessage(
          store,
          [
            '新規メモ記録の種類をお選びくださいませ。',
            '・ログメモ（追記）: 1つのメモへ継続追記',
            '・個別メモ（分割）: 記録単位で別メモ作成'
          ].join('\n'),
          { kind: 'choose_memo_type' }
        );
        writeStore(store);
        return json(res, 200, { ok: true, normalized, chatMode: store.chatMode, memoSession: store.memoSession });
      }

      const note = appendMemoLine(store, text, normalized);
      if (!note) {
        addBotMessage(store, '記録に失敗いたしました。再度お試しくださいませ。', { kind: 'choose_memo_type' });
        writeStore(store);
        return json(res, 200, { ok: true, normalized, chatMode: store.chatMode, memoSession: store.memoSession });
      }

      addBotMessage(
        store,
        '承知いたしました。メモに追記いたしました。必要に応じて、下のメモ一覧ボタンをご利用くださいませ。',
        {
          kind: 'memo_saved',
          note: {
            id: note.id,
            title: note.title,
            memoKind: note.memoKind,
            text: note.text,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt
          }
        }
      );
      writeStore(store);
      return json(res, 200, { ok: true, normalized, note, chatMode: store.chatMode, memoSession: store.memoSession });
    }

    const isTaskIntent = store.chatMode === 'task_create';
    logEvent('info', 'chat_intent', { textPreview: safePreview(text), isTaskIntent });

    if (isTaskIntent) {
      const suggestedTitle = extractTaskTitle(text);
      const dueNormalized = normalizeExpression(extractTaskDuePhrase(text), new Date());
      const dueAt = chooseDueAt(dueNormalized);
      const remindEveryMinutes = extractRemindMinutes(text);
      const assignee = extractAssignee(text);
      const notifyConfig = parseNotifyConfigFromText(text, store.settings?.notify);
      const actionId = createId('pending');
      const proposal = {
        title: suggestedTitle,
        dueInput: text,
        dueAt,
        assignee,
        remindEveryMinutes,
        notifyConfig,
        ambiguityFlags: normalized.ambiguities
      };
      store.pendingActions.push({
        id: actionId,
        type: 'create_task',
        status: 'pending',
        proposal,
        sourceText: text,
        createdAt: nowIso(),
        updatedAt: nowIso()
      });
      logEvent('info', 'task_proposal_created', {
        actionId,
        title: suggestedTitle,
        dueAt,
        assignee,
        remindEveryMinutes,
        notifyConfig,
        ambiguities: normalized.ambiguities
      });

      addBotMessage(
        store,
        `こちらでタスク候補を作成いたしました。内容をご確認のうえ、承認ボタンを押してくださいませ。\n件名: ${suggestedTitle}\n担当: ${assignee}\n期限: ${formatDueAtHuman(dueAt)}\n通知: ${formatNotifySummary(notifyConfig)}`,
        {
          kind: 'task_proposal',
          actionId,
          proposal
        }
      );
    } else {
      if (store.chatMode === 'normal') {
        if (store.settings?.ai?.enabled) {
          addBotMessage(
            store,
            '通常モードは将来的にAI会話モードとして動作可能な構成です。現在はデバッグ運用のため、機能メニューをご案内いたします。',
            { kind: 'open_app_menu' }
          );
          logEvent('info', 'chat_reply_only', {
            textPreview: safePreview(text),
            reason: 'normal_mode_ai_enabled_placeholder'
          });
        } else {
          addBotMessage(store, appMenuIntroMessage(), {
            kind: 'open_app_menu'
          });
          logEvent('info', 'chat_reply_only', {
            textPreview: safePreview(text),
            reason: 'normal_mode_menu'
          });
        }
      } else {
        const reply = makeRuleBasedReply(text, normalized);
        addBotMessage(store, reply);
        logEvent('info', 'chat_reply_only', {
          textPreview: safePreview(text),
          reason: 'no_task_intent'
        });
      }
    }

    writeStore(store);
    return json(res, 200, { ok: true, normalized });
  }

  if (req.method === 'POST' && /^\/api\/pending\/[^/]+\/edit$/.test(pathname)) {
    const actionId = pathname.split('/')[3];
    const body = await parseBody(req);
    const editText = String(body.text || '').trim();
    const action = store.pendingActions.find((a) => a.id === actionId);
    if (!action || action.status !== 'pending') {
      return json(res, 404, { error: 'pending action not found' });
    }
    if (action.type !== 'create_task') {
      return json(res, 400, { error: 'unsupported action type' });
    }

    action.proposal = applyProposalEditFromText(action.proposal || {}, editText, store.settings?.notify);
    action.updatedAt = nowIso();
    addBotMessage(
      store,
      `承知いたしました。候補内容を更新しました。\n件名: ${action.proposal.title || '未命名'}\n担当: ${action.proposal.assignee || '未設定'}\n期限: ${formatDueAtHuman(action.proposal.dueAt)}\n通知: ${formatNotifySummary(action.proposal.notifyConfig)}`,
      {
        kind: 'task_proposal',
        actionId: action.id,
        proposal: action.proposal
      }
    );
    writeStore(store);
    return json(res, 200, { ok: true, action });
  }

  if (req.method === 'GET' && pathname === '/api/notes') {
    return json(res, 200, { notes: store.notes || [] });
  }

  if (req.method === 'POST' && pathname === '/api/normalize') {
    const body = await parseBody(req);
    const text = String(body.text || '').trim();
    const normalized = normalizeExpression(text, new Date());
    const dueAt = chooseDueAt(normalized);
    return json(res, 200, { normalized, dueAt });
  }

  if (req.method === 'POST' && pathname === '/api/tasks') {
    const body = await parseBody(req);
    const title = String(body.title || '').trim();
    const dueInput = String(body.dueInput || '').trim();
    const assignee = String(body.assignee || '未設定').trim() || '未設定';
    const remindEveryMinutes = Number(body.remindEveryMinutes || 60);
    const approvedDueAt = String(body.approvedDueAt || '').trim() || null;

    if (!title) {
      return json(res, 400, { error: 'title is required' });
    }

    const normalized = normalizeExpression(dueInput, new Date());
    const dueAt = approvedDueAt || chooseDueAt(normalized);

    const task = {
      id: createId('task'),
      taskNo: allocateTaskNo(store),
      title,
      dueInput,
      dueAt,
      assignee,
      remindEveryMinutes,
      isCompleted: false,
      ambiguityFlags: normalized.ambiguities,
      notifyConfig: normalizeNotifyConfig(body.notifyConfig || store.settings?.notify),
      sentNotificationKeys: [],
      lastRemindedAt: null,
      createdAt: nowIso(),
      updatedAt: nowIso()
    };

    store.tasks.push(task);
    addBotMessage(
      store,
      `かしこまりました。タスク #${task.taskNo}「${title}」を登録いたしました。担当: ${assignee}。${dueAt ? `初回予定は ${formatDueAtHuman(dueAt)} でございます。` : '日時が曖昧なため、必要でしたら追記をご指示ください。'}`
    );
    writeStore(store);
    return json(res, 201, { task });
  }

  if (req.method === 'POST' && /^\/api\/pending\/[^/]+\/approve$/.test(pathname)) {
    const actionId = pathname.split('/')[3];
    const action = store.pendingActions.find((a) => a.id === actionId);
    if (!action || action.status !== 'pending') {
      logEvent('warn', 'task_proposal_approve_not_found', { actionId });
      return json(res, 404, { error: 'pending action not found' });
    }
    if (action.type !== 'create_task') {
      return json(res, 400, { error: 'unsupported action type' });
    }

    const p = action.proposal || {};
    const task = {
      id: createId('task'),
      taskNo: allocateTaskNo(store),
      title: String(p.title || '未命名タスク'),
      dueInput: String(p.dueInput || action.sourceText || ''),
      dueAt: p.dueAt || null,
      assignee: String(p.assignee || '未設定'),
      remindEveryMinutes: Math.max(1, Number(p.remindEveryMinutes || 60)),
      isCompleted: false,
      ambiguityFlags: Array.isArray(p.ambiguityFlags) ? p.ambiguityFlags : [],
      notifyConfig: normalizeNotifyConfig(p.notifyConfig || store.settings?.notify),
      sentNotificationKeys: [],
      lastRemindedAt: null,
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    store.tasks.push(task);
    action.status = 'approved';
    action.updatedAt = nowIso();
    logEvent('info', 'task_proposal_approved', {
      actionId,
      taskId: task.id,
      title: task.title,
      dueAt: task.dueAt,
      assignee: task.assignee
    });
    addBotMessage(
      store,
      `承りました。タスク #${task.taskNo}「${task.title}」を登録いたしました。担当: ${task.assignee}。期限: ${formatDueAtHuman(task.dueAt)}。通知: ${formatNotifySummary(task.notifyConfig)}。`
    );
    writeStore(store);
    return json(res, 200, { ok: true, task, actionId });
  }

  if (req.method === 'POST' && /^\/api\/pending\/[^/]+\/reject$/.test(pathname)) {
    const actionId = pathname.split('/')[3];
    const action = store.pendingActions.find((a) => a.id === actionId);
    if (!action || action.status !== 'pending') {
      logEvent('warn', 'task_proposal_reject_not_found', { actionId });
      return json(res, 404, { error: 'pending action not found' });
    }
    action.status = 'rejected';
    action.updatedAt = nowIso();
    logEvent('info', 'task_proposal_rejected', { actionId });
    addBotMessage(store, 'かしこまりました。今回のタスク候補は見送りとして処理いたしました。');
    writeStore(store);
    return json(res, 200, { ok: true, actionId });
  }

  if (req.method === 'PATCH' && /^\/api\/tasks\/[^/]+$/.test(pathname)) {
    const taskId = pathname.split('/')[3];
    const body = await parseBody(req);
    const task = store.tasks.find((t) => t.id === taskId);
    if (!task) {
      return json(res, 404, { error: 'task not found' });
    }

    const nextTitle = String(body.title ?? task.title).trim();
    const nextAssignee = String(body.assignee ?? task.assignee ?? '未設定').trim() || '未設定';
    const nextDueInput = String(body.dueInput ?? task.dueInput ?? '').trim();
    const nextRemind = Math.max(1, Number(body.remindEveryMinutes ?? task.remindEveryMinutes ?? 60));

    task.title = nextTitle || task.title;
    task.assignee = nextAssignee;
    task.dueInput = nextDueInput;
    task.remindEveryMinutes = nextRemind;

    if (typeof body.notifyConfig !== 'undefined') {
      task.notifyConfig = normalizeNotifyConfig(body.notifyConfig);
      task.sentNotificationKeys = [];
    }

    if (typeof body.dueAt !== 'undefined') {
      task.dueAt = body.dueAt || null;
      task.sentNotificationKeys = [];
    } else if (nextDueInput) {
      const normalized = normalizeExpression(nextDueInput, new Date());
      task.dueAt = chooseDueAt(normalized);
      task.ambiguityFlags = normalized.ambiguities;
      task.sentNotificationKeys = [];
    }

    task.updatedAt = nowIso();
    writeStore(store);
    addBotMessage(store, `承りました。タスク「${task.title}」の内容を更新いたしました。`);
    return json(res, 200, { task });
  }

  if (req.method === 'PATCH' && /^\/api\/notes\/[^/]+$/.test(pathname)) {
    const noteId = pathname.split('/')[3];
    const body = await parseBody(req);
    const note = store.notes.find((n) => n.id === noteId);
    if (!note) {
      return json(res, 404, { error: 'note not found' });
    }
    const nextText = String(body.text || '').trim();
    if (!nextText) {
      return json(res, 400, { error: 'text is required' });
    }
    note.text = nextText;
    note.updatedAt = nowIso();
    addBotMessage(store, '承りました。メモ内容を更新いたしました。');
    writeStore(store);
    return json(res, 200, { ok: true, note });
  }

  if (req.method === 'DELETE' && /^\/api\/notes\/[^/]+$/.test(pathname)) {
    const noteId = pathname.split('/')[3];
    const idx = store.notes.findIndex((n) => n.id === noteId);
    if (idx < 0) {
      return json(res, 404, { error: 'note not found' });
    }
    const removed = store.notes[idx];
    store.notes.splice(idx, 1);
    addBotMessage(store, `承りました。メモ「${safePreview(removed.text, 40)}」を削除いたしました。`);
    writeStore(store);
    return json(res, 200, { ok: true, noteId });
  }

  if (req.method === 'DELETE' && /^\/api\/tasks\/[^/]+$/.test(pathname)) {
    const taskId = pathname.split('/')[3];
    const idx = store.tasks.findIndex((t) => t.id === taskId);
    if (idx < 0) {
      return json(res, 404, { error: 'task not found' });
    }
    const removed = store.tasks[idx];
    store.tasks.splice(idx, 1);
    addBotMessage(store, `承りました。タスク「${removed.title}」を削除いたしました。`);
    writeStore(store);
    return json(res, 200, { ok: true, taskId });
  }

  if (req.method === 'PATCH' && /^\/api\/tasks\/[^/]+\/complete$/.test(pathname)) {
    const taskId = pathname.split('/')[3];
    const task = store.tasks.find((t) => t.id === taskId);
    if (!task) {
      return json(res, 404, { error: 'task not found' });
    }

    task.isCompleted = true;
    task.updatedAt = nowIso();
    addBotMessage(store, `承りました。タスク「${task.title}」を完了として記録いたしました。`);
    writeStore(store);
    return json(res, 200, { task });
  }

  if (req.method === 'PATCH' && /^\/api\/tasks\/[^/]+\/reopen$/.test(pathname)) {
    const taskId = pathname.split('/')[3];
    const task = store.tasks.find((t) => t.id === taskId);
    if (!task) {
      return json(res, 404, { error: 'task not found' });
    }

    task.isCompleted = false;
    task.updatedAt = nowIso();
    addBotMessage(store, `かしこまりました。タスク「${task.title}」を再開いたします。`);
    writeStore(store);
    return json(res, 200, { task });
  }

  return json(res, 404, { error: 'not found' });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    if (pathname.startsWith('/api/')) {
      return await handleApi(req, res, pathname);
    }

    return serveStatic(req, res, pathname);
  } catch (error) {
    logEvent('error', 'server_error', {
      message: error.message,
      stack: safePreview(error.stack, 400)
    });
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'internal_error', detail: error.message }));
  }
});

server.listen(PORT, HOST, () => {
  logEvent('info', 'server_started', {
    appVersion: APP_VERSION,
    runId: RUN_ID,
    url: `http://localhost:${PORT}`,
    lanUrl: `http://${LAN_HOST}:${PORT}`,
    host: HOST,
    debugLogFile: DEBUG_LOG_FILE
  });
});

setInterval(runReminderTick, REMINDER_CHECK_MS);
runReminderTick();
