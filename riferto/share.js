/* Share only the public application URL: no vault, medical data or app state. */
(() => {
  'use strict';
  const publicUrl = 'https://making-lemonade.github.io/riferto/';
  const shareData = { title: 'Riferto', text: 'Riferto — i tuoi referti, sul tuo dispositivo.', url: publicUrl };
  let feedbackTimer;
  function feedback(message) {
    let toast = document.getElementById('rifertoShareToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'rifertoShareToast';
      toast.className = 'riferto-share-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(feedbackTimer);
    feedbackTimer = setTimeout(() => toast.classList.remove('visible'), 2700);
  }
  async function share() {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return; // User dismissed the share sheet.
      }
    }
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API not available');
      await navigator.clipboard.writeText(publicUrl);
      feedback('Link di Riferto copiato negli appunti');
    } catch (_) {
      // A selectable URL works even in browsers denying clipboard access.
      window.prompt('Copia e condividi il link pubblico di Riferto:', publicUrl);
    }
  }
  document.querySelectorAll('[data-share-riferto]').forEach(button => {
    button.addEventListener('click', share);
  });
  const style = document.createElement('style');
  style.textContent = '.riferto-share-toast{position:fixed;z-index:45000;left:50%;bottom:calc(env(safe-area-inset-bottom) + 105px);max-width:calc(100vw - 32px);width:max-content;transform:translate(-50%,14px);opacity:0;pointer-events:none;transition:opacity .18s,transform .18s;background:#172b46;color:#fff;border:1px solid rgba(190,215,247,.2);border-radius:14px;padding:12px 16px;box-shadow:0 10px 35px rgba(0,0,0,.24);font:650 13px system-ui,sans-serif;text-align:center}.riferto-share-toast.visible{opacity:1;transform:translate(-50%,0)}';
  document.head.appendChild(style);
})();
