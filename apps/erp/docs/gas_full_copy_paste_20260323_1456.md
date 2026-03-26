# GAS Full Copy Paste (20260323_1456)

このファイルを開いて、各セクションをそのままGASプロジェクトへコピペしてください。

## EntryForm.html

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
      <h2 class="section-title">仕入入力</h2>
      <div class="note-text">最初の行から入力してください。入力中も各行を直接編集できます。商品は候補から選択、または新規名をそのまま入力できます。</div>
      <datalist id="product-options"></datalist>
      <div id="entry-lines"></div>
    </div>

    <div id="expense-area" class="section"></div>
    <div id="point-area" class="section"></div>
    <div class="section" id="tax-area">
      <h3 class="mid-title">税設定</h3>
      <div class="button-row" id="tax-open-row">
        <button type="button" class="btn-main" onclick="openTaxInput()">外税加算を使う</button>
      </div>
      <div id="tax-input-panel" style="display:none;">
        <div class="input-row">
          <div class="row-label">税率</div>
          <select id="tax-rate" class="input-select">
            <option value="10">10%</option>
            <option value="8">8%</option>
          </select>
        </div>
        <div class="button-row">
          <button type="button" class="btn-main" onclick="applyTaxToAll()">この税率で外税加算</button>
          <button type="button" class="btn-sub" onclick="closeTaxInput()">閉じる</button>
        </div>
      </div>
      <div class="note-text">登録済みの全商品行へ外税加算します。</div>
    </div>
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
        <button type="button" id="confirm-submit-btn" class="btn-main" onclick="submitEntries()">仕入登録</button>
        <button type="button" class="btn-sub" onclick="hideFinalConfirm()">戻って編集</button>
        <span id="submit-status"></span>
      </div>
    </div>
  </div>

  <div id="final-result" class="section"></div>

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
      title +
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
let lastRegisteredSlip = null;
let shouldAutoPrintAfterSubmit = false;
let pointInputMode = 'allocation';   // allocation | individual
let expenseInputMode = 'allocation'; // allocation | individual

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
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    const target = document.getElementById('final-result');
    if (target) {
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
    <div class="entry-line-card section-card">
      <div class="entry-line-title">商品入力（1行で入力）</div>
      <div class="list-toolbar">
        <button type="button" class="btn-icon btn-icon-plus" onclick="addEntryRow(${Math.max(0, entryRows.length - 1)})" aria-label="商品行を追加">＋</button>
      </div>
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

function applyTaxToAll() {
  const rate = toNumber(document.getElementById('tax-rate').value || '10') / 100;
  const targets = entryRows.filter(row => String(row.name || '').trim() && roundYen(row.price) > 0);
  if (!targets.length) {
    alert('税加算対象の商品がありません');
    return;
  }
  if (!confirm(`対象商品の提示金額に外税（${Math.round(rate * 100)}%）を加算します。よろしいですか？`)) {
    return;
  }

  targets.forEach(row => {
    row.price = Math.floor(roundYen(row.price) * (1 + rate));
  });
  recalculateCosts();
  closeTaxInput();
}

function openTaxInput() {
  const panel = document.getElementById('tax-input-panel');
  const openRow = document.getElementById('tax-open-row');
  if (panel) panel.style.display = 'block';
  if (openRow) openRow.style.display = 'none';
}

function closeTaxInput() {
  const panel = document.getElementById('tax-input-panel');
  const openRow = document.getElementById('tax-open-row');
  if (panel) panel.style.display = 'none';
  if (openRow) openRow.style.display = 'flex';
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
    modeContent = uiBuildInputTable_({
      title: 'ポイント/割引入力',
      columns: [
        { label: '項目名', className: 'col-item' },
        { label: '値', className: 'col-num' }
      ],
      includeOps: true,
      bodyHtml: `
        <tr>
          <td class="col-no">1</td>
          <td class="col-item"><div class="inline-value">ポイント/割引 合計</div></td>
          <td class="col-num"><input type="text" id="point-total" class="inline-number" inputmode="numeric" pattern="\\d*" value="${pointTotal || ''}" oninput="updatePointTotal()" placeholder="合計ポイント/割引"></td>
          <td class="col-action"><div class="inline-value">按分対象</div></td>
        </tr>
      `
    });
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
    <div class="mode-switch-wrap">
      <button type="button" class="mode-btn ${isPointAllocationMode_() ? 'active' : ''}" onclick="onPointModeChange('allocation')">按分モード</button>
      <button type="button" class="mode-btn ${!isPointAllocationMode_() ? 'active' : ''}" onclick="onPointModeChange('individual')">個別入力モード</button>
    </div>
    ${modeContent}
  `;
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
    modeContent =
      `<datalist id="expense-items">${options}</datalist>` +
      `<div class="list-toolbar">
        <button type="button" class="btn-icon btn-icon-plus" onclick="addExpenseRow(${Math.max(0, expenseList.length - 1)})" aria-label="経費行を追加">＋</button>
      </div>` +
      uiBuildInputTable_({
        title: '経費明細入力',
        columns: [
          { label: '内容', className: 'col-item' },
          { label: '金額', className: 'col-num' },
          { label: 'メモ', className: 'col-item' }
        ],
        includeOps: true,
        bodyHtml: rows
      }) +
      '<div class="note-text">経費明細の合計を商品原価割合で自動按分します。</div>';
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
    <div class="mode-switch-wrap">
      <button type="button" class="mode-btn ${isExpenseAllocationMode_() ? 'active' : ''}" onclick="onExpenseModeChange('allocation')">按分モード</button>
      <button type="button" class="mode-btn ${!isExpenseAllocationMode_() ? 'active' : ''}" onclick="onExpenseModeChange('individual')">個別入力モード</button>
    </div>
    ${modeContent}
  `;
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

  document.getElementById('summary-area').innerHTML = `
    <h3 class="mid-title">集計</h3>
    <div class="summary-grid">
      <div>商品数</div><div>${totalCount}</div>
      <div>総提示金額</div><div>${formatYen_(totalPrice)}</div>
      <div>ポイント合計</div><div>${formatYen_(totalPoint)}</div>
      <div>経費合計</div><div>${formatYen_(isExpenseAllocationMode_() ? totalExpenseInput : totalExpenseAlloc)}</div>
      <div>原価合計</div><div><strong>${formatYen_(Math.max(0, totalCost))}</strong></div>
    </div>
  `;
}

function renderCommonInfo() {
  const commonRows = `
    <tr>
      <td class="col-no">1</td>
      <td class="col-item"><div class="inline-value">仕入日</div></td>
      <td class="col-num"><input type="text" id="common-date" class="inline-number" maxlength="10" inputmode="numeric" placeholder="例: 20250701" oninput="formatDateInput(this)"></td>
      <td class="col-item"><div class="inline-value">仕入先</div></td>
      <td class="col-item"><input type="text" id="common-supplier" class="inline-input" list="supplier-options" autocomplete="off" placeholder="仕入先を入力"></td>
      <td class="col-item"><div class="inline-value">支払方法</div></td>
      <td class="col-item"><input type="text" id="common-payment" class="inline-input" list="payment-options" autocomplete="off" placeholder="支払い方法を入力"></td>
      <td class="col-action"><div class="inline-value">固定</div></td>
    </tr>
  `;

  document.getElementById('common-info').innerHTML =
    '<datalist id="supplier-options"></datalist>' +
    '<datalist id="payment-options"></datalist>' +
    uiBuildInputTable_({
      title: '共通項目（1行固定）',
      columns: [
        { label: '項目名', className: 'col-item' },
        { label: '値', className: 'col-num' },
        { label: '項目名', className: 'col-item' },
        { label: '値', className: 'col-item' },
        { label: '項目名', className: 'col-item' },
        { label: '値', className: 'col-item' }
      ],
      includeOps: true,
      bodyHtml: commonRows
    });
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

    pendingPayload = {
      entries: payloadEntries,
      commonInfo: { date: date, supplier: supplier, payment: payment },
      expenses: payloadExpenses,
      pointMode: pointInputMode,
      expenseMode: expenseInputMode
    };

    let productRows = '';
    activeRows.forEach((row, idx) => {
      productRows += `<tr>
        <td>${idx + 1}</td>
        <td>${escapeHtml(row.productNo || '')}</td>
        <td>${escapeHtml(row.name || '')}</td>
        <td>${formatYen_(roundYen(row.price))}</td>
        <td>${formatYen_(roundYen(row.point))}</td>
        <td>${formatYen_(roundYen(row.expenseAlloc))}</td>
        <td>${formatYen_(roundYen(row.cost))}</td>
        <td>${formatWithComma_(roundYen(row.qty))}</td>
        <td>${formatYen_(roundYen(row.unitPrice))}</td>
      </tr>`;
    });

    let expenseRows = '';
    if (!payloadExpenses.length) {
      expenseRows = '<tr><td colspan="4">なし</td></tr>';
    } else {
      payloadExpenses.forEach((ex, idx) => {
        expenseRows += `<tr><td>${idx + 1}</td><td>${escapeHtml(ex.name)}</td><td>${formatYen_(ex.amount)}</td><td>${escapeHtml(ex.memo)}</td></tr>`;
      });
    }

    const totalQty = activeRows.reduce((sum, row) => sum + roundYen(row.qty), 0);
    const totalPrice = activeRows.reduce((sum, row) => sum + roundYen(row.price), 0);
    const totalPoint = activeRows.reduce((sum, row) => sum + roundYen(row.point), 0);
    const totalExpAlloc = activeRows.reduce((sum, row) => sum + roundYen(row.expenseAlloc), 0);
    const totalCost = activeRows.reduce((sum, row) => sum + roundYen(row.cost), 0);
    const totalExpenseInput = payloadExpenses.reduce((sum, ex) => sum + roundYen(ex.amount), 0);

    document.getElementById('confirm-area').innerHTML = `
      <div class="confirm-block section-card">
        <div class="confirm-title">共通情報</div>
        <div class="confirm-kv-grid">
          <div class="kv-label">仕入日</div><div class="kv-value">${escapeHtml(date)}</div>
          <div class="kv-label">仕入先</div><div class="kv-value">${escapeHtml(supplier)}</div>
          <div class="kv-label">支払い方法</div><div class="kv-value">${escapeHtml(payment)}</div>
          <div class="kv-label">伝票印刷</div><div class="kv-value">登録時に選択</div>
        </div>
      </div>

      <div class="confirm-block section-card">
        <div class="confirm-title">商品明細</div>
        <div class="table-wrap">
          <table>
            <tr><th>No</th><th>商品マスタ番号</th><th>商品名</th><th>提示金額</th><th>ポイント</th><th>経費按分</th><th>原価</th><th>個数</th><th>単価</th></tr>
            ${productRows}
          </table>
        </div>
      </div>

      <div class="confirm-block section-card">
        <div class="confirm-title">経費・ポイント</div>
        <div class="summary-grid" style="margin-bottom:0.6em;">
          <div>ポイント入力方式</div><div>${escapeHtml(getPointModeLabel_())}</div>
          <div>経費入力方式</div><div>${escapeHtml(getExpenseModeLabel_())}</div>
        </div>
        <div class="table-wrap">
          <table>
            <tr><th>No</th><th>内容</th><th>金額</th><th>メモ</th></tr>
            ${expenseRows}
          </table>
        </div>
      </div>

      <div class="confirm-block section-card">
        <div class="confirm-title">集計</div>
        <div class="confirm-summary-grid">
          <div class="sum-item"><div class="sum-label">商品数</div><div class="sum-value">${formatWithComma_(totalQty)}</div></div>
          <div class="sum-item"><div class="sum-label">総提示金額</div><div class="sum-value">${formatYen_(totalPrice)}</div></div>
          <div class="sum-item"><div class="sum-label">ポイント合計</div><div class="sum-value">${formatYen_(totalPoint)}</div></div>
          <div class="sum-item"><div class="sum-label">経費合計</div><div class="sum-value">${formatYen_(isExpenseAllocationMode_() ? totalExpenseInput : totalExpAlloc)}</div></div>
          <div class="sum-item highlight"><div class="sum-label">原価合計</div><div class="sum-value">${formatYen_(totalCost)}</div></div>
        </div>
      </div>

      <div class="confirm-block section-card">
        <div class="confirm-title">印刷確認</div>
        <div class="mode-switch-wrap">
          <button type="button" class="mode-btn active" id="print-choice-yes" onclick="setPrintChoice(true)">印刷する</button>
          <button type="button" class="mode-btn" id="print-choice-no" onclick="setPrintChoice(false)">印刷しない</button>
        </div>
        <div class="note-text" id="print-choice-note">伝票とバーコードを登録後に印刷します。</div>
        <input type="hidden" id="confirm-print-now" value="1">
      </div>
    `;
    setPrintChoice(true);

    document.getElementById('entry-page').style.display = 'none';
    document.getElementById('confirm-page').style.display = 'block';
    window.scrollTo(0, 0);
  } catch (err) {
    showError(err);
  }
}

function hideFinalConfirm() {
  document.getElementById('confirm-page').style.display = 'none';
  document.getElementById('entry-page').style.display = 'block';
  window.scrollTo(0, 0);
}

function setPrintChoice(shouldPrint) {
  const flag = !!shouldPrint;
  const yesBtn = document.getElementById('print-choice-yes');
  const noBtn = document.getElementById('print-choice-no');
  const input = document.getElementById('confirm-print-now');
  const note = document.getElementById('print-choice-note');

  if (yesBtn) yesBtn.classList.toggle('active', flag);
  if (noBtn) noBtn.classList.toggle('active', !flag);
  if (input) input.value = flag ? '1' : '0';
  if (note) note.textContent = flag
    ? '伝票とバーコードを登録後に印刷します。'
    : '登録のみ実行し、印刷はあとで行います。';
}

function submitEntries() {
  if (!pendingPayload) {
    alert('最終確認を先に実行してください');
    return;
  }

  const submitBtn = document.getElementById('confirm-submit-btn');
  const status = document.getElementById('submit-status');
  const printFlagInput = document.getElementById('confirm-print-now');
  shouldAutoPrintAfterSubmit = printFlagInput ? String(printFlagInput.value || '1') === '1' : false;
  submitBtn.disabled = true;
  status.textContent = '登録中...';

  google.script.run
    .withSuccessHandler(function(res) {
      const result = (typeof res === 'string') ? { message: res } : (res || {});
      if (result.slipData) {
        lastRegisteredSlip = result.slipData;
      }

      let msgHtml = `<div class="result-success">${escapeHtml(result.message || '仕入登録が完了しました')}</div>`;
      if (result.pdf && result.pdf.success) {
        msgHtml += `<div class="note-text">PDF保存先: <a href="${escapeHtml(result.pdf.url)}" target="_blank">${escapeHtml(result.pdf.fileName)}</a></div>`;
      } else if (result.pdf && result.pdf.success === false) {
        msgHtml += `<div class="note-text" style="color:#b00020;">PDF保存に失敗: ${escapeHtml(result.pdf.error || '')}</div>`;
      }
      if (result.barcodePdf && result.barcodePdf.success) {
        msgHtml += `<div class="note-text">バーコードPDF保存先: <a href="${escapeHtml(result.barcodePdf.url)}" target="_blank">${escapeHtml(result.barcodePdf.fileName)}</a></div>`;
      } else if (result.barcodePdf && result.barcodePdf.success === false) {
        msgHtml += `<div class="note-text" style="color:#b00020;">バーコードPDF保存に失敗: ${escapeHtml(result.barcodePdf.error || '')}</div>`;
      }
      msgHtml += `
        <div class="button-row">
          <button type="button" class="btn-main" onclick="printLastSlip()">伝票を印刷</button>
          <button type="button" class="btn-main" onclick="printLastBarcodeLabels()">バーコードを印刷</button>
          ${(result.pdf && result.pdf.success) ? `<a class="btn-link" href="${escapeHtml(result.pdf.url)}" target="_blank">PDFを開く</a>` : ''}
          ${(result.barcodePdf && result.barcodePdf.success) ? `<a class="btn-link" href="${escapeHtml(result.barcodePdf.url)}" target="_blank">バーコードPDFを開く</a>` : ''}
        </div>
      `;
      document.getElementById('final-result').innerHTML = msgHtml;

      if (shouldAutoPrintAfterSubmit) {
        autoPrintSlipAndBarcode_();
      }

      entryRows = [createEmptyEntryRow()];
      expenseList = [createEmptyExpenseRow()];
      pointTotal = 0;
      pendingPayload = null;

      renderEntryRows();
      renderExpenseArea();
      renderPointArea();
      renderSummary();
      renderCommonInfo();
      loadSupplierPaymentOptions();
      loadProductCandidates();
      loadExpenseItems();

      hideFinalConfirm();
      submitBtn.disabled = false;
      status.textContent = '';
      shouldAutoPrintAfterSubmit = false;
    })
    .withFailureHandler(function(err) {
      submitBtn.disabled = false;
      status.textContent = '';
      shouldAutoPrintAfterSubmit = false;
      showError(err);
    })
    .registerEntries(pendingPayload.entries, pendingPayload.commonInfo, pendingPayload.expenses);
}

