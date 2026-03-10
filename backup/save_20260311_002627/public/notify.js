const notifyStatus = document.getElementById('notifyStatus');
const notifyPermissionBtn = document.getElementById('notifyPermissionBtn');
const closeToChatBtn = document.getElementById('closeToChatBtn');

function syncNotifyStatus() {
  if (!notifyStatus || !notifyPermissionBtn) return;
  const supported = typeof window !== 'undefined' && 'Notification' in window;
  if (!supported) {
    notifyStatus.textContent = '端末通知: このブラウザは未対応';
    notifyPermissionBtn.disabled = true;
    return;
  }
  if (Notification.permission === 'granted') {
    notifyStatus.textContent = '端末通知: 有効';
    notifyPermissionBtn.disabled = true;
    return;
  }
  if (Notification.permission === 'denied') {
    notifyStatus.textContent = '端末通知: ブロックされています（ブラウザ設定で許可してください）';
    notifyPermissionBtn.disabled = true;
    return;
  }
  notifyStatus.textContent = '端末通知: 未許可';
  notifyPermissionBtn.disabled = false;
}

if (notifyPermissionBtn) {
  notifyPermissionBtn.addEventListener('click', async () => {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    if (result === 'granted') {
      try {
        new Notification('通知を有効化しました', {
          body: 'リマインドはチャット表示と端末通知の両方でお知らせします。'
        });
      } catch {}
    }
    syncNotifyStatus();
  });
}

if (closeToChatBtn) {
  closeToChatBtn.addEventListener('click', () => {
    window.location.href = '/';
  });
}

syncNotifyStatus();
