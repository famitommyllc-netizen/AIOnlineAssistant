# EntryForm.html

```html
<!DOCTYPE html>
<html>
<head>
  <base target="_top">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <style>
    <?!= HtmlService.createHtmlOutputFromFile('style.css').getContent(); ?>
  </style>
  <style>
    /* EntryForm only: responsive tuning without touching logic */
    html,
    body {
      width: 100%;
      max-width: 100%;
      overflow-x: hidden;
      -webkit-text-size-adjust: 100%;
      text-size-adjust: 100%;
    }

    #entry-page,
    #confirm-page,
    #result-page {
      width: 100%;
      max-width: 100%;
      overflow-x: hidden;
    }

    #entry-page .section,
    #confirm-page .section,
    #result-page .section {
      box-sizing: border-box;
    }

    @media screen and (max-width: 768px), screen and (max-device-width: 768px) {
      #entry-page .section,
      #confirm-page .section,
      #result-page .section {
        margin: 10px 8px;
        padding: 12px 10px;
      }

      #entry-page .section-title,
      #confirm-page .section-title,
      #result-page .section-title {
        font-size: clamp(1.42rem, 5vw, 1.76rem);
        margin-bottom: 0.42em;
      }

      #entry-page .mid-title,
      #confirm-page .mid-title,
      #result-page .mid-title {
        font-size: clamp(1.14rem, 4.3vw, 1.35rem);
        margin-bottom: 0.38em;
      }

      #entry-page .section-header-row {
        flex-direction: column;
        align-items: stretch;
        gap: 0.46em;
      }

      #entry-page .header-toggle-bar {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.44em;
        width: 100%;
      }

      #entry-page .header-toggle-btn {
        min-width: 0;
        min-height: 50px;
        padding: 0.52em 0.5em;
        font-size: 16px;
        white-space: normal;
        line-height: 1.2;
      }

      #entry-page .entry-line-card,
      #entry-page .section-card,
      #confirm-page .confirm-block,
      #result-page .confirm-block {
        padding: 0.68em;
        margin-top: 0.5em;
      }

      #entry-page .inline-scroll,
      #entry-page .summary-table-wrap,
      #confirm-page .table-wrap,
      #confirm-page .summary-table-wrap,
      #result-page .table-wrap,
      #result-page .summary-table-wrap {
        width: 100%;
        max-width: 100%;
        overflow-x: auto;
        overflow-y: hidden;
        -webkit-overflow-scrolling: touch;
      }

      /* Wide tables: scroll only in table area, not whole page */
      #entry-page .entry-inline-table {
        min-width: 1040px;
        font-size: 0.96em;
      }

      #entry-page .entry-inline-table .col-item {
        min-width: 290px;
      }

      #entry-page .entry-inline-table .col-num {
        width: 106px;
      }

      #entry-page .entry-inline-table .col-action {
        width: 168px;
      }

      #entry-page .summary-table {
        min-width: 620px;
        table-layout: auto;
      }

      #entry-page .summary-table.summary-form-table {
        min-width: 660px;
      }

      #confirm-page table,
      #result-page table {
        min-width: 760px;
      }

      #entry-page .summary-table th,
      #entry-page .summary-table td,
      #confirm-page .summary-table th,
      #confirm-page .summary-table td,
      #result-page .summary-table th,
      #result-page .summary-table td {
        font-size: 0.94em;
        padding: 0.66em 0.6em;
      }

      #entry-page .inline-input,
      #entry-page .inline-number,
      #entry-page input[type="text"],
      #entry-page input[type="date"],
      #entry-page select,
      #confirm-page .inline-input,
      #confirm-page .inline-number,
      #result-page .inline-input,
      #result-page .inline-number {
        min-height: 50px;
        font-size: 16px;
        padding: 0.58em 0.66em;
      }

      #entry-page .inline-value,
      #confirm-page .inline-value,
      #result-page .inline-value {
        min-height: 50px;
        font-size: 16px;
        padding: 0.56em 0.62em;
      }

      #entry-page .btn-main,
      #entry-page .btn-sub,
      #entry-page button,
      #confirm-page .btn-main,
      #confirm-page .btn-sub,
      #confirm-page button,
      #result-page .btn-main,
      #result-page .btn-sub,
      #result-page button {
        min-height: 50px;
        font-size: 16px;
        padding: 0.62em 0.86em;
      }

      #entry-page .btn-icon,
      #entry-page .btn-append-row {
        width: 56px;
        height: 56px;
        min-width: 56px;
        min-height: 56px;
        font-size: 1.34em;
      }

      #entry-page .entry-inline-table .append-cell {
        padding: 0.68em;
      }

      #entry-page .point-input-row {
        max-width: 100%;
        gap: 0.48em;
      }

      #entry-page .button-row,
      #confirm-page .button-row,
      #result-page .button-row {
        gap: 0.46em;
        margin-top: 0.46em;
      }

      #entry-page .button-row .btn-main,
      #entry-page .button-row .btn-sub,
      #entry-page .button-row button,
      #confirm-page .button-row .btn-main,
      #confirm-page .button-row .btn-sub,
      #confirm-page .button-row button,
      #result-page .button-row .btn-main,
      #result-page .button-row .btn-sub,
      #result-page .button-row button {
        width: 100%;
      }
    }

    @media screen and (max-width: 540px), screen and (max-device-width: 540px) {
      #entry-page .section,
      #confirm-page .section,
      #result-page .section {
        margin: 8px 6px;
        padding: 10px 8px;
      }

      #entry-page .header-toggle-bar {
        grid-template-columns: 1fr;
      }

      #entry-page .entry-inline-table {
        min-width: 1000px;
      }

      #entry-page .summary-table {
        min-width: 560px;
      }

      #entry-page .summary-table.summary-form-table {
        min-width: 620px;
      }
    }
  </style>
</head>
<body>
  <div id="entry-page">
    <div class="section">
      <div class="section-header-row">
        <h2 class="section-title">仕入入力</h2>
        <div class="header-toggle-bar">
          <button type="button" id="helper-expense-btn" class="header-toggle-btn" onclick="handleExpenseToggleClick()"></button>
          <button type="button" id="helper-point-btn" class="header-toggle-btn" onclick="handlePointToggleClick()"></button>
          <button type="button" id="helper-tax-btn" class="header-toggle-btn" onclick="handleTaxToggleClick()"></button>
        </div>
      </div>
      <datalist id="product-options"></datalist>
      <div id="entry-lines"></div>
    </div>

    <div id="expense-area" class="section"></div>
    <div id="point-area" class="section"></div>
    <div id="summary-area" class="section"></div>

    <div class="section">
      <h3 class="mid-title">共通項目</h3>
      <div id="common-info"></div>
    </div>
    <div class="section">
      <div class="button-row">
        <button type="button" class="btn-main" onclick="showFinalConfirm()">最終確認へ進む</button>
      </div>
    </div>
  </div>
  <div id="confirm-page" style="display:none;">
    <div class="section">
      <h2 class="section-title">仕入登録 最終確認</h2>
      <div class="note-text">内容を確認し、問題なければ登録してください。</div>
      <div id="confirm-area"></div>
      <div class="button-row">
        <button type="button" id="confirm-submit-btn" class="btn-main" onclick="submitEntries()">登録実行</button>
        <button type="button" class="btn-sub" onclick="hideFinalConfirm()">戻る</button>
        <span id="submit-status"></span>
      </div>
    </div>
  </div>
  <div id="result-page" style="display:none;">
    <div class="section">
      <h2 class="section-title">仕入登録 完了</h2>
      <div id="entry-status"></div>
      <div class="button-row">
        <button type="button" class="btn-main" onclick="startNewEntry()">新しく仕入入力する</button>
      </div>
    </div>
  </div>

  <script>
function uiEscapeHtml_(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function uiBuildOpButtons_(idx, opts) {
  var o = opts || {};
  if (!o.show) {
    return '<div class="inline-value">固定</div>';
  }

  var addLabel = uiEscapeHtml_(o.addLabel || '＋行追加');
  var removeLabel = uiEscapeHtml_(o.removeLabel || '−削除');
  var addFn = String(o.onAdd || '');
  var removeFn = String(o.onRemove || '');

  var addBtn = addFn
    ? '<button type="button" class="btn-main" onclick="' + addFn + '(' + idx + ')">' + addLabel + '</button>'
    : '';
  var removeBtn = removeFn
    ? '<button type="button" class="btn-sub" onclick="' + removeFn + '(' + idx + ')">' + removeLabel + '</button>'
    : '';

  return '<div class="inline-actions">' + addBtn + removeBtn + '</div>';
}

function uiBuildInputTable_(config) {
  var c = config || {};
  var title = c.title ? '<div class="entry-line-title">' + uiEscapeHtml_(c.title) + '</div>' : '';
  var toolbar = c.toolbarHtml ? '<div class="entry-card-toolbar">' + String(c.toolbarHtml) + '</div>' : '';
  var head = (title || toolbar) ? '<div class="entry-card-head">' + title + toolbar + '</div>' : '';
  var columns = Array.isArray(c.columns) ? c.columns : [];
  var includeOps = c.includeOps !== false;
  var bodyHtml = String(c.bodyHtml || '');
  var note = c.note ? '<div class="note-text" style="margin-top:0.45em;">' + uiEscapeHtml_(c.note) + '</div>' : '';

  var header = '<th class="col-no">No</th>';
  for (var i = 0; i < columns.length; i++) {
    var col = columns[i] || {};
    var cls = col.className ? ' ' + uiEscapeHtml_(col.className) : '';
    header += '<th class="' + cls.trim() + '">' + uiEscapeHtml_(col.label || '') + '</th>';
  }
  if (includeOps) {
    header += '<th class="col-action">操作</th>';
  }

  return '' +
    '<div class="entry-line-card unified-entry-card">' +
      head +
      '<div class="inline-scroll">' +
        '<table class="entry-inline-table unified-input-table">' +
          '<tr>' + header + '</tr>' +
          bodyHtml +
        '</table>' +
      '</div>' +
      note +
    '</div>';
}
  </script>
<script>
let entryRows = [];
let expenseList = [];
let pointTotal = 0;
let productCandidates = [];
let expenseCandidates = [];
let supplierCandidates = [];
let paymentCandidates = [];
let pendingPayload = null;
let postSubmitSlipData = null;
let pointInputMode = 'allocation';   // allocation | individual
let expenseInputMode = 'allocation'; // allocation | individual
let detailPanelState = {
  expense: true,
  point: true,
  tax: false
};

window.onload = function() {
  try {
    if (typeof uiBuildInputTable_ !== 'function') {
      throw new Error('共通UI関数が読み込まれていません');
    }

    entryRows = [createEmptyEntryRow()];
    expenseList = [createEmptyExpenseRow()];
    renderEntryRows();
    renderPointArea();
    renderExpenseArea();
    renderSummary();
    renderCommonInfo();
    loadProductCandidates();
    loadExpenseItems();
    loadSupplierPaymentOptions();
    initializeDetailPanels_();
    restoreDraftIfNeeded_();
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    const target = document.getElementById('entry-status');
    if (target) {
      target.innerHTML = `<div class="note-text" style="color:#b00020;">初期化エラー: ${escapeHtml(msg)}</div>`;
    }
    showResultPage_();
  }
};

function createEmptyEntryRow() {
  return {
    productInput: '',
    productNo: '',
    name: '',
    price: 0,
    qty: 1,
    point: 0,
    expenseAlloc: 0,
    baseCost: 0,
    cost: 0,
    unitPrice: 0
  };
}

function createEmptyExpenseRow() {
  return {
    name: '',
    amount: '',
    memo: ''
  };
}

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function roundYen(v) {
  return Math.round(toNumber(v));
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatWithComma_(value) {
  return String(Math.round(toNumber(value))).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatYen_(value) {
  return formatWithComma_(value) + '円';
}

function getQueryParam_(name) {
  try {
    const url = new URL(window.location.href);
    return String(url.searchParams.get(name) || '').trim();
  } catch (err) {
    const query = String(window.location.search || '').replace(/^\?/, '');
    if (!query) return '';
    const pairs = query.split('&');
    for (let i = 0; i < pairs.length; i++) {
      const parts = pairs[i].split('=');
      if (decodeURIComponent(parts[0] || '') !== String(name || '')) continue;
      return decodeURIComponent(parts[1] || '').trim();
    }
    return '';
  }
}

function buildWebAppPageUrl_(page, params) {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('page', String(page || 'entry'));
    const p = params || {};
    Object.keys(p).forEach(key => {
      if (p[key] === undefined || p[key] === null || String(p[key]).trim() === '') {
        url.searchParams.delete(key);
        return;
      }
      url.searchParams.set(key, String(p[key]));
    });
    return url.toString();
  } catch (err) {
    const p = params || {};
    const query = ['page=' + encodeURIComponent(String(page || 'entry'))];
    Object.keys(p).forEach(key => {
      if (p[key] === undefined || p[key] === null || String(p[key]).trim() === '') return;
      query.push(encodeURIComponent(key) + '=' + encodeURIComponent(String(p[key])));
    });
    return String(window.location.pathname || '') + '?' + query.join('&');
  }
}

function resolveWebAppPageUrl_(page, params, onSuccess, onFailure) {
  const fallback = buildWebAppPageUrl_(page, params);
  const canUseGasRun = (typeof google !== 'undefined') &&
    google &&
    google.script &&
    google.script.run &&
    typeof google.script.run.getWebAppPageUrl === 'function';
  if (!canUseGasRun) {
    if (fallback) {
      onSuccess(fallback);
      return;
    }
    const err = new Error('WebアプリURLを取得できませんでした。');
    if (typeof onFailure === 'function') {
      onFailure(err);
    } else {
      showError(err);
    }
    return;
  }

  google.script.run
    .withSuccessHandler(function(url) {
      const resolved = String(url || '').trim();
      if (resolved) {
        onSuccess(resolved);
        return;
      }
      if (fallback) {
        onSuccess(fallback);
        return;
      }
      const err = new Error('WebアプリURLを取得できませんでした。Webアプリとしてデプロイ済みか確認してください。');
      if (typeof onFailure === 'function') {
        onFailure(err);
      } else {
        showError(err);
      }
    })
    .withFailureHandler(function(err) {
      if (fallback) {
        onSuccess(fallback);
        return;
      }
      if (typeof onFailure === 'function') {
        onFailure(err);
      } else {
        showError(err);
      }
    })
    .getWebAppPageUrl(page, params || {});
}

function isEmbeddedFrame_() {
  try {
    return window.top !== window.self;
  } catch (err) {
    return true;
  }
}

function setEntryConfirmTokenOnWindow_(targetWindow, token) {
  const t = String(token || '').trim();
  if (!t || !targetWindow) return;
  try {
    targetWindow.name = 'erp_entry_confirm_token:' + t;
  } catch (err) {
    // no-op
  }
}

function ensureConfirmTokenInUrl_(rawUrl, token) {
  const base = String(rawUrl || '').trim();
  const safeToken = String(token || '').trim();
  if (!base || !safeToken) return base;
  try {
    const url = new URL(base);
    if (!String(url.searchParams.get('token') || '').trim()) {
      url.searchParams.set('token', safeToken);
    }
    return url.toString();
  } catch (err) {
    if (/[?&]token=/.test(base)) return base;
    const separator = base.indexOf('?') >= 0 ? '&' : '?';
    return base + separator + 'token=' + encodeURIComponent(safeToken);
  }
}

function isPointAllocationMode_() {
  return pointInputMode !== 'individual';
}

function isExpenseAllocationMode_() {
  return expenseInputMode !== 'individual';
}

function getPointModeLabel_() {
  return isPointAllocationMode_() ? '分配モード' : '個別入力モード';
}

function getExpenseModeLabel_() {
  return isExpenseAllocationMode_() ? '分配モード' : '個別入力モード';
}

function initializeDetailPanels_() {
  detailPanelState = {
    expense: true,
    point: true,
    tax: false
  };
  applyDetailPanelVisibility_();
  updateTopHelperButtons_();
}

function applyDetailPanelVisibility_() {
  const expenseEl = document.getElementById('expense-area');
  const pointEl = document.getElementById('point-area');
  if (expenseEl) expenseEl.style.display = 'block';
  if (pointEl) pointEl.style.display = 'block';
}

function updateTopHelperButtons_() {
  const expenseBtn = document.getElementById('helper-expense-btn');
  const pointBtn = document.getElementById('helper-point-btn');
  const taxBtn = document.getElementById('helper-tax-btn');

  if (expenseBtn) {
    const isIndividual = !isExpenseAllocationMode_();
    expenseBtn.textContent = '経費：' + (isExpenseAllocationMode_() ? '分配' : '個別');
    expenseBtn.classList.toggle('is-open', isIndividual);
    expenseBtn.setAttribute('aria-pressed', isIndividual ? 'true' : 'false');
  }
  if (pointBtn) {
    const isIndividual = !isPointAllocationMode_();
    pointBtn.textContent = 'ポイント：' + (isPointAllocationMode_() ? '分配' : '個別');
    pointBtn.classList.toggle('is-open', isIndividual);
    pointBtn.setAttribute('aria-pressed', isIndividual ? 'true' : 'false');
  }
  if (taxBtn) {
    taxBtn.textContent = '外税：' + (detailPanelState.tax ? 'ON' : 'OFF');
    taxBtn.classList.toggle('is-open', detailPanelState.tax);
    taxBtn.classList.toggle('is-on', detailPanelState.tax);
    taxBtn.setAttribute('aria-pressed', detailPanelState.tax ? 'true' : 'false');
  }
}

function handleExpenseToggleClick() {
  const nextMode = isExpenseAllocationMode_() ? 'individual' : 'allocation';
  const nextLabel = nextMode === 'allocation' ? '分配' : '個別';
  const shouldSwitch = confirm('経費入力モードを「' + nextLabel + '」に切り替えますか？');
  if (!shouldSwitch) return;
  onExpenseModeChange(nextMode);
  applyDetailPanelVisibility_();
  updateTopHelperButtons_();
}

function handlePointToggleClick() {
  const nextMode = isPointAllocationMode_() ? 'individual' : 'allocation';
  const nextLabel = nextMode === 'allocation' ? '分配' : '個別';
  const shouldSwitch = confirm('ポイント入力モードを「' + nextLabel + '」に切り替えますか？');
  if (!shouldSwitch) return;
  onPointModeChange(nextMode);
  applyDetailPanelVisibility_();
  updateTopHelperButtons_();
}

function handleTaxToggleClick() {
  if (!detailPanelState.tax) {
    const shouldApply = confirm('外税を適用しますか？');
    if (!shouldApply) return;
    const applied = applyTaxToAll_();
    if (!applied) return;
    detailPanelState.tax = true;
    updateTopHelperButtons_();
    return;
  }

  const shouldRemove = confirm('外税を解除しますか？');
  if (!shouldRemove) return;
  removeTaxFromAll_();
  detailPanelState.tax = false;
  updateTopHelperButtons_();
}

function loadProductCandidates() {
  google.script.run
    .withSuccessHandler(function(list) {
      productCandidates = Array.isArray(list) ? list : [];
      const dl = document.getElementById('product-options');
      if (dl) {
        dl.innerHTML = productCandidates
          .map(item => `<option value="${escapeHtml(item.label || '')}"></option>`)
          .join('');
      }
      renderEntryRows();
    })
    .withFailureHandler(showError)
    .getProductCandidates();
}

function resolveProductByInput(input) {
  const text = String(input || '').trim();
  if (!text) return null;

  for (let i = 0; i < productCandidates.length; i++) {
    const item = productCandidates[i];
    const label = String(item.label || '').trim();
    const no = String(item.productNo || '').trim();
    const jan = String(item.jan || '').trim();
    const name = String(item.name || '').trim();
    if (text === label || text === name || (no && text === no) || (jan && text === jan)) {
      return {
        productNo: no,
        name: name,
        label: label || name,
        isKnown: true
      };
    }
  }

  const split = text.split('：');
  if (split.length >= 2) {
    const tokenPart = split[0].trim();
    const namePart = split.slice(1).join('：').trim();
    for (let j = 0; j < productCandidates.length; j++) {
      const item2 = productCandidates[j];
      const itemNo = String(item2.productNo || '').trim();
      const itemJan = String(item2.jan || '').trim();
      if ((itemNo === tokenPart || itemJan === tokenPart) && String(item2.name || '').trim() === namePart) {
        return {
          productNo: itemNo,
          name: namePart,
          label: String(item2.label || text),
          isKnown: true
        };
      }
    }
  }

  return {
    productNo: '',
    name: text,
    label: text,
    isKnown: false
  };
}

function onProductInput(idx, value) {
  const row = entryRows[idx];
  if (!row) return;

  row.productInput = String(value || '').trim();
  const matched = resolveProductByInput(row.productInput);
  if (!matched) {
    row.productNo = '';
    row.name = '';
  } else {
    row.productNo = matched.productNo;
    row.name = matched.name;
  }
  recalculateCosts();
}

function cacheProductInput(idx, value) {
  const row = entryRows[idx];
  if (!row) return;
  row.productInput = String(value || '');
}

function onPriceInput(idx, value) {
  const row = entryRows[idx];
  if (!row) return;
  row.price = Math.max(0, roundYen(value));
  recalculateCosts();
}

function cachePriceInput(idx, value) {
  const row = entryRows[idx];
  if (!row) return;
  row.price = String(value || '');
}

function onQtyInput(idx, value) {
  const row = entryRows[idx];
  if (!row) return;
  row.qty = Math.max(1, roundYen(value || 1));
  recalculateCosts();
}

function cacheQtyInput(idx, value) {
  const row = entryRows[idx];
  if (!row) return;
  row.qty = String(value || '');
}

function cachePointInput(idx, value) {
  const row = entryRows[idx];
  if (!row) return;
  row.point = String(value || '');
}

function onPointInput(idx, value) {
  const row = entryRows[idx];
  if (!row) return;
  row.point = Math.max(0, roundYen(value));
  recalculateCosts();
}

function cacheExpenseAllocInput(idx, value) {
  const row = entryRows[idx];
  if (!row) return;
  row.expenseAlloc = String(value || '');
}

function onExpenseAllocInput(idx, value) {
  const row = entryRows[idx];
  if (!row) return;
  row.expenseAlloc = Math.max(0, roundYen(value));
  recalculateCosts();
}

function addEntryRow(afterIdx) {
  const pos = Math.max(0, Math.min(afterIdx + 1, entryRows.length));
  entryRows.splice(pos, 0, createEmptyEntryRow());
  renderEntryRows();
  recalculateCosts();
}

function removeEntryRow(idx) {
  if (entryRows.length <= 1) {
    entryRows[0] = createEmptyEntryRow();
  } else {
    entryRows.splice(idx, 1);
  }
  renderEntryRows();
  recalculateCosts();
}

function renderEntryRows() {
  const pointLabel = isPointAllocationMode_() ? 'ポイント分配' : 'ポイント個別';
  const expenseLabel = isExpenseAllocationMode_() ? '経費分配' : '経費個別';
  const addEntryButtonRow = `
      <tr class="append-row">
        <td colspan="9" class="append-cell">
          <button type="button" class="btn-append-row" onclick="addEntryRow(${Math.max(0, entryRows.length - 1)})" aria-label="商品行を追加">＋</button>
        </td>
      </tr>
  `;
  let rowsHtml = '';
  entryRows.forEach((row, idx) => {
    const pointCell = isPointAllocationMode_()
      ? `<div class="inline-value">${row.point || 0}</div>`
      : `<input type="text" class="inline-number" inputmode="numeric" pattern="\\d*" value="${row.point || ''}" oninput="cachePointInput(${idx}, this.value)" onblur="onPointInput(${idx}, this.value)" placeholder="個別入力">`;
    const expenseCell = isExpenseAllocationMode_()
      ? `<div class="inline-value">${row.expenseAlloc || 0}</div>`
      : `<input type="text" class="inline-number" inputmode="numeric" pattern="\\d*" value="${row.expenseAlloc || ''}" oninput="cacheExpenseAllocInput(${idx}, this.value)" onblur="onExpenseAllocInput(${idx}, this.value)" placeholder="個別入力">`;

    rowsHtml += `
      <tr>
        <td class="col-no">${idx + 1}</td>
        <td class="col-item">
          <input type="text" class="inline-input" list="product-options" value="${escapeHtml(row.productInput || '')}" oninput="cacheProductInput(${idx}, this.value)" onblur="onProductInput(${idx}, this.value)" placeholder="JAN / 商品名 / 商品マスタ番号">
        </td>
        <td class="col-num">
          <input type="text" class="inline-number" inputmode="numeric" pattern="\\d*" value="${row.price || ''}" oninput="cachePriceInput(${idx}, this.value)" onblur="onPriceInput(${idx}, this.value)">
        </td>
        <td class="col-num">
          <input type="text" class="inline-number" inputmode="numeric" pattern="\\d*" value="${row.qty || 1}" oninput="cacheQtyInput(${idx}, this.value)" onblur="onQtyInput(${idx}, this.value)">
        </td>
        <td class="col-num">${pointCell}</td>
        <td class="col-num">${expenseCell}</td>
        <td class="col-num"><div class="inline-value">${row.cost || 0}</div></td>
        <td class="col-num"><div class="inline-value">${row.unitPrice || 0}</div></td>
        <td class="col-action">
          <div class="inline-actions">
            <button type="button" class="btn-icon btn-icon-minus" onclick="removeEntryRow(${idx})" aria-label="この行を削除">−</button>
          </div>
        </td>
      </tr>
    `;
  });

  document.getElementById('entry-lines').innerHTML = `
    <h3 class="mid-title">商品入力</h3>
    <div class="entry-line-card section-card">
      <div class="inline-scroll">
        <table class="entry-inline-table">
          <tr>
            <th class="col-no">No</th>
            <th class="col-item">商品</th>
            <th class="col-num">提示金額</th>
            <th class="col-num">個数</th>
            <th class="col-num">${pointLabel}</th>
            <th class="col-num">${expenseLabel}</th>
            <th class="col-num">原価</th>
            <th class="col-num">単価</th>
            <th class="col-action">削除</th>
          </tr>
          ${rowsHtml}
          ${addEntryButtonRow}
        </table>
      </div>
    </div>
  `;
}

function getActiveEntryRows() {
  const active = [];
  for (let i = 0; i < entryRows.length; i++) {
    const row = entryRows[i];
    const hasAnyInput = !!String(row.productInput || '').trim() || roundYen(row.price) > 0;
    if (!hasAnyInput) continue;

    if (!String(row.name || '').trim()) {
      throw new Error(`商品${i + 1} の商品名を入力してください`);
    }
    if (roundYen(row.price) <= 0) {
      throw new Error(`商品${i + 1} の提示金額を入力してください`);
    }
    if (roundYen(row.qty) <= 0) {
      throw new Error(`商品${i + 1} の個数を入力してください`);
    }

    active.push(row);
  }
  if (!active.length) {
    throw new Error('商品行が空です');
  }
  return active;
}

function getActiveExpenseRows_() {
  return expenseList.filter(ex => String(ex.name || '').trim() && roundYen(ex.amount) > 0);
}

function recalculateCosts() {
  const pointAllocation = isPointAllocationMode_();
  const expenseAllocation = isExpenseAllocationMode_();

  entryRows.forEach(row => {
    row.price = Math.max(0, roundYen(row.price));
    row.qty = Math.max(1, roundYen(row.qty || 1));
    if (pointAllocation) {
      row.point = 0;
    } else {
      row.point = Math.max(0, roundYen(row.point || 0));
    }
    if (expenseAllocation) {
      row.expenseAlloc = 0;
    } else {
      row.expenseAlloc = Math.max(0, roundYen(row.expenseAlloc || 0));
    }
    row.baseCost = row.price;
    row.cost = row.price;
    row.unitPrice = row.qty > 0 ? Math.round(row.price / row.qty) : row.price;
  });

  const targetRows = entryRows.filter(row => String(row.name || '').trim() && row.price > 0);
  if (!targetRows.length) {
    renderEntryRows();
    if (!pointAllocation) {
      renderPointArea();
    }
    renderSummary();
    return;
  }

  if (pointAllocation) {
    pointTotal = Math.max(0, roundYen(pointTotal || 0));
    const totalPrice = targetRows.reduce((sum, row) => sum + roundYen(row.price), 0);
    let remainPoint = pointTotal;

    targetRows.forEach((row, idx) => {
      let pointAlloc = 0;
      if (totalPrice > 0 && remainPoint > 0) {
        if (idx === targetRows.length - 1) {
          pointAlloc = remainPoint;
        } else {
          pointAlloc = Math.round(pointTotal * (row.price / totalPrice));
          pointAlloc = Math.min(pointAlloc, remainPoint);
        }
      }
      remainPoint -= pointAlloc;
      row.point = pointAlloc;
      row.baseCost = Math.max(0, row.price - pointAlloc);
    });
  } else {
    targetRows.forEach(row => {
      row.point = Math.max(0, roundYen(row.point || 0));
      row.baseCost = Math.max(0, row.price - row.point);
    });
    pointTotal = targetRows.reduce((sum, row) => sum + roundYen(row.point), 0);
  }

  const totalExpenseInput = getActiveExpenseRows_().reduce((sum, ex) => sum + roundYen(ex.amount), 0);
  if (expenseAllocation) {
    const totalBaseCost = targetRows.reduce((sum, row) => sum + roundYen(row.baseCost), 0);
    let remainExpense = totalExpenseInput;

    targetRows.forEach((row, idx) => {
      let alloc = 0;
      if (totalExpenseInput > 0 && totalBaseCost > 0) {
        if (idx === targetRows.length - 1) {
          alloc = remainExpense;
        } else {
          alloc = Math.round(totalExpenseInput * (row.baseCost / totalBaseCost));
          alloc = Math.min(alloc, remainExpense);
        }
      }
      remainExpense -= alloc;
      row.expenseAlloc = alloc;
      row.cost = Math.max(0, roundYen(row.baseCost) + alloc);
      row.unitPrice = row.qty > 0 ? Math.round(row.cost / row.qty) : row.cost;
    });
  } else {
    targetRows.forEach(row => {
      row.expenseAlloc = Math.max(0, roundYen(row.expenseAlloc || 0));
      row.cost = Math.max(0, roundYen(row.baseCost) + row.expenseAlloc);
      row.unitPrice = row.qty > 0 ? Math.round(row.cost / row.qty) : row.cost;
    });
  }

  renderEntryRows();
  if (!pointAllocation) {
    renderPointArea();
  }
  renderSummary();
}

function getTaxRate_() {
  const rateInput = document.getElementById('tax-rate');
  return toNumber((rateInput && rateInput.value) || '10') / 100;
}

function applyTaxToAll_() {
  const rate = getTaxRate_();
  const targets = entryRows.filter(row => String(row.name || '').trim() && roundYen(row.price) > 0);
  if (!targets.length) {
    alert('税加算対象の商品がありません');
    return false;
  }

  targets.forEach(row => {
    row.taxBasePrice = roundYen(row.price);
    row.price = Math.floor(row.taxBasePrice * (1 + rate));
  });
  recalculateCosts();
  return true;
}

function removeTaxFromAll_() {
  entryRows.forEach(row => {
    if (typeof row.taxBasePrice !== 'undefined') {
      row.price = roundYen(row.taxBasePrice);
      delete row.taxBasePrice;
    }
  });
  recalculateCosts();
}

function renderPointArea() {
  const pointTotalFromRows = entryRows.reduce((sum, row) => {
    if (!String(row.name || '').trim() || roundYen(row.price) <= 0) return sum;
    return sum + Math.max(0, roundYen(row.point || 0));
  }, 0);
  if (!isPointAllocationMode_()) {
    pointTotal = pointTotalFromRows;
  }

  let modeContent = '';
  if (isPointAllocationMode_()) {
    modeContent = `
      <div class="entry-line-card section-card">
        <div class="point-input-row">
          <input type="text" id="point-total" class="inline-number" inputmode="numeric" pattern="\\d*" value="${pointTotal || ''}" oninput="updatePointTotal()" aria-label="ポイント/割引入力">
          <span class="point-input-unit">pt / 円</span>
        </div>
      </div>
    `;
  } else {
    modeContent = `
      <div class="entry-line-card section-card">
        <div class="entry-line-title">ポイント個別入力</div>
        <div class="note-text">商品入力テーブルの「ポイント個別」列で入力してください。</div>
        <div class="note-text">現在のポイント合計: ${formatYen_(pointTotalFromRows)}</div>
      </div>
    `;
  }

  document.getElementById('point-area').innerHTML = `
    <h3 class="mid-title">ポイント/割引</h3>
    ${modeContent}
  `;
  applyDetailPanelVisibility_();
  updateTopHelperButtons_();
}

function updatePointTotal() {
  const input = document.getElementById('point-total');
  if (!input) return;
  pointTotal = Math.max(0, roundYen(input.value || 0));
  recalculateCosts();
}

function onPointModeChange(mode) {
  pointInputMode = String(mode || 'allocation') === 'individual' ? 'individual' : 'allocation';
  if (!isPointAllocationMode_()) {
    entryRows.forEach(function(row) {
      row.point = 0;
    });
  }
  if (isPointAllocationMode_()) {
    pointTotal = entryRows.reduce((sum, row) => {
      if (!String(row.name || '').trim() || roundYen(row.price) <= 0) return sum;
      return sum + Math.max(0, roundYen(row.point || 0));
    }, 0);
  }
  recalculateCosts();
  renderPointArea();
  updateTopHelperButtons_();
}

function renderExpenseArea() {
  if (!expenseList.length) {
    expenseList = [createEmptyExpenseRow()];
  }

  let options = '';
  expenseCandidates.forEach(name => {
    options += `<option value="${escapeHtml(name)}"></option>`;
  });

  let rows = '';
  expenseList.forEach((ex, idx) => {
    rows += `
      <tr>
        <td class="col-no">${idx + 1}</td>
        <td class="col-item"><input type="text" class="inline-input" list="expense-items" autocomplete="off" value="${escapeHtml(ex.name || '')}" oninput="cacheExpenseField(${idx}, 'name', this.value)" onblur="recalculateCosts()"></td>
        <td class="col-num"><input type="text" class="inline-number" inputmode="numeric" pattern="\\d*" value="${escapeHtml(ex.amount || '')}" oninput="cacheExpenseField(${idx}, 'amount', this.value)" onblur="onExpenseAmountBlur(${idx}, this.value)"></td>
        <td class="col-item"><input type="text" class="inline-input" value="${escapeHtml(ex.memo || '')}" oninput="cacheExpenseField(${idx}, 'memo', this.value)"></td>
        <td class="col-action"><div class="inline-actions"><button type="button" class="btn-icon btn-icon-minus" onclick="removeExpenseRow(${idx})" aria-label="この行を削除">−</button></div></td>
      </tr>
    `;
  });

  let modeContent = '';
  if (isExpenseAllocationMode_()) {
    const addExpenseButtonRow = `
      <tr class="append-row">
        <td colspan="5" class="append-cell">
          <button type="button" class="btn-append-row" onclick="addExpenseRow(${Math.max(0, expenseList.length - 1)})" aria-label="経費行を追加">＋</button>
        </td>
      </tr>
    `;
    modeContent =
      `<datalist id="expense-items">${options}</datalist>` +
      uiBuildInputTable_({
        columns: [
          { label: '内容', className: 'col-item' },
          { label: '金額', className: 'col-num' },
          { label: 'メモ', className: 'col-item' }
        ],
        includeOps: true,
        bodyHtml: rows + addExpenseButtonRow
      });
  } else {
    modeContent = `
      <div class="entry-line-card section-card">
        <div class="entry-line-title">経費個別入力</div>
        <div class="note-text">商品入力テーブルの「経費個別」列で入力してください。</div>
      </div>
    `;
  }

  document.getElementById('expense-area').innerHTML = `
    <h3 class="mid-title">経費</h3>
    ${modeContent}
  `;
  applyDetailPanelVisibility_();
  updateTopHelperButtons_();
}

function cacheExpenseField(idx, key, value) {
  const row = expenseList[idx];
  if (!row) return;
  row[key] = String(value || '');
}

function onExpenseAmountBlur(idx, value) {
  const row = expenseList[idx];
  if (!row) return;
  row.amount = Math.max(0, roundYen(value));
  recalculateCosts();
}

function addExpenseRow(afterIdx) {
  const pos = Math.max(0, Math.min(afterIdx + 1, expenseList.length));
  expenseList.splice(pos, 0, createEmptyExpenseRow());
  renderExpenseArea();
}

function removeExpenseRow(idx) {
  if (expenseList.length <= 1) {
    expenseList[0] = createEmptyExpenseRow();
  } else {
    expenseList.splice(idx, 1);
  }
  renderExpenseArea();
  recalculateCosts();
}

function onExpenseModeChange(mode) {
  expenseInputMode = String(mode || 'allocation') === 'individual' ? 'individual' : 'allocation';
  if (!isExpenseAllocationMode_()) {
    entryRows.forEach(function(row) {
      row.expenseAlloc = 0;
    });
  }
  recalculateCosts();
  renderExpenseArea();
  updateTopHelperButtons_();
}

function loadExpenseItems() {
  google.script.run
    .withSuccessHandler(function(list) {
      expenseCandidates = (list || []).slice();
      renderExpenseArea();
    })
    .withFailureHandler(showError)
    .getExpenseItems();
}

function renderSummary() {
  let totalCount = 0;
  let totalPrice = 0;
  let totalPoint = 0;
  let totalExpenseAlloc = 0;
  let totalCost = 0;
  let totalExpenseInput = 0;

  entryRows.forEach(row => {
    if (!String(row.name || '').trim() || roundYen(row.price) <= 0) return;
    totalCount += roundYen(row.qty);
    totalPrice += roundYen(row.price);
    totalPoint += roundYen(row.point);
    totalExpenseAlloc += roundYen(row.expenseAlloc);
    totalCost += roundYen(row.cost);
  });

  getActiveExpenseRows_().forEach(ex => {
    totalExpenseInput += roundYen(ex.amount);
  });

  const summaryExpenseTotal = isExpenseAllocationMode_() ? totalExpenseInput : totalExpenseAlloc;

  document.getElementById('summary-area').innerHTML = `
    <h3 class="mid-title">集計</h3>
    <div class="summary-table-wrap">
      <table class="summary-table">
        <thead>
          <tr>
            <th>商品数</th>
            <th>総提示金額</th>
            <th>ポイント合計</th>
            <th>経費合計</th>
            <th>原価合計</th>
          </tr>
        </thead>
        <tbody>
          <tr class="summary-value-row">
            <td class="count-cell">${formatWithComma_(totalCount)}</td>
            <td>${formatYen_(totalPrice)}</td>
            <td>${formatYen_(totalPoint)}</td>
            <td>${formatYen_(summaryExpenseTotal)}</td>
            <td class="is-emphasis">${formatYen_(Math.max(0, totalCost))}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

