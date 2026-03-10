const form = document.getElementById('settingsForm');
const notifyForm = document.getElementById('notifyForm');
const appMenuForm = document.getElementById('appMenuForm');
const saveStatus = document.getElementById('saveStatus');
const closeToChatBtn = document.getElementById('closeToChatBtn');

const fields = {
  enabled: document.getElementById('enabled'),
  provider: document.getElementById('provider'),
  model: document.getElementById('model'),
  baseUrl: document.getElementById('baseUrl'),
  apiKey: document.getElementById('apiKey'),
  apiSecret: document.getElementById('apiSecret')
};

const webSearchFields = {
  enabled: document.getElementById('webSearchEnabled'),
  apiKey: document.getElementById('webSearchApiKey'),
  cx: document.getElementById('webSearchCx'),
  defaultCount: document.getElementById('webSearchDefaultCount')
};

const modeControlFields = {
  lockIntentsInMode: document.getElementById('modeLockIntentsInMode')
};

const notifyFields = {
  daysBefore: document.getElementById('daysBefore'),
  hoursBefore: document.getElementById('hoursBefore'),
  sameDayTimes: document.getElementById('sameDayTimes'),
  atDue: document.getElementById('atDue'),
  overdueSnoozeMinutes: document.getElementById('overdueSnoozeMinutes')
};

const appMenuFields = {
  enabled: document.getElementById('appMenuEnabled'),
  order: document.getElementById('appMenuOrder'),
  layout: document.getElementById('appMenuLayout'),
  iconSize: document.getElementById('appMenuIconSize')
};

function toCsv(arr) {
  return Array.isArray(arr) ? arr.join(',') : '';
}

function setStatus(text, isError = false) {
  saveStatus.textContent = text;
  saveStatus.style.color = isError ? '#b42318' : '#2457d6';
}

function buildPayload() {
  return {
    ai: {
      enabled: fields.enabled.checked,
      provider: fields.provider.value.trim(),
      model: fields.model.value.trim(),
      baseUrl: fields.baseUrl.value.trim(),
      apiKey: fields.apiKey.value.trim(),
      apiSecret: fields.apiSecret.value.trim()
    },
    webSearch: {
      enabled: webSearchFields.enabled?.checked || false,
      provider: 'google_cse',
      apiKey: webSearchFields.apiKey?.value?.trim() || '',
      cx: webSearchFields.cx?.value?.trim() || '',
      defaultStart: 1,
      defaultCount: Number(webSearchFields.defaultCount?.value || 10),
      language: 'ja',
      country: 'jp',
      safe: 'off'
    },
    modeControl: {
      lockIntentsInMode: modeControlFields.lockIntentsInMode?.checked !== false
    },
    notify: {
      daysBefore: notifyFields.daysBefore.value.trim(),
      hoursBefore: notifyFields.hoursBefore.value.trim(),
      sameDayTimes: notifyFields.sameDayTimes.value.trim(),
      atDue: notifyFields.atDue.checked,
      overdueSnoozeMinutes: Number(notifyFields.overdueSnoozeMinutes.value || 60)
    },
    appMenu: {
      enabled: appMenuFields.enabled?.value?.trim() || '',
      order: appMenuFields.order?.value?.trim() || '',
      layout: appMenuFields.layout?.value || 'grid3',
      iconSize: Number(appMenuFields.iconSize?.value || 102)
    }
  };
}

async function loadSettings() {
  const res = await fetch('/api/settings');
  const data = await res.json();
  if (!res.ok) {
    setStatus('設定の読み込みに失敗しました。', true);
    return;
  }

  const ai = data.ai || {};
  fields.enabled.checked = Boolean(ai.enabled);
  fields.provider.value = ai.provider || '';
  fields.model.value = ai.model || '';
  fields.baseUrl.value = ai.baseUrl || '';
  fields.apiKey.value = ai.apiKey || '';
  fields.apiSecret.value = ai.apiSecret || '';

  const webSearch = data.webSearch || {};
  if (webSearchFields.enabled) webSearchFields.enabled.checked = Boolean(webSearch.enabled);
  if (webSearchFields.apiKey) webSearchFields.apiKey.value = webSearch.apiKey || '';
  if (webSearchFields.cx) webSearchFields.cx.value = webSearch.cx || '';
  if (webSearchFields.defaultCount) webSearchFields.defaultCount.value = String(webSearch.defaultCount || 10);

  const modeControl = data.modeControl || {};
  if (modeControlFields.lockIntentsInMode) {
    modeControlFields.lockIntentsInMode.checked = modeControl.lockIntentsInMode !== false;
  }

  const notify = data.notify || {};
  notifyFields.daysBefore.value = toCsv(notify.daysBefore || [1]);
  notifyFields.hoursBefore.value = toCsv(notify.hoursBefore || [1]);
  notifyFields.sameDayTimes.value = toCsv(notify.sameDayTimes || []);
  notifyFields.atDue.checked = notify.atDue !== false;
  notifyFields.overdueSnoozeMinutes.value = String(notify.overdueSnoozeMinutes || 60);

  const appMenu = data.appMenu || {};
  if (appMenuFields.enabled) appMenuFields.enabled.value = toCsv(appMenu.enabled || []);
  if (appMenuFields.order) appMenuFields.order.value = toCsv(appMenu.order || []);
  if (appMenuFields.layout) appMenuFields.layout.value = appMenu.layout || 'grid3';
  if (appMenuFields.iconSize) appMenuFields.iconSize.value = String(appMenu.iconSize || 102);

  setStatus('現在の設定を読み込みました。');
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = buildPayload();

  const res = await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    setStatus('保存に失敗しました。入力値をご確認ください。', true);
    return;
  }

  setStatus('設定を保存しました。');
});

notifyForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = buildPayload();

  const res = await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    setStatus('通知設定の保存に失敗しました。', true);
    return;
  }
  setStatus('通知設定を保存しました。');
});

if (appMenuForm) {
  appMenuForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = buildPayload();
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      setStatus('アプリボタン設定の保存に失敗しました。', true);
      return;
    }
    setStatus('アプリボタン設定を保存しました。');
  });
}

loadSettings();

fetch('/api/icon-settings')
  .then((res) => res.json())
  .then((data) => {
    const icon = document.getElementById('pageIcon');
    if (icon) icon.src = data?.icons?.settings || '/assets/icons/settings.svg';
  })
  .catch(() => {});

if (closeToChatBtn) {
  closeToChatBtn.addEventListener('click', () => {
    window.location.href = '/';
  });
}
