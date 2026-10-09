// PWA install prompt handler
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  // Show all install buttons
  document.querySelectorAll('.pwa-install-btn').forEach(btn => btn.style.display = '');
});

function triggerPwaInstall() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => { deferredPrompt = null; });
  } else {
    alert('To install: use your browser\'s menu → Install, or Add to Home Screen on mobile.');
  }
}

window.addEventListener('appinstalled', () => { deferredPrompt = null; });
