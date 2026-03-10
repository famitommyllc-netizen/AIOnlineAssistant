const chatLog = document.getElementById('chatLog');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const taskList = document.getElementById('taskList');
const modeControl = document.getElementById('modeControl');
const modeLabel = document.getElementById('modeLabel');
const exitModeBtn = document.getElementById('exitModeBtn');
const modeFeatureBtn = document.getElementById('modeFeatureBtn');

let pendingById = {};
let openEditorByActionId = {};
let editorDraftByActionId = {};
let currentChatMode = 'normal';
let currentMemoSession = { recording: false, type: '', targetNoteId: '', lineCount: 0 };
let initializedReminderIds = false;
const seenReminderIds = new Set();
let currentMessages = [];
let historyDates = [];
let loadedHistoryDays = [];
let loadedHistoryMessages = [];
let historyLoading = false;
let appMenuConfig = {
  order: ['task_create', 'memo_create', 'profit', 'number'],
  enabled: ['task_create', 'memo_create', 'profit', 'number'],
  layout: 'grid3',
  iconSize: 102
};
let actionIcons = {
  chat: '/assets/icons/chat.svg',
  tasks: '/assets/icons/tasks.svg',
  memos: '/assets/icons/memos.svg',
  number: '/assets/icons/number.svg',
  profit: '/assets/icons/profit.svg',
  profitSettings: '/assets/icons/profit-settings.svg',
  help: '/assets/icons/help.svg',
  settings: '/assets/icons/settings.svg',
  iconSettings: '/assets/icons/icon-settings.svg'
};
const appMenuDefinitions = {
  task_create: { label: 'タスク作成', iconKey: 'tasks', type: 'chat', command: 'タスク作成' },
  memo_create: { label: 'メモ作成', iconKey: 'memos', type: 'chat', command: 'メモ作成' },
  profit: { label: '利益計算', iconKey: 'profit', type: 'nav', href: '/profit-tool.html' },
  number: { label: '数値集計', iconKey: 'number', type: 'nav', href: '/number-tool.html' },
  help: { label: '使い方', iconKey: 'help', type: 'nav', href: '/help.html' },
  settings: { label: '設定', iconKey: 'settings', type: 'nav', href: '/settings.html' }
};

const defaultIntroMessage = [
  'いつでも、どのようなご用件でもお申し付けくださいませ。',
  'ご相談、情報検索、各種サポートまで、順次お手伝いいたします。',
  'ご要望はそのままお送りいただければ、こちらで整理して対応いたします。',
  '過去トークは日次で履歴保存し、当画面は省データ化のため最新表示のみとしております。',
  '',
  '連携アプリをご利用の際は、下記ボタンよりお選びくださいませ。'
].join('\n');

function readSeenReminderIds() {
  try {
    const raw = localStorage.getItem('seenReminderIds');
    const arr = raw ? JSON.parse(raw) : [];
    if (Array.isArray(arr)) {
      for (const id of arr) seenReminderIds.add(String(id));
    }
  } catch {}
}

