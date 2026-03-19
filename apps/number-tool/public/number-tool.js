const numberForm = document.getElementById('numberForm');
const numberTitleInput = document.getElementById('numberTitleInput');
const numberInput = document.getElementById('numberInput');
const numberSummary = document.getElementById('numberSummary');
const numberList = document.getElementById('numberList');
const clearBtn = document.getElementById('clearBtn');
const closeToChatBtn = document.getElementById('closeToChatBtn');
const sumValue = document.getElementById('sumValue');
const countValue = document.getElementById('countValue');
const avgValue = document.getElementById('avgValue');
const numberCard = document.getElementById('numberCard');
const numberLayoutSection = document.getElementById('numberLayoutSection');
const numberKpiSection = document.getElementById('numberKpiSection');
const numberSummarySection = document.getElementById('numberSummarySection');
const numberListSection = document.getElementById('numberListSection');
const saveNumberLayoutBtn = document.getElementById('saveNumberLayoutBtn');
const openNumberHelpBtn = document.getElementById('openNumberHelpBtn');
const orderKpi = document.getElementById('orderKpi');
const orderForm = document.getElementById('orderForm');
const orderSummary = document.getElementById('orderSummary');
const orderList = document.getElementById('orderList');
const headerHistoryBtn = document.getElementById('headerHistoryBtn');
const headerSettingsBtn = document.getElementById('headerSettingsBtn');
const headerMoveModeBtn = document.getElementById('headerMoveModeBtn');
const navToggleBtn = document.querySelector('.nav-toggle');
const numberRowControls = document.getElementById('numberRowControls');
let currentOrder = ['kpi', 'form', 'summary', 'list'];
let currentFormRowOrder = ['title', 'value', 'actions'];
let numberMoveMode = false;
let editingEntryId = null;
let stateCache = { entries: [], count: 0, total: 0, average: 0 };

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

function setHeaderActive(mode) {
  const map = {
    history: headerHistoryBtn,
    settings: headerSettingsBtn,
    move: headerMoveModeBtn
  };
  Object.entries(map).forEach(([k, btn]) => {
    if (!btn) return;
    btn.classList.toggle('active', mode === k);
  });
}

function setMoveLock(isLocked) {
  document.body.classList.toggle('number-move-lock', isLocked);
  if (navToggleBtn) navToggleBtn.disabled = isLocked;
  if (headerHistoryBtn) headerHistoryBtn.disabled = isLocked;
  if (headerSettingsBtn) headerSettingsBtn.disabled = isLocked;
  if (closeToChatBtn) closeToChatBtn.disabled = isLocked;
}

function normalizeOrder(order) {
  const base = ['kpi', 'form', 'summary', 'list'];
  if (!Array.isArray(order)) return base;
  const out = [];
  for (const key of order) {
    const k = String(key);
    if (!base.includes(k)) continue;
    if (out.includes(k)) continue;
    out.push(k);
  }
  for (const k of base) {
    if (!out.includes(k)) out.push(k);
  }
  return out;
}

function orderFromSelectors() {
  const defs = [
    { key: 'kpi', rank: Number(orderKpi?.value || 1) },
    { key: 'form', rank: Number(orderForm?.value || 2) },
    { key: 'summary', rank: Number(orderSummary?.value || 3) },
    { key: 'list', rank: Number(orderList?.value || 4) }
  ];
  defs.sort((a, b) => a.rank - b.rank);
  return normalizeOrder(defs.map((d) => d.key));
}

function selectorsFromOrder(order) {
  const normalized = normalizeOrder(order);
  const idx = (k) => String(normalized.indexOf(k) + 1);
  if (orderKpi) orderKpi.value = idx('kpi');
  if (orderForm) orderForm.value = idx('form');
  if (orderSummary) orderSummary.value = idx('summary');
  if (orderList) orderList.value = idx('list');
}

function applyLayout(order) {
  if (!numberCard || !numberLayoutSection) return;
  const normalized = normalizeOrder(order);
  currentOrder = normalized;
  const map = {
    kpi: numberKpiSection,
    form: numberForm,
    summary: numberSummarySection,
    list: numberListSection
  };
  let anchor = numberLayoutSection;
  for (const key of normalized) {
    const el = map[key];
    if (!el) continue;
    if (anchor.nextSibling !== el) {
      anchor.after(el);
    }
    anchor = el;
  }
  selectorsFromOrder(normalized);
  renderMoveMode();
}

