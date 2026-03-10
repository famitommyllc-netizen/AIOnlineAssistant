const form = document.getElementById('iconForm');
const saveStatus = document.getElementById('saveStatus');
const closeToChatBtn = document.getElementById('closeToChatBtn');

const iconFields = {
  chat: document.getElementById('icon_chat'),
  tasks: document.getElementById('icon_tasks'),
  memos: document.getElementById('icon_memos'),
  number: document.getElementById('icon_number'),
  profit: document.getElementById('icon_profit'),
  profitSettings: document.getElementById('icon_profitSettings'),
  help: document.getElementById('icon_help'),
  settings: document.getElementById('icon_settings'),
  iconSettings: document.getElementById('icon_iconSettings')
};

function setStatus(text, isError = false) {
  saveStatus.textContent = text;
  saveStatus.style.color = isError ? '#b42318' : '#2457d6';
}

async function loadIconSettings() {
  const res = await fetch('/api/icon-settings');
  const data = await res.json();
  if (!res.ok) {
    setStatus('読み込みに失敗しました。', true);
    return;
  }
  const icons = data.icons || {};
  for (const key of Object.keys(iconFields)) {
    if (iconFields[key]) iconFields[key].value = icons[key] || '';
  }
  const pageIcon = document.getElementById('pageIcon');
  if (pageIcon) pageIcon.src = icons.iconSettings || '/assets/icons/icon-settings.svg';
  setStatus('現在の設定を読み込みました。');
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const icons = {};
  for (const key of Object.keys(iconFields)) {
    icons[key] = iconFields[key]?.value?.trim() || '';
  }
  const res = await fetch('/api/icon-settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ icons })
  });
  if (!res.ok) {
    setStatus('保存に失敗しました。', true);
    return;
  }
  setStatus('アイコン設定を保存しました。');
});

if (closeToChatBtn) {
  closeToChatBtn.addEventListener('click', () => {
    window.location.href = '/';
  });
}

loadIconSettings();
