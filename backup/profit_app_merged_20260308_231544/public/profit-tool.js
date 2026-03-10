const profitForm = document.getElementById('profitForm');
const profitResult = document.getElementById('profitResult');
const profitValue = document.getElementById('profitValue');
const marginRateRow = document.getElementById('marginRateRow');
const marginRateValue = document.getElementById('marginRateValue');
const roiRateRow = document.getElementById('roiRateRow');
const roiRateValue = document.getElementById('roiRateValue');
const profitSaveBtn = document.getElementById('profitSaveBtn');
const profitClearBtn = document.getElementById('profitClearBtn');
const profitRowControls = document.getElementById('profitRowControls');
const profitSectionAnchor = document.getElementById('profitSectionAnchor');
const profitResultSection = document.getElementById('profitResultSection');
const headerHistoryBtn = document.getElementById('headerHistoryBtn');
const headerMoveModeBtn = document.getElementById('headerMoveModeBtn');
const headerSettingsBtn = document.getElementById('headerSettingsBtn');
const navToggleBtn = document.querySelector('.nav-toggle');
const closeToChatBtn = document.getElementById('closeToChatBtn');
const cardEl = document.querySelector('main .card');

const fields = {
  itemName: document.getElementById('itemName'),
  cost: document.getElementById('cost'),
  feeRate: document.getElementById('feeRate'),
  shippingId: document.getElementById('shippingId'),
  packingId: document.getElementById('packingId'),
  salePrice: document.getElementById('salePrice'),
  otherCost: document.getElementById('otherCost'),
  folderId: document.getElementById('folderId')
};

let shippingOptions = [];
let packingOptions = [];
let folderOptions = [];
let pendingSavePayload = null;
let profitSectionOrder = ['form', 'result'];
let profitFormRowOrder = [
  'heading',
  'itemName',
  'cost',
  'feeRate',
  'shippingId',
  'packingId',
  'salePrice',
  'otherCost',
  'folderId',
  'actions'
];
let profitMoveMode = false;
let showMarginRate = true;
let showRoiRate = true;
let latestResultRecord = null;
let currentLocale = 'ja-JP';
let currentCurrency = 'JPY';
let profitResultRowOrder = ['profitValue', 'marginRate', 'roiRate', 'resultText'];

function notify(message, type = 'success') {
  if (window.AppFeedback && typeof window.AppFeedback.showNotice === 'function') {
    window.AppFeedback.showNotice(message, { type });
    return;
  }
  console.log(message);
}

const LONG_PRESS_MS = 220;
let pressTimer = null;
let dragRow = null;

function applyInputAlign(align) {
  const right = String(align || '').trim() === 'right';
  document.body.classList.toggle('profit-input-right', right);
}

function applyResultAlign(align) {
  const left = String(align || '').trim() === 'left';
  document.body.classList.toggle('profit-result-left', left);
  document.body.classList.toggle('profit-result-right', !left);
}

function applyDetailPack(pack) {
  const left = String(pack || '').trim() === 'left';
  document.body.classList.toggle('profit-detail-pack-left', left);
  document.body.classList.toggle('profit-detail-pack-right', !left);
}

function applyDetailAlign(align) {
  const right = String(align || '').trim() === 'right';
  document.body.classList.toggle('profit-detail-align-right', right);
  document.body.classList.toggle('profit-detail-align-left', !right);
}

function applyMetricVisibility() {
  if (marginRateRow) marginRateRow.style.display = showMarginRate ? '' : 'none';
  if (roiRateRow) roiRateRow.style.display = showRoiRate ? '' : 'none';
}

function formatMoney(v) {
  const amount = Number(v || 0);
  if (currentCurrency === 'JPY') {
    try {
      return `${new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 0 }).format(amount)}円`;
    } catch {
      return `${Math.floor(amount)}円`;
    }
  }
  try {
    return new Intl.NumberFormat(currentLocale, {
      style: 'currency',
      currency: currentCurrency,
      maximumFractionDigits: 0
    }).format(amount);
  } catch {
    return String(amount);
  }
}