function renderCommonInfo() {
  document.getElementById('common-info').innerHTML =
    '<datalist id="supplier-options"></datalist>' +
    '<datalist id="payment-options"></datalist>' +
    '<div class="summary-table-wrap">' +
      '<table class="summary-table summary-form-table">' +
        '<thead>' +
          '<tr>' +
            '<th>仕入日</th>' +
            '<th>仕入先</th>' +
            '<th>支払方法</th>' +
          '</tr>' +
        '</thead>' +
        '<tbody>' +
          '<tr class="summary-input-row">' +
            '<td>' +
              '<div class="date-input-wrap">' +
                '<input type="hidden" id="common-date">' +
                '<input type="date" id="common-date-picker" class="date-picker-hidden" oninput="onDatePickerChange(\'common-date\', \'common-date-picker\')" onchange="onDatePickerChange(\'common-date\', \'common-date-picker\')">' +
              '</div>' +
            '</td>' +
            '<td><input type="text" id="common-supplier" class="inline-input" list="supplier-options" autocomplete="off" placeholder="仕入先を入力"></td>' +
            '<td><input type="text" id="common-payment" class="inline-input" list="payment-options" autocomplete="off" placeholder="支払い方法を入力"></td>' +
          '</tr>' +
        '</tbody>' +
      '</table>' +
    '</div>';
}