function autoPrintSlipAndBarcode_() {
  const slipOk = printLastSlip(true);
  const barcodeOk = printLastBarcodeLabels(true);
  if (!slipOk || !barcodeOk) {
    alert('自動印刷時にポップアップがブロックされました。画面下の印刷ボタンから実行してください。');
  }
}

function printLastSlip(silent) {
  if (!lastRegisteredSlip) {
    if (!silent) alert('印刷対象の伝票がありません');
    return false;
  }

  const w = window.open('', '_blank');
  if (!w) {
    if (!silent) alert('ポップアップを許可して再実行してください');
    return false;
  }
  w.document.open();
  w.document.write(buildSlipPrintHtml(lastRegisteredSlip));
  w.document.close();
  w.focus();
  w.print();
  return true;
}

function printLastBarcodeLabels(silent) {
  if (!lastRegisteredSlip || !lastRegisteredSlip.lines || !lastRegisteredSlip.lines.length) {
    if (!silent) alert('バーコード印刷対象がありません');
    return false;
  }

  const w = window.open('', '_blank');
  if (!w) {
    if (!silent) alert('ポップアップを許可して再実行してください');
    return false;
  }

  w.document.open();
  w.document.write(buildBarcodePrintHtml(lastRegisteredSlip));
  w.document.close();
  w.focus();
  w.print();
  return true;
}

