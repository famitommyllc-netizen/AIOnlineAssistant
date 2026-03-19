const optionForm = document.getElementById('optionForm');
const saveStatus = document.getElementById('saveStatus');
const headerHistoryBtn = document.getElementById('headerHistoryBtn');
const headerSettingsBtn = document.getElementById('headerSettingsBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const openManualBtn = document.getElementById('openManualBtn');

const inputAlign = document.getElementById('inputAlign');
const resultAlign = document.getElementById('resultAlign');
const detailPack = document.getElementById('detailPack');
const detailAlign = document.getElementById('detailAlign');
const showMarginRate = document.getElementById('showMarginRate');
const showRoiRate = document.getElementById('showRoiRate');
const restoreLastResult = document.getElementById('restoreLastResult');
const locale = document.getElementById('locale');
const currency = document.getElementById('currency');

const shippingPlusBtn = document.getElementById('shippingPlusBtn');
const shippingAddForm = document.getElementById('shippingAddForm');
const shippingNameInput = document.getElementById('shippingNameInput');
const shippingCostInput = document.getElementById('shippingCostInput');
const shippingAddBtn = document.getElementById('shippingAddBtn');
const shippingList = document.getElementById('shippingList');

const packingPlusBtn = document.getElementById('packingPlusBtn');
const packingAddForm = document.getElementById('packingAddForm');
const packingNameInput = document.getElementById('packingNameInput');
const packingCostInput = document.getElementById('packingCostInput');
const packingAddBtn = document.getElementById('packingAddBtn');
const packingList = document.getElementById('packingList');

const state = {
  shippingOptions: [],
  packingOptions: [],
  editing: {
    shipping: null,
    packing: null
  }
};

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

function createOptionId(prefix) {
  return `opt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${prefix}`;
}

function formatCost(cost) {
  const n = Number(cost || 0);
  return Number.isFinite(n) ? `${Math.round(n)}円` : '0円';
}

function setStatus(text, isError = false) {
  if (!saveStatus) return;
  saveStatus.textContent = text;
  saveStatus.style.color = isError ? '#b42318' : '#2457d6';
}

function parseCost(value) {
  const n = Number(String(value ?? '').trim());
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n);
}

function getListState(kind) {
  return kind === 'shipping' ? state.shippingOptions : state.packingOptions;
}

function setListState(kind, next) {
  if (kind === 'shipping') {
    state.shippingOptions = next;
  } else {
    state.packingOptions = next;
  }
}

function renderOptionList(kind) {
  const listEl = kind === 'shipping' ? shippingList : packingList;
  if (!listEl) return;
  const editingId = state.editing[kind];
  const list = getListState(kind);
  listEl.innerHTML = '';

  list.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'option-item';
    li.dataset.id = item.id;

    if (editingId === item.id) {
      const form = document.createElement('div');
      form.className = 'option-item-edit';

      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.value = item.name;
      nameInput.placeholder = '名前';

      const costInput = document.createElement('input');
      costInput.type = 'number';
      costInput.min = '0';
      costInput.step = '1';
      costInput.value = String(item.cost);
      costInput.placeholder = '価格';

      const saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.textContent = '保存';
      saveBtn.addEventListener('click', () => {
        const name = nameInput.value.trim();
        const cost = parseCost(costInput.value);
        if (!name || cost === null) {
          setStatus('名前と価格を入力してください。', true);
          notify('名前と価格を入力してください。', 'error');
          return;
        }
        const next = list.map((opt) => (opt.id === item.id ? { ...opt, name, cost } : opt));
        setListState(kind, next);
        state.editing[kind] = null;
        renderOptionList(kind);
        notify('編集を保存しました。', 'success');
      });

      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'secondary';
      cancelBtn.textContent = 'キャンセル';
      cancelBtn.addEventListener('click', () => {
        state.editing[kind] = null;
        renderOptionList(kind);
      });

      form.append(nameInput, costInput, saveBtn, cancelBtn);
      li.appendChild(form);
      listEl.appendChild(li);
      return;
    }

    const label = document.createElement('div');
    label.className = 'option-item-label';
    label.textContent = `・${item.name}（${formatCost(item.cost)}）`;

    const actions = document.createElement('div');
    actions.className = 'option-item-actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'secondary';
    editBtn.textContent = '編集';
    editBtn.addEventListener('click', () => {
      state.editing[kind] = item.id;
      renderOptionList(kind);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'secondary';
    deleteBtn.textContent = '削除';
    deleteBtn.addEventListener('click', async () => {
      const ok = await askConfirm(`「${item.name}」を削除しますか？`);
      if (!ok) return;
      setListState(
        kind,
        list.filter((opt) => opt.id !== item.id)
      );
      if (state.editing[kind] === item.id) state.editing[kind] = null;
      renderOptionList(kind);
      notify('削除しました。', 'success');
    });

    actions.append(editBtn, deleteBtn);
    li.append(label, actions);
    listEl.appendChild(li);
  });
}