function loadSupplierPaymentOptions() {
  google.script.run
    .withSuccessHandler(function(list) {
      supplierCandidates = list || [];
      const dl = document.getElementById('supplier-options');
      if (dl) {
        dl.innerHTML = supplierCandidates.map(v => `<option value="${escapeHtml(v)}"></option>`).join('');
      }
    })
    .withFailureHandler(showError)
    .getSupplierList();

  google.script.run
    .withSuccessHandler(function(list) {
      paymentCandidates = list || [];
      const dl = document.getElementById('payment-options');
      if (dl) {
        dl.innerHTML = paymentCandidates.map(v => `<option value="${escapeHtml(v)}"></option>`).join('');
      }
    })
    .withFailureHandler(showError)
    .getPaymentList();
}

function formatDateInput(el) {
  if (!el) return;
  el.value = normalizeDateDigits_(el.value);
}

function normalizeDateDigits_(value) {
  let v = String(value || '').replace(/[^0-9]/g, '');
  if (v.length > 8) v = v.slice(0, 8);
  return v;
}

function digitsToIsoDate_(value) {
  const v = normalizeDateDigits_(value);
  if (v.length !== 8) return '';
  return v.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
}

function isoDateToDigits_(value) {
  return normalizeDateDigits_(value);
}

function onDateTextInput(targetId, pickerId, value) {
  const target = document.getElementById(targetId);
  if (!target) return;
  target.value = normalizeDateDigits_(value);
  syncDatePickerFromText_(targetId, pickerId);
}