function persistSeenReminderIds() {
  try {
    localStorage.setItem('seenReminderIds', JSON.stringify(Array.from(seenReminderIds).slice(-500)));
  } catch {}
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

function toJstYmd(value) {
  try {
    return new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(value ? new Date(value) : new Date());
  } catch {
    return '';
  }
}

function findLatestArchivedDay() {
  const dates = Array.isArray(historyDates) ? historyDates : [];
  const today = toJstYmd();
  return dates.find((d) => d && d !== today) || null;
}

function buildArchiveNoticeMessage() {
  const latestDay = findLatestArchivedDay();
  if (!latestDay) return null;
  return {
    id: `archive_notice_${latestDay}`,
    role: 'assistant',
    text: `前日分までのトークは履歴へ保存し、こちらの画面からは削除済みでございます。\n保存日: ${latestDay}\n必要に応じて、下記ボタンまたは上スクロールで履歴を読み込みいただけます。`,
    createdAt: new Date().toISOString(),
    synthetic: true,
    action: {
      kind: 'open_history_day',
      day: latestDay
    }
  };
}

function makeHistoryMarkerMessage(day, count) {
  return {
    id: `history_marker_${day}`,
    role: 'assistant',
    text: `${day} の履歴を読み込みました（${count}件）。`,
    createdAt: new Date(`${day}T00:00:00+09:00`).toISOString(),
    synthetic: true,
    historyMarker: true
  };
}

function normalizeHistoryMessages(day, items) {
  const records = Array.isArray(items) ? items : [];
  const converted = [];
  for (const item of records) {
    if (item?.kind !== 'message') continue;
    const data = item?.data || {};
    const role = data.role === 'user' ? 'user' : 'assistant';
    const text = String(data.text || '').trim();
    if (!text) continue;
    converted.push({
      id: `hist_${day}_${data.id || converted.length}`,
      role,
      text,
      createdAt: data.createdAt || item.archivedAt || new Date().toISOString(),
      synthetic: true,
      archived: true,
      action: null
    });
  }
  return [makeHistoryMarkerMessage(day, converted.length), ...converted];
}

function getNextHistoryDayToLoad() {
  const dates = Array.isArray(historyDates) ? historyDates : [];
  const today = toJstYmd();
  for (const day of dates) {
    if (!day || day === today) continue;
    if (loadedHistoryDays.includes(day)) continue;
    return day;
  }
  return null;
}

function composeDisplayMessages() {
  const base = Array.isArray(currentMessages) ? [...currentMessages] : [];
  const current = base.length
    ? base
    : [
        {
          id: 'intro_local',
          role: 'assistant',
          text: defaultIntroMessage,
          action: { kind: 'open_app_menu' },
          createdAt: new Date().toISOString(),
          synthetic: true
        }
      ];

  const out = [];
  const notice = buildArchiveNoticeMessage();
  if (notice) out.push(notice);
  if (loadedHistoryMessages.length) out.push(...loadedHistoryMessages);
  out.push(...current);
  return out;
}

async function loadHistoryDay(day, options = {}) {
  if (!day || historyLoading) return;
  if (loadedHistoryDays.includes(day)) return;
  historyLoading = true;
  const preserveTop = Boolean(options.preserveTop);
  const prevScrollTop = chatLog ? chatLog.scrollTop : 0;
  const prevScrollHeight = chatLog ? chatLog.scrollHeight : 0;
  try {
    const res = await fetch(`/api/history/${day}`, { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    const msgs = normalizeHistoryMessages(day, data.items || []);
    loadedHistoryDays.push(day);
    loadedHistoryMessages = [...msgs, ...loadedHistoryMessages];
    renderMessages(composeDisplayMessages(), {
      preserveTop,
      prevScrollTop,
      prevScrollHeight
    });
  } catch {
    // noop
  } finally {
    historyLoading = false;
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

async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : '{}'
  });
  return res;
}

function maybeSendDeviceNotifications(state) {
  const reminders = Array.isArray(state?.reminders) ? state.reminders : [];
  const tasks = Array.isArray(state?.tasks) ? state.tasks : [];
  if (!initializedReminderIds) {
    for (const rem of reminders) seenReminderIds.add(String(rem.id));
    initializedReminderIds = true;
    persistSeenReminderIds();
    return;
  }
  const canNotify = typeof Notification !== 'undefined' && Notification.permission === 'granted';
  for (const rem of reminders) {
    const id = String(rem.id || '');
    if (!id || seenReminderIds.has(id)) continue;
    seenReminderIds.add(id);
    if (!canNotify) continue;
    const task = tasks.find((t) => t.id === rem.taskId);
    const title = task?.title || '未完了タスク';
    const reasons = Array.isArray(rem.reasons) ? rem.reasons.join(' / ') : '通知';
    const dueText = task?.dueAt ? fmtDate(task.dueAt) : '未設定';
    try {
      new Notification(`タスク通知: ${title}`, {
        body: `${reasons} | 期限: ${dueText}`,
        tag: `task-${task?.id || id}`,
        renotify: true
      });
    } catch {}
  }
  persistSeenReminderIds();
}

async function handlePendingAction(actionId, kind) {
  const endpoint = kind === 'approve' ? 'approve' : 'reject';
  await postJson(`/api/pending/${actionId}/${endpoint}`);
  await refresh();
}

function buildActionUI(msg) {
  if (!msg.action) return null;

  function createNavAction(label, href, iconKey) {
    const wrap = document.createElement('div');
    wrap.className = 'msg-action-wrap';
    const row = document.createElement('div');
    row.className = 'msg-action-row';

    const iconBtn = document.createElement('button');
    iconBtn.type = 'button';
    iconBtn.className = 'mini-btn icon-mini-btn';
    const img = document.createElement('img');
    img.className = 'action-icon';
    img.alt = '';
    img.src = actionIcons[iconKey] || '/assets/icons/chat.svg';
    iconBtn.appendChild(img);
    iconBtn.addEventListener('click', () => {
      window.location.href = href;
    });
    row.appendChild(iconBtn);

    const openBtn = document.createElement('button');
    openBtn.type = 'button';
    openBtn.className = 'mini-btn';
    openBtn.textContent = label;
    openBtn.addEventListener('click', () => {
      window.location.href = href;
    });
    row.appendChild(openBtn);

    wrap.appendChild(row);
    return wrap;
  }

  if (msg.action.kind === 'open_settings') {
    return createNavAction('設定画面を開く', '/settings.html', 'settings');
  }

  if (msg.action.kind === 'open_tasks') {
    return createNavAction('タスク管理を開く', '/tasks.html', 'tasks');
  }

  if (msg.action.kind === 'open_number_tool') {
    return createNavAction('数値集計を開く', '/number-tool.html', 'number');
  }

  if (msg.action.kind === 'open_profit_tool') {
    return createNavAction('利益計算を開く', '/profit-tool.html', 'profit');
  }

  if (msg.action.kind === 'open_profit_history') {
    return createNavAction('利益履歴を開く', '/profit-history.html', 'profit');
  }

  if (msg.action.kind === 'open_profit_settings') {
    return createNavAction('利益計算の設定を開く', '/profit-settings.html', 'profitSettings');
  }

  if (msg.action.kind === 'open_profit_manual') {
    return createNavAction('利益計算マニュアルを開く', '/profit-manual.html', 'help');
  }

  if (msg.action.kind === 'open_manual_index') {
    return createNavAction('マニュアル一覧を開く', '/manuals.html', 'help');
  }

  if (msg.action.kind === 'open_icon_settings') {
    return createNavAction('アイコン設定を開く', '/icon-settings.html', 'iconSettings');
  }

  if (msg.action.kind === 'open_help') {
    return createNavAction('使い方を開く', '/help.html', 'help');
  }

  if (msg.action.kind === 'open_notify') {
    return createNavAction('通知設定を開く', '/notify.html', 'settings');
  }

  if (msg.action.kind === 'open_memos') {
    return createNavAction('メモ一覧を開く', '/memos.html', 'memos');
  }

  if (msg.action.kind === 'choose_memo_type') {
    const wrap = document.createElement('div');
    wrap.className = 'msg-action-wrap';

    const info = document.createElement('div');
    info.className = 'msg-action-info';
    info.textContent = '記録方式をお選びください。';
    wrap.appendChild(info);

    const row = document.createElement('div');
    row.className = 'msg-action-row';

    const appendBtn = document.createElement('button');
    appendBtn.type = 'button';
    appendBtn.className = 'mini-btn';
    appendBtn.textContent = 'ログメモ（追記）';
    appendBtn.addEventListener('click', async () => {
      await fetch('/api/memo/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'append' })
      });
      await refresh();
    });
    row.appendChild(appendBtn);

    const individualBtn = document.createElement('button');
    individualBtn.type = 'button';
    individualBtn.className = 'mini-btn secondary';
    individualBtn.textContent = '個別メモ（分割）';
    individualBtn.addEventListener('click', async () => {
      await fetch('/api/memo/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'individual' })
      });
      await refresh();
    });
    row.appendChild(individualBtn);

    wrap.appendChild(row);
    return wrap;
  }

  if (msg.action.kind === 'memo_saved') {
    const wrap = document.createElement('div');
    wrap.className = 'msg-action-wrap';

    const note = msg.action.note || {};
    const savedAt = note.updatedAt ? fmtDate(note.updatedAt) : note.createdAt ? fmtDate(note.createdAt) : '';
    const content = String(note.text || '').trim();
    const memoTitle = String(note.title || '').trim() || 'メモ';
    const memoKindRaw = String(note.memoKind || '').trim();
    const memoKind =
      memoKindRaw === 'append' ? 'ログメモ（追記）' : memoKindRaw === 'individual' ? '個別メモ（分割）' : 'メモ';

    const summary = document.createElement('div');
    summary.className = 'msg-action-summary';

    const titleRow = document.createElement('div');
    titleRow.className = 'msg-action-summary-row';
    titleRow.innerHTML = `<span class="msg-action-summary-label">${memoTitle}</span><span class="msg-action-summary-value">${savedAt || '時刻未取得'}</span>`;
    summary.appendChild(titleRow);

    const typeRow = document.createElement('div');
    typeRow.className = 'msg-action-summary-row';
    typeRow.innerHTML = `<span class="msg-action-summary-label">記録方式</span><span class="msg-action-summary-value">${memoKind}</span>`;
    summary.appendChild(typeRow);

    const contentBox = document.createElement('div');
    contentBox.className = 'msg-action-summary-content';
    contentBox.textContent = content || '(未入力)';
    summary.appendChild(contentBox);
    wrap.appendChild(summary);

    const row = document.createElement('div');
    row.className = 'msg-action-row';

    const openBtn = document.createElement('button');
    openBtn.type = 'button';
    openBtn.className = 'mini-btn';
    openBtn.textContent = 'メモ一覧を開く';
    openBtn.addEventListener('click', () => {
      window.location.href = '/memos.html';
    });
    row.appendChild(openBtn);

    wrap.appendChild(row);
    return wrap;
  }

  if (msg.action.kind === 'web_search_results') {
    const wrap = document.createElement('div');
    wrap.className = 'msg-action-wrap';

    const info = document.createElement('div');
    info.className = 'msg-action-info';
    const q = String(msg.action.query || '').trim();
    const start = Number(msg.action.start || 0);
    const end = Number(msg.action.end || 0);
    info.textContent = q
      ? `検索語: ${q}${start > 0 && end >= start ? ` / 範囲: ${start}〜${end}` : ''}`
      : '検索結果リンク';
    wrap.appendChild(info);

    const list = document.createElement('div');
    list.className = 'msg-action-search-list';
    const results = Array.isArray(msg.action.results) ? msg.action.results : [];

    for (const result of results.slice(0, 20)) {
      const item = document.createElement('div');
      item.className = 'msg-action-search-item';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mini-btn secondary';
      const title = String(result?.title || '').trim() || '検索結果';
      const rank = Number(result?.rank || 0);
      btn.textContent = rank > 0 ? `${rank}. ${title}` : title;
      btn.addEventListener('click', () => {
        const link = String(result?.link || '').trim();
        if (!link) return;
        window.open(link, '_blank', 'noopener,noreferrer');
      });

      item.appendChild(btn);

      const linkAnchor = document.createElement('a');
      linkAnchor.className = 'msg-action-search-link';
      linkAnchor.href = String(result?.link || '').trim() || '#';
      linkAnchor.target = '_blank';
      linkAnchor.rel = 'noopener noreferrer';
      linkAnchor.textContent = String(result?.link || '').trim();
      item.appendChild(linkAnchor);

      const snippet = String(result?.snippet || '').trim();
      if (snippet) {
        const snippetEl = document.createElement('div');
        snippetEl.className = 'msg-action-search-snippet';
        snippetEl.textContent = snippet;
        item.appendChild(snippetEl);
      }

      list.appendChild(item);
    }

    wrap.appendChild(list);
    return wrap;
  }

  if (msg.action.kind === 'open_history_day') {
    const wrap = document.createElement('div');
    wrap.className = 'msg-action-wrap';
    const row = document.createElement('div');
    row.className = 'msg-action-row';

    const openBtn = document.createElement('button');
    openBtn.type = 'button';
    openBtn.className = 'mini-btn';
    openBtn.textContent = `${msg.action.day} の履歴を表示`;
    openBtn.addEventListener('click', async () => {
      await loadHistoryDay(msg.action.day, { preserveTop: true });
    });
    row.appendChild(openBtn);

    wrap.appendChild(row);
    return wrap;
  }

  if (msg.action.kind === 'open_app_menu') {
    const wrap = document.createElement('div');
    wrap.className = 'msg-action-wrap app-menu-wrap';
    const grid = document.createElement('div');
    grid.className = 'msg-action-grid';
    const layout = appMenuConfig?.layout === 'single' ? 'single' : 'grid3';
    grid.classList.add(`layout-${layout}`);

    function addNavItem(label, href, iconKey) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mini-btn action-grid-btn app-launch-btn';
      const img = document.createElement('img');
      img.className = 'action-icon';
      img.alt = '';
      img.src = actionIcons[iconKey] || '/assets/icons/chat.svg';
      const span = document.createElement('span');
      span.textContent = label;
      btn.appendChild(img);
      btn.appendChild(span);
      btn.addEventListener('click', () => {
        window.location.href = href;
      });
      grid.appendChild(btn);
    }

    function addChatItem(label, command, iconKey) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mini-btn action-grid-btn secondary app-launch-btn';
      const img = document.createElement('img');
      img.className = 'action-icon';
      img.alt = '';
      img.src = actionIcons[iconKey] || '/assets/icons/chat.svg';
      const span = document.createElement('span');
      span.textContent = label;
      btn.appendChild(img);
      btn.appendChild(span);
      btn.addEventListener('click', async () => {
        await postJson('/api/chat', { text: command });
        await refresh();
      });
      grid.appendChild(btn);
    }

    const order = Array.isArray(appMenuConfig?.order) ? appMenuConfig.order : [];
    const enabled = new Set(Array.isArray(appMenuConfig?.enabled) ? appMenuConfig.enabled : []);
    for (const key of order) {
      if (!enabled.has(key)) continue;
      const def = appMenuDefinitions[key];
      if (!def) continue;
      if (def.type === 'chat') {
        addChatItem(def.label, def.command, def.iconKey);
      } else {
        addNavItem(def.label, def.href, def.iconKey);
      }
    }

    wrap.appendChild(grid);
    return wrap;
  }

  if (msg.action.kind === 'choose_tool') {
    const wrap = document.createElement('div');
    wrap.className = 'msg-action-wrap';
    const row = document.createElement('div');
    row.className = 'msg-action-row';

    const numberIconBtn = document.createElement('button');
    numberIconBtn.type = 'button';
    numberIconBtn.className = 'mini-btn icon-mini-btn';
    const numberIcon = document.createElement('img');
    numberIcon.className = 'action-icon';
    numberIcon.alt = '';
    numberIcon.src = actionIcons.number || '/assets/icons/number.svg';
    numberIconBtn.appendChild(numberIcon);
    numberIconBtn.addEventListener('click', () => {
      window.location.href = '/number-tool.html';
    });
    row.appendChild(numberIconBtn);

    const numberBtn = document.createElement('button');
    numberBtn.type = 'button';
    numberBtn.className = 'mini-btn';
    numberBtn.textContent = '数値集計を開く';
    numberBtn.addEventListener('click', () => {
      window.location.href = '/number-tool.html';
    });
    row.appendChild(numberBtn);

    const profitIconBtn = document.createElement('button');
    profitIconBtn.type = 'button';
    profitIconBtn.className = 'mini-btn icon-mini-btn secondary';
    const profitIcon = document.createElement('img');
    profitIcon.className = 'action-icon';
    profitIcon.alt = '';
    profitIcon.src = actionIcons.profit || '/assets/icons/profit.svg';
    profitIconBtn.appendChild(profitIcon);
    profitIconBtn.addEventListener('click', () => {
      window.location.href = '/profit-tool.html';
    });
    row.appendChild(profitIconBtn);

    const profitBtn = document.createElement('button');
    profitBtn.type = 'button';
    profitBtn.className = 'mini-btn secondary';
    profitBtn.textContent = '利益計算を開く';
    profitBtn.addEventListener('click', () => {
      window.location.href = '/profit-tool.html';
    });
    row.appendChild(profitBtn);

    wrap.appendChild(row);
    return wrap;
  }

  if (msg.action.kind !== 'task_proposal') return null;

  const actionId = msg.action.actionId;
  const actionState = pendingById[actionId]?.status || 'pending';
  const proposal = pendingById[actionId]?.proposal || msg.action.proposal || {};

  const wrap = document.createElement('div');
  wrap.className = 'msg-action-wrap';

  const info = document.createElement('div');
  info.className = 'msg-action-info';
  const ambiguity = Array.isArray(proposal.ambiguityFlags) && proposal.ambiguityFlags.length
    ? ` | 要確認: ${proposal.ambiguityFlags.join(',')}`
    : '';
  const noLabel = proposal.taskNo ? `#${proposal.taskNo} ` : '';
  info.textContent = `件名: ${noLabel}${proposal.title || '未命名'} | 担当: ${proposal.assignee || '未設定'} | 期限: ${proposal.dueAt ? fmtDate(proposal.dueAt) : '未確定'} | 通知: ${fmtNotify(proposal.notifyConfig)}${ambiguity}`;
  wrap.appendChild(info);

  const row = document.createElement('div');
  row.className = 'msg-action-row';

  const approveBtn = document.createElement('button');
  approveBtn.type = 'button';
  approveBtn.className = 'mini-btn';
  approveBtn.textContent = actionState === 'approved' ? '承認済み' : '承認';
  approveBtn.disabled = actionState !== 'pending';
  approveBtn.addEventListener('click', () => handlePendingAction(actionId, 'approve'));
  row.appendChild(approveBtn);

  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.className = 'mini-btn';
  editBtn.textContent = '編集';
  editBtn.disabled = actionState !== 'pending';
  editBtn.addEventListener('click', () => {
    openEditorByActionId[actionId] = !openEditorByActionId[actionId];
    renderMessages(window.__lastMessages || []);
  });
  row.appendChild(editBtn);

  const rejectBtn = document.createElement('button');
  rejectBtn.type = 'button';
  rejectBtn.className = 'mini-btn secondary';
  rejectBtn.textContent = actionState === 'rejected' ? '見送り済み' : '見送り';
  rejectBtn.disabled = actionState !== 'pending';
  rejectBtn.addEventListener('click', () => handlePendingAction(actionId, 'reject'));
  row.appendChild(rejectBtn);

  wrap.appendChild(row);

  if (openEditorByActionId[actionId] && actionState === 'pending') {
    const editor = document.createElement('div');
    editor.className = 'inline-editor';

    const input = document.createElement('textarea');
    input.className = 'inline-editor-input';
    input.rows = 3;
    input.placeholder = '口語で編集内容を入力 例: 担当は田中、期限は来週火曜朝10時、通知は3日前と1日前';
    input.value = editorDraftByActionId[actionId] || '';
    input.addEventListener('input', () => {
      editorDraftByActionId[actionId] = input.value;
    });
    editor.appendChild(input);

    const actionRow = document.createElement('div');
    actionRow.className = 'msg-action-row';

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'mini-btn';
    saveBtn.textContent = '編集を反映';
    saveBtn.addEventListener('click', async () => {
      const text = input.value.trim();
      if (!text) return;
      await postJson(`/api/pending/${actionId}/edit`, { text });
      openEditorByActionId[actionId] = false;
      editorDraftByActionId[actionId] = '';
      await refresh();
    });
    actionRow.appendChild(saveBtn);

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'mini-btn secondary';
    cancelBtn.textContent = '閉じる';
    cancelBtn.addEventListener('click', () => {
      openEditorByActionId[actionId] = false;
      renderMessages(window.__lastMessages || []);
    });
    actionRow.appendChild(cancelBtn);

    editor.appendChild(actionRow);
    wrap.appendChild(editor);
  }

  return wrap;
}

