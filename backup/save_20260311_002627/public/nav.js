const nav = document.querySelector('.top-nav');
const navToggle = document.querySelector('.nav-toggle');
const closeBtn = document.querySelector('.close-to-chat');
const pageIcon = document.getElementById('pageIcon');
const currentPath = window.location.pathname;

function mapLinksByHref() {
  const map = new Map();
  if (!nav) return map;
  nav.querySelectorAll('a').forEach((a) => {
    const href = a.getAttribute('href');
    if (!href) return;
    map.set(href, {
      href,
      label: a.textContent?.trim() || href,
      active: a.classList.contains('active') || href === currentPath
    });
  });
  return map;
}

function buildGroupedMenu() {
  if (!nav) return;
  const links = mapLinksByHref();
  const groups = [
    { title: 'メイン', items: ['/', '/help.html', '/manuals.html'] },
    { title: 'タスク', items: ['/tasks.html', '/notify.html'] },
    { title: 'メモ', items: ['/memos.html'] },
    { title: '数値集計', items: ['/number-tool.html'] },
    { title: '利益計算', items: ['/profit-tool.html', '/profit-history.html', '/profit-settings.html', '/profit-manual.html'] },
    { title: '共通設定', items: ['/settings.html', '/icon-settings.html'] }
  ];

  nav.innerHTML = '';
  for (const group of groups) {
    const detail = document.createElement('details');
    detail.className = 'nav-group';
    const summary = document.createElement('summary');
    summary.className = 'nav-group-title';
    summary.textContent = group.title;
    detail.appendChild(summary);

    const list = document.createElement('div');
    list.className = 'nav-group-links';
    let hasActive = false;

    for (const href of group.items) {
      const found = links.get(href);
      if (!found) continue;
      const a = document.createElement('a');
      a.href = found.href;
      a.className = `nav-link ${found.active ? 'active' : ''}`.trim();
      a.textContent = found.label;
      if (found.active) hasActive = true;
      list.appendChild(a);
    }

    if (!list.children.length) continue;
    if (hasActive || window.innerWidth > 900) detail.open = true;
    detail.appendChild(list);
    nav.appendChild(detail);
  }
}

function closeNav() {
  if (!nav || !navToggle) return;
  nav.classList.remove('open');
  navToggle.setAttribute('aria-expanded', 'false');
}

function toggleNav() {
  if (!nav || !navToggle) return;
  const open = nav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
}

function mountMobileTopRow() {
  if (!navToggle) return;
  const parent = navToggle.parentElement;
  if (!parent) return;
  const row = document.createElement('div');
  row.className = 'mobile-top-row';

  row.appendChild(navToggle);

  const inlineActions = Array.from(document.querySelectorAll('.mobile-inline-action'));
  for (const btn of inlineActions) {
    row.appendChild(btn);
  }

  if (closeBtn) {
    row.appendChild(closeBtn);
  }

  parent.insertBefore(row, parent.firstChild);
}

if (nav && navToggle) {
  mountMobileTopRow();
  buildGroupedMenu();

  navToggle.addEventListener('click', toggleNav);

  nav.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => {
      closeNav();
    });
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) closeNav();
  });

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (nav.contains(target) || navToggle.contains(target)) return;
    closeNav();
  });

  if (document.body.classList.contains('chat-page') && pageIcon) {
    pageIcon.setAttribute('role', 'button');
    pageIcon.setAttribute('tabindex', '0');
    pageIcon.setAttribute('aria-label', 'メニューを開閉');
    pageIcon.addEventListener('click', (event) => {
      event.preventDefault();
      toggleNav();
    });
    pageIcon.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      toggleNav();
    });
  }
}

if (closeBtn) {
  closeBtn.addEventListener('click', () => {
    const target = String(closeBtn.dataset.closeHref || '/').trim() || '/';
    window.location.href = target;
  });
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

// Profit pages are tuned frequently; clear old SW/cache to avoid stale UI.
if (window.location.pathname.startsWith('/profit-')) {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => reg.unregister());
    });
  }
  if ('caches' in window) {
    caches.keys().then((keys) => {
      keys.forEach((k) => caches.delete(k));
    });
  }
}
