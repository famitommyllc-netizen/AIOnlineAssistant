# SalesForm.html

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
      '<td class="col-num">' +
        '<div class="date-input-wrap">' +
          '<input type="hidden" id="sales-date">' +
          '<input type="date" id="sales-date-picker" class="date-picker-hidden" oninput="onDatePickerChange(\'sales-date\', \'sales-date-picker\')" onchange="onDatePickerChange(\'sales-date\', \'sales-date-picker\')">' +
        '</div>' +
      '</td>' +
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
    const date = normalizeDateDigits_(String((document.getElementById('sales-date') && document.getElementById('sales-date').value) || '').trim());
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