function syncDatePickerFromText_(targetId, pickerId) {
  const target = document.getElementById(targetId);
  const picker = document.getElementById(pickerId);
  if (!target || !picker) return;
  picker.value = digitsToIsoDate_(target.value);
}

function openDatePickerFromText(targetId, pickerId) {
  const picker = document.getElementById(pickerId);
  if (!picker) return;
  syncDatePickerFromText_(targetId, pickerId);
  let opened = false;
  try {
    picker.focus({ preventScroll: true });
  } catch (err) {
    try {
      picker.focus();
    } catch (err2) {
      // no-op
    }
  }
  if (typeof picker.showPicker === 'function') {
    try {
      picker.showPicker();
      opened = true;
      return;
    } catch (err3) {
      // showPicker非対応/制限時はclickにフォールバック
    }
  }
  try {
    picker.click();
    opened = true;
  } catch (err4) {
    // no-op
  }
  if (!opened) {
    alert('カレンダーを開けませんでした。日付欄（YYYY-MM-DD）を直接タップして選択してください。');
  }
}

function onDatePickerChange(targetId, pickerId) {
  const target = document.getElementById(targetId);
  const picker = document.getElementById(pickerId);
  if (!target || !picker) return;
  target.value = isoDateToDigits_(picker.value);
}

