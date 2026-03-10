const closeToChatBtn = document.getElementById('closeToChatBtn');

if (closeToChatBtn) {
  closeToChatBtn.addEventListener('click', () => {
    window.location.href = '/';
  });
}

fetch('/api/icon-settings')
  .then((res) => res.json())
  .then((data) => {
    const icon = document.getElementById('pageIcon');
    if (icon) icon.src = data?.icons?.help || '/assets/icons/help.svg';
  })
  .catch(() => {});
