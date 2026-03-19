const taskList = document.getElementById('taskList');
const closeToChatBtn = document.getElementById('closeToChatBtn');
const sortKey = document.getElementById('sortKey');
const sortOrder = document.getElementById('sortOrder');
let lastTasks = [];

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

function fmtNotify(config) {
  const c = config || {};
  const days = Array.isArray(c.daysBefore) ? c.daysBefore : [];
  const hours = Array.isArray(c.hoursBefore) ? c.hoursBefore : [];
  const sameDay = Array.isArray(c.sameDayTimes) ? c.sameDayTimes : [];
  const parts = [];
  if (days.length) parts.push(`${days.join(',')}日前`);
  if (hours.length) parts.push(`${hours.join(',')}時間前`);
  if (sameDay.length) parts.push(`当日 ${sameDay.join(',')}`);
  if (c.atDue !== false) parts.push('期限時刻');
  parts.push(`期限後${c.overdueSnoozeMinutes || 60}分おき`);
  return parts.join(' / ');
}

function makeTaskItem(task) {
  const li = document.createElement('li');
  li.className = `task-item ${task.isCompleted ? 'done' : ''}`;

  const head = document.createElement('div');
  head.className = 'task-head';

  const title = document.createElement('strong');
  title.textContent = `${task.taskNo ? `#${task.taskNo} ` : ''}${task.title}`;
  head.appendChild(title);

  const actions = document.createElement('div');
  actions.className = 'task-actions';

  const btn = document.createElement('button');
  btn.textContent = task.isCompleted ? '再開' : '完了';
  if (task.isCompleted) btn.classList.add('secondary');
  btn.addEventListener('click', async () => {
    const path = task.isCompleted ? 'reopen' : 'complete';
    try {
      const res = await fetch(`/api/tasks/${task.id}/${path}`, { method: 'PATCH' });
      if (!res.ok) throw new Error(`status=${res.status}`);
      await refresh();
    } catch (e) {
      alert(`状態更新に失敗しました: ${e.message}`);
    }
  });
  actions.appendChild(btn);

  const editBtn = document.createElement('button');
  editBtn.textContent = '編集';
  editBtn.classList.add('secondary');
  editBtn.addEventListener('click', async () => {
    const nextTitle = prompt('タスク名', task.title || '');
    if (nextTitle === null) return;
    const nextAssignee = prompt('担当者', task.assignee || '未設定');
    if (nextAssignee === null) return;
    const nextDueInput = prompt('期限メモ（例: 明日18時 / 2026-03-04 17:00）', task.dueInput || '');
    if (nextDueInput === null) return;
    const nextMinutes = prompt('通知間隔(分)', String(task.remindEveryMinutes || 60));
    if (nextMinutes === null) return;
    const nextDaysBefore = prompt('何日前通知(カンマ区切り)', (task.notifyConfig?.daysBefore || []).join(','));
    if (nextDaysBefore === null) return;
    const nextHoursBefore = prompt('何時間前通知(カンマ区切り)', (task.notifyConfig?.hoursBefore || []).join(','));
    if (nextHoursBefore === null) return;
    const nextSameDayTimes = prompt('当日通知時刻(HH:mm,カンマ区切り)', (task.notifyConfig?.sameDayTimes || []).join(','));
    if (nextSameDayTimes === null) return;
    const nextSnoozeMinutes = prompt('期限切れ後スヌーズ(分)', String(task.notifyConfig?.overdueSnoozeMinutes || 60));
    if (nextSnoozeMinutes === null) return;

    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: nextTitle,
        assignee: nextAssignee,
        dueInput: nextDueInput,
        remindEveryMinutes: Number(nextMinutes || 60),
        notifyConfig: {
          daysBefore: nextDaysBefore,
          hoursBefore: nextHoursBefore,
          sameDayTimes: nextSameDayTimes,
          overdueSnoozeMinutes: Number(nextSnoozeMinutes || 60),
          atDue: task.notifyConfig?.atDue !== false
        }
      })
    });
    await refresh();
  });
  actions.appendChild(editBtn);

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = '削除';
  deleteBtn.classList.add('secondary');
  deleteBtn.addEventListener('click', async () => {
    const ok = await askConfirm(`タスク「${task.title}」を削除しますか？`);
    if (!ok) return;
    const res = await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
    if (!res.ok) {
      notify('削除に失敗しました。', 'error');
      return;
    }
    notify('削除しました。', 'success');
    await refresh();
  });
  actions.appendChild(deleteBtn);

  head.appendChild(actions);

  li.appendChild(head);

  const detailGrid = document.createElement('div');
  detailGrid.className = 'task-detail-grid';
  const rows = [
    ['担当', task.assignee || '未設定'],
    ['期限', task.dueAt ? fmtDate(task.dueAt) : '未設定'],
    ['通知', fmtNotify(task.notifyConfig)],
    ['状態', task.isCompleted ? '完了' : '未完了']
  ];
  if (task.ambiguityFlags?.length) {
    rows.push(['要確認', task.ambiguityFlags.join(', ')]);
  }
  for (const [label, value] of rows) {
    const row = document.createElement('div');
    row.className = 'task-detail-row';
    const keyEl = document.createElement('span');
    keyEl.className = 'task-detail-key';
    keyEl.textContent = label;
    const valEl = document.createElement('span');
    valEl.className = 'task-detail-value';
    valEl.textContent = value;
    row.appendChild(keyEl);
    row.appendChild(valEl);
    detailGrid.appendChild(row);
  }
  li.appendChild(detailGrid);

  return li;
}

function valueBySort(task, key) {
  if (key === 'status') {
    return task.isCompleted ? 1 : 0;
  }
  if (key === 'due') {
    if (!task.dueAt) return Number.POSITIVE_INFINITY;
    const t = new Date(task.dueAt).getTime();
    return Number.isFinite(t) ? t : Number.POSITIVE_INFINITY;
  }
  if (key === 'assignee') {
    return String(task.assignee || '未設定');
  }
  return 0;
}

function sortTasks(tasks) {
  const key = sortKey?.value || 'status';
  const order = sortOrder?.value || 'asc';
  const factor = order === 'desc' ? -1 : 1;
  const arr = [...tasks];
  arr.sort((a, b) => {
    const av = valueBySort(a, key);
    const bv = valueBySort(b, key);
    if (typeof av === 'string' || typeof bv === 'string') {
      return String(av).localeCompare(String(bv), 'ja') * factor;
    }
    if (av < bv) return -1 * factor;
    if (av > bv) return 1 * factor;
    return String(a.title || '').localeCompare(String(b.title || ''), 'ja');
  });
  return arr;
}

function renderTasks(tasks) {
  taskList.innerHTML = '';
  for (const task of sortTasks(tasks)) {
    taskList.appendChild(makeTaskItem(task));
  }
}

async function refresh() {
  const res = await fetch('/api/state', { cache: 'no-store' });
  const state = await res.json();
  lastTasks = state.tasks || [];
  renderTasks(lastTasks);
}

if (closeToChatBtn) {
  closeToChatBtn.addEventListener('click', () => {
    window.location.href = '/';
  });
}

if (sortKey) {
  sortKey.addEventListener('change', () => renderTasks(lastTasks));
}
if (sortOrder) {
  sortOrder.addEventListener('change', () => renderTasks(lastTasks));
}

fetch('/api/icon-settings')
  .then((res) => res.json())
  .then((data) => {
    const icon = document.getElementById('pageIcon');
    if (icon) icon.src = data?.icons?.tasks || '/assets/icons/tasks.svg';
  })
  .catch(() => {});

refresh();
setInterval(refresh, 10000);