function normalizeFormRowOrder(order) {
  const base = ['title', 'value', 'actions'];
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

function applyFormRowOrder(order) {
  if (!numberForm) return;
  const normalized = normalizeFormRowOrder(order);
  currentFormRowOrder = normalized;
  let anchor = numberRowControls || null;
  for (const key of normalized) {
    const el = numberForm.querySelector(`.movable-form-row[data-row-key="${key}"]`);
    if (!el) continue;
    if (anchor) {
      if (anchor.nextSibling !== el) anchor.after(el);
      anchor = el;
    } else {
      numberForm.appendChild(el);
    }
  }
  renderNumberRowControls();
}

function shiftSection(key, dir) {
  const order = [...currentOrder];
  const idx = order.indexOf(key);
  if (idx < 0) return order;
  const nextIdx = idx + dir;
  if (nextIdx < 0 || nextIdx >= order.length) return order;
  [order[idx], order[nextIdx]] = [order[nextIdx], order[idx]];
  return normalizeOrder(order);
}

async function saveNumberUiPatch(patch) {
  await fetch('/api/tools/number/ui', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch || {})
  });
}

function ensureMoveControl(sectionEl, key, title) {
  if (!sectionEl) return;
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
    upBtn.textContent = '↑';
    upBtn.dataset.dir = 'up';
    upBtn.addEventListener('click', async () => {
      if (!numberMoveMode) return;
      const next = shiftSection(key, -1);
      if (String(next.join(',')) === String(currentOrder.join(','))) return;
      applyLayout(next);
    });
    const downBtn = document.createElement('button');
    downBtn.type = 'button';
    downBtn.className = 'secondary layout-move-btn';
    downBtn.textContent = '↓';
    downBtn.dataset.dir = 'down';
    downBtn.addEventListener('click', async () => {
      if (!numberMoveMode) return;
      const next = shiftSection(key, 1);
      if (String(next.join(',')) === String(currentOrder.join(','))) return;
      applyLayout(next);
    });
    control.dataset.sectionKey = key;
    control.appendChild(label);
    control.appendChild(upBtn);
    control.appendChild(downBtn);
    sectionEl.prepend(control);
  }
}

function renderMoveMode() {
  if (!numberCard || !headerMoveModeBtn) return;
  numberCard.classList.toggle('move-mode', numberMoveMode);
  document.body.classList.toggle('move-mode', numberMoveMode);
  headerMoveModeBtn.textContent = numberMoveMode ? '位置変更保存' : '位置変更';
  headerMoveModeBtn.classList.toggle('danger-move-btn', numberMoveMode);
  setMoveLock(numberMoveMode);
  setHeaderActive(numberMoveMode ? 'move' : '');

  document.querySelectorAll('.layout-move-control').forEach((control) => {
    const key = String(control.dataset.sectionKey || '');
    const idx = currentOrder.indexOf(key);
    const up = control.querySelector('button[data-dir="up"]');
    const down = control.querySelector('button[data-dir="down"]');
    if (up) up.disabled = !numberMoveMode || idx <= 0;
    if (down) down.disabled = !numberMoveMode || idx < 0 || idx >= currentOrder.length - 1;
  });

  numberRowControls?.querySelectorAll('.layout-row-chip').forEach((chip) => {
    const key = String(chip.dataset.rowKey || '');
    const idx = currentFormRowOrder.indexOf(key);
    const up = chip.querySelector('button[data-dir="up"]');
    const down = chip.querySelector('button[data-dir="down"]');
    if (up) up.disabled = !numberMoveMode || idx <= 0;
    if (down) down.disabled = !numberMoveMode || idx < 0 || idx >= currentFormRowOrder.length - 1;
  });
}

function shiftFormRow(key, dir) {
  const order = [...currentFormRowOrder];
  const idx = order.indexOf(key);
  if (idx < 0) return order;
  const nextIdx = idx + dir;
  if (nextIdx < 0 || nextIdx >= order.length) return order;
  [order[idx], order[nextIdx]] = [order[nextIdx], order[idx]];
  return normalizeFormRowOrder(order);
}