function unitLabelForInput() {
  if (currentCurrency === 'JPY' && currentLocale.startsWith('ja')) return '円';
  return currentCurrency;
}

function applyUnitLabels() {
  const label = unitLabelForInput();
  const ids = ['costUnit', 'saleUnit', 'otherUnit'];
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) el.textContent = label;
  }
}

function fillSelect(select, options) {
  select.innerHTML = '';
  for (const opt of options || []) {
    const el = document.createElement('option');
    el.value = opt.id;
    el.textContent = `${opt.name} (${formatMoney(opt.cost)})`;
    select.appendChild(el);
  }
}

function fillFolderSelect(select, options) {
  select.innerHTML = '';
  for (const opt of options || []) {
    const el = document.createElement('option');
    el.value = opt.id;
    el.textContent = String(opt.name || 'inbox');
    select.appendChild(el);
  }
}

function resetInputForm() {
  fields.itemName.value = '';
  fields.cost.value = '';
  fields.feeRate.value = '10';
  fields.salePrice.value = '';
  fields.otherCost.value = '0';
  fields.shippingId.value = shippingOptions[0]?.id || '';
  fields.packingId.value = packingOptions[0]?.id || '';
  const defaultFolder =
    folderOptions.find((f) => String(f.id || '') === 'folder_inbox') ||
    folderOptions.find((f) => String(f.name || '').trim().toLowerCase() === 'inbox') ||
    folderOptions[0];
  fields.folderId.value = defaultFolder?.id || '';
}

function clearProfitInput(shouldNotify = true) {
  pendingSavePayload = null;
  resetInputForm();
  if (profitSaveBtn) {
    profitSaveBtn.style.display = 'none';
  }
  if (shouldNotify) {
    notify('入力をクリアしました。', 'success');
  }
}

function resetResultDisplay() {
  latestResultRecord = null;
  pendingSavePayload = null;
  if (profitValue) profitValue.textContent = '-';
  if (marginRateValue) marginRateValue.textContent = '-';
  if (roiRateValue) roiRateValue.textContent = '-';
  let detailEl = profitResult.querySelector('.profit-detail-text');
  if (!detailEl) {
    detailEl = document.createElement('div');
    detailEl.className = 'profit-detail-text';
    profitResult.replaceChildren(detailEl);
  }
  detailEl.textContent = '内訳（計算後に表示）';
  if (profitSaveBtn) {
    profitSaveBtn.style.display = 'none';
  }
}

function renderResult(r) {
  if (!r) return;
  latestResultRecord = r;
  const shownProfit = Number(r.profit || 0);
  const shownMarginRate = Number(r.salePrice || 0) > 0 ? (shownProfit / Number(r.salePrice || 1)) * 100 : 0;
  const shownRoiRate = Number(r.totalCost || 0) > 0 ? (shownProfit / Number(r.totalCost || 1)) * 100 : 0;
  profitValue.textContent = formatMoney(shownProfit);
  if (marginRateValue) marginRateValue.textContent = `${Number(shownMarginRate || 0).toFixed(2)}%`;
  if (roiRateValue) {
    roiRateValue.textContent = `${Number(shownRoiRate || 0).toFixed(2)}%`;
  }
  applyMetricVisibility();

  const shippingLabel =
    String(r.shippingName || '').trim() ||
    shippingOptions.find((o) => o.id === String(r.shippingId || ''))?.name ||
    '未選択';
  const packingLabel =
    String(r.packingName || '').trim() ||
    packingOptions.find((o) => o.id === String(r.packingId || ''))?.name ||
    '未選択';
  const lines = [];
  lines.push(`商品: ${r.itemName || '未設定'}`);
  lines.push(`売価: ${formatMoney(r.salePrice)}`);
  const costPrefix = '総コスト：';
  const indent = ' '.repeat(costPrefix.length);
  lines.push(`${costPrefix}${formatMoney(r.totalCost)}`);
  const breakdownLabel = `${indent}コスト内訳`;
  const breakdownIndent = ' '.repeat(breakdownLabel.length);
  const extraIndent = '\u3000\u3000\u3000 ';
  lines.push(`${breakdownLabel}：原価 ${formatMoney(r.cost)}`);
  lines.push(`${breakdownIndent}${extraIndent}：手数料 ${formatMoney(r.feeAmount)}`);
  lines.push(`${breakdownIndent}${extraIndent}：送料（${shippingLabel}） ${formatMoney(r.shippingCost)}`);
  lines.push(`${breakdownIndent}${extraIndent}：梱包材（${packingLabel}） ${formatMoney(r.packingCost)}`);
  lines.push(`${breakdownIndent}${extraIndent}：その他 ${formatMoney(r.otherCost)}`);
  lines.push(`利益: ${formatMoney(shownProfit)}`);
  lines.push(`利益率: ${Number(shownMarginRate || 0).toFixed(2)}%`);
  lines.push(`ROI: ${Number(shownRoiRate || 0).toFixed(2)}%`);
  if (r.folderName || r.folderId) {
    lines.push(`保存先: ${r.folderName || r.folderId}`);
  }
  const text = lines.join('\n');
  let detailEl = profitResult.querySelector('.profit-detail-text');
  if (!detailEl) {
    detailEl = document.createElement('div');
    detailEl.className = 'profit-detail-text';
    profitResult.replaceChildren(detailEl);
  }
  detailEl.textContent = text;
}