function renderMessages(messages, options = {}) {
  const prevScrollTop = Number(options.prevScrollTop || 0);
  const prevScrollHeight = Number(options.prevScrollHeight || 0);
  const preserveTop = Boolean(options.preserveTop);
  const forceBottom = Boolean(options.forceBottom);
  const wasNearBottom = chatLog
    ? chatLog.scrollHeight - chatLog.scrollTop - chatLog.clientHeight < 80
    : true;

  window.__lastMessages = messages;
  chatLog.innerHTML = '';
  for (const msg of messages) {
    const wrap = document.createElement('div');
    wrap.className = `msg-wrap ${msg.role}`;
    if (msg.synthetic) wrap.classList.add('synthetic');
    if (msg.archived) wrap.classList.add('archived');
    if (msg.historyMarker) wrap.classList.add('history-marker');

    const div = document.createElement('div');
    div.className = `msg ${msg.role}`;
    if (msg.synthetic) div.classList.add('synthetic');
    if (msg.archived) div.classList.add('archived');
    if (msg.historyMarker) div.classList.add('history-marker');

    const text = document.createElement('div');
    text.textContent = msg.text;
    div.appendChild(text);

    const actionUI = buildActionUI(msg);
    if (actionUI) div.appendChild(actionUI);

    wrap.appendChild(div);

    const meta = document.createElement('div');
    meta.className = 'msg-meta outer';
    const roleLabel = msg.historyMarker ? 'archive' : msg.role;
    meta.textContent = `${roleLabel} | ${fmtDate(msg.createdAt)}`;
    wrap.appendChild(meta);

    chatLog.appendChild(wrap);
  }

  if (preserveTop) {
    const nextHeight = chatLog.scrollHeight;
    const delta = Math.max(0, nextHeight - prevScrollHeight);
    chatLog.scrollTop = Math.max(0, prevScrollTop + delta);
    return;
  }

  if (forceBottom || wasNearBottom) {
    chatLog.scrollTop = chatLog.scrollHeight;
  }
}