function renderNumberRowControls() {
  if (!numberRowControls) return;
  numberRowControls.innerHTML = '';
  const labels = { title: 'タイトル', value: '数値', actions: '操作' };
  for (const key of currentFormRowOrder) {
    const chip = document.createElement('div');
    chip.className = 'layout-row-chip';
    chip.dataset.rowKey = key;
    const name = document.createElement('span');
    name.className = 'layout-row-chip-label';
    name.textContent = labels[key] || key;
    const up = document.createElement('button');
    up.type = 'button';
    up.className = 'secondary layout-move-btn';
    up.textContent = '↑';
    up.dataset.dir = 'up';
    up.addEventListener('click', async () => {
      if (!numberMoveMode) return;
      const next = shiftFormRow(key, -1);
      if (String(next.join(',')) === String(currentFormRowOrder.join(','))) return;
      applyFormRowOrder(next);
    });
    const down = document.createElement('button');
    down.type = 'button';
    down.className = 'secondary layout-move-btn';
    down.textContent = '↓';
    down.dataset.dir = 'down';
    down.addEventListener('click', async () => {
      if (!numberMoveMode) return;
      const next = shiftFormRow(key, 1);
      if (String(next.join(',')) === String(currentFormRowOrder.join(','))) return;
      applyFormRowOrder(next);
    });
    chip.appendChild(name);
    chip.appendChild(up);
    chip.appendChild(down);
    numberRowControls.appendChild(chip);
  }
  renderMoveMode();
}

function fmtNum(n) {
  return new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 2 }).format(Number(n || 0));
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

function buildEntryLabel(entry) {
  const title = String(entry.title || '無題').trim() || '無題';
  return `・${title}（${fmtNum(entry.value)}）`;
}

