const headerHistoryBtn = document.getElementById('headerHistoryBtn');
const headerSettingsBtn = document.getElementById('headerSettingsBtn');
const backProfitBtn = document.getElementById('backProfitBtn');
const profitHistory = document.getElementById('profitHistory');

const folderPlusBtn = document.getElementById('folderPlusBtn');
const folderAddForm = document.getElementById('folderAddForm');
const folderNameInput = document.getElementById('folderNameInput');
const folderAddBtn = document.getElementById('folderAddBtn');
const folderList = document.getElementById('folderList');
const folderFilter = document.getElementById('folderFilter');

let shippingOptions = [];
let packingOptions = [];
let folders = [];
let editingRecordId = null;
let editingFolderId = null;
let recordsCache = [];
let folderFilterId = 'all';

function notify(message, type = 'success') {
  if (window.AppFeedback && typeof window.AppFeedback.showNotice === 'function') {
    window.AppFeedback.showNotice(message, { type });
    return;
  }
  console.log(message);
}

async function askConfirm(message) {
  if (window.AppFeedback && typeof window.AppFeedback.confirm === 'function') {
    return window.AppFeedback.confirm(message, { okLabel: 'はい', cancelLabel: 'いいえ' });
  }
  return window.confirm(message);
}

function createFolderId() {
  return `folder_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function money(v, locale = 'ja-JP', currency = 'JPY') {
  const amount = Number(v || 0);
  if (String(currency || '').toUpperCase() === 'JPY') {
    try {
      return `${new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 0 }).format(amount)}円`;
    } catch {
      return `${Math.floor(amount)}円`;
    }
  }
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return String(amount);
  }
}

function fmtDate(iso) {
  try {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function unitLabel(locale = 'ja-JP', currency = 'JPY') {
  if (String(currency).toUpperCase() === 'JPY' && String(locale).startsWith('ja')) return '円';
  return String(currency || 'JPY').toUpperCase();
}

function buildOptionLabel(opt, locale, currency) {
  const name = String(opt?.name || '未設定');
  return `${name}（${money(opt?.cost || 0, locale, currency)}）`;
}

function createNumberInput(value, step = '1') {
  const input = document.createElement('input');
  input.type = 'number';
  input.min = '0';
  input.step = step;
  input.value = String(Number(value || 0));
  input.required = true;
  return input;
}

function buildLabeledField(label, control) {
  const field = document.createElement('label');
  field.className = 'field-row';
  const span = document.createElement('span');
  span.textContent = label;
  field.appendChild(span);
  field.appendChild(control);
  return field;
}

function buildInputWithUnit(input, unitText) {
  const wrap = document.createElement('div');
  wrap.className = 'input-with-unit';
  const unit = document.createElement('span');
  unit.className = 'input-unit';
  unit.textContent = unitText;
  wrap.append(input, unit);
  return wrap;
}

function normalizeFolders(list) {
  const src = Array.isArray(list) ? list : [];
  if (!src.length) return [{ id: 'folder_inbox', name: 'inbox' }];
  const out = [];
  for (const raw of src) {
    const id = String(raw?.id || '').trim();
    const name = String(raw?.name || '').trim();
    if (!id || !name) continue;
    if (out.some((f) => f.id === id)) continue;
    out.push({ id, name });
  }
  if (!out.length) return [{ id: 'folder_inbox', name: 'inbox' }];
  if (!out.some((f) => f.id === 'folder_inbox')) {
    out.unshift({ id: 'folder_inbox', name: 'inbox' });
  }
  return out;
}

function getInboxFolderId() {
  if (folders.some((f) => f.id === 'folder_inbox')) return 'folder_inbox';
  return folders[0]?.id || 'folder_inbox';
}

function getFolderName(folderId) {
  return folders.find((f) => f.id === String(folderId || ''))?.name || 'inbox';
}

function buildFolderSelect(selectedId) {
  const select = document.createElement('select');
  for (const folder of folders) {
    const opt = document.createElement('option');
    opt.value = folder.id;
    opt.textContent = folder.name;
    select.appendChild(opt);
  }
  select.value = String(selectedId || getInboxFolderId());
  return select;
}

async function saveFolderState(nextFolders, successMessage) {
  const payload = {
    shippingOptions,
    packingOptions,
    folders: normalizeFolders(nextFolders)
  };
  const res = await fetch('/api/tools/profit/options', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    notify('フォルダ設定の保存に失敗しました。', 'error');
    return;
  }
  editingFolderId = null;
  if (folderAddForm) folderAddForm.hidden = true;
  if (folderNameInput) folderNameInput.value = '';
  notify(successMessage || '保存しました。', 'success');
  await refresh();
}

function renderFolderFilter() {
  if (!folderFilter) return;
  const prev = folderFilterId;
  folderFilter.innerHTML = '';

  const allOpt = document.createElement('option');
  allOpt.value = 'all';
  allOpt.textContent = 'すべて';
  folderFilter.appendChild(allOpt);

  for (const folder of folders) {
    const opt = document.createElement('option');
    opt.value = folder.id;
    opt.textContent = folder.name;
    folderFilter.appendChild(opt);
  }

  const valid = prev === 'all' || folders.some((f) => f.id === prev);
  folderFilterId = valid ? prev : 'all';
  folderFilter.value = folderFilterId;
}

function renderFolderList() {
  if (!folderList) return;
  folderList.innerHTML = '';

  for (const folder of folders) {
    const li = document.createElement('li');
    li.className = 'option-item';

    if (editingFolderId === folder.id) {
      const edit = document.createElement('div');
      edit.className = 'option-item-edit';

      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.value = folder.name;
      nameInput.placeholder = 'フォルダ名';

      const saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.textContent = '保存';
      saveBtn.addEventListener('click', async () => {
        const name = nameInput.value.trim();
        if (!name) {
          notify('フォルダ名を入力してください。', 'error');
          return;
        }
        const next = folders.map((f) => (f.id === folder.id ? { ...f, name } : f));
        await saveFolderState(next, 'フォルダを更新しました。');
      });

      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'secondary';
      cancelBtn.textContent = 'キャンセル';
      cancelBtn.addEventListener('click', () => {
        editingFolderId = null;
        renderFolderList();
      });

      edit.append(nameInput, saveBtn, cancelBtn);
      li.appendChild(edit);
      folderList.appendChild(li);
      continue;
    }

    const label = document.createElement('div');
    label.className = 'option-item-label';
    const fixed = folder.id === 'folder_inbox' ? '（固定）' : '';
    label.textContent = `・${folder.name}${fixed}`;

    const actions = document.createElement('div');
    actions.className = 'option-item-actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'secondary';
    editBtn.textContent = '編集';
    editBtn.addEventListener('click', () => {
      editingFolderId = folder.id;
      renderFolderList();
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'secondary';
    deleteBtn.textContent = '削除';
    deleteBtn.disabled = folder.id === 'folder_inbox';
    deleteBtn.addEventListener('click', async () => {
      if (folder.id === 'folder_inbox') {
        notify('inboxフォルダは削除できません。', 'warn');
        return;
      }
      const ok = await askConfirm(`フォルダ「${folder.name}」を削除しますか？\n中身は inbox へ移動します。`);
      if (!ok) return;
      const next = folders.filter((f) => f.id !== folder.id);
      await saveFolderState(next, 'フォルダを削除しました。');
    });

    actions.append(editBtn, deleteBtn);
    li.append(label, actions);
    folderList.appendChild(li);
  }
}

function createInlineEditForm(record) {
  const locale = record.locale || 'ja-JP';
  const currency = record.currency || 'JPY';
  const unit = unitLabel(locale, currency);

  const panel = document.createElement('div');
  panel.className = 'primary-panel profit-history-edit-panel';

  const form = document.createElement('form');
  form.className = 'settings-form profit-history-edit-form';

  const itemNameInput = document.createElement('input');
  itemNameInput.type = 'text';
  itemNameInput.value = record.itemName || '';
  form.appendChild(buildLabeledField('商品名（任意）', itemNameInput));

  const costInput = createNumberInput(record.cost, '1');
  form.appendChild(buildLabeledField('原価', buildInputWithUnit(costInput, unit)));

  const feeRateInput = createNumberInput(record.feeRate, '0.1');
  form.appendChild(buildLabeledField('手数料（%）', buildInputWithUnit(feeRateInput, '%')));

  const shippingSelect = document.createElement('select');
  for (const opt of shippingOptions) {
    const el = document.createElement('option');
    el.value = opt.id;
    el.textContent = buildOptionLabel(opt, locale, currency);
    shippingSelect.appendChild(el);
  }
  shippingSelect.value = record.shippingId || (shippingOptions[0] ? shippingOptions[0].id : '');
  form.appendChild(buildLabeledField('送料（選択）', shippingSelect));

  const packingSelect = document.createElement('select');
  for (const opt of packingOptions) {
    const el = document.createElement('option');
    el.value = opt.id;
    el.textContent = buildOptionLabel(opt, locale, currency);
    packingSelect.appendChild(el);
  }
  packingSelect.value = record.packingId || (packingOptions[0] ? packingOptions[0].id : '');
  form.appendChild(buildLabeledField('梱包資材代（選択）', packingSelect));

  const salePriceInput = createNumberInput(record.salePrice, '1');
  form.appendChild(buildLabeledField('販売予定価格', buildInputWithUnit(salePriceInput, unit)));

  const otherCostInput = createNumberInput(record.otherCost, '1');
  form.appendChild(buildLabeledField('その他', buildInputWithUnit(otherCostInput, unit)));

  const actionRow = document.createElement('div');
  actionRow.className = 'row profit-history-edit-actions';

  const saveBtn = document.createElement('button');
  saveBtn.type = 'submit';
  saveBtn.textContent = '更新';
  actionRow.appendChild(saveBtn);

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'secondary';
  cancelBtn.textContent = 'キャンセル';
  cancelBtn.addEventListener('click', () => {
    editingRecordId = null;
    renderHistory(recordsCache);
  });
  actionRow.appendChild(cancelBtn);

  form.appendChild(actionRow);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      itemName: itemNameInput.value.trim(),
      cost: Number(costInput.value || 0),
      feeRate: Number(feeRateInput.value || 0),
      shippingId: shippingSelect.value,
      packingId: packingSelect.value,
      salePrice: Number(salePriceInput.value || 0),
      otherCost: Number(otherCostInput.value || 0)
    };
    if (!Number.isFinite(payload.cost) || !Number.isFinite(payload.feeRate) || !Number.isFinite(payload.salePrice)) {
      notify('数値入力をご確認ください。', 'error');
      return;
    }
    const res = await fetch(`/api/tools/profit/records/${record.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      notify('履歴の更新に失敗しました。', 'error');
      return;
    }
    editingRecordId = null;
    notify('履歴を更新しました。', 'success');
    await refresh();
  });

  panel.appendChild(form);
  return panel;
}

