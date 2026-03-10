(function () {
  function ensureContainer() {
    let el = document.getElementById('appFeedbackContainer');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'appFeedbackContainer';
    el.className = 'app-feedback-container';
    document.body.appendChild(el);
    return el;
  }

  function showNotice(message, options = {}) {
    const container = ensureContainer();
    const toast = document.createElement('div');
    const type = options.type || 'info';
    const duration = Number(options.duration || 1800);
    toast.className = `app-toast app-toast-${type}`;
    toast.textContent = String(message || '');
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('is-show'));
    setTimeout(() => {
      toast.classList.remove('is-show');
      setTimeout(() => toast.remove(), 180);
    }, duration);
  }

  function confirmDialog(message, options = {}) {
    return new Promise((resolve) => {
      const backdrop = document.createElement('div');
      backdrop.className = 'app-confirm-backdrop';

      const panel = document.createElement('div');
      panel.className = 'app-confirm-panel';

      const text = document.createElement('p');
      text.className = 'app-confirm-text';
      text.textContent = String(message || '');

      const actions = document.createElement('div');
      actions.className = 'app-confirm-actions';

      const noBtn = document.createElement('button');
      noBtn.type = 'button';
      noBtn.className = 'secondary';
      noBtn.textContent = options.cancelLabel || 'いいえ';

      const yesBtn = document.createElement('button');
      yesBtn.type = 'button';
      yesBtn.textContent = options.okLabel || 'はい';

      function close(result) {
        backdrop.remove();
        resolve(result);
      }

      noBtn.addEventListener('click', () => close(false));
      yesBtn.addEventListener('click', () => close(true));
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) close(false);
      });

      actions.append(noBtn, yesBtn);
      panel.append(text, actions);
      backdrop.appendChild(panel);
      document.body.appendChild(backdrop);
    });
  }

  window.AppFeedback = {
    showNotice,
    confirm: confirmDialog
  };
})();
