# Report.html

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