function renderHistory(records) {
  if (!profitHistory) return;
  recordsCache = Array.isArray(records) ? records : [];
  const rows =
    folderFilterId === 'all' ? recordsCache : recordsCache.filter((r) => String(r.folderId || '') === String(folderFilterId));

  profitHistory.innerHTML = '';
  if (!rows.length) {
    const li = document.createElement('li');
    li.className = 'task-item';
    li.textContent = '表示対象の履歴はありません。';
    profitHistory.appendChild(li);
    return;
  }

  for (const r of rows) {
    const li = document.createElement('li');
    li.className = 'task-item';
    const row = document.createElement('div');
    row.className = 'task-head';
    const summary = document.createElement('strong');
    const locale = r.locale || 'ja-JP';
    const currency = r.currency || 'JPY';
    summary.textContent = `${r.itemName || '商品'} | 売価 ${money(r.salePrice, locale, currency)} | 利益 ${money(r.profit, locale, currency)} | 利益率 ${Number(r.marginRate || 0).toFixed(2)}%`;
    row.appendChild(summary);

    const btnWrap = document.createElement('div');
    btnWrap.className = 'task-actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'secondary';
    editBtn.textContent = editingRecordId === r.id ? '編集中' : '編集';
    editBtn.addEventListener('click', () => {
      editingRecordId = editingRecordId === r.id ? null : r.id;
      renderHistory(recordsCache);
    });
    btnWrap.appendChild(editBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'secondary';
    deleteBtn.textContent = '削除';
    deleteBtn.addEventListener('click', async () => {
      const ok = await askConfirm(`履歴「${r.itemName || '商品'}」を削除しますか？`);
      if (!ok) return;
      const res = await fetch(`/api/tools/profit/records/${r.id}`, { method: 'DELETE' });
      if (!res.ok) {
        notify('履歴の削除に失敗しました。', 'error');
        return;
      }
      notify('履歴を削除しました。', 'success');
      await refresh();
    });
    btnWrap.appendChild(deleteBtn);

    row.appendChild(btnWrap);
    li.appendChild(row);

    const meta = document.createElement('div');
    meta.className = 'task-meta';
    const shippingLabel = String(r.shippingName || '').trim() || '未選択';
    const packingLabel = String(r.packingName || '').trim() || '未選択';
    meta.textContent = `フォルダ ${getFolderName(r.folderId)} | 原価 ${money(r.cost, locale, currency)} / 手数料 ${money(r.feeAmount, locale, currency)} / 送料（${shippingLabel}） ${money(r.shippingCost, locale, currency)} / 梱包材（${packingLabel}） ${money(r.packingCost, locale, currency)} / その他 ${money(r.otherCost, locale, currency)} | 作成 ${fmtDate(r.createdAt)}${r.updatedAt ? ` / 更新 ${fmtDate(r.updatedAt)}` : ''}`;
    li.appendChild(meta);

    if (editingRecordId === r.id) {
      li.appendChild(createInlineEditForm(r));
    }
    profitHistory.appendChild(li);
  }
}

async function refresh() {
  const res = await fetch('/api/tools/profit', { cache: 'no-store' });
  const data = await res.json();
  const records = Array.isArray(data.records) ? data.records : [];
  shippingOptions = Array.isArray(data.shippingOptions) ? data.shippingOptions : [];
  packingOptions = Array.isArray(data.packingOptions) ? data.packingOptions : [];
  folders = normalizeFolders(data.folders);

  if (editingRecordId && !records.some((r) => r.id === editingRecordId)) {
    editingRecordId = null;
  }
  if (editingFolderId && !folders.some((f) => f.id === editingFolderId)) {
    editingFolderId = null;
  }
  if (folderFilterId !== 'all' && !folders.some((f) => f.id === folderFilterId)) {
    folderFilterId = 'all';
  }

  renderFolderList();
  renderFolderFilter();
  renderHistory(records);
}

if (folderPlusBtn) {
  folderPlusBtn.addEventListener('click', () => {
    if (!folderAddForm) return;
    folderAddForm.hidden = !folderAddForm.hidden;
    if (!folderAddForm.hidden) {
      folderNameInput?.focus();
    }
  });
}

if (folderAddBtn) {
  folderAddBtn.addEventListener('click', async () => {
    const name = String(folderNameInput?.value || '').trim();
    if (!name) {
      notify('フォルダ名を入力してください。', 'error');
      return;
    }
    if (folders.some((f) => f.name === name)) {
      notify('同名フォルダが存在します。', 'warn');
      return;
    }
    const next = folders.concat([{ id: createFolderId(), name }]);
    await saveFolderState(next, 'フォルダを追加しました。');
  });
}

if (folderFilter) {
  folderFilter.addEventListener('change', () => {
    folderFilterId = String(folderFilter.value || 'all');
    renderHistory(recordsCache);
  });
}

if (backProfitBtn) {
  backProfitBtn.addEventListener('click', () => {
    window.location.href = '/profit-tool.html';
  });
}

if (headerHistoryBtn) {
  headerHistoryBtn.addEventListener('click', () => {
    window.location.href = '/profit-history.html';
  });
}

if (headerSettingsBtn) {
  headerSettingsBtn.addEventListener('click', () => {
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

try {
  const flash = sessionStorage.getItem('profitFlashNotice');
  if (flash) {
    sessionStorage.removeItem('profitFlashNotice');
    notify(flash, 'success');
  }
} catch {}

refresh();