function restoreDraftIfNeeded_() {
  const token = getQueryParam_('token');
  if (!token) return;

  google.script.run
    .withSuccessHandler(function(payload) {
      applyDraftPayload_(payload);
    })
    .withFailureHandler(showError)
    .getEntryDraftForConfirm(token);
}

function applyDraftPayload_(payload) {
  const p = payload || {};
  const entries = Array.isArray(p.entries) ? p.entries : [];
  const expenses = Array.isArray(p.expenses) ? p.expenses : [];
  const info = p.commonInfo || {};

  pointInputMode = String(p.pointMode || 'allocation') === 'individual' ? 'individual' : 'allocation';
  expenseInputMode = String(p.expenseMode || 'allocation') === 'individual' ? 'individual' : 'allocation';

  entryRows = entries.map(function(item) {
    const productNo = String(item[0] || '').trim();
    const name = String(item[1] || '').trim();
    const price = roundYen(item[2]);
    const point = roundYen(item[3]);
    const cost = roundYen(item[4]);
    const qty = Math.max(1, roundYen(item[5] || 1));
    const unitPrice = roundYen(item[6]);
    const expenseAlloc = roundYen(item[7]);
    return {
      productInput: productNo && name ? productNo + '：' + name : (name || productNo),
      productNo: productNo,
      name: name,
      price: price,
      qty: qty,
      point: point,
      expenseAlloc: expenseAlloc,
      baseCost: Math.max(0, price - point),
      cost: cost,
      unitPrice: unitPrice
    };
  });
  if (!entryRows.length) {
    entryRows = [createEmptyEntryRow()];
  }

  expenseList = expenses.map(function(ex) {
    return {
      name: String(ex.name || '').trim(),
      amount: roundYen(ex.amount),
      memo: String(ex.memo || '').trim()
    };
  });
  if (!expenseList.length) {
    expenseList = [createEmptyExpenseRow()];
  }

  pointTotal = entryRows.reduce(function(sum, row) {
    if (!String(row.name || '').trim() || roundYen(row.price) <= 0) return sum;
    return sum + Math.max(0, roundYen(row.point || 0));
  }, 0);

  recalculateCosts();
  renderExpenseArea();
  renderPointArea();
  renderSummary();
  renderCommonInfo();

  const dateInput = document.getElementById('common-date');
  const datePicker = document.getElementById('common-date-picker');
  const supplierInput = document.getElementById('common-supplier');
  const paymentInput = document.getElementById('common-payment');
  if (dateInput) dateInput.value = normalizeDateDigits_(String(info.date || '').trim());
  if (dateInput && datePicker) syncDatePickerFromText_('common-date', 'common-date-picker');
  if (supplierInput) supplierInput.value = String(info.supplier || '').trim();
  if (paymentInput) paymentInput.value = String(info.payment || '').trim();

  updateTopHelperButtons_();
}