function makeTaskItem(task) {
  const li = document.createElement('li');
  li.className = `task-item ${task.isCompleted ? 'done' : ''}`;

  const head = document.createElement('div');
  head.className = 'task-head';

  const title = document.createElement('strong');
  title.textContent = `${task.taskNo ? `#${task.taskNo} ` : ''}${task.title}`;
  head.appendChild(title);

  const btn = document.createElement('button');
  btn.textContent = task.isCompleted ? '再開' : '完了';
  if (task.isCompleted) btn.classList.add('secondary');
  btn.addEventListener('click', async () => {
    const path = task.isCompleted ? 'reopen' : 'complete';
    await fetch(`/api/tasks/${task.id}/${path}`, { method: 'PATCH' });
    await refresh();
  });
  head.appendChild(btn);

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
  head.appendChild(editBtn);

  li.appendChild(head);

  const meta = document.createElement('div');
  meta.className = 'task-meta';
  const ambiguity = task.ambiguityFlags?.length ? ` | 要確認: ${task.ambiguityFlags.join(',')}` : '';
  meta.textContent = `担当: ${task.assignee || '未設定'} | 期限: ${task.dueAt ? fmtDate(task.dueAt) : '未設定'} | 通知: ${fmtNotify(task.notifyConfig)}${ambiguity}`;
  li.appendChild(meta);

  return li;
}