function normalizeSectionOrder(order) {
  const base = ['form', 'result'];
  if (!Array.isArray(order)) return base;
  const out = [];
  for (const k of order) {
    const v = String(k);
    if (!base.includes(v)) continue;
    if (out.includes(v)) continue;
    out.push(v);
  }
  for (const k of base) {
    if (!out.includes(k)) out.push(k);
  }
  return out;
}

function applySectionOrder(order) {
  if (!cardEl || !profitForm || !profitResultSection || !profitSectionAnchor) return;
  const normalized = normalizeSectionOrder(order);
  profitSectionOrder = normalized;
  const map = {
    form: profitForm,
    result: profitResultSection
  };
  let anchor = profitSectionAnchor;
  for (const key of normalized) {
    const el = map[key];
    if (!el) continue;
    if (anchor.nextSibling !== el) {
      anchor.after(el);
    }
    anchor = el;
  }
  updateSectionMoveButtonState();
  renderProfitMoveMode();
}

function updateSectionMoveButtonState() {
  const total = profitSectionOrder.length;
  for (const key of profitSectionOrder) {
    const sectionEl = cardEl?.querySelector(`[data-section-key="${key}"]`);
    if (!sectionEl) continue;
    const upBtn = sectionEl.querySelector('.layout-move-btn[data-dir="up"]');
    const downBtn = sectionEl.querySelector('.layout-move-btn[data-dir="down"]');
    const idx = profitSectionOrder.indexOf(key);
    if (upBtn) {
      const disabled = idx <= 0;
      upBtn.disabled = disabled;
      upBtn.classList.toggle('is-disabled', disabled);
      upBtn.setAttribute('aria-disabled', disabled ? 'true' : 'false');
      upBtn.title = disabled ? 'これ以上上へ移動できません' : '上へ移動';
    }
    if (downBtn) {
      const disabled = idx < 0 || idx >= total - 1;
      downBtn.disabled = disabled;
      downBtn.classList.toggle('is-disabled', disabled);
      downBtn.setAttribute('aria-disabled', disabled ? 'true' : 'false');
      downBtn.title = disabled ? 'これ以上下へ移動できません' : '下へ移動';
    }
  }
}

function normalizeProfitFormRowOrder(order) {
  const base = ['heading', 'itemName', 'cost', 'feeRate', 'shippingId', 'packingId', 'salePrice', 'otherCost', 'folderId', 'actions'];
  if (!Array.isArray(order)) return base;
  const out = [];
  for (const raw of order) {
    const key = String(raw || '');
    if (!base.includes(key)) continue;
    if (out.includes(key)) continue;
    out.push(key);
  }
  for (const key of base) {
    if (!out.includes(key)) out.push(key);
  }
  return out;
}