function buildEntryPayload(rows) {
  return rows.map(row => [
    String(row.productNo || '').trim(),
    String(row.name || '').trim(),
    roundYen(row.price),
    roundYen(row.point),
    roundYen(row.cost),
    Math.max(1, roundYen(row.qty)),
    roundYen(row.unitPrice),
    roundYen(row.expenseAlloc)
  ]);
}

function showEntryPage_() {
  const entryPage = document.getElementById('entry-page');
  const confirmPage = document.getElementById('confirm-page');
  const resultPage = document.getElementById('result-page');
  if (entryPage) entryPage.style.display = 'block';
  if (confirmPage) confirmPage.style.display = 'none';
  if (resultPage) resultPage.style.display = 'none';
}

function showConfirmPage_() {
  const entryPage = document.getElementById('entry-page');
  const confirmPage = document.getElementById('confirm-page');
  const resultPage = document.getElementById('result-page');
  if (entryPage) entryPage.style.display = 'none';
  if (confirmPage) confirmPage.style.display = 'block';
  if (resultPage) resultPage.style.display = 'none';
}

function showResultPage_() {
  const entryPage = document.getElementById('entry-page');
  const confirmPage = document.getElementById('confirm-page');
  const resultPage = document.getElementById('result-page');
  if (entryPage) entryPage.style.display = 'none';
  if (confirmPage) confirmPage.style.display = 'none';
  if (resultPage) resultPage.style.display = 'block';
}

function showFinalConfirm() {
  try {
    recalculateCosts();

    const date = normalizeDateDigits_(String((document.getElementById('common-date') && document.getElementById('common-date').value) || '').trim());
    const supplier = (document.getElementById('common-supplier').value || '').trim();
    const payment = (document.getElementById('common-payment').value || '').trim();

    if (!date || !supplier || !payment) {
      alert('共通項目（仕入日/仕入先/支払い方法）を入力してください');
      return;
    }

    const activeRows = getActiveEntryRows();
    const payloadEntries = buildEntryPayload(activeRows);
    const payloadExpenses = (isExpenseAllocationMode_() ? getActiveExpenseRows_() : []).map(ex => ({
      name: String(ex.name || '').trim(),
      amount: roundYen(ex.amount),
      memo: String(ex.memo || '').trim()
    }));
    pendingPayload = {
      entries: payloadEntries,
      commonInfo: { date: date, supplier: supplier, payment: payment },
      expenses: payloadExpenses,
      pointMode: pointInputMode,
      expenseMode: expenseInputMode
    };

    renderFinalConfirm_(activeRows, payloadExpenses, pendingPayload.commonInfo, pendingPayload.pointMode, pendingPayload.expenseMode);
    showConfirmPage_();
    window.scrollTo(0, 0);
  } catch (err) {
    showError(err);
  }
}

function renderFinalConfirm_(rows, expenses, commonInfo, pointMode, expenseMode) {
  const activeRows = Array.isArray(rows) ? rows : [];
  const expenseRowsData = Array.isArray(expenses) ? expenses : [];
  const info = commonInfo || {};

  let detailRows = '';
  activeRows.forEach(function(row, idx) {
    detailRows += '<tr>' +
      '<td>' + (idx + 1) + '</td>' +
      '<td>' + escapeHtml(String(row.productNo || '').trim()) + '</td>' +
      '<td>' + escapeHtml(String(row.name || '').trim()) + '</td>' +
      '<td>' + formatYen_(roundYen(row.price)) + '</td>' +
      '<td>' + formatYen_(roundYen(row.point)) + '</td>' +
      '<td>' + formatYen_(roundYen(row.expenseAlloc)) + '</td>' +
      '<td>' + formatYen_(roundYen(row.cost)) + '</td>' +
      '<td>' + formatWithComma_(roundYen(row.qty)) + '</td>' +
      '<td>' + formatYen_(roundYen(row.unitPrice)) + '</td>' +
    '</tr>';
  });

  let expenseRows = '';
  expenseRowsData.forEach(function(ex, idx) {
    expenseRows += '<tr>' +
      '<td>' + (idx + 1) + '</td>' +
      '<td>' + escapeHtml(String(ex.name || '').trim()) + '</td>' +
      '<td>' + formatYen_(roundYen(ex.amount)) + '</td>' +
      '<td>' + escapeHtml(String(ex.memo || '').trim()) + '</td>' +
    '</tr>';
  });

  const totalQty = activeRows.reduce((sum, row) => sum + roundYen(row.qty), 0);
  const totalPrice = activeRows.reduce((sum, row) => sum + roundYen(row.price), 0);
  const totalPoint = activeRows.reduce((sum, row) => sum + roundYen(row.point), 0);
  const totalExpAlloc = activeRows.reduce((sum, row) => sum + roundYen(row.expenseAlloc), 0);
  const totalCost = activeRows.reduce((sum, row) => sum + roundYen(row.cost), 0);
  const totalExpenseInput = expenseRowsData.reduce((sum, ex) => sum + roundYen(ex.amount), 0);
  const expenseTotal = String(expenseMode || 'allocation') === 'individual' ? totalExpAlloc : totalExpenseInput;
  const hasExpenseRows = expenseRowsData.length > 0;

  let pointExpenseBlock = '';
  if (hasExpenseRows) {
    pointExpenseBlock =
      '<div class="confirm-block section-card slip-block slip-block-expense">' +
        '<div class="confirm-title">経費</div>' +
        '<div class="table-wrap">' +
          '<table>' +
            '<tr><th>No</th><th>内容</th><th>金額</th><th>メモ</th></tr>' +
            expenseRows +
          '</table>' +
        '</div>' +
      '</div>';
  }

  document.getElementById('confirm-area').innerHTML =
    '<div class="confirm-block section-card">' +
      '<div class="confirm-title">商品明細</div>' +
      '<div class="table-wrap">' +
        '<table>' +
          '<tr><th>No</th><th>商品マスタ番号</th><th>商品名</th><th>提示金額</th><th>ポイント/割引</th><th>経費</th><th>原価</th><th>個数</th><th>単価</th></tr>' +
          detailRows +
        '</table>' +
      '</div>' +
    '</div>' +
    pointExpenseBlock +

    '<div class="confirm-block section-card">' +
      '<div class="confirm-title">集計</div>' +
      '<div class="summary-table-wrap">' +
        '<table class="summary-table">' +
          '<thead><tr><th>商品数</th><th>総提示金額</th><th>ポイント合計</th><th>経費合計</th><th>原価合計</th></tr></thead>' +
          '<tbody><tr class="summary-value-row">' +
            '<td class="count-cell">' + formatWithComma_(totalQty) + '</td>' +
            '<td>' + formatYen_(totalPrice) + '</td>' +
            '<td>' + formatYen_(totalPoint) + '</td>' +
            '<td>' + formatYen_(expenseTotal) + '</td>' +
            '<td class="is-emphasis">' + formatYen_(totalCost) + '</td>' +
          '</tr></tbody>' +
        '</table>' +
      '</div>' +
    '</div>' +

    '<div class="confirm-block section-card">' +
      '<div class="confirm-title">共通情報</div>' +
      '<div class="summary-table-wrap">' +
        '<table class="summary-table summary-meta-table">' +
          '<thead><tr><th>仕入日</th><th>仕入先</th><th>支払い方法</th></tr></thead>' +
          '<tbody><tr class="summary-text-row">' +
            '<td>' + escapeHtml(String(info.date || '').trim()) + '</td>' +
            '<td>' + escapeHtml(String(info.supplier || '').trim()) + '</td>' +
            '<td>' + escapeHtml(String(info.payment || '').trim()) + '</td>' +
          '</tr></tbody>' +
        '</table>' +
      '</div>' +
    '</div>';
}

function hideFinalConfirm() {
  showEntryPage_();
  window.scrollTo(0, 0);
}

function submitEntries() {
  if (!pendingPayload) {
    alert('最終確認を先に実行してください');
    return;
  }

  const submitBtn = document.getElementById('confirm-submit-btn');
  const statusEl = document.getElementById('submit-status');
  if (submitBtn) submitBtn.disabled = true;
  if (statusEl) statusEl.textContent = '登録中...';

  google.script.run
    .withSuccessHandler(function(res) {
      const result = (typeof res === 'string') ? { message: res } : (res || {});

      if (submitBtn) submitBtn.disabled = false;
      if (statusEl) statusEl.textContent = '';

      pendingPayload = null;
      entryRows = [createEmptyEntryRow()];
      expenseList = [createEmptyExpenseRow()];
      pointTotal = 0;
      detailPanelState.tax = false;

      renderEntryRows();
      renderExpenseArea();
      renderPointArea();
      renderSummary();
      renderCommonInfo();
      loadSupplierPaymentOptions();
      loadProductCandidates();
      loadExpenseItems();
      renderPostSubmitSlipPreview_(result);
    })
    .withFailureHandler(function(err) {
      if (submitBtn) submitBtn.disabled = false;
      if (statusEl) statusEl.textContent = '';
      showError(err);
    })
    .registerEntries(pendingPayload.entries, pendingPayload.commonInfo, pendingPayload.expenses);
}

