# EntryForm.html

```html
<!DOCTYPE html>
<html>
<head>
  <base target="_top">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    <?!= HtmlService.createHtmlOutputFromFile('style.css').getContent(); ?>
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
  <div id="entry-status" class="section" style="display:none;"></div>

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
      target.style.display = 'block';
      target.innerHTML = `<div class="note-text" style="color:#b00020;">初期化エラー: ${escapeHtml(msg)}</div>`;
    }
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
  const url = new URL(window.location.href);
  return String(url.searchParams.get(name) || '').trim();
}

function buildWebAppPageUrl_(page, params) {
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
}

function isPointAllocationMode_() {
  return pointInputMode !== 'individual';
}

function isExpenseAllocationMode_() {
  return expenseInputMode !== 'individual';
}

function getPointModeLabel_() {
  return isPointAllocationMode_() ? '按分モード' : '個別入力モード';
}

function getExpenseModeLabel_() {
  return isExpenseAllocationMode_() ? '按分モード' : '個別入力モード';
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
    expenseBtn.textContent = '経費：' + (isExpenseAllocationMode_() ? '按分' : '個別');
    expenseBtn.classList.toggle('is-open', isIndividual);
    expenseBtn.setAttribute('aria-pressed', isIndividual ? 'true' : 'false');
  }
  if (pointBtn) {
    const isIndividual = !isPointAllocationMode_();
    pointBtn.textContent = 'ポイント：' + (isPointAllocationMode_() ? '按分' : '個別');
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
  const nextLabel = nextMode === 'allocation' ? '按分' : '個別';
  const shouldSwitch = confirm('経費入力モードを「' + nextLabel + '」に切り替えますか？');
  if (!shouldSwitch) return;
  onExpenseModeChange(nextMode);
  applyDetailPanelVisibility_();
  updateTopHelperButtons_();
}

function handlePointToggleClick() {
  const nextMode = isPointAllocationMode_() ? 'individual' : 'allocation';
  const nextLabel = nextMode === 'allocation' ? '按分' : '個別';
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
  const pointLabel = isPointAllocationMode_() ? 'ポイント按分' : 'ポイント個別';
  const expenseLabel = isExpenseAllocationMode_() ? '経費按分' : '経費個別';
  const addEntryButtonRow = `
      <tr class="append-row">
        <td colspan="9" class="append-cell">
          <button type="button" class="btn-append-row" onclick="addEntryRow(${Math.max(0, entryRows.length - 1)})" aria-label="商品行を追加">＋ 行を追加</button>
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
          <button type="button" class="btn-append-row" onclick="addExpenseRow(${Math.max(0, expenseList.length - 1)})" aria-label="経費行を追加">＋ 行を追加</button>
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
            '<td><input type="text" id="common-date" class="inline-number" maxlength="10" inputmode="numeric" placeholder="例: 20250701" oninput="formatDateInput(this)"></td>' +
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
  let v = el.value.replace(/[^0-9]/g, '');
  if (v.length > 8) v = v.slice(0, 8);
  if (v.length === 8) {
    el.value = v.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
  } else {
    el.value = v;
  }
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
  const supplierInput = document.getElementById('common-supplier');
  const paymentInput = document.getElementById('common-payment');
  if (dateInput) dateInput.value = String(info.date || '').trim();
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

function showFinalConfirm() {
  try {
    recalculateCosts();

    const date = (document.getElementById('common-date').value || '').trim();
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
    const payload = {
      entries: payloadEntries,
      commonInfo: { date: date, supplier: supplier, payment: payment },
      expenses: payloadExpenses,
      pointMode: pointInputMode,
      expenseMode: expenseInputMode
    };

    google.script.run
      .withSuccessHandler(function(res) {
        const token = res && res.token ? String(res.token) : '';
        if (!token) {
          throw new Error('確認トークンの発行に失敗しました');
        }
        window.location.href = buildWebAppPageUrl_('entry_confirm', { token: token });
      })
      .withFailureHandler(showError)
      .saveEntryDraftForConfirm(payload);
  } catch (err) {
    showError(err);
  }
}

function showError(err) {
  const msg = err && err.message ? err.message : String(err);
  alert('エラー: ' + msg);
}
</script>
</body>
</html>

```