function renderTasks(tasks) {
  if (!taskList) return;
  taskList.innerHTML = '';
  for (const task of tasks) {
    taskList.appendChild(makeTaskItem(task));
  }
}

function modeName(mode) {
  if (mode === 'task_create') return 'タスク作成モード';
  if (mode === 'memo') return 'メモモード';
  return '通常モード';
}

function renderModeControl(mode, memoSession) {
  if (!modeControl || !modeLabel || !exitModeBtn) return;
  const current = mode || 'normal';
  const memo = memoSession || {};
  if (current === 'normal') {
    modeControl.style.display = 'none';
    modeLabel.textContent = '';
    if (modeFeatureBtn) {
      modeFeatureBtn.style.display = 'none';
      modeFeatureBtn.disabled = true;
      modeFeatureBtn.textContent = '';
      modeFeatureBtn.dataset.action = '';
    }
    return;
  }
  modeLabel.textContent = `現在: ${modeName(current)}`;
  modeControl.style.display = 'flex';
  exitModeBtn.disabled = false;
  exitModeBtn.textContent = 'モード終了';

  if (modeFeatureBtn) {
    modeFeatureBtn.style.display = 'none';
    modeFeatureBtn.disabled = true;
    modeFeatureBtn.textContent = '';
    modeFeatureBtn.dataset.action = '';

    if (current === 'memo' && memo.recording) {
      modeFeatureBtn.style.display = '';
      modeFeatureBtn.disabled = false;
      modeFeatureBtn.textContent = '記録終了';
      modeFeatureBtn.dataset.action = 'memo_stop';
    }
  }
}