function renderPostSubmitSlipPreview_(result) {
  const data = result || {};
  const statusBox = document.getElementById('entry-status');
  if (!statusBox) return;

  postSubmitSlipData = data && data.slipData ? data.slipData : null;
  statusBox.innerHTML = buildPostSubmitSlipPreviewHtml_(data);
  showResultPage_();
  window.scrollTo(0, 0);
}

function startNewEntry() {
  postSubmitSlipData = null;
  const statusBox = document.getElementById('entry-status');
  if (statusBox) {
    statusBox.innerHTML = '';
  }
  showEntryPage_();
  window.scrollTo(0, 0);
}

function buildPostSubmitSlipPreviewHtml_(result) {
  const data = result || {};
  const slip = data.slipData || {};
  const lines = Array.isArray(slip.lines) ? slip.lines : [];
  const expenses = Array.isArray(slip.expenses) ? slip.expenses : [];
  const totals = slip.totals || {};
  const message = escapeHtml(String(data.message || '仕入登録が完了しました'));

  if (!lines.length) {
    return '<div class="result-success">' + message + '</div>';
  }

  const lineRows = lines.map(function(line) {
    return '<tr>' +
      '<td>' + escapeHtml(String(line.lineNo || '')) + '</td>' +
      '<td>' + escapeHtml(String(line.productNo || '')) + '</td>' +
      '<td>' + escapeHtml(String(line.name || '')) + '</td>' +
      '<td>' + formatYen_(line.price || 0) + '</td>' +
      '<td>' + formatYen_(line.point || 0) + '</td>' +
      '<td>' + formatYen_(line.expenseAlloc || 0) + '</td>' +
      '<td>' + formatYen_(line.cost || 0) + '</td>' +
      '<td>' + formatWithComma_(line.qty || 0) + '</td>' +
      '<td>' + formatYen_(line.unitPrice || 0) + '</td>' +
    '</tr>';
  }).join('');

  const pointTotal = roundYen(totals.point || 0);
  const expenseAllocTotal = roundYen(totals.expenseAlloc || 0);
  const expenseInputTotal = roundYen(totals.expenseInputTotal || 0);
  const expenseTotal = Math.max(expenseInputTotal, expenseAllocTotal);
  const hasExpenseRows = expenses.length > 0;

  let pointExpenseBlock = '';
  if (hasExpenseRows) {
    let expenseRows = '';
    expenseRows = expenses.map(function(ex) {
      return '<tr>' +
        '<td>' + escapeHtml(String(ex.lineNo || '')) + '</td>' +
        '<td>' + escapeHtml(String(ex.name || '')) + '</td>' +
        '<td>' + formatYen_(ex.amount || 0) + '</td>' +
        '<td>' + escapeHtml(String(ex.memo || '')) + '</td>' +
      '</tr>';
    }).join('');

    pointExpenseBlock =
      '<div class="confirm-block section-card">' +
        '<div class="confirm-title">経費</div>' +
        '<div class="table-wrap">' +
          '<table>' +
            '<tr><th>No</th><th>内容</th><th>金額</th><th>メモ</th></tr>' +
            expenseRows +
          '</table>' +
        '</div>' +
      '</div>';
  }

  let pdfStatusHtml = '';
  if (data.pdf && data.pdf.success === false) {
    pdfStatusHtml = '<div class="note-text" style="color:#b00020;">伝票PDF保存に失敗: ' + escapeHtml(String(data.pdf.error || '')) + '</div>';
  } else if (data.pdf && data.pdf.success) {
    pdfStatusHtml = '<div class="note-text">伝票PDF保存: 完了</div>';
  }

  return '' +
    '<div class="confirm-block section-card"><div class="result-success">' + message + '</div>' + pdfStatusHtml + '</div>' +
    '<div class="confirm-block section-card slip-block slip-block-summary">' +
      '<div class="confirm-title">仕入伝票プレビュー</div>' +
      '<div class="note-text">内容を確認し、印刷するか選択してください。</div>' +
    '</div>' +
    '<div class="confirm-block section-card slip-block slip-block-common">' +
      '<div class="confirm-title">共通情報</div>' +
      '<div class="summary-table-wrap">' +
        '<table class="summary-table summary-meta-table">' +
          '<thead><tr><th>伝票番号</th><th>仕入日</th><th>仕入先</th><th>支払い方法</th></tr></thead>' +
          '<tbody><tr class="summary-text-row">' +
            '<td>' + escapeHtml(String(slip.slipNo || '')) + '</td>' +
            '<td>' + escapeHtml(String(slip.purchaseDate || '')) + '</td>' +
            '<td>' + escapeHtml(String(slip.supplier || '')) + '</td>' +
            '<td>' + escapeHtml(String(slip.payment || '')) + '</td>' +
          '</tr></tbody>' +
        '</table>' +
      '</div>' +
    '</div>' +
    '<div class="confirm-block section-card slip-block slip-block-detail">' +
      '<div class="confirm-title">商品明細</div>' +
      '<div class="table-wrap">' +
        '<table>' +
          '<tr><th>No</th><th>商品マスタ番号</th><th>商品名</th><th>提示金額</th><th>ポイント/割引</th><th>経費</th><th>原価</th><th>個数</th><th>単価</th></tr>' +
          lineRows +
        '</table>' +
      '</div>' +
    '</div>' +
    pointExpenseBlock +
    '<div class="confirm-block section-card slip-block slip-block-summary">' +
      '<div class="confirm-title">集計</div>' +
      '<div class="summary-table-wrap">' +
        '<table class="summary-table">' +
          '<thead><tr><th>商品数</th><th>総提示金額</th><th>ポイント合計</th><th>経費合計</th><th>原価合計</th></tr></thead>' +
          '<tbody><tr class="summary-value-row">' +
            '<td class="count-cell">' + formatWithComma_(totals.qty || 0) + '</td>' +
            '<td>' + formatYen_(totals.price || 0) + '</td>' +
            '<td>' + formatYen_(pointTotal) + '</td>' +
            '<td>' + formatYen_(expenseTotal) + '</td>' +
            '<td class="is-emphasis">' + formatYen_(totals.cost || 0) + '</td>' +
          '</tr></tbody>' +
        '</table>' +
      '</div>' +
    '</div>' +
    '<div class="confirm-block section-card">' +
      '<div class="confirm-title">印刷確認</div>' +
      '<div class="note-text">仕入伝票を印刷しますか？</div>' +
      '<div class="button-row" id="post-submit-print-controls">' +
        '<button type="button" class="btn-main" onclick="handlePostSubmitPrintDecision_(true)">印刷する</button>' +
        '<button type="button" class="btn-sub" onclick="handlePostSubmitPrintDecision_(false)">印刷しない</button>' +
      '</div>' +
      '<div id="post-submit-print-status" class="note-text"></div>' +
    '</div>';
}

function handlePostSubmitPrintDecision_(shouldPrint) {
  const statusEl = document.getElementById('post-submit-print-status');
  const controlsEl = document.getElementById('post-submit-print-controls');
  if (!shouldPrint) {
    if (statusEl) statusEl.textContent = '印刷せずに終了しました。';
    if (controlsEl) controlsEl.style.display = 'none';
    return;
  }

  if (!postSubmitSlipData) {
    if (statusEl) statusEl.textContent = '印刷対象の伝票データがありません。';
    return;
  }

  if (statusEl) statusEl.textContent = '印刷ダイアログを開いています...';
  if (controlsEl) controlsEl.style.display = 'none';

  document.body.classList.add('print-slip-mode');
  window.setTimeout(function() {
    try {
      window.print();
      if (statusEl) statusEl.textContent = '印刷ダイアログを表示しました。';
    } catch (err) {
      if (statusEl) statusEl.textContent = '印刷ダイアログを表示できませんでした。';
      if (controlsEl) controlsEl.style.display = 'flex';
    } finally {
      document.body.classList.remove('print-slip-mode');
    }
  }, 40);
}

function printSlipFromData_(data) {
  const slip = data || {};
  const lines = Array.isArray(slip.lines) ? slip.lines : [];
  if (!lines.length) return false;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return false;
  printWindow.document.open();
  printWindow.document.write(buildSlipPrintHtml_(slip));
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  return true;
}

