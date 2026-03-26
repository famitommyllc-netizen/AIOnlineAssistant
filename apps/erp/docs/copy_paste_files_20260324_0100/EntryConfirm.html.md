# EntryConfirm.html

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
    <h2 class="section-title">仕入登録 最終確認</h2>
    <div id="confirm-error" class="note-text" style="display:none;color:#b00020;"></div>
    <div id="confirm-slip-area"></div>
    <div class="button-row">
      <button type="button" id="confirm-register-btn" class="btn-main" onclick="submitConfirmedEntry()">登録実行</button>
      <button type="button" class="btn-sub" onclick="goBackToEntry()">戻る</button>
      <span id="confirm-status"></span>
    </div>
  </div>

<script>
let draftToken = '';
let draftPayload = null;
const ENTRY_CONFIRM_WINDOW_TOKEN_PREFIX_ = 'erp_entry_confirm_token:';

window.onload = function() {
  try {
    draftToken = getQueryParam_('token') || getTokenFromWindowName_();
    if (!draftToken) {
      throw new Error('確認トークンがありません。仕入入力からやり直してください。');
    }
    setTokenToWindowName_(draftToken);
    loadDraftForConfirm_();
  } catch (err) {
    showError(err);
  }
};

function getQueryParam_(name) {
  try {
    const url = new URL(window.location.href);
    const fromQuery = String(url.searchParams.get(name) || '').trim();
    if (fromQuery) return fromQuery;
    const hash = String(url.hash || '').replace(/^#/, '');
    if (!hash) return '';
    const hashParams = new URLSearchParams(hash);
    return String(hashParams.get(name) || '').trim();
  } catch (err) {
    const query = String(window.location.search || '').replace(/^\?/, '');
    if (query) {
      const pairs = query.split('&');
      for (let i = 0; i < pairs.length; i++) {
        const parts = pairs[i].split('=');
        if (decodeURIComponent(parts[0] || '') !== String(name || '')) continue;
        return decodeURIComponent(parts[1] || '').trim();
      }
    }
    const hash = String(window.location.hash || '').replace(/^#/, '');
    if (!hash) return '';
    const pairs = hash.split('&');
    for (let j = 0; j < pairs.length; j++) {
      const parts = pairs[j].split('=');
      if (decodeURIComponent(parts[0] || '') !== String(name || '')) continue;
      return decodeURIComponent(parts[1] || '').trim();
    }
    return '';
  }
}

function getTokenFromWindowName_() {
  try {
    const raw = String(window.name || '');
    if (raw.indexOf(ENTRY_CONFIRM_WINDOW_TOKEN_PREFIX_) !== 0) return '';
    return String(raw.substring(ENTRY_CONFIRM_WINDOW_TOKEN_PREFIX_.length) || '').trim();
  } catch (err) {
    return '';
  }
}

function setTokenToWindowName_(token) {
  const safeToken = String(token || '').trim();
  if (!safeToken) return;
  try {
    window.name = ENTRY_CONFIRM_WINDOW_TOKEN_PREFIX_ + safeToken;
  } catch (err) {
    // no-op
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
      onSuccess(fallback);
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

function navigateToPage_(page, params) {
  resolveWebAppPageUrl_(page, params, function(nextUrl) {
    window.location.href = nextUrl;
  }, showError);
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function roundYen(value) {
  return Math.round(toNumber(value));
}

function formatWithComma_(value) {
  return String(roundYen(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatYen_(value) {
  return formatWithComma_(value) + '円';
}

function loadDraftForConfirm_() {
  google.script.run
    .withSuccessHandler(function(payload) {
      draftPayload = payload || null;
      renderConfirmSlip_(draftPayload);
    })
    .withFailureHandler(showError)
    .getEntryDraftForConfirm(draftToken);
}

function parseEntryRows_(entries) {
  return (Array.isArray(entries) ? entries : []).map(function(row) {
    return {
      productNo: String(row[0] || '').trim(),
      name: String(row[1] || '').trim(),
      price: roundYen(row[2]),
      point: roundYen(row[3]),
      cost: roundYen(row[4]),
      qty: Math.max(1, roundYen(row[5] || 1)),
      unitPrice: roundYen(row[6]),
      expenseAlloc: roundYen(row[7])
    };
  });
}

function parseExpenseRows_(expenses) {
  return (Array.isArray(expenses) ? expenses : []).map(function(ex) {
    return {
      name: String(ex.name || '').trim(),
      amount: roundYen(ex.amount),
      memo: String(ex.memo || '').trim()
    };
  });
}

function computeTotals_(rows, expenses, expenseMode) {
  const totals = {
    qty: 0,
    price: 0,
    point: 0,
    expenseAlloc: 0,
    cost: 0,
    expenseInput: 0
  };

  rows.forEach(function(row) {
    totals.qty += roundYen(row.qty);
    totals.price += roundYen(row.price);
    totals.point += roundYen(row.point);
    totals.expenseAlloc += roundYen(row.expenseAlloc);
    totals.cost += roundYen(row.cost);
  });
  expenses.forEach(function(ex) {
    totals.expenseInput += roundYen(ex.amount);
  });

  totals.expenseTotal = String(expenseMode || 'allocation') === 'individual'
    ? totals.expenseAlloc
    : totals.expenseInput;
  return totals;
}

function renderConfirmSlip_(payload) {
  const p = payload || {};
  const info = p.commonInfo || {};
  const rows = parseEntryRows_(p.entries);
  const expenses = parseExpenseRows_(p.expenses);
  const totals = computeTotals_(rows, expenses, p.expenseMode);
  const pointModeLabel = String(p.pointMode || 'allocation') === 'individual' ? '個別入力' : '分配入力';
  const expenseModeLabel = String(p.expenseMode || 'allocation') === 'individual' ? '個別入力' : '分配入力';

  let detailRows = '';
  rows.forEach(function(row, idx) {
    detailRows += '<tr>' +
      '<td>' + (idx + 1) + '</td>' +
      '<td>' + escapeHtml(row.productNo) + '</td>' +
      '<td>' + escapeHtml(row.name) + '</td>' +
      '<td>' + formatYen_(row.price) + '</td>' +
      '<td>' + formatYen_(row.point) + '</td>' +
      '<td>' + formatYen_(row.expenseAlloc) + '</td>' +
      '<td>' + formatYen_(row.cost) + '</td>' +
      '<td>' + formatWithComma_(row.qty) + '</td>' +
      '<td>' + formatYen_(row.unitPrice) + '</td>' +
    '</tr>';
  });

  let expenseRows = '';
  if (!expenses.length) {
    expenseRows = '<tr><td colspan="4">なし</td></tr>';
  } else {
    expenses.forEach(function(ex, idx) {
      expenseRows += '<tr>' +
        '<td>' + (idx + 1) + '</td>' +
        '<td>' + escapeHtml(ex.name) + '</td>' +
        '<td>' + formatYen_(ex.amount) + '</td>' +
        '<td>' + escapeHtml(ex.memo) + '</td>' +
      '</tr>';
    });
  }

  document.getElementById('confirm-slip-area').innerHTML =
    '<div class="confirm-block section-card">' +
      '<div class="confirm-title">仕入伝票（登録前確認）</div>' +
    '</div>' +

    '<div class="confirm-block section-card">' +
      '<div class="confirm-title">商品明細</div>' +
      '<div class="table-wrap">' +
        '<table>' +
          '<tr><th>No</th><th>商品マスタ番号</th><th>商品名</th><th>提示金額</th><th>ポイント/割引</th><th>経費</th><th>原価</th><th>個数</th><th>単価</th></tr>' +
          detailRows +
        '</table>' +
      '</div>' +
    '</div>' +

    '<div class="confirm-block section-card">' +
      '<div class="confirm-title">経費・ポイント/割引</div>' +
      '<div class="summary-table-wrap" style="margin-bottom:0.6em;">' +
        '<table class="summary-table summary-meta-table">' +
          '<thead><tr><th>ポイント入力方式</th><th>経費入力方式</th></tr></thead>' +
          '<tbody><tr class="summary-text-row"><td>' + escapeHtml(pointModeLabel) + '</td><td>' + escapeHtml(expenseModeLabel) + '</td></tr></tbody>' +
        '</table>' +
      '</div>' +
      '<div class="table-wrap">' +
        '<table>' +
          '<tr><th>No</th><th>内容</th><th>金額</th><th>メモ</th></tr>' +
          expenseRows +
        '</table>' +
      '</div>' +
    '</div>' +

    '<div class="confirm-block section-card">' +
      '<div class="confirm-title">集計</div>' +
      '<div class="summary-table-wrap">' +
        '<table class="summary-table">' +
          '<thead><tr><th>商品数</th><th>総提示金額</th><th>ポイント合計</th><th>経費合計</th><th>原価合計</th></tr></thead>' +
          '<tbody><tr class="summary-value-row">' +
            '<td class="count-cell">' + formatWithComma_(totals.qty) + '</td>' +
            '<td>' + formatYen_(totals.price) + '</td>' +
            '<td>' + formatYen_(totals.point) + '</td>' +
            '<td>' + formatYen_(totals.expenseTotal) + '</td>' +
            '<td class="is-emphasis">' + formatYen_(totals.cost) + '</td>' +
          '</tr></tbody>' +
        '</table>' +
      '</div>' +
    '</div>' +

    '<div class="confirm-block section-card">' +
      '<div class="confirm-title">共通情報</div>' +
      '<div class="summary-table-wrap">' +
        '<table class="summary-table summary-meta-table">' +
          '<thead><tr><th>伝票番号</th><th>仕入日</th><th>仕入先</th><th>支払い方法</th></tr></thead>' +
          '<tbody><tr class="summary-text-row">' +
            '<td>登録時採番</td>' +
            '<td>' + escapeHtml(String(info.date || '').trim()) + '</td>' +
            '<td>' + escapeHtml(String(info.supplier || '').trim()) + '</td>' +
            '<td>' + escapeHtml(String(info.payment || '').trim()) + '</td>' +
          '</tr></tbody>' +
        '</table>' +
      '</div>' +
    '</div>';
}

function submitConfirmedEntry() {
  if (!draftToken) {
    showError('確認トークンがありません');
    return;
  }
  const submitBtn = document.getElementById('confirm-register-btn');
  const statusEl = document.getElementById('confirm-status');
  if (submitBtn) submitBtn.disabled = true;
  if (statusEl) statusEl.textContent = '登録中...';

  google.script.run
    .withSuccessHandler(function(res) {
      const result = (typeof res === 'string') ? { message: res } : (res || {});
      if (statusEl) statusEl.textContent = '登録完了';
      if (submitBtn) submitBtn.disabled = false;

      if (result && result.pdf && result.pdf.success === false) {
        alert('仕入登録は完了しましたが、伝票PDF保存に失敗しました: ' + String(result.pdf.error || ''));
      }

      const shouldPrint = confirm('仕入伝票を印刷しますか？');
      if (shouldPrint) {
        if (result && result.pdf && result.pdf.success && result.pdf.url) {
          window.location.href = String(result.pdf.url);
          return;
        }
        alert('印刷対象の伝票PDFがありません。');
      }
      navigateToPage_('entry', { token: '' });
    })
    .withFailureHandler(function(err) {
      if (submitBtn) submitBtn.disabled = false;
      if (statusEl) statusEl.textContent = '';
      showError(err);
    })
    .submitEntryDraftForConfirm(draftToken);
}

function goBackToEntry() {
  setTokenToWindowName_(draftToken);
  navigateToPage_('entry', { token: draftToken });
}

function showError(err) {
  const msg = err && err.message ? err.message : String(err);
  const box = document.getElementById('confirm-error');
  if (box) {
    box.textContent = msg;
    box.style.display = 'block';
  }
  alert('エラー: ' + msg);
}
  </script>
</body>
</html>

```