function applyAppMenuStyle() {
  const raw = Number(appMenuConfig?.iconSize || 102);
  const size = Number.isFinite(raw) ? Math.max(40, Math.min(120, Math.round(raw))) : 102;
  document.documentElement.style.setProperty('--app-icon-size', `${size}px`);
}

async function refresh() {
  const res = await fetch('/api/state', { cache: 'no-store' });
  const state = await res.json();
  pendingById = Object.fromEntries((state.pendingActions || []).map((a) => [a.id, a]));
  currentChatMode = state.chatMode || 'normal';
  currentMemoSession = state.memoSession || { recording: false, type: '', targetNoteId: '', lineCount: 0 };
  appMenuConfig = state?.settings?.appMenu || appMenuConfig;
  historyDates = Array.isArray(state?.history?.dates) ? state.history.dates : [];
  applyAppMenuStyle();
  currentMessages = Array.isArray(state.messages) ? [...state.messages] : [];
  renderMessages(composeDisplayMessages());
  renderTasks(state.tasks || []);
  renderModeControl(currentChatMode, currentMemoSession);
  maybeSendDeviceNotifications(state);
}

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;

  await postJson('/api/chat', { text });
  chatInput.value = '';
  await refresh();
});

if (exitModeBtn) {
  exitModeBtn.addEventListener('click', async () => {
    await postJson('/api/chat', { text: '通常モード' });
    await refresh();
  });
}

if (modeFeatureBtn) {
  modeFeatureBtn.addEventListener('click', async () => {
    const action = String(modeFeatureBtn.dataset.action || '').trim();
    if (!action) return;
    if (action === 'memo_stop') {
      await fetch('/api/memo/session/stop', { method: 'POST' });
      await refresh();
    }
  });
}

if (chatLog) {
  chatLog.addEventListener('scroll', async () => {
    if (historyLoading) return;
    if (chatLog.scrollTop > 16) return;
    const nextDay = getNextHistoryDayToLoad();
    if (!nextDay) return;
    await loadHistoryDay(nextDay, { preserveTop: true });
  });
}

readSeenReminderIds();
refresh();
setInterval(refresh, 10000);

fetch('/api/icon-settings')
  .then((res) => res.json())
  .then((data) => {
    const icon = document.getElementById('pageIcon');
    actionIcons = { ...actionIcons, ...(data?.icons || {}) };
    if (icon) icon.src = actionIcons.chat || '/assets/icons/chat.svg';
  })
  .catch(() => {});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}