function getCurrentFormRowOrderFromDom() {
  const keys = Array.from(profitForm.querySelectorAll('.movable-form-row[data-row-key]')).map((el) => el.dataset.rowKey);
  return normalizeProfitFormRowOrder(keys);
}

function applyProfitFormRowOrder(order) {
  if (!profitForm) return;
  const normalized = normalizeProfitFormRowOrder(order);
  profitFormRowOrder = normalized;
  let anchor = profitRowControls || null;
  for (const key of normalized) {
    const el = profitForm.querySelector(`.movable-form-row[data-row-key="${key}"]`);
    if (!el) continue;
    if (anchor) {
      if (anchor.nextSibling !== el) anchor.after(el);
      anchor = el;
    } else {
      profitForm.appendChild(el);
    }
  }
}

function normalizeProfitResultRowOrder(order) {
  const base = ['profitValue', 'marginRate', 'roiRate', 'resultText'];
  if (!Array.isArray(order)) return base;
  const out = [];
  for (const raw of order) {
    const key = String(raw || '');
    if (!base.includes(key)) continue;
    if (out.includes(key)) continue;
    out.push(key);
  }
  for (const key of base) {
    if (!out.includes(key)) out.push(key);
  }
  return out;
}

function getCurrentResultRowOrderFromDom() {
  const keys = Array.from(profitResultSection.querySelectorAll('.movable-result-row[data-row-key]')).map((el) => el.dataset.rowKey);
  return normalizeProfitResultRowOrder(keys);
}

function applyProfitResultRowOrder(order) {
  if (!profitResultSection) return;
  const normalized = normalizeProfitResultRowOrder(order);
  profitResultRowOrder = normalized;
  const anchor = profitResultSection.querySelector('.layout-move-control');
  const fixedNote = profitResultSection.querySelector('.rounding-note');
  const metricsContainer = document.getElementById('profitMetrics');
  if (!metricsContainer) return;
  let prev = fixedNote || anchor || null;
  for (const key of normalized) {
    const el = profitResultSection.querySelector(`.movable-result-row[data-row-key="${key}"]`);
    if (!el) continue;
    if (el.parentElement === metricsContainer) {
      metricsContainer.removeChild(el);
    }
    if (prev) {
      if (prev.nextSibling !== el) prev.after(el);
      prev = el;
    } else {
      profitResultSection.appendChild(el);
    }
  }

  // Keep rounding note always above the first result row.
  if (fixedNote) {
    const firstRow = normalized
      .map((key) => profitResultSection.querySelector(`.movable-result-row[data-row-key="${key}"]`))
      .find(Boolean);
    if (firstRow) {
      if (fixedNote.nextSibling !== firstRow) {
        firstRow.before(fixedNote);
      }
    } else if (anchor) {
      if (anchor.nextSibling !== fixedNote) {
        anchor.after(fixedNote);
      }
    } else if (profitResultSection.firstChild !== fixedNote) {
      profitResultSection.prepend(fixedNote);
    }
  }
}

async function saveProfitUiPatch(ui) {
  await fetch('/api/tools/profit/options', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ui: ui || {} })
  });
}

