// Shared interaction details. Business permissions stay in engine.js.
const mobile = window.matchMedia('(max-width: 760px)');
let lastModalTrigger;

export function syncNavigation() {
  const sidebar = document.querySelector('#sidebar');
  if (!sidebar) return;
  const isOpen = sidebar.classList.contains('open') && mobile.matches;
  sidebar.inert = mobile.matches && !isOpen;
  document.querySelector('.mobile-menu')?.setAttribute('aria-expanded', String(isOpen));
  document.querySelector('.nav-scrim')?.toggleAttribute('hidden', !isOpen);
  document.body.classList.toggle('navigation-open', isOpen);
  document.querySelector('.main').inert = isOpen;
}

export function toggleNavigation() {
  const sidebar = document.querySelector('#sidebar');
  if (!sidebar) return;
  const open = sidebar.classList.toggle('open');
  syncNavigation();
  (open ? sidebar.querySelector('[aria-current=page]') : document.querySelector('.mobile-menu'))?.focus();
}

export function rememberModalTrigger() {
  if (!document.querySelector('#modal').open) lastModalTrigger = document.activeElement;
}

export function focusPage() {
  document.querySelector('.page-head h1')?.focus({ preventScroll: true });
}

document.addEventListener('pointerdown', () => {
  document.documentElement.dataset.input = 'pointer';
}, { passive: true });
document.addEventListener('keydown', event => {
  document.documentElement.dataset.input = 'keyboard';
  const sidebar = document.querySelector('#sidebar.open');
  if (!sidebar || !mobile.matches || document.querySelector('#modal').open) return;
  if (event.key === 'Escape') {
    toggleNavigation();
    return;
  }
  if (event.key !== 'Tab') return;
  const items = [...sidebar.querySelectorAll('button:not(:disabled), a[href]')];
  const first = items[0], last = items.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault(); last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault(); first?.focus();
  }
});
document.querySelector('#modal').addEventListener('close', () => {
  if (lastModalTrigger?.isConnected) lastModalTrigger.focus({ preventScroll: true });
});
mobile.addEventListener('change', syncNavigation);
