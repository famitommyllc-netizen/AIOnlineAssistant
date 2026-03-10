const memoList = document.getElementById('memoList');
const closeToChatBtn = document.getElementById('closeToChatBtn');
const memoSortKey = document.getElementById('memoSortKey');
const memoSortOrder = document.getElementById('memoSortOrder');
let lastNotes = [];

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

function fmtDate(iso) {
  try {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZoneName: 'short'
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function valueBySort(note, key) {
  if (key === 'text') return String(note.text || '');
  const target = key === 'created' ? note.createdAt : note.updatedAt || note.createdAt;
  const t = new Date(target || 0).getTime();
  return Number.isFinite(t) ? t : 0;
}

function sortNotes(notes) {
  const key = memoSortKey?.value || 'updated';
  const order = memoSortOrder?.value || 'desc';
  const factor = order === 'asc' ? 1 : -1;
  const arr = [...(notes || [])];
  arr.sort((a, b) => {
    const ak = String(a.memoKind || '').trim();
    const bk = String(b.memoKind || '').trim();
    if (ak === 'append' && bk !== 'append') return -1;
    if (ak !== 'append' && bk === 'append') return 1;
    const av = valueBySort(a, key);
    const bv = valueBySort(b, key);
    if (typeof av === 'string' || typeof bv === 'string') {
      return String(av).localeCompare(String(bv), 'ja') * factor;
    }
    if (av < bv) return -1 * factor;
    if (av > bv) return 1 * factor;
    return String(a.text || '').localeCompare(String(b.text || ''), 'ja');
  });
  return arr;
}

function renderMemos(notes) {
  memoList.innerHTML = '';
  const items = sortNotes(notes || []);
  if (!items.length) {
    const li = document.createElement('li');
    li.className = 'task-item';
    li.textContent = '記録済みメモはありません。';
    memoList.appendChild(li);
    return;
  }
  for (const note of items) {
    const li = document.createElement('li');
    const kindRaw = String(note.memoKind || '').trim();
    li.className = `memo-note ${kindRaw === 'append' ? 'memo-note-log' : 'memo-note-individual'}`;
    const head = document.createElement('div');
    head.className = 'memo-note-head';
    const pin = document.createElement('span');
    pin.className = 'memo-note-dot';
    head.appendChild(pin);
    const title = document.createElement('div');
    title.className = 'task-meta';
    const kindLabel = kindRaw === 'append' ? 'ログメモ（追記）' : kindRaw === 'individual' ? '個別メモ（分割）' : 'メモ';
    const titleText = String(note.title || '').trim() || kindLabel;
    const topMark = kindRaw === 'append' ? '【固定】' : '';
    title.textContent = `${topMark}${titleText} | ${kindLabel} | ${fmtDate(note.updatedAt || note.createdAt)}`;
    head.appendChild(title);
    li.appendChild(head);

    const text = document.createElement('div');
    text.className = 'memo-body';
    text.textContent = note.text || '';
    li.appendChild(text);

    const actions = document.createElement('div');
    actions.className = 'task-actions memo-actions';

    const editBtn = document.createElement('button');
    editBtn.textContent = '編集';
    editBtn.classList.add('secondary');
    editBtn.addEventListener('click', async () => {
      const nextText = prompt('メモ内容', note.text || '');
      if (nextText === null) return;
      const textValue = nextText.trim();
      if (!textValue) return;
      await fetch(`/api/notes/${note.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textValue })
      });
      await refresh();
    });
    actions.appendChild(editBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '削除';
    deleteBtn.classList.add('secondary');
    deleteBtn.addEventListener('click', async () => {
      const ok = await askConfirm('このメモを削除しますか？');
      if (!ok) return;
      const res = await fetch(`/api/notes/${note.id}`, { method: 'DELETE' });
      if (!res.ok) {
        notify('削除に失敗しました。', 'error');
        return;
      }
      notify('削除しました。', 'success');
      await refresh();
    });
    actions.appendChild(deleteBtn);
    li.appendChild(actions);

    const meta = document.createElement('div');
    meta.className = 'task-meta';
    meta.textContent = `作成: ${fmtDate(note.createdAt)}`;
    li.appendChild(meta);

    memoList.appendChild(li);
  }
}

async function refresh() {
  const res = await fetch('/api/notes');
  const data = await res.json();
  lastNotes = data.notes || [];
  renderMemos(lastNotes);
}

if (closeToChatBtn) {
  closeToChatBtn.addEventListener('click', () => {
    window.location.href = '/';
  });
}

if (memoSortKey) {
  memoSortKey.addEventListener('change', () => renderMemos(lastNotes));
}
if (memoSortOrder) {
  memoSortOrder.addEventListener('change', () => renderMemos(lastNotes));
}

fetch('/api/icon-settings')
  .then((res) => res.json())
  .then((data) => {
    const icon = document.getElementById('pageIcon');
    if (icon) icon.src = data?.icons?.memos || '/assets/icons/memos.svg';
  })
  .catch(() => {});

refresh();
setInterval(refresh, 10000);