function ensureProfitMoveControl(sectionEl, key, title) {
  if (!sectionEl) return;
  sectionEl.dataset.sectionKey = key;
  let control = sectionEl.querySelector('.layout-move-control');
  if (!control) {
    control = document.createElement('div');
    control.className = 'layout-move-control';
    const label = document.createElement('span');
    label.className = 'layout-move-label';
    label.textContent = title;
    const upBtn = document.createElement('button');
    upBtn.type = 'button';
    upBtn.className = 'secondary layout-move-btn';
    upBtn.dataset.dir = 'up';
    upBtn.textContent = '↑';
    upBtn.addEventListener('click', async () => {
      const order = [...profitSectionOrder];
      const idx = order.indexOf(key);
      const nextIdx = idx - 1;
      if (idx < 0 || nextIdx < 0) return;
      sectionEl.classList.add('section-swapping-out');
      const targetEl = key === 'form' ? profitResultSection : profitForm;
      if (targetEl) targetEl.classList.add('section-swapping-in');
      await new Promise((resolve) => setTimeout(resolve, 820));
      [order[idx], order[nextIdx]] = [order[nextIdx], order[idx]];
      const next = normalizeSectionOrder(order);
      applySectionOrder(next);
      await saveProfitUiPatch({ sectionOrder: next });
      sectionEl.classList.remove('section-swapping-out');
      if (targetEl) targetEl.classList.remove('section-swapping-in');
    });
    const downBtn = document.createElement('button');
    downBtn.type = 'button';
    downBtn.className = 'secondary layout-move-btn';
    downBtn.dataset.dir = 'down';
    downBtn.textContent = '↓';
    downBtn.addEventListener('click', async () => {
      const order = [...profitSectionOrder];
      const idx = order.indexOf(key);
      const nextIdx = idx + 1;
      if (idx < 0 || nextIdx >= order.length) return;
      sectionEl.classList.add('section-swapping-out');
      const targetEl = key === 'form' ? profitResultSection : profitForm;
      if (targetEl) targetEl.classList.add('section-swapping-in');
      await new Promise((resolve) => setTimeout(resolve, 820));
      [order[idx], order[nextIdx]] = [order[nextIdx], order[idx]];
      const next = normalizeSectionOrder(order);
      applySectionOrder(next);
      await saveProfitUiPatch({ sectionOrder: next });
      sectionEl.classList.remove('section-swapping-out');
      if (targetEl) targetEl.classList.remove('section-swapping-in');
    });
    control.appendChild(label);
    control.appendChild(upBtn);
    control.appendChild(downBtn);
    sectionEl.prepend(control);
  }
  updateSectionMoveButtonState();
}

function ensureRowDragHandles() {
  const rows = [
    ...Array.from(profitForm.querySelectorAll('.movable-form-row[data-row-key]')),
    ...Array.from(profitResultSection.querySelectorAll('.movable-result-row[data-row-key]'))
  ];
  for (const row of rows) {
    if (!row.querySelector('.row-drag-handle')) {
      const handle = document.createElement('span');
      handle.className = 'row-drag-handle';
      handle.setAttribute('aria-hidden', 'true');
      row.appendChild(handle);
    }

    if (row.dataset.dragBound === '1') continue;
    row.dataset.dragBound = '1';

    const clearPress = () => {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    };

    row.addEventListener('pointerdown', (e) => {
      if (!profitMoveMode) return;
      e.preventDefault();
      clearPress();
      pressTimer = setTimeout(() => {
        dragRow = row;
        dragRow.classList.add('row-dragging');
        document.body.classList.add('row-drag-active');
      }, LONG_PRESS_MS);
    });

    row.addEventListener('pointerup', clearPress);
    row.addEventListener('pointercancel', clearPress);
    row.addEventListener('pointerleave', clearPress);
  }
}

function bindRowDragEvents() {
  document.addEventListener('pointermove', (e) => {
    if (!dragRow || !profitMoveMode) return;
    const hit = document.elementFromPoint(e.clientX, e.clientY);
    if (!hit) return;
    const selector = dragRow.classList.contains('movable-result-row')
      ? '.movable-result-row[data-row-key]'
      : '.movable-form-row[data-row-key]';
    const target = hit.closest(selector);
    if (!target || target === dragRow || target.parentElement !== dragRow.parentElement) return;
    if (selector.includes('movable-form-row') && target.dataset.rowKey === 'heading') return;
    const rect = target.getBoundingClientRect();
    const before = e.clientY < rect.top + rect.height / 2;
    if (before) {
      target.before(dragRow);
    } else {
      target.after(dragRow);
    }
  });

  const endDrag = async () => {
    if (!dragRow) return;
    dragRow.classList.remove('row-dragging');
    const draggedType = dragRow.classList.contains('movable-result-row') ? 'result' : 'form';
    dragRow = null;
    document.body.classList.remove('row-drag-active');
    if (draggedType === 'form') {
      const next = getCurrentFormRowOrderFromDom();
      if (JSON.stringify(next) !== JSON.stringify(profitFormRowOrder)) {
        profitFormRowOrder = next;
        await saveProfitUiPatch({ formRowOrder: next });
      }
    } else {
      const next = getCurrentResultRowOrderFromDom();
      if (JSON.stringify(next) !== JSON.stringify(profitResultRowOrder)) {
        profitResultRowOrder = next;
        await saveProfitUiPatch({ resultRowOrder: next });
      }
    }
  };

  document.addEventListener('pointerup', endDrag);
  document.addEventListener('pointercancel', endDrag);

  // iOSの長押しメニュー（選択/コピー）を、位置変更モード中は抑止する
  document.addEventListener('contextmenu', (e) => {
    if (!profitMoveMode) return;
    const target = e.target;
    if (!(target instanceof Element)) return;
    if (!target.closest('.movable-form-row[data-row-key], .movable-result-row[data-row-key]')) return;
    e.preventDefault();
  });

  document.addEventListener('selectstart', (e) => {
    if (!profitMoveMode) return;
    const target = e.target;
    if (!(target instanceof Element)) return;
    if (!target.closest('.movable-form-row[data-row-key], .movable-result-row[data-row-key]')) return;
    e.preventDefault();
  });
}