function buildSlipPrintHtml_(data) {
  const lines = Array.isArray(data.lines) ? data.lines : [];
  const expenseLines = Array.isArray(data.expenses) ? data.expenses : [];
  const totals = data.totals || {};
  const pointTotal = roundYen(totals.point || 0);
  const expenseAllocTotal = roundYen(totals.expenseAlloc || 0);
  const expenseInputTotal = roundYen(totals.expenseInputTotal || 0);
  const expenseTotal = Math.max(expenseInputTotal, expenseAllocTotal);
  const totalPrice = roundYen(totals.price || 0);
  const totalCost = roundYen(totals.cost || 0);
  const totalQty = roundYen(totals.qty || 0);

  const lineRows = lines.map(function(line, idx) {
    const rowClass = (idx % 2 === 1) ? ' class="row-alt"' : '';
    return '<tr' + rowClass + '>' +
      '<td class="center cell-weak">' + escapeHtml(String(line.lineNo || '')) + '</td>' +
      '<td class="cell-weak">' + escapeHtml(String(line.inventoryId || '')) + '</td>' +
      '<td class="cell-weak">' + escapeHtml(String(line.productNo || '')) + '</td>' +
      '<td class="cell-name">' + escapeHtml(String(line.name || '')) + '</td>' +
      '<td class="num cell-mid">' + formatYen_(line.price || 0) + '</td>' +
      '<td class="num cell-weak">' + formatYen_(line.point || 0) + '</td>' +
      '<td class="num cell-weak">' + formatYen_(line.expenseAlloc || 0) + '</td>' +
      '<td class="num cell-cost">' + formatYen_(line.cost || 0) + '</td>' +
      '<td class="center cell-mid">' + formatWithComma_(line.qty || 0) + '</td>' +
      '<td class="num cell-mid">' + formatYen_(line.unitPrice || 0) + '</td>' +
    '</tr>';
  }).join('');

  const expenseRows = expenseLines.length
    ? expenseLines.map(function(ex, idx) {
        const rowClass = (idx % 2 === 1) ? ' class="row-alt"' : '';
        return '<tr' + rowClass + '>' +
          '<td class="center cell-weak">' + escapeHtml(String(ex.lineNo || '')) + '</td>' +
          '<td class="cell-mid">' + escapeHtml(String(ex.name || '')) + '</td>' +
          '<td class="num cell-mid">' + formatYen_(ex.amount || 0) + '</td>' +
          '<td class="cell-weak">' + escapeHtml(String(ex.memo || '')) + '</td>' +
        '</tr>';
      }).join('')
    : '<tr><td colspan="4" class="expense-empty">なし</td></tr>';

  return '' +
    '<!DOCTYPE html>' +
    '<html><head><meta charset="UTF-8"><title>仕入伝票</title>' +
    '<style>' +
      '@page{size:A4 portrait;margin:7mm;}' +
      'html,body{margin:0;padding:0;}' +
      'body{font-family:Arial,\"Hiragino Kaku Gothic ProN\",Meiryo,sans-serif;color:#111827;background:#fff;font-size:10.5px;line-height:1.28;-webkit-print-color-adjust:exact;print-color-adjust:exact;}' +
      '*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact;}' +
      '.slip-root{display:flex;flex-direction:column;gap:5px;}' +
      '.section{border:1.2px solid #9ca3af;border-radius:5px;padding:6px 8px;margin:0;page-break-inside:avoid;break-inside:avoid;}' +
      '.section-head{font-size:12px;font-weight:800;letter-spacing:0.02em;color:#0f172a;margin:0 0 4px 0;padding:0 0 3px 0;border-bottom:1px solid #cfd5dc;}' +
      '.title-row{display:flex;align-items:flex-end;justify-content:space-between;gap:8px;}' +
      '.title-main{font-size:20px;font-weight:900;letter-spacing:0.03em;line-height:1;}' +
      '.title-sub{font-size:10px;color:#4b5563;white-space:nowrap;}' +
      '.common-inline{display:flex;flex-wrap:wrap;gap:6px 8px;}' +
      '.kv{display:inline-flex;align-items:center;gap:4px;border:1px solid #d2d7de;border-radius:4px;padding:3px 6px;background:#f8fafc;min-height:24px;}' +
      '.kv .k{font-size:9px;font-weight:700;color:#4b5563;white-space:nowrap;}' +
      '.kv .v{font-size:11px;font-weight:700;color:#111827;white-space:nowrap;}' +
      '.totals-main{border:1.5px solid #1f2937;background:#f3f4f6;padding:6px 8px;border-radius:5px;}' +
      '.totals-main-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;}' +
      '.total-block{border:1px solid #9ca3af;background:#fff;padding:5px 6px;border-radius:4px;}' +
      '.total-label{font-size:10px;font-weight:800;color:#374151;margin:0 0 2px 0;}' +
      '.total-value{font-size:22px;font-weight:900;line-height:1;letter-spacing:0.01em;color:#111827;}' +
      '.totals-sub{display:flex;gap:10px;flex-wrap:wrap;margin-top:5px;}' +
      '.totals-sub .mini{font-size:10px;font-weight:700;color:#374151;}' +
      '.totals-sub .mini b{font-size:12px;color:#111827;}' +
      'table{width:100%;border-collapse:collapse;table-layout:fixed;}' +
      'th,td{border:1px solid #b8c0ca;padding:4px 5px;vertical-align:middle;page-break-inside:avoid;break-inside:avoid;}' +
      'th{background:#e5e7eb;color:#111827;font-weight:800;font-size:9.5px;text-align:left;}' +
      'td{font-size:10px;color:#111827;}' +
      '.num{text-align:right;font-variant-numeric:tabular-nums;}' +
      '.center{text-align:center;}' +
      '.cell-name{font-weight:800;font-size:10.7px;}' +
      '.cell-mid{font-weight:700;}' +
      '.cell-weak{color:#6b7280;font-weight:600;}' +
      '.cell-cost{font-weight:800;}' +
      '.row-alt td{background:#fafafa;}' +
      '.expense-table th{background:#efefef;}' +
      '.expense-empty{text-align:center;color:#6b7280;font-weight:700;}' +
      '.w-no{width:5%;}.w-inv{width:11%;}.w-prod{width:10%;}.w-name{width:24%;}.w-price{width:9%;}.w-point{width:8%;}.w-exp{width:8%;}.w-cost{width:9%;}.w-qty{width:6%;}.w-unit{width:10%;}' +
      '.w-exp-no{width:8%;}.w-exp-name{width:42%;}.w-exp-amount{width:18%;}.w-exp-memo{width:32%;}' +
    '</style></head><body>' +
      '<div class="slip-root">' +
        '<div class="section">' +
          '<div class="title-row">' +
            '<div class="title-main">仕入伝票</div>' +
            '<div class="title-sub">判断用サマリー</div>' +
          '</div>' +
        '</div>' +

        '<div class="section">' +
          '<div class="section-head">共通情報</div>' +
          '<div class="common-inline">' +
            '<span class="kv"><span class="k">伝票番号</span><span class="v">' + escapeHtml(String(data.slipNo || '')) + '</span></span>' +
            '<span class="kv"><span class="k">仕入日</span><span class="v">' + escapeHtml(String(data.purchaseDate || '')) + '</span></span>' +
            '<span class="kv"><span class="k">仕入先</span><span class="v">' + escapeHtml(String(data.supplier || '')) + '</span></span>' +
            '<span class="kv"><span class="k">支払い方法</span><span class="v">' + escapeHtml(String(data.payment || '')) + '</span></span>' +
          '</div>' +
        '</div>' +

        '<div class="section totals-main">' +
          '<div class="section-head">集計（最重要）</div>' +
          '<div class="totals-main-grid">' +
            '<div class="total-block">' +
              '<div class="total-label">総提示金額</div>' +
              '<div class="total-value">' + formatYen_(totalPrice) + '</div>' +
            '</div>' +
            '<div class="total-block">' +
              '<div class="total-label">原価合計</div>' +
              '<div class="total-value">' + formatYen_(totalCost) + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="totals-sub">' +
            '<div class="mini">商品数 <b>' + formatWithComma_(totalQty) + '</b></div>' +
            '<div class="mini">ポイント合計 <b>' + formatYen_(pointTotal) + '</b></div>' +
            '<div class="mini">経費合計 <b>' + formatYen_(expenseTotal) + '</b></div>' +
          '</div>' +
        '</div>' +

        '<div class="section">' +
          '<div class="section-head">商品明細</div>' +
          '<table>' +
            '<colgroup>' +
              '<col class="w-no"><col class="w-inv"><col class="w-prod"><col class="w-name"><col class="w-price"><col class="w-point"><col class="w-exp"><col class="w-cost"><col class="w-qty"><col class="w-unit">' +
            '</colgroup>' +
            '<thead>' +
              '<tr><th>No</th><th>商品個別番号</th><th>商品マスタ番号</th><th>商品名</th><th>提示金額</th><th>ポイント</th><th>経費</th><th>原価</th><th>個数</th><th>単価</th></tr>' +
            '</thead>' +
            '<tbody>' + lineRows + '</tbody>' +
          '</table>' +
        '</div>' +

        '<div class="section">' +
          '<div class="section-head">経費明細</div>' +
          '<table class="expense-table">' +
            '<colgroup><col class="w-exp-no"><col class="w-exp-name"><col class="w-exp-amount"><col class="w-exp-memo"></colgroup>' +
            '<thead><tr><th>No</th><th>内容</th><th>金額</th><th>メモ</th></tr></thead>' +
            '<tbody>' + expenseRows + '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>' +
    '</body></html>';
}

function showError(err) {
  const msg = err && err.message ? err.message : String(err);
  alert('エラー: ' + msg);
}
</script>
</body>
</html>

```