function buildSlipPrintHtml(data) {
  const lineRows = (data.lines || []).map(line => `
    <tr>
      <td>${line.lineNo || ''}</td>
      <td>${escapeHtml(line.inventoryId || '')}</td>
      <td>${escapeHtml(line.productNo || '')}</td>
      <td>${escapeHtml(line.name || '')}</td>
      <td>${formatYen_(line.price || 0)}</td>
      <td>${formatYen_(line.point || 0)}</td>
      <td>${formatYen_(line.expenseAlloc || 0)}</td>
      <td>${formatYen_(line.cost || 0)}</td>
      <td>${formatWithComma_(line.qty || 0)}</td>
      <td>${formatYen_(line.unitPrice || 0)}</td>
    </tr>
  `).join('');

  const expenseRows = (data.expenses && data.expenses.length)
    ? data.expenses.map(ex => `<tr><td>${ex.lineNo || ''}</td><td>${escapeHtml(ex.name || '')}</td><td>${formatYen_(ex.amount || 0)}</td><td>${escapeHtml(ex.memo || '')}</td></tr>`).join('')
    : '<tr><td colspan="4">なし</td></tr>';

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>仕入伝票 ${escapeHtml(data.slipNo || '')}</title>
<style>
@page { size: A4 portrait; margin: 8mm; }
body { font-family: sans-serif; color: #111; margin: 0; font-size: 12px; }
.page-wrap { display: flex; gap: 8mm; width: 100%; }
.left-pane { width: 62%; }
.right-pane { width: 34%; }
h1 { margin: 0 0 6px 0; font-size: 20px; }
h2 { margin: 12px 0 6px 0; font-size: 15px; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 10px; margin-bottom: 8px; }
.info-item { border: 1px solid #777; padding: 4px 6px; border-radius: 4px; }
.info-key { font-size: 10px; color: #444; margin-bottom: 2px; }
.info-val { font-size: 12px; font-weight: 700; }
table { width: 100%; border-collapse: collapse; font-size: 11px; }
th, td { border: 1px solid #666; padding: 3px 4px; text-align: left; vertical-align: top; }
th { background: #efefef; }
.summary-row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }
.sum-box { border: 1px solid #777; border-radius: 4px; padding: 6px; }
.sum-key { font-size: 10px; color: #444; }
.sum-val { font-size: 14px; font-weight: 700; margin-top: 2px; }
.sum-box.highlight { border-color: #0f4c81; background: #eef5fc; }
.blank-zone { min-height: 250mm; }
</style>
</head>
<body>
  <div class="page-wrap">
    <div class="left-pane">
      <h1>仕入伝票</h1>
      <div class="info-grid">
        <div class="info-item"><div class="info-key">伝票番号</div><div class="info-val">${escapeHtml(data.slipNo || '')}</div></div>
        <div class="info-item"><div class="info-key">仕入日</div><div class="info-val">${escapeHtml(data.purchaseDate || '')}</div></div>
        <div class="info-item"><div class="info-key">仕入先</div><div class="info-val">${escapeHtml(data.supplier || '')}</div></div>
        <div class="info-item"><div class="info-key">支払い方法</div><div class="info-val">${escapeHtml(data.payment || '')}</div></div>
      </div>

      <h2>商品明細</h2>
      <table>
        <tr><th>No</th><th>商品個別番号</th><th>商品マスタ番号</th><th>商品名</th><th>提示金額</th><th>ポイント</th><th>経費</th><th>原価</th><th>個数</th><th>単価</th></tr>
        ${lineRows}
      </table>

      <h2>経費明細</h2>
      <table>
        <tr><th>No</th><th>内容</th><th>金額</th><th>メモ</th></tr>
        ${expenseRows}
      </table>

      <h2>集計</h2>
      <div class="summary-row">
        <div class="sum-box"><div class="sum-key">商品数</div><div class="sum-val">${formatWithComma_((data.totals && data.totals.qty) || 0)}</div></div>
        <div class="sum-box"><div class="sum-key">総提示金額</div><div class="sum-val">${formatYen_((data.totals && data.totals.price) || 0)}</div></div>
        <div class="sum-box"><div class="sum-key">ポイント合計</div><div class="sum-val">${formatYen_((data.totals && data.totals.point) || 0)}</div></div>
        <div class="sum-box"><div class="sum-key">経費入力合計</div><div class="sum-val">${formatYen_((data.totals && data.totals.expenseInputTotal) || 0)}</div></div>
        <div class="sum-box"><div class="sum-key">経費按分合計</div><div class="sum-val">${formatYen_((data.totals && data.totals.expenseAlloc) || 0)}</div></div>
        <div class="sum-box highlight"><div class="sum-key">原価合計</div><div class="sum-val">${formatYen_((data.totals && data.totals.cost) || 0)}</div></div>
      </div>
    </div>

    <div class="right-pane">
      <div class="blank-zone"></div>
    </div>
  </div>
</body>
</html>
  `;
}

function buildBarcodePrintHtml(data) {
  const labelRows = (data.lines || []).map(line => {
    const values = (Array.isArray(line.inventoryIds) && line.inventoryIds.length)
      ? line.inventoryIds
      : ((Array.isArray(line.barcodeValues) && line.barcodeValues.length) ? line.barcodeValues : [line.inventoryId || line.barcodeValue || '']);
    return values.map((code, idx) => `
      <div class="label-card">
        <div class="label-row"><span class="label-key">商品個別番号</span><span class="label-val">${escapeHtml(code || '')}</span></div>
        <div class="label-row"><span class="label-key">商品マスタ番号</span><span class="label-val">${escapeHtml(line.productNo || '')}</span></div>
        <div class="label-row"><span class="label-key">商品名</span><span class="label-val">${escapeHtml(line.name || '')}</span></div>
        ${(values.length > 1) ? `<div class="label-row"><span class="label-key">個体</span><span class="label-val">${idx + 1}/${values.length}</span></div>` : ''}
        <div class="barcode-text">${escapeHtml(code || '')}</div>
      </div>
    `).join('');
  }).join('');

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>バーコード印刷 ${escapeHtml(data.slipNo || '')}</title>
<style>
@page { size: A4 portrait; margin: 8mm; }
body { font-family: sans-serif; color: #111; margin: 0; font-size: 12px; }
h1 { margin: 0 0 8px 0; font-size: 18px; }
.meta { margin-bottom: 8px; }
.meta div { margin: 2px 0; }
.label-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.label-card { border: 1px solid #666; padding: 6px; min-height: 58mm; box-sizing: border-box; page-break-inside: avoid; }
.label-row { display: flex; gap: 6px; margin-bottom: 4px; }
.label-key { width: 68px; font-weight: 700; }
.label-val { flex: 1; }
.barcode-text { margin-top: 12px; font-size: 20px; font-weight: 700; letter-spacing: 1px; border: 1px dashed #999; padding: 8px; text-align: center; }
</style>
</head>
<body>
  <h1>バーコード印刷</h1>
  <div class="meta">
    <div>伝票番号: ${escapeHtml(data.slipNo || '')}</div>
    <div>仕入日: ${escapeHtml(data.purchaseDate || '')}</div>
    <div>仕入先: ${escapeHtml(data.supplier || '')}</div>
    <div>ID方式: ${escapeHtml(data.inventoryIdModeLabel || data.inventoryIdMode || '')}</div>
  </div>
  <div class="label-grid">
    ${labelRows}
  </div>
</body>
</html>
  `;
}

function showError(err) {
  const msg = err && err.message ? err.message : String(err);
  alert('エラー: ' + msg);
}
</script>
</body>
</html>
```

## ExpenseForm.html

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
  <div class="section">
    <h2 class="section-title">経費登録</h2>
    <div class="note-text">経費はテーブル行でまとめて入力できます。</div>
    <datalist id="expense-items"></datalist>
    <div id="expense-table-area"></div>
    <div class="button-row">
      <button type="button" class="btn-main" onclick="registerExpenseRows()">登録</button>
      <span id="exp-status"></span>
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
      title +
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
let expenseRows = [];
let expenseCandidates = [];

window.onload = function() {
  expenseRows = [createEmptyExpenseRow()];
  renderExpenseRows();
  loadExpenseItems();
};

function createEmptyExpenseRow() {
  return {
    date: '',
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

function formatDateValue(v) {
  let s = String(v || '').replace(/[^0-9]/g, '');
  if (s.length > 8) s = s.slice(0, 8);
  if (s.length === 8) {
    return s.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
  }
  return s;
}

function cacheExpenseField(idx, key, value) {
  const row = expenseRows[idx];
  if (!row) return;
  row[key] = String(value || '');
}

function onExpenseDateBlur(idx, value) {
  const row = expenseRows[idx];
  if (!row) return;
  row.date = formatDateValue(value);
  renderExpenseRows();
}

function onExpenseAmountBlur(idx, value) {
  const row = expenseRows[idx];
  if (!row) return;
  row.amount = Math.max(0, roundYen(value));
  renderExpenseRows();
}

function addExpenseRow(afterIdx) {
  const pos = Math.max(0, Math.min(afterIdx + 1, expenseRows.length));
  expenseRows.splice(pos, 0, createEmptyExpenseRow());
  renderExpenseRows();
}

function removeExpenseRow(idx) {
  if (expenseRows.length <= 1) {
    expenseRows[0] = createEmptyExpenseRow();
  } else {
    expenseRows.splice(idx, 1);
  }
  renderExpenseRows();
}

function loadExpenseItems() {
  google.script.run
    .withSuccessHandler(function(list) {
      expenseCandidates = Array.isArray(list) ? list : [];
      const dl = document.getElementById('expense-items');
      dl.innerHTML = expenseCandidates.map(function(item) {
        return '<option value="' + uiEscapeHtml_(item) + '"></option>';
      }).join('');
      renderExpenseRows();
    })
    .withFailureHandler(showError)
    .getExpenseItems();
}

function getActiveExpenseRows() {
  const active = [];
  for (let i = 0; i < expenseRows.length; i++) {
    const row = expenseRows[i];
    const hasInput = !!String(row.date || '').trim() || !!String(row.name || '').trim() || roundYen(row.amount) > 0 || !!String(row.memo || '').trim();
    if (!hasInput) continue;

    const date = formatDateValue(row.date);
    const name = String(row.name || '').trim();
    const amount = Math.max(0, roundYen(row.amount));
    const memo = String(row.memo || '').trim();

    if (!date || !name || !amount) {
      throw new Error('明細' + (i + 1) + ' の日付・内容・金額は必須です');
    }
    active.push({ date: date, name: name, amount: amount, memo: memo });
  }
  if (!active.length) {
    throw new Error('経費明細が空です');
  }
  return active;
}

function renderExpenseRows() {
  let rowsHtml = '';
  expenseRows.forEach(function(row, idx) {
    rowsHtml += '' +
      '<tr>' +
        '<td class="col-no">' + (idx + 1) + '</td>' +
        '<td class="col-num"><input type="text" class="inline-number" maxlength="10" inputmode="numeric" placeholder="20260322" value="' + uiEscapeHtml_(row.date || '') + '" oninput="cacheExpenseField(' + idx + ', \'date\', this.value)" onblur="onExpenseDateBlur(' + idx + ', this.value)"></td>' +
        '<td class="col-item"><input type="text" class="inline-input" list="expense-items" autocomplete="off" value="' + uiEscapeHtml_(row.name || '') + '" oninput="cacheExpenseField(' + idx + ', \'name\', this.value)"></td>' +
        '<td class="col-num"><input type="text" class="inline-number" inputmode="numeric" pattern="\\d*" value="' + uiEscapeHtml_(row.amount || '') + '" oninput="cacheExpenseField(' + idx + ', \'amount\', this.value)" onblur="onExpenseAmountBlur(' + idx + ', this.value)"></td>' +
        '<td class="col-item"><input type="text" class="inline-input" value="' + uiEscapeHtml_(row.memo || '') + '" oninput="cacheExpenseField(' + idx + ', \'memo\', this.value)"></td>' +
        '<td class="col-action">' + uiBuildOpButtons_(idx, { show: true, onAdd: 'addExpenseRow', onRemove: 'removeExpenseRow' }) + '</td>' +
      '</tr>';
  });

  document.getElementById('expense-table-area').innerHTML = uiBuildInputTable_({
    title: '経費明細入力（1行で入力）',
    columns: [
      { label: '日付', className: 'col-num' },
      { label: '内容', className: 'col-item' },
      { label: '金額', className: 'col-num' },
      { label: 'メモ', className: 'col-item' }
    ],
    includeOps: true,
    bodyHtml: rowsHtml
  });
}

function registerExpenseRows() {
  let payload = [];
  const status = document.getElementById('exp-status');
  try {
    payload = getActiveExpenseRows();
  } catch (e) {
    showError(e);
    return;
  }

  status.textContent = '登録中...';
  google.script.run
    .withSuccessHandler(function(res) {
      const msg = (res && res.message) ? res.message : '経費を登録しました';
      status.textContent = msg;
      expenseRows = [createEmptyExpenseRow()];
      renderExpenseRows();
      loadExpenseItems();
    })
    .withFailureHandler(function(err) {
      status.textContent = '';
      showError(err);
    })
    .registerExpensesBatch(payload);
}

function showError(err) {
  const msg = err && err.message ? err.message : String(err);
  alert('エラー: ' + msg);
}
  </script>
</body>
</html>
```

## ProductRegister.html

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
  <div class="section">
    <h2 class="section-title">商品新規登録</h2>
    <div class="note-text">商品登録も統一テーブルUIで入力します（1行固定）。</div>
    <div id="product-table-area"></div>
    <div class="button-row">
      <button type="button" class="btn-main" onclick="registerProduct()">登録</button>
      <span id="status"></span>
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
      title +
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
let productRow = {};

window.onload = function() {
  productRow = createEmptyProductRow();
  renderProductRow();
};

function createEmptyProductRow() {
  return {
    jan: '',
    name: '',
    category: '',
    maker: '',
    brand: '',
    sub: '',
    retailPrice: '',
    note: '',
    searchName: '',
    yomigana: '',
    assumedPrice: ''
  };
}

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function roundYen(v) {
  return Math.round(toNumber(v));
}

function getProductNo(jan) {
  if (jan && jan.length >= 4) return String(jan).slice(-4);
  return String(Math.floor(Math.random() * 9000) + 1000);
}

function cacheProductField(key, value) {
  productRow[key] = String(value || '');
}

function renderProductRow() {
  const rowHtml = '' +
    '<tr>' +
      '<td class="col-no">1</td>' +
      '<td class="col-num"><input type="text" class="inline-number" maxlength="13" value="' + uiEscapeHtml_(productRow.jan) + '" oninput="cacheProductField(\'jan\', this.value)"></td>' +
      '<td class="col-item"><input type="text" class="inline-input" value="' + uiEscapeHtml_(productRow.name) + '" oninput="cacheProductField(\'name\', this.value)"></td>' +
      '<td class="col-item"><input type="text" class="inline-input" value="' + uiEscapeHtml_(productRow.category) + '" oninput="cacheProductField(\'category\', this.value)"></td>' +
      '<td class="col-item"><input type="text" class="inline-input" value="' + uiEscapeHtml_(productRow.maker) + '" oninput="cacheProductField(\'maker\', this.value)"></td>' +
      '<td class="col-item"><input type="text" class="inline-input" value="' + uiEscapeHtml_(productRow.brand) + '" oninput="cacheProductField(\'brand\', this.value)"></td>' +
      '<td class="col-item"><input type="text" class="inline-input" value="' + uiEscapeHtml_(productRow.sub) + '" oninput="cacheProductField(\'sub\', this.value)"></td>' +
      '<td class="col-num"><input type="text" class="inline-number" inputmode="numeric" pattern="\\d*" value="' + uiEscapeHtml_(productRow.retailPrice) + '" oninput="cacheProductField(\'retailPrice\', this.value)"></td>' +
      '<td class="col-item"><input type="text" class="inline-input" value="' + uiEscapeHtml_(productRow.note) + '" oninput="cacheProductField(\'note\', this.value)"></td>' +
      '<td class="col-item"><input type="text" class="inline-input" value="' + uiEscapeHtml_(productRow.searchName) + '" oninput="cacheProductField(\'searchName\', this.value)"></td>' +
      '<td class="col-item"><input type="text" class="inline-input" value="' + uiEscapeHtml_(productRow.yomigana) + '" oninput="cacheProductField(\'yomigana\', this.value)"></td>' +
      '<td class="col-num"><input type="text" class="inline-number" inputmode="numeric" pattern="\\d*" value="' + uiEscapeHtml_(productRow.assumedPrice) + '" oninput="cacheProductField(\'assumedPrice\', this.value)"></td>' +
      '<td class="col-action"><div class="inline-value">1行固定</div></td>' +
    '</tr>';

  document.getElementById('product-table-area').innerHTML = uiBuildInputTable_({
    title: '商品入力（1行固定）',
    columns: [
      { label: 'JAN', className: 'col-num' },
      { label: '商品名*', className: 'col-item' },
      { label: 'カテゴリ', className: 'col-item' },
      { label: 'メーカー', className: 'col-item' },
      { label: 'ブランド', className: 'col-item' },
      { label: 'サブ', className: 'col-item' },
      { label: '希望小売価格', className: 'col-num' },
      { label: '備考', className: 'col-item' },
      { label: '検索名', className: 'col-item' },
      { label: '読み仮名', className: 'col-item' },
      { label: '想定売価', className: 'col-num' }
    ],
    includeOps: true,
    bodyHtml: rowHtml
  });
}

function registerProduct() {
  const jan = String(productRow.jan || '').trim();
  const name = String(productRow.name || '').trim();
  if (!name) {
    alert('商品名は必須です');
    return;
  }

  const info = {
    productNo: getProductNo(jan),
    jan: jan,
    name: name,
    category: String(productRow.category || '').trim(),
    maker: String(productRow.maker || '').trim(),
    brand: String(productRow.brand || '').trim(),
    sub: String(productRow.sub || '').trim(),
    retailPrice: roundYen(productRow.retailPrice || 0),
    note: String(productRow.note || '').trim(),
    searchName: String(productRow.searchName || '').trim(),
    yomigana: String(productRow.yomigana || '').trim(),
    assumedPrice: roundYen(productRow.assumedPrice || 0)
  };

  const status = document.getElementById('status');
  status.textContent = '登録中...';
  google.script.run
    .withSuccessHandler(function(res) {
      status.textContent = (res && res.msg ? res.msg : '商品情報を登録しました') + ' (' + (res && res.productNo ? res.productNo : '') + ')';
      productRow = createEmptyProductRow();
      renderProductRow();
    })
    .withFailureHandler(function(err) {
      status.textContent = '';
      const msg = err && err.message ? err.message : String(err);
      alert('エラー: ' + msg);
    })
    .registerNewProduct(info);
}
  </script>
</body>
</html>
```

## Report.html

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
  <div class="section">
    <h2 class="section-title">日次/月次レポート</h2>
    <div class="input-row">
      <div class="row-label">集計単位</div>
      <select id="period-type" class="input-main" onchange="onPeriodTypeChange()">
        <option value="day">日次</option>
        <option value="month">月次</option>
      </select>
    </div>
    <div class="input-row">
      <div class="row-label">対象期間</div>
      <input id="period-value" class="input-main" type="text" inputmode="numeric" placeholder="YYYY-MM-DD" oninput="formatPeriodInput(this)">
    </div>
    <div class="button-row">
      <button type="button" class="btn-main" onclick="loadReport()">集計する</button>
      <button type="button" class="btn-sub" onclick="printReport()">印刷</button>
      <button type="button" class="btn-sub" onclick="saveReportPdf()">PDF保存</button>
      <span id="action-status"></span>
    </div>
    <div class="note-text">PDFは指定フォルダに保存されます。</div>
  </div>

  <div id="report-summary" class="section"></div>
  <div id="report-purchases" class="section"></div>
  <div id="report-sales" class="section"></div>
  <div id="report-expenses" class="section"></div>

<script>
let currentReport = null;

window.onload = function() {
  setDefaultPeriodValue();
  loadReport();
};

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function onPeriodTypeChange() {
  setDefaultPeriodValue();
}

function setDefaultPeriodValue() {
  const type = document.getElementById('period-type').value;
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const input = document.getElementById('period-value');

  if (type === 'month') {
    input.placeholder = 'YYYY-MM';
    input.value = `${yyyy}-${mm}`;
  } else {
    input.placeholder = 'YYYY-MM-DD';
    input.value = `${yyyy}-${mm}-${dd}`;
  }
}

function formatPeriodInput(el) {
  const type = document.getElementById('period-type').value;
  let v = el.value.replace(/[^0-9]/g, '');

  if (type === 'month') {
    if (v.length > 6) v = v.slice(0, 6);
    if (v.length >= 4) {
      el.value = v.replace(/(\d{4})(\d{0,2})/, function(_, y, m) {
        return m ? `${y}-${m}` : y;
      });
    } else {
      el.value = v;
    }
    return;
  }

  if (v.length > 8) v = v.slice(0, 8);
  if (v.length === 8) {
    el.value = v.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
  } else {
    el.value = v;
  }
}

function loadReport() {
  const type = document.getElementById('period-type').value;
  const value = document.getElementById('period-value').value.trim();
  const status = document.getElementById('action-status');
  status.textContent = '集計中...';

  google.script.run
    .withSuccessHandler(function(report) {
      currentReport = report;
      renderSummary(report);
      renderPurchases(report.purchases || []);
      renderSales(report.sales || []);
      renderExpenses(report.expenses || []);
      status.textContent = '';
    })
    .withFailureHandler(function(err) {
      status.textContent = '';
      showError(err);
    })
    .getPeriodReport(type, value);
}

function renderSummary(report) {
  const s = report.summary || {};
  document.getElementById('report-summary').innerHTML = `
    <h3 class="mid-title">集計結果（${escapeHtml(report.period ? report.period.label : '')}）</h3>
    <div class="summary-grid">
      <div>仕入件数</div><div>${s.purchaseCount || 0}</div>
      <div>仕入個数合計</div><div>${s.purchaseQtyTotal || 0}</div>
      <div>仕入総提示金額</div><div>${s.purchasePriceTotal || 0}</div>
      <div>仕入総原価</div><div>${s.purchaseCostTotal || 0}</div>
      <div>売上件数</div><div>${s.salesCount || 0}</div>
      <div>売上総額</div><div>${s.salesAmountTotal || 0}</div>
      <div>売上総利益</div><div>${s.salesProfitTotal || 0}</div>
      <div>経費件数</div><div>${s.expenseCount || 0}</div>
      <div>経費総額</div><div>${s.expenseTotal || 0}</div>
      <div>営業利益</div><div>${s.operatingProfit || 0}</div>
      <div>利益率</div><div>${s.profitRate || 0}%</div>
      <div>減価率</div><div>${s.depreciationRate || 0}%</div>
      <div>経費率</div><div>${s.expenseRate || 0}%</div>
    </div>
    <div class="note-text">生成日時: ${escapeHtml(report.generatedAt || '')}</div>
  `;
}

function renderPurchases(rows) {
  let body = '';
  if (!rows.length) {
    body = '<tr><td colspan="11">データなし</td></tr>';
  } else {
    rows.forEach((r, idx) => {
      body += `<tr>
        <td>${idx + 1}</td>
        <td>${escapeHtml(r.inventoryId)}</td>
        <td>${escapeHtml(r.purchaseDate)}</td>
        <td>${escapeHtml(r.productMasterNo)}</td>
        <td>${escapeHtml(r.name)}</td>
        <td>${r.price}</td>
        <td>${r.point}</td>
        <td>${r.expenseAlloc}</td>
        <td>${r.cost}</td>
        <td>${r.qty}</td>
        <td>${escapeHtml(r.slipNo)}</td>
      </tr>`;
    });
  }

  document.getElementById('report-purchases').innerHTML = `
    <h3 class="mid-title">仕入明細</h3>
    <div class="table-wrap">
      <table>
        <tr><th>No</th><th>商品個別番号</th><th>仕入日</th><th>商品マスタ番号</th><th>商品名</th><th>提示金額</th><th>ポイント</th><th>経費按分</th><th>原価</th><th>個数</th><th>伝票番号</th></tr>
        ${body}
      </table>
    </div>
  `;
}

function renderSales(rows) {
  let body = '';
  if (!rows.length) {
    body = '<tr><td colspan="10">データなし</td></tr>';
  } else {
    rows.forEach((r, idx) => {
      body += `<tr>
        <td>${idx + 1}</td>
        <td>${escapeHtml(r.salesDate)}</td>
        <td>${escapeHtml(r.inventoryId)}</td>
        <td>${escapeHtml(r.productMasterNo)}</td>
        <td>${escapeHtml(r.name)}</td>
        <td>${r.salesAmount}</td>
        <td>${r.cost}</td>
        <td>${r.profit}</td>
        <td>${r.assumedSales}</td>
        <td>${escapeHtml(r.slipNo)}</td>
      </tr>`;
    });
  }

  document.getElementById('report-sales').innerHTML = `
    <h3 class="mid-title">売上明細</h3>
    <div class="table-wrap">
      <table>
        <tr><th>No</th><th>売上日</th><th>商品個別番号</th><th>商品マスタ番号</th><th>商品名</th><th>売上金額</th><th>原価</th><th>利益</th><th>想定売価</th><th>伝票番号</th></tr>
        ${body}
      </table>
    </div>
  `;
}

function renderExpenses(rows) {
  let body = '';
  if (!rows.length) {
    body = '<tr><td colspan="5">データなし</td></tr>';
  } else {
    rows.forEach((r, idx) => {
      body += `<tr>
        <td>${idx + 1}</td>
        <td>${escapeHtml(r.date)}</td>
        <td>${escapeHtml(r.name)}</td>
        <td>${r.amount}</td>
        <td>${escapeHtml(r.memo)}</td>
      </tr>`;
    });
  }

  document.getElementById('report-expenses').innerHTML = `
    <h3 class="mid-title">経費明細</h3>
    <div class="table-wrap">
      <table>
        <tr><th>No</th><th>日付</th><th>内容</th><th>金額</th><th>メモ</th></tr>
        ${body}
      </table>
    </div>
  `;
}

function printReport() {
  if (!currentReport) {
    alert('先に集計を実行してください');
    return;
  }
  window.print();
}

function saveReportPdf() {
  const type = document.getElementById('period-type').value;
  const value = document.getElementById('period-value').value.trim();
  const status = document.getElementById('action-status');
  status.textContent = 'PDF保存中...';

  google.script.run
    .withSuccessHandler(function(res) {
      status.innerHTML = `保存完了: <a href="${escapeHtml(res.url)}" target="_blank">${escapeHtml(res.fileName)}</a>`;
    })
    .withFailureHandler(function(err) {
      status.textContent = '';
      showError(err);
    })
    .savePeriodReportPdf(type, value);
}

function showError(err) {
  const msg = err && err.message ? err.message : String(err);
  alert('エラー: ' + msg);
}
</script>
</body>
</html>
```

## SalesForm.html

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
  <div id="sales-entry-page">
    <div class="section">
      <h2 class="section-title">売上入力</h2>
      <div class="note-text">未売上の在庫を候補から選び、1日分/1月分を一括登録できます。</div>
      <datalist id="sales-item-options"></datalist>
      <div id="sales-lines"></div>
    </div>

    <div class="section">
      <h3 class="mid-title">共通項目</h3>
      <div id="sales-common-info"></div>
      <div class="button-row">
        <button type="button" class="btn-main" onclick="showSalesFinalConfirm()">最終確認へ</button>
      </div>
    </div>

    <div id="sales-summary" class="section"></div>
  </div>

  <div id="sales-confirm-page" style="display:none;">
    <div class="section">
      <h2 class="section-title">売上登録 最終確認</h2>
      <div class="note-text">内容を確認し、問題なければ登録してください。</div>
      <div id="sales-confirm-area"></div>
      <div class="button-row">
        <button type="button" class="btn-sub" onclick="hideSalesFinalConfirm()">戻って編集</button>
        <button type="button" id="sales-submit-btn" class="btn-main" onclick="submitSalesEntries()">売上登録</button>
        <span id="sales-submit-status"></span>
      </div>
    </div>
  </div>

  <div id="sales-final-result" class="section"></div>

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
      title +
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
let salesRows = [];
let salesCandidates = [];
let salesPlaceCandidates = [];
let salesCandidateKeyMap = {};
let pendingSalesPayload = null;

window.onload = function() {
  salesRows = [createEmptySalesRow()];
  renderSalesRows();
  renderSalesCommonInfo();
  renderSalesSummary();
  loadSalesCandidates();
  loadSalesPlaceOptions();
};

function createEmptySalesRow() {
  return {
    itemInput: '',
    inventoryId: '',
    productNo: '',
    name: '',
    cost: 0,
    salesAmount: '',
    profit: 0,
    place: ''
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

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function toCandidateTokens(item) {
  const values = [
    item && item.label,
    item && item.inventoryId,
    item && item.name,
    item && item.productNo,
    item && item.jan
  ];
  const seen = {};
  const out = [];
  values.forEach(v => {
    const token = String(v || '').trim();
    if (!token || seen[token]) return;
    seen[token] = true;
    out.push(token);
  });
  return out;
}

function buildSalesItemOptions(filterText) {
  const dl = document.getElementById('sales-item-options');
  if (!dl) return;

  const q = normalizeText(filterText);
  const uniqueOptions = {};
  const options = [];
  salesCandidateKeyMap = {};

  salesCandidates.forEach(item => {
    const searchable = [
      item && item.label,
      item && item.inventoryId,
      item && item.name,
      item && item.productNo,
      item && item.jan
    ].map(normalizeText).join(' ');

    if (q && searchable.indexOf(q) === -1) return;

    toCandidateTokens(item).forEach(token => {
      const key = normalizeText(token);
      if (!salesCandidateKeyMap[key]) salesCandidateKeyMap[key] = [];
      salesCandidateKeyMap[key].push(item);
      if (uniqueOptions[token]) return;
      uniqueOptions[token] = true;
      options.push(`<option value="${escapeHtml(token)}"></option>`);
    });
  });

  dl.innerHTML = options.join('');
}

function loadSalesCandidates() {
  google.script.run
    .withSuccessHandler(function(list) {
      salesCandidates = Array.isArray(list) ? list : [];
      buildSalesItemOptions('');
      renderSalesRows();
    })
    .withFailureHandler(showError)
    .getSalesInventoryCandidates();
}

function loadSalesPlaceOptions() {
  google.script.run
    .withSuccessHandler(function(list) {
      salesPlaceCandidates = Array.isArray(list) ? list : [];
      const dl = document.getElementById('sales-place-options');
      if (dl) {
        dl.innerHTML = salesPlaceCandidates.map(v => `<option value="${escapeHtml(v)}"></option>`).join('');
      }
      const sel = document.getElementById('sales-place-candidate');
      if (sel) {
        if (!salesPlaceCandidates.length) {
          sel.innerHTML = '<option value="">候補なし</option>';
        } else {
          sel.innerHTML = salesPlaceCandidates.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('');
        }
      }
    })
    .withFailureHandler(showError)
    .getSalesPlaceList();
}

function resolveSalesCandidateByInput(input) {
  const text = String(input || '').trim();
  if (!text) return null;
  const key = normalizeText(text);

  if (salesCandidateKeyMap[key] && salesCandidateKeyMap[key].length === 1) {
    return salesCandidateKeyMap[key][0];
  }

  const exact = salesCandidates.filter(item => {
    return (
      normalizeText(item && item.label) === key ||
      normalizeText(item && item.inventoryId) === key ||
      normalizeText(item && item.name) === key ||
      normalizeText(item && item.productNo) === key ||
      normalizeText(item && item.jan) === key
    );
  });
  if (exact.length === 1) {
    return exact[0];
  }

  const contains = salesCandidates.filter(item => {
    const searchable = [
      item && item.label,
      item && item.inventoryId,
      item && item.name,
      item && item.productNo,
      item && item.jan
    ].map(normalizeText).join(' ');
    return searchable.indexOf(key) !== -1;
  });
  if (contains.length === 1) {
    return contains[0];
  }

  return null;
}

function onSalesItemInput(idx, value) {
  const row = salesRows[idx];
  if (!row) return;

  row.itemInput = String(value || '').trim();
  const matched = resolveSalesCandidateByInput(row.itemInput);
  if (!matched) {
    row.inventoryId = '';
    row.productNo = '';
    row.name = '';
    row.cost = 0;
    row.salesAmount = '';
    row.profit = 0;
    renderSalesRows();
    renderSalesSummary();
    return;
  }

  row.inventoryId = String(matched.inventoryId || '').trim();
  row.productNo = String(matched.productNo || '').trim();
  row.name = String(matched.name || '').trim();
  row.cost = roundYen(matched.cost || 0);
  if (!roundYen(row.salesAmount)) {
    const assumed = roundYen(matched.assumedSales || 0);
    row.salesAmount = assumed > 0 ? assumed : row.cost;
  }
  row.profit = roundYen(row.salesAmount) - row.cost;
  renderSalesRows();
  renderSalesSummary();
}

function cacheSalesItemInput(idx, value) {
  const row = salesRows[idx];
  if (!row) return;
  row.itemInput = String(value || '');
  buildSalesItemOptions(row.itemInput);
}

function onSalesAmountInput(idx, value) {
  const row = salesRows[idx];
  if (!row) return;
  row.salesAmount = Math.max(0, roundYen(value));
  row.profit = roundYen(row.salesAmount) - roundYen(row.cost);
  renderSalesRows();
  renderSalesSummary();
}

function cacheSalesAmountInput(idx, value) {
  const row = salesRows[idx];
  if (!row) return;
  row.salesAmount = String(value || '');
}

function onSalesPlaceInput(idx, value) {
  const row = salesRows[idx];
  if (!row) return;
  row.place = String(value || '').trim();
}

function addSalesRow(afterIdx) {
  const pos = Math.max(0, Math.min(afterIdx + 1, salesRows.length));
  salesRows.splice(pos, 0, createEmptySalesRow());
  renderSalesRows();
}

function removeSalesRow(idx) {
  if (salesRows.length <= 1) {
    salesRows[0] = createEmptySalesRow();
  } else {
    salesRows.splice(idx, 1);
  }
  renderSalesRows();
  renderSalesSummary();
}

function renderSalesRows() {
  let rowsHtml = '';
  salesRows.forEach((row, idx) => {
    rowsHtml += `
      <tr>
        <td class="col-no">${idx + 1}</td>
        <td class="col-item">
          <input type="text" class="inline-input" list="sales-item-options" value="${escapeHtml(row.itemInput || '')}" oninput="cacheSalesItemInput(${idx}, this.value)" onblur="onSalesItemInput(${idx}, this.value)" placeholder="商品個別番号 / 商品名 / 商品番号 / JAN">
        </td>
        <td class="col-num">
          <input type="text" class="inline-number" inputmode="numeric" pattern="\\d*" value="${row.salesAmount || ''}" oninput="cacheSalesAmountInput(${idx}, this.value)" onblur="onSalesAmountInput(${idx}, this.value)">
        </td>
        <td class="col-num"><div class="inline-value">${row.cost || 0}</div></td>
        <td class="col-num"><div class="inline-value">${row.profit || 0}</div></td>
        <td class="col-item">
          <input type="text" class="inline-input" list="sales-place-options" value="${escapeHtml(row.place || '')}" onblur="onSalesPlaceInput(${idx}, this.value)" placeholder="空欄なら共通販売場所">
        </td>
        <td>
          <div class="inline-actions">
            <button type="button" class="btn-main" onclick="addSalesRow(${idx})">＋行追加</button>
            <button type="button" class="btn-sub" onclick="removeSalesRow(${idx})">−削除</button>
          </div>
        </td>
      </tr>
    `;
  });

  document.getElementById('sales-lines').innerHTML = `
    <div class="entry-line-card">
      <div class="entry-line-title">売上明細入力（1行で入力）</div>
      <div class="inline-scroll">
        <table class="entry-inline-table">
          <tr>
            <th class="col-no">No</th>
            <th class="col-item">商品</th>
            <th class="col-num">売上金額</th>
            <th class="col-num">原価</th>
            <th class="col-num">利益</th>
            <th class="col-item">販売場所</th>
            <th>操作</th>
          </tr>
          ${rowsHtml}
        </table>
      </div>
    </div>
  `;
}

function renderSalesCommonInfo() {
  const commonRows = '' +
    '<tr>' +
      '<td class="col-no">1</td>' +
      '<td class="col-item"><div class="inline-value">売上日</div></td>' +
      '<td class="col-num"><input type="text" id="sales-date" class="inline-number" maxlength="10" inputmode="numeric" placeholder="例: 20260322" oninput="formatDateInput(this)"></td>' +
      '<td class="col-item"><div class="inline-value">販売場所</div></td>' +
      '<td class="col-item"><input type="text" id="sales-place" class="inline-input" list="sales-place-options" placeholder="共通販売場所"></td>' +
      '<td class="col-action"><div class="inline-value">固定</div></td>' +
    '</tr>';

  const candidateRows = '' +
    '<tr>' +
      '<td class="col-no">1</td>' +
      '<td class="col-item"><div class="inline-value">販売場所</div></td>' +
      '<td class="col-item"><select id="sales-place-candidate" class="inline-input"></select></td>' +
      '<td class="col-item"><input type="text" id="sales-place-add" class="inline-input" placeholder="新しい販売場所"></td>' +
      '<td class="col-action">' +
        '<div class="inline-actions">' +
          '<button type="button" class="btn-main" onclick="addSalesPlaceCandidate()">＋候補追加</button>' +
          '<button type="button" class="btn-sub" onclick="removeSalesPlaceCandidate()">−候補削除</button>' +
        '</div>' +
      '</td>' +
    '</tr>';

  document.getElementById('sales-common-info').innerHTML =
    '<datalist id="sales-place-options"></datalist>' +
    uiBuildInputTable_({
      title: '共通項目（1行固定）',
      columns: [
        { label: '項目名', className: 'col-item' },
        { label: '値', className: 'col-num' },
        { label: '項目名', className: 'col-item' },
        { label: '値', className: 'col-item' }
      ],
      includeOps: true,
      bodyHtml: commonRows
    }) +
    uiBuildInputTable_({
      title: '候補リスト（販売場所）',
      columns: [
        { label: '対象', className: 'col-item' },
        { label: '候補名', className: 'col-item' },
        { label: '新規候補', className: 'col-item' }
      ],
      includeOps: true,
      bodyHtml: candidateRows
    }) +
    '<div class="note-text" id="sales-place-status" style="margin-top:0.4em;"></div>';
}

function addSalesPlaceCandidate() {
  const value = String(document.getElementById('sales-place-add').value || '').trim();
  if (!value) {
    alert('追加する販売場所を入力してください');
    return;
  }
  const status = document.getElementById('sales-place-status');
  status.textContent = '追加中...';
  google.script.run
    .withSuccessHandler(function() {
      status.textContent = '追加しました';
      document.getElementById('sales-place-add').value = '';
      loadSalesPlaceOptions();
      setTimeout(function() { status.textContent = ''; }, 1000);
    })
    .withFailureHandler(function(err) {
      status.textContent = '';
      showError(err);
    })
    .addMasterCandidate('sales_place', value);
}

function removeSalesPlaceCandidate() {
  const value = String(document.getElementById('sales-place-candidate').value || '').trim();
  if (!value || value === '候補なし') {
    alert('削除する販売場所候補を選択してください');
    return;
  }
  if (!confirm(`候補「${value}」を削除します。よろしいですか？`)) return;

  const status = document.getElementById('sales-place-status');
  status.textContent = '削除中...';
  google.script.run
    .withSuccessHandler(function() {
      status.textContent = '削除しました';
      loadSalesPlaceOptions();
      setTimeout(function() { status.textContent = ''; }, 1000);
    })
    .withFailureHandler(function(err) {
      status.textContent = '';
      showError(err);
    })
    .removeMasterCandidate('sales_place', value);
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

function getActiveSalesRows() {
  const out = [];
  for (let i = 0; i < salesRows.length; i++) {
    const row = salesRows[i];
    const hasInput = !!String(row.itemInput || '').trim() || roundYen(row.salesAmount) > 0;
    if (!hasInput) continue;

    if (!String(row.inventoryId || '').trim()) {
      throw new Error(`明細${i + 1} の商品を候補から選択してください`);
    }
    if (roundYen(row.salesAmount) <= 0) {
      throw new Error(`明細${i + 1} の売上金額を入力してください`);
    }
    out.push(row);
  }
  if (!out.length) {
    throw new Error('売上明細が空です');
  }
  return out;
}

function renderSalesSummary() {
  let count = 0;
  let totalSales = 0;
  let totalCost = 0;
  let totalProfit = 0;

  salesRows.forEach(row => {
    if (!String(row.inventoryId || '').trim()) return;
    count += 1;
    totalSales += roundYen(row.salesAmount);
    totalCost += roundYen(row.cost);
    totalProfit += roundYen(row.profit);
  });

  document.getElementById('sales-summary').innerHTML = `
    <h3 class="mid-title">集計</h3>
    <div class="summary-grid">
      <div>明細数</div><div>${count}</div>
      <div>売上合計</div><div>${totalSales}</div>
      <div>原価合計</div><div>${totalCost}</div>
      <div>利益合計</div><div>${totalProfit}</div>
    </div>
  `;
}

function showSalesFinalConfirm() {
  try {
    const date = String(document.getElementById('sales-date').value || '').trim();
    const place = String(document.getElementById('sales-place').value || '').trim();
    if (!date) {
      alert('売上日を入力してください');
      return;
    }

    const activeRows = getActiveSalesRows();
    const payloadEntries = activeRows.map(row => ([
      String(row.inventoryId || '').trim(),
      roundYen(row.salesAmount),
      String(row.place || '').trim()
    ]));

    pendingSalesPayload = {
      entries: payloadEntries,
      commonInfo: {
        date: date,
        place: place
      }
    };

    let bodyRows = '';
    activeRows.forEach((row, idx) => {
      const usePlace = String(row.place || '').trim() || place;
      bodyRows += `<tr>
        <td>${idx + 1}</td>
        <td>${escapeHtml(row.inventoryId || '')}</td>
        <td>${escapeHtml(row.productNo || '')}</td>
        <td>${escapeHtml(row.name || '')}</td>
        <td>${roundYen(row.salesAmount)}</td>
        <td>${roundYen(row.cost)}</td>
        <td>${roundYen(row.profit)}</td>
        <td>${escapeHtml(usePlace || '')}</td>
      </tr>`;
    });

    const totalSales = activeRows.reduce((sum, row) => sum + roundYen(row.salesAmount), 0);
    const totalCost = activeRows.reduce((sum, row) => sum + roundYen(row.cost), 0);
    const totalProfit = activeRows.reduce((sum, row) => sum + roundYen(row.profit), 0);

    document.getElementById('sales-confirm-area').innerHTML = `
      <div class="confirm-block">
        <div class="confirm-title">共通情報</div>
        <div class="summary-grid">
          <div>売上日</div><div>${escapeHtml(date)}</div>
          <div>共通販売場所</div><div>${escapeHtml(place || '(明細ごと指定)')}</div>
        </div>
      </div>

      <div class="confirm-block">
        <div class="confirm-title">売上明細</div>
        <div class="table-wrap">
          <table>
            <tr><th>No</th><th>商品個別番号</th><th>商品マスタ番号</th><th>商品名</th><th>売上金額</th><th>原価</th><th>利益</th><th>販売場所</th></tr>
            ${bodyRows}
          </table>
        </div>
      </div>

      <div class="confirm-block">
        <div class="confirm-title">集計</div>
        <div class="summary-grid">
          <div>明細数</div><div>${activeRows.length}</div>
          <div>売上合計</div><div>${totalSales}</div>
          <div>原価合計</div><div>${totalCost}</div>
          <div>利益合計</div><div>${totalProfit}</div>
        </div>
      </div>
    `;

    document.getElementById('sales-entry-page').style.display = 'none';
    document.getElementById('sales-confirm-page').style.display = 'block';
    window.scrollTo(0, 0);
  } catch (err) {
    showError(err);
  }
}

function hideSalesFinalConfirm() {
  document.getElementById('sales-confirm-page').style.display = 'none';
  document.getElementById('sales-entry-page').style.display = 'block';
  window.scrollTo(0, 0);
}

function submitSalesEntries() {
  if (!pendingSalesPayload) {
    alert('最終確認を先に実行してください');
    return;
  }

  const btn = document.getElementById('sales-submit-btn');
  const status = document.getElementById('sales-submit-status');
  btn.disabled = true;
  status.textContent = '登録中...';

  google.script.run
    .withSuccessHandler(function(res) {
      const result = (typeof res === 'string') ? { message: res } : (res || {});
      document.getElementById('sales-final-result').innerHTML = `
        <div class="result-success">${escapeHtml(result.message || '売上登録が完了しました')}</div>
      `;

      salesRows = [createEmptySalesRow()];
      pendingSalesPayload = null;
      renderSalesRows();
      renderSalesSummary();
      renderSalesCommonInfo();
      loadSalesCandidates();
      loadSalesPlaceOptions();
      hideSalesFinalConfirm();

      btn.disabled = false;
      status.textContent = '';
    })
    .withFailureHandler(function(err) {
      btn.disabled = false;
      status.textContent = '';
      showError(err);
    })
    .registerSalesEntries(pendingSalesPayload.entries, pendingSalesPayload.commonInfo);
}

function showError(err) {
  const msg = err && err.message ? err.message : String(err);
  alert('エラー: ' + msg);
}
</script>
</body>
</html>
```

## SettingsForm.html

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
  <div class="section">
    <h2 class="section-title">設定</h2>
    <div class="note-text">設定画面も統一テーブルUIで管理します（固定行）。</div>
    <div id="settings-table-area"></div>
    <div class="button-row">
      <button type="button" class="btn-main" onclick="saveSettings()">保存</button>
      <span id="settings-status"></span>
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
      title +
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
const INVENTORY_MODE_DETAIL = '明細単位';
const INVENTORY_MODE_UNIT = '個体単位';
const TERMINOLOGY_MODE_JP = '日本対応';
const TERMINOLOGY_MODE_GLOBAL = '国際対応';

let currentSettings = {
  terminologyMode: TERMINOLOGY_MODE_JP,
  inventoryIdMode: INVENTORY_MODE_DETAIL,
  terminologyOptions: []
};

window.onload = function() {
  loadSettings();
};

function getInventoryOptionsByTerminology(terminologyMode) {
  if (String(terminologyMode || '') === TERMINOLOGY_MODE_GLOBAL) {
    return [
      { value: INVENTORY_MODE_DETAIL, label: 'line（1 line = 1 inventory ID）' },
      { value: INVENTORY_MODE_UNIT, label: 'unit（1 quantity = 1 inventory ID）' }
    ];
  }
  return [
    { value: INVENTORY_MODE_DETAIL, label: '明細単位（1行 = 1在庫ID）' },
    { value: INVENTORY_MODE_UNIT, label: '個体単位（数量1つ = 1在庫ID）' }
  ];
}

function loadSettings() {
  google.script.run
    .withSuccessHandler(function(res) {
      const settings = res || {};
      currentSettings.terminologyMode = String(settings.terminologyMode || TERMINOLOGY_MODE_JP);
      currentSettings.inventoryIdMode = String(settings.inventoryIdMode || INVENTORY_MODE_DETAIL);
      currentSettings.terminologyOptions = Array.isArray(settings.terminologyOptions) ? settings.terminologyOptions : [];
      renderSettingsTable();
    })
    .withFailureHandler(showError)
    .getErpSettingsForUi();
}

function onTerminologyChanged(value) {
  currentSettings.terminologyMode = String(value || TERMINOLOGY_MODE_JP);
  const available = getInventoryOptionsByTerminology(currentSettings.terminologyMode).map(function(v) { return v.value; });
  if (available.indexOf(currentSettings.inventoryIdMode) === -1) {
    currentSettings.inventoryIdMode = INVENTORY_MODE_DETAIL;
  }
  renderSettingsTable();
}

function onInventoryModeChanged(value) {
  currentSettings.inventoryIdMode = String(value || INVENTORY_MODE_DETAIL);
}

function renderSettingsTable() {
  const terminologyOptions = currentSettings.terminologyOptions.map(function(opt) {
    const selected = String(opt.value || '') === currentSettings.terminologyMode ? ' selected' : '';
    return '<option value="' + uiEscapeHtml_(opt.value || '') + '"' + selected + '>' + uiEscapeHtml_(opt.label || '') + '</option>';
  }).join('');

  const inventoryOptions = getInventoryOptionsByTerminology(currentSettings.terminologyMode).map(function(opt) {
    const selected = String(opt.value || '') === currentSettings.inventoryIdMode ? ' selected' : '';
    return '<option value="' + uiEscapeHtml_(opt.value || '') + '"' + selected + '>' + uiEscapeHtml_(opt.label || '') + '</option>';
  }).join('');

  const rowsHtml = '' +
    '<tr>' +
      '<td class="col-no">1</td>' +
      '<td class="col-item"><div class="inline-value">用語表示方式</div></td>' +
      '<td class="col-item"><select id="terminology-mode" class="inline-input" onchange="onTerminologyChanged(this.value)">' + terminologyOptions + '</select></td>' +
      '<td class="col-action"><div class="inline-value">固定</div></td>' +
    '</tr>' +
    '<tr>' +
      '<td class="col-no">2</td>' +
      '<td class="col-item"><div class="inline-value">在庫ID方式</div></td>' +
      '<td class="col-item"><select id="inventory-id-mode" class="inline-input" onchange="onInventoryModeChanged(this.value)">' + inventoryOptions + '</select></td>' +
      '<td class="col-action"><div class="inline-value">固定</div></td>' +
    '</tr>';

  document.getElementById('settings-table-area').innerHTML = uiBuildInputTable_({
    title: '設定入力（1行入力型UI）',
    columns: [
      { label: '項目名', className: 'col-item' },
      { label: '値', className: 'col-item' }
    ],
    includeOps: true,
    bodyHtml: rowsHtml
  });
}

function saveSettings() {
  const status = document.getElementById('settings-status');
  status.textContent = '保存中...';

  google.script.run
    .withSuccessHandler(function() {
      status.textContent = '保存しました';
      setTimeout(function() { status.textContent = ''; }, 1200);
    })
    .withFailureHandler(function(err) {
      status.textContent = '';
      showError(err);
    })
    .saveErpSettings({
      inventoryIdMode: currentSettings.inventoryIdMode,
      terminologyMode: currentSettings.terminologyMode
    });
}

function showError(err) {
  const msg = err && err.message ? err.message : String(err);
  alert('エラー: ' + msg);
}
  </script>
</body>
</html>
```

## TableComponents.html

```html
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
      title +
      '<div class="inline-scroll">' +
        '<table class="entry-inline-table unified-input-table">' +
          '<tr>' + header + '</tr>' +
          bodyHtml +
        '</table>' +
      '</div>' +
      note +
    '</div>';
}
```

## expenseForm.gs

```javascript
// 経費内容の候補一覧を取得（重複なし・最新順）
function getExpenseItems() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('経費');
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  var names = {};
  for (var i = data.length - 1; i >= 1; i--) {
    var val = String(data[i][1] || '').trim(); // B列: 内容
    if (val && !names[val]) names[val] = true;
  }
  return Object.keys(names);
}

// 経費をシートへ登録（A:日付, B:内容, C:金額, D:メモ, E:登録日）
function registerExpense(info) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('経費');
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('経費');
    sheet.getRange(1, 1, 1, 5).setValues([['日付', '内容', '金額', 'メモ', '登録日']]);
  }

  var date = String((info && info.date) || '').trim();
  var name = String((info && info.name) || '').trim();
  var amount = Number((info && info.amount) || 0);
  var memo = String((info && info.memo) || '').trim();

  if (!date || !name || !amount) {
    throw new Error('日付・内容・金額は必須です');
  }

  var row = [
    date,
    name,
    Math.round(amount),
    memo,
    Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd')
  ];
  sheet.appendRow(row);

  // masterシートがある場合は候補として追加
  try {
    if (typeof upsertMasterValue_ === 'function') {
      upsertMasterValue_('expense', name);
    }
  } catch (e) {
    // no-op
  }

  return '経費を登録しました';
}

// 経費を複数行まとめて登録（UI統一用）
function registerExpensesBatch(list) {
  var rows = Array.isArray(list) ? list : [];
  if (!rows.length) throw new Error('経費明細が空です');

  var count = 0;
  rows.forEach(function(item) {
    registerExpense(item || {});
    count += 1;
  });

  return {
    success: true,
    count: count,
    message: '経費を' + count + '件登録しました'
  };
}
```

## main.gs

```javascript
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

function showEntryForm() {
  var html = HtmlService.createHtmlOutputFromFile('EntryForm')
    .setWidth(900)
    .setHeight(760);
  SpreadsheetApp.getUi().showModalDialog(html, '仕入登録');
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
```

## report.gs

```javascript
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
  var table = [['商品個別番号', '仕入日', '商品マスタ番号', '商品名', '提示金額', 'ポイント', '経費按分', '原価', '個数', '仕入先', '伝票番号']];
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
```

## search.gs

```javascript
var SHEET_PRODUCT = '商品情報';
var SHEET_INVENTORY = '在庫表';
var SHEET_EXPENSE = '経費';
var SHEET_MASTER = 'マスタ';
var SHEET_MASTER_PAYMENT = '支払い方法候補';
var SHEET_MASTER_SALES_PLACE = '販売場所候補';
var SHEET_SALES_SLIP = '売上伝票';
var TZ = 'Asia/Tokyo';

// 商品情報検索（商品マスタ番号/JAN/商品名/検索名/読み仮名で部分一致検索）
function searchProduct(keyword) {
  var query = String(keyword || '').trim();
  if (!query) return [];

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PRODUCT);
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  var results = [];
  for (var i = 1; i < data.length; i++) {
    var productNo = data[i][0];   // A 商品マスタ番号
    var jan = data[i][1];         // B
    var name = data[i][2];        // C
    var searchName = data[i][10]; // K
    var yomi = data[i][11];       // L

    if (
      contains_(productNo, query) ||
      contains_(jan, query) ||
      contains_(name, query) ||
      contains_(searchName, query) ||
      contains_(yomi, query)
    ) {
      results.push([productNo || '', name || '']);
    }
  }
  return results;
}

// 商品新規登録（商品マスタ番号は受取値優先、未指定ならJAN下4桁 or ランダム）
function registerNewProduct(productInfo) {
  var info = productInfo || {};
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PRODUCT);
  if (!sheet) throw new Error('商品情報シートがありません');

  var name = String(info.name || '').trim();
  if (!name) throw new Error('商品名は必須です');

  var productNo = String(info.productNo || '').trim();
  if (!productNo) {
    var jan = String(info.jan || '').trim();
    productNo = jan.length >= 4 ? jan.slice(-4) : String(Math.floor(1000 + Math.random() * 9000));
  }

  var found = findProductRow_(sheet, productNo, name);
  if (found.found) {
    return { msg: '商品情報は既に登録済みです', name: found.name || name, productNo: found.productNo || productNo };
  }

  var row = [
    productNo,                                    // A 商品マスタ番号
    String(info.jan || '').trim(),               // B JAN
    name,                                         // C 商品名
    String(info.category || '').trim(),          // D カテゴリ
    String(info.maker || '').trim(),             // E メーカー
    String(info.brand || '').trim(),             // F ブランド
    String(info.sub || '').trim(),               // G サブ
    toNumberOrBlank_(info.retailPrice),          // H 希望小売価格
    String(info.note || '').trim(),              // I 備考
    formatYmd_(new Date()),                      // J 登録日
    String(info.searchName || name).trim(),      // K 検索名
    String(info.yomigana || '').trim(),          // L 読み仮名
    toNumberOrBlank_(info.assumedPrice)          // M 想定売価
  ];
  sheet.appendRow(row);
  return { msg: '商品情報を登録しました', name: name, productNo: productNo };
}

// 仕入先候補（検索・選択用）
function getSupplierList() {
  return getMasterCandidateList_('supplier', SHEET_INVENTORY, 11); // K列
}

// 支払い方法候補（検索・選択用）
function getPaymentList() {
  return getMasterCandidateList_('payment', SHEET_INVENTORY, 12); // L列
}

// 販売場所候補（売上入力用）
function getSalesPlaceList() {
  return getMasterCandidateList_('sales_place', SHEET_INVENTORY, 15); // O列
}

// 未売上在庫候補（売上入力用）
function getSalesInventoryCandidates() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_INVENTORY);
  if (!sheet || sheet.getLastRow() < 2) return [];

  ensureInventoryHeaders_(sheet);
  var janMap = buildProductJanMap_();

  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 21).getValues();
  var out = [];

  values.forEach(function(row, idx) {
    var rowNo = idx + 2;
    var inventoryId = String(row[0] || '').trim();
    var productNo = String(row[2] || '').trim();
    var name = String(row[3] || '').trim();
    var jan = String(janMap[productNo] || '').trim();
    var cost = roundYen_(toNumber_(row[7]));
    var qty = Math.max(1, roundYen_(toNumber_(row[8]) || 1));
    var salesDate = String(row[12] || '').trim();
    var salesAmount = roundYen_(toNumber_(row[13]));
    var assumedSales = roundYen_(toNumber_(row[16]));
    var purchaseSlipNo = String(row[18] || '').trim();

    if (!name) return;
    if (salesDate || salesAmount > 0) return; // 売上済み除外
    if (roundYen_(toNumber_(row[8])) <= 0) return; // 在庫ゼロ除外

    var id = inventoryId || ('ROW' + rowNo);
    var label = id + '：' + name;
    if (productNo) label += ' / ' + productNo;
    if (jan) label += ' / JAN:' + jan;
    if (qty > 1) label += ' x' + qty;

    out.push({
      rowNo: rowNo,
      inventoryId: id,
      productNo: productNo,
      jan: jan,
      name: name,
      cost: cost,
      qty: qty,
      assumedSales: assumedSales,
      purchaseSlipNo: purchaseSlipNo,
      label: label
    });
  });

  out.sort(function(a, b) {
    return String(a.inventoryId || '').localeCompare(String(b.inventoryId || ''), 'ja');
  });
  return out;
}

// 商品候補（入力補助用）
function getProductCandidates() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PRODUCT);
  if (!sheet || sheet.getLastRow() < 2) return [];

  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues(); // A-C
  var seen = {};
  var out = [];

  values.forEach(function(row) {
    var productNo = String(row[0] || '').trim(); // 商品マスタ番号
    var jan = String(row[1] || '').trim();
    var name = String(row[2] || '').trim();
    if (!name) return;

    var key = (productNo || '-') + '|' + (jan || '-') + '|' + name;
    if (seen[key]) return;
    seen[key] = true;

    var label = '';
    if (jan) {
      label = jan + '：' + name;
    } else if (productNo) {
      label = productNo + '：' + name;
    } else {
      label = name;
    }

    out.push({
      productNo: productNo,
      jan: jan,
      name: name,
      label: label
    });
  });

  out.sort(function(a, b) {
    return String(a.label).localeCompare(String(b.label), 'ja');
  });
  return out;
}

// 候補編集（仕入先/支払い方法）
function addMasterCandidate(type, value) {
  var itemType = normalizeMasterType_(type);
  var itemValue = String(value || '').trim();
  if (!itemType || !itemValue) throw new Error('候補種別と値は必須です');

  upsertMasterValue_(itemType, itemValue);
  removeMasterExclusion_(itemType, itemValue);
  return { ok: true, type: itemType, value: itemValue };
}

function removeMasterCandidate(type, value) {
  var itemType = normalizeMasterType_(type);
  var itemValue = String(value || '').trim();
  if (!itemType || !itemValue) throw new Error('候補種別と値は必須です');

  removeMasterValue_(itemType, itemValue);
  upsertMasterValue_(itemType + '_exclude', itemValue);
  return { ok: true, type: itemType, value: itemValue };
}

// 仕入リストを在庫表に登録（商品個別番号/仕入伝票番号を自動採番）
// entryList item: [商品マスタ番号, 商品名, 提示金額, ポイント/割引, 原価, 個数, 単価, 経費按分]
function registerEntries(entryList, commonInfo, expenseList) {
  if (!entryList || !entryList.length) throw new Error('仕入リストが空です');

  var info = commonInfo || {};
  var purchaseDate = normalizeDateInput_(info.date);
  var supplier = String(info.supplier || '').trim();
  var payment = String(info.payment || '').trim();
  if (!purchaseDate || !supplier || !payment) {
    throw new Error('共通項目（仕入日/仕入先/支払い方法）が不足しています');
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var inventorySheet = ss.getSheetByName(SHEET_INVENTORY);
  if (!inventorySheet) throw new Error('在庫表シートがありません');
  var productSheet = ss.getSheetByName(SHEET_PRODUCT);
  if (!productSheet) throw new Error('商品情報シートがありません');

  ensureInventoryHeaders_(inventorySheet);
  ensureProductHeaders_(productSheet);

  var slipNo = issueSlipNo_(inventorySheet, purchaseDate, supplier);
  var inventoryIdSeqState = {
    current: getMaxInventoryIdSequence_(inventorySheet)
  };
  var inventoryIdMode = '明細単位';
  var terminologyMode = '日本対応';
  if (typeof getInventoryIdMode_ === 'function') {
    inventoryIdMode = getInventoryIdMode_();
  }
  if (typeof getTerminologyMode_ === 'function') {
    terminologyMode = getTerminologyMode_();
  }
  var inventoryIdModeLabel = inventoryIdMode;
  if (typeof getInventoryIdModeLabel_ === 'function') {
    inventoryIdModeLabel = getInventoryIdModeLabel_(inventoryIdMode, terminologyMode);
  }

  var normalizedEntries = entryList.map(normalizeEntryItem_);
  normalizedEntries.forEach(function(item, idx) {
    item.productNo = upsertProductMasterByEntry_(item.productNo, item.name);
    var inventoryIds = buildInventoryIdsByMode_(inventoryIdSeqState, item.qty, inventoryIdMode);
    item.inventoryId = String(inventoryIds[0] || '').trim();
    item.inventoryIds = inventoryIds.slice();
    item.barcodeValues = inventoryIds.slice();
    item.barcodeValue = inventoryIds.join('\n');
  });

  var normalizedExpenses = normalizeExpenseList_(expenseList);
  var slipData = buildPurchaseSlipData_({
    slipNo: slipNo,
    purchaseDate: purchaseDate,
    supplier: supplier,
    payment: payment,
    terminologyMode: terminologyMode,
    inventoryIdMode: inventoryIdMode,
    inventoryIdModeLabel: inventoryIdModeLabel,
    entries: normalizedEntries,
    expenses: normalizedExpenses
  });

  var pdfInfo = null;
  var barcodePdfInfo = null;
  var firstDataRow = inventorySheet.getLastRow() + 1;

  // 検索せず入力された値もマスタへ追加
  upsertMasterValue_('supplier', supplier);
  upsertMasterValue_('payment', payment);
  normalizedExpenses.forEach(function(ex) { upsertMasterValue_('expense', ex.name); });

  normalizedEntries.forEach(function(item) {
    var row = [
      item.inventoryId,         // A 商品個別番号
      purchaseDate,             // B 仕入日
      item.productNo,           // C 商品マスタ番号
      item.name,                // D 商品名
      item.price,               // E 提示金額
      item.point,               // F ポイント/割引
      item.expenseAlloc,        // G 経費按分
      item.cost,                // H 原価
      item.qty,                 // I 在庫数
      item.unitPrice,           // J 単価
      supplier,                 // K 仕入先
      payment,                  // L 支払い方法
      '',                       // M 売上日
      '',                       // N 売上金額
      '',                       // O 販売場所
      '',                       // P 利益
      '',                       // Q 想定売価
      '',                       // R 想定利益
      slipNo,                   // S 仕入伝票番号
      item.barcodeValue,        // T バーコード値一覧（商品個別番号の主参照は禁止）
      '未作成'                  // U ラベル印刷状態
    ];
    inventorySheet.appendRow(row);
  });

  appendExpenseRows_(normalizedExpenses, {
    date: purchaseDate,
    slipNo: slipNo,
    supplier: supplier,
    inventoryIds: normalizedEntries.map(function(item) { return item.inventoryId; })
  });

  try {
    pdfInfo = savePurchaseSlipPdf_(slipData);
  } catch (err) {
    pdfInfo = {
      success: false,
      error: err && err.message ? err.message : String(err)
    };
  }

  try {
    barcodePdfInfo = savePurchaseBarcodePdf_(slipData);
    markBarcodePrintStatus_(inventorySheet, firstDataRow, normalizedEntries.length, 'PDF作成');
  } catch (err2) {
    barcodePdfInfo = {
      success: false,
      error: err2 && err2.message ? err2.message : String(err2)
    };
    markBarcodePrintStatus_(inventorySheet, firstDataRow, normalizedEntries.length, '作成失敗');
  }

  var firstInventoryId = normalizedEntries.length ? normalizedEntries[0].inventoryId : '';
  var message = '仕入登録完了: 仕入伝票番号=' + slipNo + ' / 商品' + normalizedEntries.length + '件';
  if (firstInventoryId) {
    message += ' / 商品個別番号(先頭)=' + firstInventoryId;
  }
  if (pdfInfo && pdfInfo.success === false) {
    message += ' / PDF保存失敗:' + pdfInfo.error;
  }
  if (barcodePdfInfo && barcodePdfInfo.success === false) {
    message += ' / バーコードPDF保存失敗:' + barcodePdfInfo.error;
  }

  return {
    success: true,
    message: message,
    inventoryIdStart: firstInventoryId,
    slipNo: slipNo,
    terminologyMode: terminologyMode,
    inventoryIdMode: inventoryIdMode,
    inventoryIdModeLabel: inventoryIdModeLabel,
    slipData: slipData,
    pdf: pdfInfo,
    barcodePdf: barcodePdfInfo
  };
}

// 売上リストを在庫表へ登録（複数行一括）
// salesList item: [商品個別番号, 売上金額, 販売場所]
function registerSalesEntries(salesList, commonInfo) {
  if (!salesList || !salesList.length) throw new Error('売上リストが空です');

  var info = commonInfo || {};
  var salesDate = normalizeDateInput_(info.date);
  var commonPlace = String(info.place || '').trim();
  if (!salesDate) {
    throw new Error('売上日を入力してください');
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var inventorySheet = ss.getSheetByName(SHEET_INVENTORY);
  if (!inventorySheet) throw new Error('在庫表シートがありません');
  ensureInventoryHeaders_(inventorySheet);

  var salesSlipSheet = ensureSalesSlipSheet_();
  var salesSlipNo = issueSalesSlipNo_(salesSlipSheet, salesDate, commonPlace || 'UNKNOWN');

  var inventoryLast = inventorySheet.getLastRow();
  if (inventoryLast < 2) throw new Error('在庫データがありません');

  var invValues = inventorySheet.getRange(2, 1, inventoryLast - 1, 21).getValues();
  var invMap = {};
  invValues.forEach(function(row, idx) {
    var rowNo = idx + 2;
    var id = String(row[0] || '').trim();
    var fallbackId = 'ROW' + rowNo;
    var payload = { rowNo: rowNo, row: row };
    if (id && !invMap[id]) invMap[id] = payload;
    if (!invMap[fallbackId]) invMap[fallbackId] = payload;
  });

  var normalized = salesList.map(normalizeSalesEntryItem_);
  var seen = {};
  var updatedCount = 0;
  var totalSales = 0;
  var totalProfit = 0;

  normalized.forEach(function(item) {
    var inventoryId = item.inventoryId;
    if (seen[inventoryId]) {
      throw new Error('同じ商品個別番号が重複しています: ' + inventoryId);
    }
    seen[inventoryId] = true;

    var hit = invMap[inventoryId];
    if (!hit) {
      throw new Error('該当在庫が見つかりません: ' + inventoryId);
    }

    var row = hit.row;
    var rowNo = hit.rowNo;
    var existedSalesDate = String(row[12] || '').trim();
    var existedSalesAmount = roundYen_(toNumber_(row[13]));
    if (existedSalesDate || existedSalesAmount > 0) {
      throw new Error('既に売上済みです: ' + inventoryId);
    }

    var place = item.place || commonPlace;
    if (!place) {
      throw new Error('販売場所を入力してください（商品個別番号: ' + inventoryId + '）');
    }

    var cost = roundYen_(toNumber_(row[7]));
    var salesAmount = item.salesAmount;
    var profit = salesAmount - cost;
    var assumedSalesCell = row[16];
    var assumedProfitCell = row[17];
    var assumedSalesNum = roundYen_(toNumber_(assumedSalesCell));
    if ((assumedProfitCell === '' || assumedProfitCell === null) && assumedSalesNum > 0) {
      assumedProfitCell = assumedSalesNum - cost;
    }

    // I:在庫数を0化（売上済み）
    inventorySheet.getRange(rowNo, 9).setValue(0);
    // M:売上日 N:売上金額 O:販売場所 P:利益 Q:想定売価 R:想定利益
    inventorySheet.getRange(rowNo, 13, 1, 6).setValues([[
      salesDate,
      salesAmount,
      place,
      profit,
      assumedSalesCell,
      assumedProfitCell
    ]]);

    salesSlipSheet.appendRow([
      salesSlipNo,
      salesDate,
      place,
      inventoryId,
      String(row[2] || '').trim(), // 商品マスタ番号
      String(row[3] || '').trim(), // 商品名
      cost,
      salesAmount,
      profit,
      String(row[18] || '').trim(), // 仕入伝票番号
      formatYmd_(new Date())
    ]);

    upsertMasterValue_('sales_place', place);
    updatedCount += 1;
    totalSales += salesAmount;
    totalProfit += profit;
  });

  return {
    success: true,
    message: '売上登録完了: 売上伝票番号=' + salesSlipNo + ' / ' + updatedCount + '件 / 売上合計=' + totalSales + ' / 利益合計=' + totalProfit,
    salesSlipNo: salesSlipNo,
    count: updatedCount,
    totals: {
      salesAmount: totalSales,
      profit: totalProfit
    }
  };
}

function buildProductJanMap_() {
  var map = {};
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PRODUCT);
  if (!sheet || sheet.getLastRow() < 2) return map;

  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues(); // A:商品マスタ番号 B:JAN
  values.forEach(function(row) {
    var productNo = String(row[0] || '').trim();
    var jan = String(row[1] || '').trim();
    if (!productNo || !jan) return;
    if (!map[productNo]) map[productNo] = jan;
  });
  return map;
}

function normalizeEntryItem_(item) {
  var productNo = '';
  var name = '';
  var price = 0;
  var point = 0;
  var cost = 0;
  var qty = 1;
  var unitPrice = 0;
  var expenseAlloc = 0;

  if (Array.isArray(item)) {
    productNo = String(item[0] || '').trim(); // 商品マスタ番号
    name = String(item[1] || '').trim();
    price = roundYen_(toNumber_(item[2]));
    point = roundYen_(toNumber_(item[3]));
    cost = roundYen_(toNumber_(item[4]));
    qty = Math.max(1, roundYen_(toNumber_(item[5]) || 1));
    unitPrice = roundYen_(toNumber_(item[6]));
    expenseAlloc = roundYen_(toNumber_(item[7]));
  } else {
    productNo = String(item.productNo || '').trim();
    name = String(item.name || '').trim();
    price = roundYen_(toNumber_(item.price));
    point = roundYen_(toNumber_(item.point));
    cost = roundYen_(toNumber_(item.cost));
    qty = Math.max(1, roundYen_(toNumber_(item.qty) || 1));
    unitPrice = roundYen_(toNumber_(item.unitPrice));
    expenseAlloc = roundYen_(toNumber_(item.expenseAlloc));
  }

  if (!name) throw new Error('商品名が空の行があります');

  if (!cost) {
    cost = Math.max(0, price - point + expenseAlloc);
  }
  if (!unitPrice) {
    unitPrice = qty > 0 ? roundYen_(cost / qty) : cost;
  }

  return {
    productNo: productNo,
    name: name,
    price: price,
    point: point,
    cost: cost,
    qty: qty,
    unitPrice: unitPrice,
    expenseAlloc: expenseAlloc,
    barcodeValue: Array.isArray(item) ? String(item[8] || '').trim() : String(item.barcodeValue || '').trim(),
    barcodeValues: Array.isArray(item) ? [] : (Array.isArray(item.barcodeValues) ? item.barcodeValues.slice() : [])
  };
}

function normalizeExpenseList_(expenseList) {
  if (!expenseList || !expenseList.length) return [];
  return expenseList
    .map(function(item) {
      return {
        name: String(item.name || '').trim(),
        amount: roundYen_(toNumber_(item.amount)),
        memo: String(item.memo || '').trim()
      };
    })
    .filter(function(item) {
      return item.name && item.amount > 0;
    });
}

function normalizeSalesEntryItem_(item) {
  var inventoryId = '';
  var salesAmount = 0;
  var place = '';

  if (Array.isArray(item)) {
    inventoryId = String(item[0] || '').trim();
    salesAmount = roundYen_(toNumber_(item[1]));
    place = String(item[2] || '').trim();
  } else {
    inventoryId = String(item.inventoryId || '').trim();
    salesAmount = roundYen_(toNumber_(item.salesAmount));
    place = String(item.place || '').trim();
  }

  if (!inventoryId) {
    throw new Error('商品個別番号が空の行があります');
  }
  if (salesAmount <= 0) {
    throw new Error('売上金額は1円以上で入力してください（商品個別番号: ' + inventoryId + '）');
  }

  return {
    inventoryId: inventoryId,
    salesAmount: salesAmount,
    place: place
  };
}

function appendExpenseRows_(expenseList, info) {
  if (!expenseList.length) return;

  var sheet = ensureExpenseSheet_();
  var date = info.date;
  var slipNo = info.slipNo;
  var supplier = info.supplier;
  var inventoryIds = Array.isArray(info.inventoryIds) ? info.inventoryIds : [];
  var inventoryIdMemo = inventoryIds.slice(0, 3).join(',');
  if (inventoryIds.length > 3) inventoryIdMemo += '...';

  expenseList.forEach(function(item) {
    var memoParts = [];
    if (item.memo) memoParts.push(item.memo);
    memoParts.push('仕入伝票:' + slipNo);
    if (inventoryIdMemo) memoParts.push('商品個別番号:' + inventoryIdMemo);
    memoParts.push('仕入先:' + supplier);

    var row = [
      date,
      item.name,
      item.amount,
      memoParts.join(' / '),
      formatYmd_(new Date())
    ];
    sheet.appendRow(row);
  });
}

function ensureExpenseSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_EXPENSE);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_EXPENSE);
  }
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, 5).setValues([['日付', '内容', '金額', 'メモ', '登録日']]);
  }
  return sheet;
}

function ensureSalesSlipSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_SALES_SLIP);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_SALES_SLIP);
  }
  if (sheet.getMaxColumns() < 11) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), 11 - sheet.getMaxColumns());
  }
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, 11).setValues([[
      '売上伝票番号',
      '売上日',
      '販売場所',
      '商品個別番号',
      '商品マスタ番号',
      '商品名',
      '原価',
      '売上金額',
      '利益',
      '仕入伝票番号',
      '登録日'
    ]]);
  }
  return sheet;
}

function ensureInventoryHeaders_(sheet) {
  // 旧レイアウト（G列=原価）なら G列に「経費按分」列を挿入して右へシフト
  var gHeader = String(sheet.getRange(1, 7).getValue() || '').trim();
  var hasExpenseAllocColumn = String(sheet.getRange(1, 7).getValue() || '').trim() === '経費按分' ||
    String(sheet.getRange(1, 19).getValue() || '').trim() === '経費按分';
  if (!hasExpenseAllocColumn && gHeader === '原価') {
    sheet.insertColumnBefore(7);
  }

  if (sheet.getMaxColumns() < 21) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), 21 - sheet.getMaxColumns());
  }

  var headers = [[
    '商品個別番号', // A
    '仕入日',       // B
    '商品マスタ番号', // C
    '商品名',       // D
    '提示金額',     // E
    'ポイント/割引', // F
    '経費按分',     // G
    '原価',         // H
    '在庫数',       // I
    '単価',         // J
    '仕入先',       // K
    '支払い方法',   // L
    '売上日',       // M
    '売上金額',     // N
    '販売場所',     // O
    '利益',         // P
    '想定売価',     // Q
    '想定利益',     // R
    '仕入伝票番号', // S
    'バーコード値一覧', // T（補助列。主キー参照は禁止）
    'ラベル印刷状態' // U
  ]];
  sheet.getRange(1, 1, 1, 21).setValues(headers);
  if (sheet.getMaxColumns() >= 20) {
    sheet.hideColumns(20, 1);
  }
}

function ensureProductHeaders_(sheet) {
  if (sheet.getMaxColumns() < 13) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), 13 - sheet.getMaxColumns());
  }

  var headers = [[
    '商品マスタ番号', // A
    'JAN',           // B
    '商品名',         // C
    'カテゴリ',       // D
    'メーカー',       // E
    'ブランド',       // F
    'サブ',           // G
    '希望小売価格',   // H
    '備考',           // I
    '登録日',         // J
    '検索名',         // K
    '読み仮名',       // L
    '想定売価'        // M
  ]];
  sheet.getRange(1, 1, 1, 13).setValues(headers);
}

function getMaxInventoryIdSequence_(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;

  var maxNo = 0;
  var colA = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  colA.forEach(function(row) {
    var n = parseInventoryIdSequence_(row[0]);
    if (n > maxNo) maxNo = n;
  });

  if (sheet.getMaxColumns() >= 20) {
    var colT = sheet.getRange(2, 20, lastRow - 1, 1).getValues();
    colT.forEach(function(row) {
      var text = String(row[0] || '');
      if (!text) return;
      text.split(/\r?\n/).forEach(function(token) {
        var n = parseInventoryIdSequence_(token);
        if (n > maxNo) maxNo = n;
      });
    });
  }

  return maxNo;
}

function issueSlipNo_(sheet, date, supplier) {
  var dateToken = date.replace(/[^0-9]/g, '').slice(0, 8);
  if (dateToken.length !== 8) dateToken = formatYmd_(new Date()).replace(/-/g, '');

  var placeToken = String(supplier || '').trim().replace(/\s+/g, '');
  if (!placeToken) placeToken = 'UNKNOWN';

  var prefix = 'SD-' + dateToken + '-' + placeToken + '-';

  var lastRow = sheet.getLastRow();
  var maxNo = 0;
  if (lastRow >= 2 && sheet.getMaxColumns() >= 19) {
    var values = sheet.getRange(2, 19, lastRow - 1, 1).getValues();
    values.forEach(function(row) {
      var slip = String(row[0] || '');
      if (slip.indexOf(prefix) === 0) {
        var tail = slip.substring(prefix.length);
        var n = parseInt(tail, 10);
        if (!isNaN(n) && n > maxNo) maxNo = n;
      }
    });
  }

  return prefix + padLeft_(maxNo + 1, 4);
}

function issueSalesSlipNo_(sheet, date, place) {
  var dateToken = String(date || '').replace(/[^0-9]/g, '').slice(0, 8);
  if (dateToken.length !== 8) dateToken = formatYmd_(new Date()).replace(/-/g, '');

  var placeToken = String(place || '').trim().replace(/\s+/g, '');
  if (!placeToken) placeToken = 'UNKNOWN';

  var prefix = 'SV-' + dateToken + '-' + placeToken + '-';
  var lastRow = sheet.getLastRow();
  var maxNo = 0;
  if (lastRow >= 2) {
    var values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    values.forEach(function(row) {
      var slip = String(row[0] || '');
      if (slip.indexOf(prefix) === 0) {
        var tail = slip.substring(prefix.length);
        var n = parseInt(tail, 10);
        if (!isNaN(n) && n > maxNo) maxNo = n;
      }
    });
  }
  return prefix + padLeft_(maxNo + 1, 4);
}

function upsertProductMasterByEntry_(productNo, name) {
  var trimmedName = String(name || '').trim();
  if (!trimmedName) return '';

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PRODUCT);
  if (!sheet) return '';
  ensureProductHeaders_(sheet);

  var requestedNo = String(productNo || '').trim();
  var found = findProductRow_(sheet, requestedNo, trimmedName);
  if (found.found) {
    var existedNo = String(found.productNo || '').trim();
    if (existedNo) return existedNo;

    var assignedNo = requestedNo || issueProductMasterNo_(sheet);
    sheet.getRange(found.row, 1).setValue(assignedNo);
    return assignedNo;
  }

  var newProductNo = requestedNo || issueProductMasterNo_(sheet);

  var row = [
    newProductNo,
    '',
    trimmedName,
    '',
    '',
    '',
    '',
    '',
    '',
    formatYmd_(new Date()),
    trimmedName,
    '',
    ''
  ];
  sheet.appendRow(row);
  return newProductNo;
}

function findProductRow_(sheet, productNo, name) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return { found: false };

  var values = sheet.getRange(2, 1, lastRow - 1, 3).getValues(); // A-C
  var targetNo = String(productNo || '').trim();
  var targetName = String(name || '').trim();

  for (var i = 0; i < values.length; i++) {
    var rowNo = String(values[i][0] || '').trim();
    var rowName = String(values[i][2] || '').trim();

    if (targetNo && rowNo && targetNo === rowNo) {
      return { found: true, row: i + 2, productNo: rowNo, name: rowName };
    }
    if (targetName && rowName && targetName === rowName) {
      return { found: true, row: i + 2, productNo: rowNo, name: rowName };
    }
  }
  return { found: false };
}

function getMasterCandidateList_(type, sourceSheetName, sourceCol) {
  ensureSeparatedMasterSheets_();

  var fromMaster = getMasterValues_(type);
  var fromSource = [];
  var excluded = getLegacyMasterValues_(type + '_exclude');
  var excludedMap = {};
  excluded.forEach(function(v) {
    excludedMap[String(v)] = true;
  });

  var sourceSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sourceSheetName);
  if (sourceSheet && sourceSheet.getLastRow() >= 2) {
    var values = sourceSheet.getRange(2, sourceCol, sourceSheet.getLastRow() - 1, 1).getValues();
    values.forEach(function(row) {
      var v = String(row[0] || '').trim();
      if (v && !excludedMap[v]) fromSource.push(v);
    });
  }

  return uniqueValues_(fromMaster.concat(fromSource))
    .filter(function(v) {
      return !excludedMap[String(v)];
    })
    .sort();
}

function upsertMasterValue_(type, value) {
  ensureSeparatedMasterSheets_();

  var itemType = String(type || '').trim();
  var itemValue = String(value || '').trim();
  if (!itemType || !itemValue) return;

  if (itemType.indexOf('_exclude') === -1) {
    removeMasterExclusion_(itemType, itemValue);
  }

  if (hasDedicatedMasterSheet_(itemType)) {
    upsertDedicatedMasterValue_(itemType, itemValue);
    return;
  }

  var sheet = ensureMasterSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    var values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
    for (var i = 0; i < values.length; i++) {
      if (String(values[i][0]).trim() === itemType && String(values[i][1]).trim() === itemValue) {
        return;
      }
    }
  }

  sheet.appendRow([itemType, itemValue, formatYmd_(new Date())]);
}

function removeMasterValue_(type, value) {
  ensureSeparatedMasterSheets_();

  var itemType = String(type || '').trim();
  var itemValue = String(value || '').trim();
  if (!itemType || !itemValue) return;

  if (hasDedicatedMasterSheet_(itemType)) {
    removeDedicatedMasterValue_(itemType, itemValue);
  }

  var sheet = ensureMasterSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  var values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  for (var i = values.length - 1; i >= 0; i--) {
    var rowType = String(values[i][0] || '').trim();
    var rowValue = String(values[i][1] || '').trim();
    if (rowType === itemType && rowValue === itemValue) {
      sheet.deleteRow(i + 2);
    }
  }
}

function removeMasterExclusion_(type, value) {
  removeMasterValue_(String(type || '').trim() + '_exclude', value);
}

function normalizeMasterType_(type) {
  var t = String(type || '').trim().toLowerCase();
  if (t === 'supplier' || t === 'payment' || t === 'sales_place' || t === 'salesplace' || t === 'place') {
    return t === 'salesplace' || t === 'place' ? 'sales_place' : t;
  }
  return '';
}

function getMasterValues_(type) {
  var itemType = String(type || '').trim();
  if (!itemType) return [];

  ensureSeparatedMasterSheets_();
  var legacy = getLegacyMasterValues_(itemType);
  if (!hasDedicatedMasterSheet_(itemType)) {
    return uniqueValues_(legacy);
  }
  var dedicated = getDedicatedMasterValues_(itemType);
  return uniqueValues_(dedicated.concat(legacy));
}

function getLegacyMasterValues_(type) {
  var itemType = String(type || '').trim();
  if (!itemType) return [];

  var sheet = ensureMasterSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  var out = [];
  values.forEach(function(row) {
    if (String(row[0]).trim() === itemType) {
      var v = String(row[1] || '').trim();
      if (v) out.push(v);
    }
  });
  return uniqueValues_(out);
}

function ensureMasterSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_MASTER);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_MASTER);
  }
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, 3).setValues([['種別', '値', '登録日']]);
  }
  return sheet;
}

function ensureSeparatedMasterSheets_() {
  ensureMasterSheet_();
  ensureDedicatedMasterSheetByType_('payment');
  ensureDedicatedMasterSheetByType_('sales_place');
  migrateLegacyMasterTypeToDedicated_('payment');
  migrateLegacyMasterTypeToDedicated_('sales_place');
}

function hasDedicatedMasterSheet_(type) {
  return !!getDedicatedMasterSheetNameByType_(type);
}

function getDedicatedMasterSheetNameByType_(type) {
  var itemType = normalizeMasterType_(type);
  if (itemType === 'payment') return SHEET_MASTER_PAYMENT;
  if (itemType === 'sales_place') return SHEET_MASTER_SALES_PLACE;
  return '';
}

function ensureDedicatedMasterSheetByType_(type) {
  var sheetName = getDedicatedMasterSheetNameByType_(type);
  if (!sheetName) return null;
  return ensureDedicatedMasterSheetByName_(sheetName);
}

function ensureDedicatedMasterSheetByName_(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, 2).setValues([['値', '登録日']]);
  }
  return sheet;
}

function getDedicatedMasterValues_(type) {
  var sheet = ensureDedicatedMasterSheetByType_(type);
  if (!sheet || sheet.getLastRow() < 2) return [];
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
  var out = [];
  values.forEach(function(row) {
    var v = String(row[0] || '').trim();
    if (v) out.push(v);
  });
  return uniqueValues_(out);
}

function upsertDedicatedMasterValue_(type, value) {
  var sheet = ensureDedicatedMasterSheetByType_(type);
  if (!sheet) return;
  var itemValue = String(value || '').trim();
  if (!itemValue) return;

  var lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    var values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < values.length; i++) {
      if (String(values[i][0] || '').trim() === itemValue) {
        return;
      }
    }
  }

  sheet.appendRow([itemValue, formatYmd_(new Date())]);
}

function removeDedicatedMasterValue_(type, value) {
  var sheet = ensureDedicatedMasterSheetByType_(type);
  if (!sheet || sheet.getLastRow() < 2) return;

  var itemValue = String(value || '').trim();
  if (!itemValue) return;

  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
  for (var i = values.length - 1; i >= 0; i--) {
    if (String(values[i][0] || '').trim() === itemValue) {
      sheet.deleteRow(i + 2);
    }
  }
}

function migrateLegacyMasterTypeToDedicated_(type) {
  if (!hasDedicatedMasterSheet_(type)) return;

  var values = getLegacyMasterValues_(type);
  values.forEach(function(v) {
    upsertDedicatedMasterValue_(type, v);
  });

  if (!values.length) return;

  var master = ensureMasterSheet_();
  var lastRow = master.getLastRow();
  if (lastRow < 2) return;

  var itemType = String(normalizeMasterType_(type) || type || '').trim();
  var rows = master.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = rows.length - 1; i >= 0; i--) {
    if (String(rows[i][0] || '').trim() === itemType) {
      master.deleteRow(i + 2);
    }
  }
}

function contains_(value, keyword) {
  if (value === null || value === undefined) return false;
  return String(value).indexOf(keyword) !== -1;
}

function normalizeDateInput_(v) {
  var s = String(v || '').trim();
  if (!s) return '';
  var digits = s.replace(/[^0-9]/g, '');
  if (digits.length >= 8) {
    return digits.slice(0, 8).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
  }
  return s;
}

function toNumberOrBlank_(v) {
  var n = toNumber_(v);
  return n ? n : '';
}

function toNumber_(v) {
  var n = Number(v);
  return isNaN(n) ? 0 : n;
}

function roundYen_(v) {
  return Math.round(toNumber_(v));
}

function padLeft_(n, len) {
  return ('000000000000' + n).slice(-len);
}

function parseNumberToken_(v) {
  if (v === null || v === undefined) return 0;
  var m = String(v).match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

function uniqueValues_(list) {
  var seen = {};
  var out = [];
  list.forEach(function(v) {
    var key = String(v || '').trim();
    if (!key) return;
    if (!seen[key]) {
      seen[key] = true;
      out.push(key);
    }
  });
  return out;
}

function buildBarcodeValue_(idToken, lineNo, productNo) {
  var pNo = String(idToken || '').trim() || 'S000000';
  var lNo = padLeft_(Math.max(1, parseNumberToken_(lineNo)), 3);
  var prod = String(productNo || '').trim().replace(/\s+/g, '');
  if (!prod) prod = 'NOITEM';
  return ['ERP', pNo, lNo, prod].join('-');
}

function buildBarcodeValuesByMode_(idToken, lineNo, productNo, qty, mode) {
  var normalizedMode = String(mode || '').trim();
  if (typeof normalizeInventoryIdModeInput_ === 'function') {
    normalizedMode = normalizeInventoryIdModeInput_(normalizedMode);
  }
  if (!normalizedMode) {
    var lower = String(mode || '').trim().toLowerCase();
    normalizedMode = (lower === 'unit') ? '個体単位' : '明細単位';
  }

  if (normalizedMode !== '個体単位') {
    return [buildBarcodeValue_(idToken, lineNo, productNo)];
  }

  var count = Math.max(1, roundYen_(toNumber_(qty || 1)));
  var base = buildBarcodeValue_(idToken, lineNo, productNo);
  var out = [];
  for (var i = 1; i <= count; i++) {
    out.push(base + '-U' + padLeft_(i, 3));
  }
  return out;
}

function buildInventoryIdsByMode_(seqState, qty, mode) {
  var normalizedMode = String(mode || '').trim();
  if (typeof normalizeInventoryIdModeInput_ === 'function') {
    normalizedMode = normalizeInventoryIdModeInput_(normalizedMode);
  }
  if (!normalizedMode) {
    normalizedMode = '明細単位';
  }

  var count = 1;
  if (normalizedMode === '個体単位') {
    count = Math.max(1, roundYen_(toNumber_(qty || 1)));
  }

  var out = [];
  for (var i = 0; i < count; i++) {
    seqState.current += 1;
    out.push('I' + padLeft_(seqState.current, 8));
  }
  return out;
}

function parseInventoryIdSequence_(value) {
  var text = String(value || '').trim();
  var m = text.match(/^I(\d{4,})$/);
  if (m) return parseInt(m[1], 10);
  return 0;
}

function issueProductMasterNo_(sheet) {
  var lastRow = sheet.getLastRow();
  var maxNo = 999;
  if (lastRow >= 2) {
    var values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    values.forEach(function(row) {
      var token = String(row[0] || '').trim();
      if (!token) return;
      var n = parseInt(token, 10);
      if (!isNaN(n) && n > maxNo && token.length <= 6) {
        maxNo = n;
      }
    });
  }
  return padLeft_(maxNo + 1, 4);
}

// 在庫表/商品情報のヘッダを現行仕様へ揃える（メニュー未実装のため手動実行用）
function applyErpSchemaUpdates() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var inventorySheet = ss.getSheetByName(SHEET_INVENTORY);
  if (!inventorySheet) {
    inventorySheet = ss.insertSheet(SHEET_INVENTORY);
  }
  ensureInventoryHeaders_(inventorySheet);

  var productSheet = ss.getSheetByName(SHEET_PRODUCT);
  if (!productSheet) {
    productSheet = ss.insertSheet(SHEET_PRODUCT);
  }
  ensureProductHeaders_(productSheet);

  var salesSlipSheet = ensureSalesSlipSheet_();
  ensureSeparatedMasterSheets_();

  var setupOk = false;
  try {
    if (typeof ensureErpSettingsSetup_ === 'function') {
      ensureErpSettingsSetup_();
      setupOk = true;
    }
  } catch (e) {
    setupOk = false;
  }

  return {
    ok: true,
    inventorySheet: SHEET_INVENTORY,
    productSheet: SHEET_PRODUCT,
    salesSlipSheet: SHEET_SALES_SLIP,
    paymentMasterSheet: SHEET_MASTER_PAYMENT,
    salesPlaceMasterSheet: SHEET_MASTER_SALES_PLACE,
    settingsPrepared: setupOk,
    inventoryHeaders: inventorySheet.getRange(1, 1, 1, 21).getValues()[0],
    productHeaders: productSheet.getRange(1, 1, 1, 13).getValues()[0],
    salesSlipHeaders: salesSlipSheet.getRange(1, 1, 1, 11).getValues()[0]
  };
}

// スプレッドシート編集メンテナンス（売上系）
// - 売上済み行の在庫数を0に統一
// - 販売場所候補をマスタへ再登録
// - 売上伝票シートヘッダを整備
function runSalesSheetMaintenance() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var inventorySheet = ss.getSheetByName(SHEET_INVENTORY);
  if (!inventorySheet) throw new Error('在庫表シートがありません');
  ensureInventoryHeaders_(inventorySheet);
  ensureSalesSlipSheet_();

  var lastRow = inventorySheet.getLastRow();
  var fixedQtyRows = 0;
  var placeCount = 0;
  if (lastRow >= 2) {
    var values = inventorySheet.getRange(2, 1, lastRow - 1, 21).getValues();
    values.forEach(function(row, idx) {
      var rowNo = idx + 2;
      var salesDate = String(row[12] || '').trim();
      var salesAmount = roundYen_(toNumber_(row[13]));
      var qty = roundYen_(toNumber_(row[8]));
      var place = String(row[14] || '').trim();

      if ((salesDate || salesAmount > 0) && qty !== 0) {
        inventorySheet.getRange(rowNo, 9).setValue(0);
        fixedQtyRows += 1;
      }
      if (place) {
        upsertMasterValue_('sales_place', place);
        placeCount += 1;
      }
    });
  }

  return {
    success: true,
    message: '売上メンテナンス完了',
    fixedQtyRows: fixedQtyRows,
    scannedRows: Math.max(0, lastRow - 1),
    placeRowsScanned: placeCount
  };
}

function markBarcodePrintStatus_(sheet, startRow, count, status) {
  var row = Math.max(2, parseNumberToken_(startRow));
  var n = Math.max(0, parseNumberToken_(count));
  if (!n) return;
  var value = String(status || '').trim();
  var values = [];
  for (var i = 0; i < n; i++) {
    values.push([value]);
  }
  sheet.getRange(row, 21, n, 1).setValues(values);
}

function formatYmd_(date) {
  return Utilities.formatDate(date, TZ, 'yyyy-MM-dd');
}
```

## settings.gs

```javascript
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

## slip.gs

```javascript
var ERP_OUTPUT_FOLDER_ID = '1he6UfP9Nm7FGMEVxvIukkI831-5b8CY6';

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
  body.appendParagraph('A4縦印刷 / 左:伝票詳細 右:空白');
  body.appendParagraph('');

  var layoutTable = body.appendTable([['', '']]);
  layoutTable.setBorderWidth(0);
  var leftCell = layoutTable.getCell(0, 0);
  var rightCell = layoutTable.getCell(0, 1);

  leftCell.appendParagraph('伝票番号: ' + data.slipNo);
  leftCell.appendParagraph('仕入日: ' + data.purchaseDate);
  leftCell.appendParagraph('仕入先: ' + data.supplier);
  leftCell.appendParagraph('支払い方法: ' + data.payment);
  leftCell.appendParagraph('作成日時: ' + data.createdAt);
  leftCell.appendParagraph('');

  var itemTable = [['No', '商品個別番号', '商品マスタ番号', '商品名', '提示金額', 'ポイント', '経費按分', '原価', '個数', '単価']];
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
  leftCell.appendParagraph('商品明細').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  leftCell.appendTable(itemTable);
  leftCell.appendParagraph('');

  var expenseTable = [['No', '内容', '金額', 'メモ']];
  if (data.expenses && data.expenses.length) {
    data.expenses.forEach(function(ex) {
      expenseTable.push([String(ex.lineNo), ex.name, formatYen_(ex.amount), ex.memo]);
    });
  } else {
    expenseTable.push(['', 'なし', '0', '']);
  }
  leftCell.appendParagraph('経費明細').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  leftCell.appendTable(expenseTable);
  leftCell.appendParagraph('');

  leftCell.appendParagraph('集計').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  leftCell.appendTable([
    ['項目', '値'],
    ['総個数', String(data.totals.qty)],
    ['総提示金額', formatYen_(data.totals.price)],
    ['ポイント合計', formatYen_(data.totals.point)],
    ['経費入力合計', formatYen_(data.totals.expenseInputTotal)],
    ['経費按分合計', formatYen_(data.totals.expenseAlloc)],
    ['原価合計', formatYen_(data.totals.cost)],
    ['平均単価', formatYen_(data.totals.avgUnitPrice)]
  ]);

  // 右側は将来のレシートサーマル運用を見据えて空白を維持する。
  rightCell.setText('');

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
```

## style.css.html

```html
body {
  font-size: 18px;
  line-height: 1.45;
  background: #f4f6f8;
  color: #1f2933;
  margin: 0;
  padding: 0 0 2.2em 0;
}

.section {
  background: #ffffff;
  margin: 1.1em auto;
  padding: 1.1em 1.2em;
  max-width: 1100px;
  border-radius: 12px;
  border: 1px solid #d5dbe3;
}

.section-title {
  font-size: 1.45em;
  font-weight: 700;
  margin: 0 0 0.8em 0;
  color: #0f4c81;
}

.mid-title {
  font-size: 1.15em;
  font-weight: 700;
  margin: 0 0 0.7em 0;
  color: #0f4c81;
}

.section-card {
  border: 1px solid #cbd8e6;
  background: #fafcff;
}

.input-row {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  align-items: center;
  gap: 0.7em;
  margin-bottom: 0.55em;
}

.row-label {
  font-weight: 700;
  color: #243b53;
}

.input-main,
.input-select,
.form-input,
select,
input[type="text"] {
  width: 100%;
  box-sizing: border-box;
  font-size: 1.05em;
  padding: 0.54em 0.6em;
  border: 1.6px solid #afbdd0;
  border-radius: 8px;
  background: #fff;
  color: #1f2933;
}

input:focus,
select:focus {
  outline: 3px solid #cbe4ff;
  border-color: #2a6fae;
}

.button-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6em;
  margin-top: 0.65em;
}

.list-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0.35em;
}

.btn-main,
button {
  background: #0f6ab4;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.62em 1.1em;
  font-size: 1em;
  font-weight: 700;
  cursor: pointer;
}

.btn-sub {
  background: #64748b;
  color: #fff;
}

.btn-small {
  font-size: 0.88em;
  padding: 0.44em 0.65em;
  margin-right: 0.3em;
  margin-bottom: 0.2em;
}

.btn-main:hover,
button:hover {
  background: #0c5692;
}

.btn-sub:hover {
  background: #4f5f77;
}

button:disabled {
  background: #9fb5c8;
  cursor: default;
}

.btn-link {
  display: inline-block;
  text-decoration: none;
  background: #0f6ab4;
  color: #fff;
  border-radius: 8px;
  padding: 0.62em 1.1em;
  font-size: 1em;
  font-weight: 700;
}

.btn-icon {
  width: 34px;
  height: 34px;
  min-width: 34px;
  border-radius: 50%;
  border: none;
  font-size: 1.15em;
  font-weight: 700;
  padding: 0;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.btn-icon-plus {
  background: #0f6ab4;
  color: #fff;
}

.btn-icon-minus {
  background: #8f9eb1;
  color: #fff;
}

.btn-icon:hover {
  opacity: 0.9;
}

.mode-switch-wrap {
  display: inline-flex;
  border: 1px solid #afbdd0;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 0.7em;
}

.mode-btn {
  border: none;
  background: #eef3f8;
  color: #334e68;
  padding: 0.55em 1.05em;
  font-size: 0.95em;
  font-weight: 700;
  cursor: pointer;
}

.mode-btn.active {
  background: #0f6ab4;
  color: #fff;
}

.note-text {
  color: #52606d;
  font-size: 0.92em;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 0.55em;
  font-size: 0.88em;
  min-width: 760px;
}

th,
td {
  border: 1px solid #d5dce5;
  padding: 0.43em 0.48em;
  text-align: left;
  vertical-align: middle;
}

th {
  background: #eaf1f7;
  color: #243b53;
  font-weight: 700;
}

.summary-grid {
  display: grid;
  grid-template-columns: 210px minmax(0, 1fr);
  gap: 0.42em 0.8em;
  font-size: 1em;
}

.summary-grid div:nth-child(odd) {
  font-weight: 700;
  color: #334e68;
}

.entry-line-card {
  border: 1px solid #d5dce5;
  border-radius: 8px;
  background: #fbfcfd;
  padding: 0.8em;
  margin-top: 0.8em;
  overflow-x: auto;
}

.entry-line-title {
  font-weight: 700;
  color: #0f4c81;
  margin-bottom: 0.45em;
  white-space: nowrap;
}

.value-box {
  width: 100%;
  min-height: 2.3em;
  box-sizing: border-box;
  padding: 0.48em 0.6em;
  border: 1.5px solid #d0d7e2;
  border-radius: 8px;
  background: #f7f9fc;
}

.confirm-block {
  margin-bottom: 1em;
  padding: 0.7em;
  border: 1px solid #d5dce5;
  border-radius: 8px;
  background: #fbfcfd;
}

.confirm-title {
  font-weight: 700;
  color: #0f4c81;
  margin-bottom: 0.55em;
}

.confirm-kv-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5em 0.7em;
}

.kv-label {
  font-size: 0.84em;
  color: #5b7085;
}

.kv-value {
  font-size: 1.02em;
  font-weight: 700;
  color: #243b53;
}

.confirm-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.55em;
}

.sum-item {
  border: 1px solid #d5dce5;
  border-radius: 8px;
  padding: 0.55em 0.6em;
  background: #fff;
}

.sum-item.highlight {
  border-color: #0f6ab4;
  background: #eef6ff;
}

.sum-label {
  color: #5b7085;
  font-size: 0.84em;
  margin-bottom: 0.2em;
}

.sum-value {
  font-weight: 700;
  color: #243b53;
  font-size: 1.02em;
}

.result-success {
  font-size: 1.02em;
  font-weight: 700;
  color: #0f5132;
}

.form-row {
  display: grid;
  grid-template-columns: 170px minmax(0, 1fr);
  align-items: center;
  gap: 0.6em;
  margin-bottom: 0.55em;
}

.form-label {
  font-weight: 700;
  color: #243b53;
}

.form-btns {
  display: flex;
  align-items: center;
  gap: 0.65em;
  margin-top: 0.7em;
}

.modal-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1000;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
}

.modal-card {
  background: #fff;
  padding: 1.1em;
  max-width: 760px;
  width: 96%;
  border-radius: 12px;
  border: 1px solid #d5dce5;
  position: relative;
  max-height: 92vh;
  overflow: auto;
}

.modal-close {
  position: absolute;
  top: 8px;
  right: 12px;
  cursor: pointer;
  font-size: 1.8em;
  color: #243b53;
}

.inline-scroll {
  width: 100%;
  overflow-x: auto;
}

.entry-inline-table {
  width: 100%;
  min-width: 1240px;
  border-collapse: collapse;
  margin-top: 0.35em;
  font-size: 0.9em;
}

.entry-inline-table th,
.entry-inline-table td {
  border: 1px solid #d5dce5;
  padding: 0.38em 0.4em;
  vertical-align: middle;
  white-space: nowrap;
}

.entry-inline-table th {
  background: #eaf1f7;
  color: #243b53;
  font-weight: 700;
}

.entry-inline-table .col-no {
  width: 52px;
  text-align: center;
}

.entry-inline-table .col-item {
  min-width: 290px;
}

.entry-inline-table .col-num {
  width: 104px;
}

.entry-inline-table .col-action {
  width: 170px;
}

.inline-input,
.inline-number {
  width: 100%;
  box-sizing: border-box;
  font-size: 1em;
  padding: 0.42em 0.48em;
  border: 1.4px solid #afbdd0;
  border-radius: 7px;
  background: #fff;
  color: #1f2933;
}

.inline-value {
  min-height: 2.2em;
  box-sizing: border-box;
  padding: 0.42em 0.48em;
  border: 1.4px solid #d0d7e2;
  border-radius: 7px;
  background: #f7f9fc;
  color: #243b53;
  font-weight: 700;
}

.inline-actions {
  display: flex;
  gap: 0.35em;
  align-items: center;
}

.inline-actions .btn-main,
.inline-actions .btn-sub,
.inline-actions button {
  width: auto;
  min-width: 74px;
  padding: 0.48em 0.72em;
  font-size: 0.92em;
}

.unified-input-table td {
  white-space: nowrap;
}

.unified-entry-card .inline-value {
  min-height: 2.05em;
}

.expense-inline-row,
.point-inline-row,
.common-inline-row,
.candidate-inline-row {
  display: grid;
  align-items: center;
  gap: 0.5em;
  min-width: 940px;
}

.expense-inline-row {
  grid-template-columns: 48px minmax(180px, 1fr) 48px 120px 38px minmax(220px, 1fr) 128px;
}

.point-inline-row {
  grid-template-columns: 64px minmax(220px, 1fr);
  min-width: 420px;
}

.common-inline-row {
  grid-template-columns: 48px 150px 58px minmax(230px, 1fr) 66px minmax(210px, 1fr);
}

.candidate-inline-row {
  grid-template-columns: 58px 140px 58px 150px 58px minmax(220px, 1fr) 112px 112px;
}

.inline-label {
  font-weight: 700;
  color: #243b53;
  white-space: nowrap;
}

.expense-inline-row .btn-main,
.common-inline-row .btn-main,
.common-inline-row .btn-sub,
.candidate-inline-row .btn-main,
.candidate-inline-row .btn-sub,
.expense-inline-row button,
.common-inline-row button,
.candidate-inline-row button {
  width: auto;
  min-width: 90px;
  padding: 0.52em 0.74em;
}

@media (max-width: 900px) {
  .section {
    margin: 0.7em 0.4em;
    padding: 0.9em 0.7em;
  }

  .input-row {
    grid-template-columns: 185px minmax(0, 1fr);
  }

  .summary-grid {
    grid-template-columns: 170px minmax(0, 1fr);
  }

  .confirm-kv-grid {
    grid-template-columns: 1fr;
  }

  .confirm-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .form-row {
    grid-template-columns: 150px minmax(0, 1fr);
  }

  .entry-inline-table {
    min-width: 1120px;
  }

  .expense-inline-row,
  .point-inline-row,
  .common-inline-row,
  .candidate-inline-row {
    min-width: 860px;
  }

  .point-inline-row {
    min-width: 360px;
  }
}

@media (max-width: 560px) {
  body {
    font-size: 17px;
  }

  .section-title {
    font-size: 1.28em;
  }

  .input-row {
    grid-template-columns: 145px minmax(0, 1fr);
    gap: 0.5em;
  }

  .summary-grid {
    grid-template-columns: 130px minmax(0, 1fr);
  }

  .mode-switch-wrap {
    display: flex;
    width: 100%;
  }

  .mode-btn {
    flex: 1;
    text-align: center;
  }

  .confirm-summary-grid {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 130px minmax(0, 1fr);
  }

  .button-row .btn-main,
  .button-row button,
  .button-row .btn-link {
    width: 100%;
    text-align: center;
  }

  .entry-inline-table {
    min-width: 980px;
  }

  .expense-inline-row,
  .point-inline-row,
  .common-inline-row,
  .candidate-inline-row {
    min-width: 780px;
  }

  .point-inline-row {
    min-width: 320px;
  }
}
```