function renderProfitMoveMode() {
  if (!cardEl) return;
  cardEl.classList.toggle('move-mode', profitMoveMode);
  document.body.classList.toggle('profit-move-lock', profitMoveMode);

  const controls = Array.from(cardEl.querySelectorAll('input, select, textarea, .movable-form-row button, .movable-result-row button'));
  for (const el of controls) {
    el.disabled = profitMoveMode;
  }
  const blockedHeaderButtons = [navToggleBtn, headerHistoryBtn, headerSettingsBtn, closeToChatBtn].filter(Boolean);
  for (const btn of blockedHeaderButtons) {
    btn.disabled = profitMoveMode;
  }
  if (profitClearBtn) {
    profitClearBtn.disabled = profitMoveMode;
  }
  if (headerMoveModeBtn) {
    headerMoveModeBtn.textContent = profitMoveMode ? '位置変更保存' : '位置変更';
    headerMoveModeBtn.classList.toggle('danger-move-btn', profitMoveMode);
  }
  if (profitRowControls) {
    if (profitMoveMode) {
      profitRowControls.innerHTML = '';
      const tip = document.createElement('span');
      tip.className = 'layout-row-tip';
      tip.textContent = '長押しして行を移動できます（終了以外の操作はロック中）。';
      profitRowControls.appendChild(tip);
    } else {
      profitRowControls.textContent = '';
    }
  }
}

async function refresh() {
  const prevShipping = fields.shippingId.value;
  const prevPacking = fields.packingId.value;
  const prevFolder = fields.folderId.value;
  const res = await fetch('/api/tools/profit', { cache: 'no-store' });
  const data = await res.json();

  applySectionOrder(data?.ui?.sectionOrder || ['form', 'result']);
  applyInputAlign(data?.ui?.inputAlign || 'right');
  applyResultAlign(data?.ui?.resultAlign || 'right');
  applyDetailPack(data?.ui?.detailPack || 'right');
  applyDetailAlign(data?.ui?.detailAlign || 'left');
  showMarginRate = data?.ui?.showMarginRate !== false;
  showRoiRate = data?.ui?.showRoiRate !== false;
  applyMetricVisibility();
  currentLocale = data?.ui?.locale || 'ja-JP';
  currentCurrency = data?.ui?.currency || 'JPY';
  applyUnitLabels();
  applyProfitFormRowOrder(data?.ui?.formRowOrder || profitFormRowOrder);
  applyProfitResultRowOrder(data?.ui?.resultRowOrder || profitResultRowOrder);
  ensureProfitMoveControl(profitForm, 'form', '入力');
  ensureProfitMoveControl(profitResultSection, 'result', '結果');
  ensureRowDragHandles();

  shippingOptions = data.shippingOptions || [];
  packingOptions = data.packingOptions || [];
  folderOptions = Array.isArray(data.folders) && data.folders.length ? data.folders : [{ id: 'folder_inbox', name: 'inbox' }];
  fillSelect(fields.shippingId, shippingOptions);
  fillSelect(fields.packingId, packingOptions);
  fillFolderSelect(fields.folderId, folderOptions);

  if (prevShipping) fields.shippingId.value = prevShipping;
  if (prevPacking) fields.packingId.value = prevPacking;
  if (prevFolder) fields.folderId.value = prevFolder;
  if (!fields.shippingId.value && shippingOptions.length) fields.shippingId.value = shippingOptions[0].id;
  if (!fields.packingId.value && packingOptions.length) fields.packingId.value = packingOptions[0].id;
  if (!fields.folderId.value && folderOptions.length) fields.folderId.value = folderOptions[0].id;

  const shouldRestore = data?.ui?.restoreLastResult === true;
  const latest = (data.records || [])[0];
  if (shouldRestore && latest) {
    renderResult(latest);
  } else {
    resetResultDisplay();
  }
}

profitForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    itemName: fields.itemName.value.trim(),
    cost: Number(fields.cost.value || 0),
    feeRate: Number(fields.feeRate.value || 0),
    shippingId: fields.shippingId.value,
    packingId: fields.packingId.value,
    folderId: fields.folderId.value,
    salePrice: Number(fields.salePrice.value || 0),
    otherCost: Number(fields.otherCost.value || 0),
    locale: currentLocale,
    currency: currentCurrency
  };

  const res = await fetch('/api/tools/profit/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok || !data.record) {
    notify('計算に失敗しました。入力内容をご確認ください。', 'error');
    return;
  }

  pendingSavePayload = payload;
  renderResult(data.record);
  notify('計算しました。', 'success');
  if (profitSaveBtn) {
    profitSaveBtn.style.display = 'inline-block';
  }
});

if (profitSaveBtn) {
  profitSaveBtn.addEventListener('click', async () => {
    if (!pendingSavePayload) {
      notify('先に計算を実行してください。', 'warn');
      return;
    }
    const res = await fetch('/api/tools/profit/calc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pendingSavePayload)
    });
    if (!res.ok) {
      notify('保存に失敗しました。再度お試しください。', 'error');
      return;
    }
    clearProfitInput(false);
    sessionStorage.setItem('profitFlashNotice', '保存しました。');
    notify('保存しました。', 'success');
    setTimeout(() => {
      window.location.href = '/profit-history.html';
    }, 260);
  });
}

if (profitClearBtn) {
  profitClearBtn.addEventListener('click', () => {
    clearProfitInput(true);
  });
}

if (headerHistoryBtn) {
  headerHistoryBtn.addEventListener('click', (e) => {
    if (profitMoveMode) {
      e.preventDefault();
      return;
    }
    window.location.href = '/profit-history.html';
  });
}

if (headerMoveModeBtn) {
  headerMoveModeBtn.addEventListener('click', async () => {
    if (profitMoveMode) {
      // Save current layout explicitly when exiting move mode.
      const payload = {
        sectionOrder: normalizeSectionOrder(profitSectionOrder),
        formRowOrder: getCurrentFormRowOrderFromDom(),
        resultRowOrder: getCurrentResultRowOrderFromDom()
      };
      try {
        await saveProfitUiPatch(payload);
        notify('位置変更を保存しました。', 'success');
      } catch {
        notify('位置変更の保存に失敗しました。', 'error');
        return;
      }
    }
    profitMoveMode = !profitMoveMode;
    renderProfitMoveMode();
  });
}

if (headerSettingsBtn) {
  headerSettingsBtn.addEventListener('click', (e) => {
    if (profitMoveMode) {
      e.preventDefault();
      return;
    }
    window.location.href = '/profit-settings.html';
  });
}

fetch('/api/icon-settings')
  .then((res) => res.json())
  .then((data) => {
    const icon = document.getElementById('pageIcon');
    if (icon) icon.src = data?.icons?.profit || '/assets/icons/profit.svg';
  })
  .catch(() => {});

bindRowDragEvents();
resetInputForm();
refresh();
renderProfitMoveMode();