function createEntryEditForm(entry) {
  const wrap = document.createElement('div');
  wrap.className = 'option-item-edit number-entry-edit';

  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.value = String(entry.title || '無題');
  titleInput.placeholder = 'タイトル';

  const valueInput = document.createElement('input');
  valueInput.type = 'number';
  valueInput.step = 'any';
  valueInput.value = String(entry.value ?? '');
  valueInput.placeholder = '数値';

  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.textContent = '保存';
  saveBtn.addEventListener('click', async () => {
    const nextTitle = titleInput.value.trim() || '無題';
    const nextValue = Number(valueInput.value);
    if (!Number.isFinite(nextValue)) {
      notify('数値を正しく入力してください。', 'error');
      return;
    }
    const res = await fetch(`/api/tools/number/${entry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: nextTitle, value: nextValue })
    });
    if (!res.ok) {
      notify('更新に失敗しました。', 'error');
      return;
    }
    editingEntryId = null;
    notify('更新しました。', 'success');
    await refresh();
  });

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'secondary';
  cancelBtn.textContent = 'キャンセル';
  cancelBtn.addEventListener('click', () => {
    editingEntryId = null;
    render(stateCache);
  });

  wrap.append(titleInput, valueInput, saveBtn, cancelBtn);
  return wrap;
}

function render(state) {
  stateCache = state || stateCache;
  sumValue.textContent = fmtNum(state.total);
  countValue.textContent = fmtNum(state.count);
  avgValue.textContent = fmtNum(state.average);
  numberSummary.textContent = `件数: ${state.count} | 合計: ${fmtNum(state.total)} | 平均: ${fmtNum(state.average)}`;
  numberList.innerHTML = '';
  for (const entry of state.entries || []) {
    const li = document.createElement('li');
    li.className = 'task-item number-entry-item';

    if (editingEntryId === entry.id) {
      li.appendChild(createEntryEditForm(entry));
      numberList.appendChild(li);
      continue;
    }

    const line = document.createElement('div');
    line.className = 'number-entry-line';
    const title = document.createElement('strong');
    title.className = 'number-entry-label';
    title.textContent = buildEntryLabel(entry);
    line.appendChild(title);

    const actions = document.createElement('div');
    actions.className = 'number-entry-actions task-actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'secondary';
    editBtn.textContent = '編集';
    editBtn.addEventListener('click', async () => {
      editingEntryId = entry.id;
      render(stateCache);
    });
    actions.appendChild(editBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'secondary';
    deleteBtn.textContent = '削除';
    deleteBtn.addEventListener('click', async () => {
      const ok = await askConfirm(`「${String(entry.title || '無題')}」を削除しますか？`);
      if (!ok) return;
      const res = await fetch(`/api/tools/number/${entry.id}`, { method: 'DELETE' });
      if (!res.ok) {
        notify('削除に失敗しました。', 'error');
        return;
      }
      notify('削除しました。', 'success');
      if (editingEntryId === entry.id) editingEntryId = null;
      await refresh();
    });
    actions.appendChild(deleteBtn);

    line.appendChild(actions);
    li.appendChild(line);

    const meta = document.createElement('div');
    meta.className = 'task-meta';
    meta.textContent = `作成: ${fmtDate(entry.createdAt)} | 更新: ${fmtDate(entry.updatedAt || entry.createdAt)}`;
    li.appendChild(meta);

    numberList.appendChild(li);
  }
}

async function refresh() {
  const res = await fetch('/api/tools/number');
  const data = await res.json();
  applyLayout(data?.ui?.sectionOrder || ['kpi', 'form', 'summary', 'list']);
  applyFormRowOrder(data?.ui?.formRowOrder || ['title', 'value', 'actions']);
  ensureMoveControl(numberKpiSection, 'kpi', 'KPI');
  ensureMoveControl(numberForm, 'form', '入力');
  ensureMoveControl(numberSummarySection, 'summary', '集計');
  ensureMoveControl(numberListSection, 'list', '履歴');
  render(data);
}

numberForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (numberMoveMode) return;
  const value = Number(numberInput.value);
  if (!Number.isFinite(value)) {
    notify('数値を正しく入力してください。', 'error');
    return;
  }
  const title = (numberTitleInput?.value || '').trim() || '無題';
  const res = await fetch('/api/tools/number', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, value })
  });
  if (!res.ok) {
    notify('追加に失敗しました。', 'error');
    return;
  }
  if (numberTitleInput) numberTitleInput.value = '';
  numberInput.value = '';
  notify('追加しました。', 'success');
  await refresh();
});

clearBtn.addEventListener('click', async () => {
  if (numberMoveMode) return;
  const ok = await askConfirm('数値履歴をすべて削除しますか？');
  if (!ok) return;
  const res = await fetch('/api/tools/number/clear', { method: 'POST' });
  if (!res.ok) {
    notify('全消去に失敗しました。', 'error');
    return;
  }
  editingEntryId = null;
  notify('全消去しました。', 'success');
  await refresh();
});

if (saveNumberLayoutBtn) {
  saveNumberLayoutBtn.addEventListener('click', async () => {
    const sectionOrder = orderFromSelectors();
    await saveNumberUiPatch({ sectionOrder, formRowOrder: currentFormRowOrder });
    applyLayout(sectionOrder);
    notify('設定保存しました。', 'success');
  });
}

if (openNumberHelpBtn) {
  openNumberHelpBtn.addEventListener('click', () => {
    window.location.href = '/help.html';
  });
}

if (headerHistoryBtn) {
  headerHistoryBtn.addEventListener('click', () => {
    if (numberMoveMode) return;
    setHeaderActive('history');
    numberListSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    notify('履歴へ移動しました。', 'success');
  });
}

if (headerSettingsBtn) {
  headerSettingsBtn.addEventListener('click', () => {
    if (numberMoveMode) return;
    setHeaderActive('settings');
    if (numberLayoutSection) numberLayoutSection.open = true;
    numberLayoutSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    notify('設定へ移動しました。', 'success');
  });
}

if (headerMoveModeBtn) {
  headerMoveModeBtn.addEventListener('click', async () => {
    if (!numberMoveMode) {
      numberMoveMode = true;
      if (numberLayoutSection) numberLayoutSection.open = true;
      renderMoveMode();
      notify('位置変更モードを開始しました。', 'warn');
      return;
    }

    try {
      await saveNumberUiPatch({
        sectionOrder: currentOrder,
        formRowOrder: currentFormRowOrder
      });
      numberMoveMode = false;
      renderMoveMode();
      notify('位置変更を保存しました。', 'success');
    } catch {
      notify('位置変更の保存に失敗しました。', 'error');
    }
  });
}

fetch('/api/icon-settings')
  .then((res) => res.json())
  .then((data) => {
    const icon = document.getElementById('pageIcon');
    if (icon) icon.src = data?.icons?.number || '/assets/icons/number.svg';
  })
  .catch(() => {});

refresh();
