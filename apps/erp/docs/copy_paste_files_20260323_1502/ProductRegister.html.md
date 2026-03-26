# ProductRegister.html

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