function addOption(kind) {
  const nameInput = kind === 'shipping' ? shippingNameInput : packingNameInput;
  const costInput = kind === 'shipping' ? shippingCostInput : packingCostInput;
  const name = String(nameInput?.value || '').trim();
  const cost = parseCost(costInput?.value);

  if (!name || cost === null) {
    setStatus('名前と価格を入力してください。', true);
    notify('名前と価格を入力してください。', 'error');
    return;
  }

  const list = getListState(kind);
  const next = list.concat([{ id: createOptionId(kind), name, cost }]);
  setListState(kind, next);

  if (nameInput) nameInput.value = '';
  if (costInput) costInput.value = '';
  renderOptionList(kind);
  setStatus('候補を追加しました。');
  notify('追加しました。', 'success');
}

function toggleAddForm(kind) {
  const formEl = kind === 'shipping' ? shippingAddForm : packingAddForm;
  if (!formEl) return;
  formEl.hidden = !formEl.hidden;
}

async function loadOptions() {
  const res = await fetch('/api/tools/profit');
  const data = await res.json();
  if (!res.ok) {
    setStatus('読み込みに失敗しました。', true);
    return;
  }

  state.shippingOptions = Array.isArray(data.shippingOptions) ? data.shippingOptions.slice() : [];
  state.packingOptions = Array.isArray(data.packingOptions) ? data.packingOptions.slice() : [];
  state.editing.shipping = null;
  state.editing.packing = null;

  if (inputAlign) inputAlign.value = data?.ui?.inputAlign === 'left' ? 'left' : 'right';
  if (resultAlign) resultAlign.value = data?.ui?.resultAlign === 'left' ? 'left' : 'right';
  if (detailPack) detailPack.value = data?.ui?.detailPack === 'left' ? 'left' : 'right';
  if (detailAlign) detailAlign.value = data?.ui?.detailAlign === 'right' ? 'right' : 'left';
  if (showMarginRate) showMarginRate.value = data?.ui?.showMarginRate === false ? 'off' : 'on';
  if (showRoiRate) showRoiRate.value = data?.ui?.showRoiRate === false ? 'off' : 'on';
  if (restoreLastResult) restoreLastResult.value = data?.ui?.restoreLastResult === true ? 'on' : 'off';
  if (locale) locale.value = data?.ui?.locale || 'ja-JP';
  if (currency) currency.value = data?.ui?.currency || 'JPY';

  renderOptionList('shipping');
  renderOptionList('packing');
  setStatus('現在の設定を読み込みました。');
}

async function saveOptions() {
  const payload = {
    shippingOptions: state.shippingOptions,
    packingOptions: state.packingOptions,
    ui: {
      inputAlign: inputAlign?.value === 'right' ? 'right' : 'left',
      resultAlign: resultAlign?.value === 'left' ? 'left' : 'right',
      detailPack: detailPack?.value === 'left' ? 'left' : 'right',
      detailAlign: detailAlign?.value === 'right' ? 'right' : 'left',
      showMarginRate: showMarginRate?.value !== 'off',
      showRoiRate: showRoiRate?.value !== 'off',
      restoreLastResult: restoreLastResult?.value === 'on',
      locale: String(locale?.value || 'ja-JP'),
      currency: String(currency?.value || 'JPY')
    }
  };

  const res = await fetch('/api/tools/profit/options', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    setStatus('保存に失敗しました。入力を確認してください。', true);
    notify('設定保存に失敗しました。入力を確認してください。', 'error');
    return;
  }
  const data = await res.json();
  if (detailPack) detailPack.value = data?.ui?.detailPack === 'left' ? 'left' : 'right';
  if (detailAlign) detailAlign.value = data?.ui?.detailAlign === 'right' ? 'right' : 'left';
  setStatus('利益計算の設定を保存しました。');
  notify('設定保存しました。', 'success');
  // Re-sync from server to avoid stale UI/state after save.
  await loadOptions();
}

if (optionForm) {
  optionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveOptions();
  });
}

if (saveSettingsBtn) {
  saveSettingsBtn.addEventListener('click', async () => {
    await saveOptions();
  });
}

if (openManualBtn) {
  openManualBtn.addEventListener('click', () => {
    window.location.href = '/apps/profit/public/profit-manual.html';
  });
}

if (shippingPlusBtn) {
  shippingPlusBtn.addEventListener('click', () => toggleAddForm('shipping'));
}
if (packingPlusBtn) {
  packingPlusBtn.addEventListener('click', () => toggleAddForm('packing'));
}
if (shippingAddBtn) {
  shippingAddBtn.addEventListener('click', () => addOption('shipping'));
}
if (packingAddBtn) {
  packingAddBtn.addEventListener('click', () => addOption('packing'));
}

if (headerHistoryBtn) {
  headerHistoryBtn.addEventListener('click', () => {
    window.location.href = '/apps/profit/public/profit-history.html';
  });
}

if (headerSettingsBtn) {
  headerSettingsBtn.addEventListener('click', () => {
    window.location.href = '/apps/profit/public/profit-settings.html';
  });
}

fetch('/api/icon-settings')
  .then((res) => res.json())
  .then((data) => {
    const icon = document.getElementById('pageIcon');
    if (icon) icon.src = data?.icons?.profitSettings || '/assets/icons/profit-settings.svg';
  })
  .catch(() => {});

loadOptions();
