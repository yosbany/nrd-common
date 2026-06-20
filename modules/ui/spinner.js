// Unified loading spinner for all NRD frontend apps.
// Generic: works for any async operation with optional message.

const SPINNER_ID = 'loading-spinner';
const STYLE_ID = 'nrd-spinner-styles';
const SPINNER_VERSION = '3';

/** @type {Array<string|null|undefined>} */
const requestStack = [];

const SPINNER_STYLES = `
#${SPINNER_ID}.nrd-spinner-visible {
  display: flex;
}
#${SPINNER_ID} {
  display: none;
}
@keyframes nrd-spinner-spin {
  to { transform: rotate(360deg); }
}
@keyframes nrd-spinner-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes nrd-spinner-scale-in {
  from { opacity: 0; transform: scale(0.96) translateY(4px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
.nrd-spinner-orbit {
  animation: nrd-spinner-spin 0.85s cubic-bezier(0.55, 0.15, 0.45, 0.85) infinite;
}
#${SPINNER_ID}.nrd-spinner-visible {
  animation: nrd-spinner-fade-in 0.18s ease-out;
}
.nrd-spinner-panel {
  animation: nrd-spinner-scale-in 0.22s ease-out;
}
#nrd-spinner-message.nrd-spinner-message-hidden {
  display: none;
}
`;

function injectStyles() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = SPINNER_STYLES;
  document.head.appendChild(style);
}

function getSpinnerPanelMarkup() {
  return `
    <div class="nrd-spinner-panel bg-white border border-gray-200 shadow-[0_20px_50px_rgba(15,23,42,0.16)] px-8 py-7 flex flex-col items-center gap-5 min-w-[200px] max-w-[min(90vw,340px)]">
      <div class="relative w-12 h-12" aria-hidden="true">
        <div class="absolute inset-0 border-[3px] border-gray-100"></div>
        <div class="absolute inset-0 border-[3px] border-transparent border-t-red-600 nrd-spinner-orbit"></div>
        <div class="absolute inset-[10px] border-2 border-gray-100"></div>
      </div>
      <p id="nrd-spinner-message" class="nrd-spinner-message-hidden text-sm text-gray-700 font-light tracking-wide text-center leading-snug"></p>
    </div>
  `;
}

function normalizeMessage(message) {
  if (message === undefined || message === null) return null;
  const text = String(message).trim();
  return text || null;
}

function applyMessage(message) {
  const spinner = document.getElementById(SPINNER_ID);
  const el = document.getElementById('nrd-spinner-message');
  if (!spinner || !el) return;

  const text = normalizeMessage(message);
  if (text) {
    el.textContent = text;
    el.classList.remove('nrd-spinner-message-hidden');
    spinner.setAttribute('aria-labelledby', 'nrd-spinner-message');
    spinner.removeAttribute('aria-label');
  } else {
    el.textContent = '';
    el.classList.add('nrd-spinner-message-hidden');
    spinner.removeAttribute('aria-labelledby');
    spinner.setAttribute('aria-label', 'Cargando');
  }
}

function syncSpinnerVisibility() {
  const spinner = document.getElementById(SPINNER_ID);
  if (!spinner) return;

  const visible = requestStack.length > 0;

  if (visible) {
    const topMessage = requestStack[requestStack.length - 1];
    applyMessage(topMessage);
    spinner.classList.remove('hidden');
    spinner.classList.add('nrd-spinner-visible');
    spinner.setAttribute('aria-busy', 'true');
    if (requestStack.length === 1) {
      document.body.dataset.nrdSpinnerPrevOverflow = document.body.style.overflow || '';
      document.body.style.overflow = 'hidden';
    }
    return;
  }

  spinner.classList.add('hidden');
  spinner.classList.remove('nrd-spinner-visible');
  spinner.setAttribute('aria-busy', 'false');
  document.body.style.overflow = document.body.dataset.nrdSpinnerPrevOverflow || '';
  delete document.body.dataset.nrdSpinnerPrevOverflow;
}

/**
 * Creates or upgrades the global spinner element in the DOM.
 */
export function ensureSpinner() {
  if (typeof document === 'undefined') return null;

  injectStyles();

  let spinner = document.getElementById(SPINNER_ID);
  if (spinner && spinner.dataset.nrdSpinnerVersion === SPINNER_VERSION) {
    return spinner;
  }

  if (!spinner) {
    spinner = document.createElement('div');
    spinner.id = SPINNER_ID;
    document.body.appendChild(spinner);
  }

  spinner.dataset.nrdSpinnerVersion = SPINNER_VERSION;
  spinner.setAttribute('role', 'status');
  spinner.setAttribute('aria-live', 'polite');
  spinner.setAttribute('aria-busy', 'false');
  spinner.setAttribute('aria-label', 'Cargando');
  spinner.className =
    'fixed inset-0 z-[2147483646] hidden items-center justify-center bg-slate-900/45 backdrop-blur-[3px] p-4';
  spinner.innerHTML = getSpinnerPanelMarkup();

  return spinner;
}

/**
 * Show the global spinner.
 * @param {string} [message] - Optional context (e.g. "Guardando..."). Omit for spinner only.
 */
export function showSpinner(message) {
  ensureSpinner();
  requestStack.push(message);
  syncSpinnerVisibility();
}

/**
 * Hide one spinner layer (supports nested showSpinner calls).
 */
export function hideSpinner() {
  if (requestStack.length > 0) {
    requestStack.pop();
  }
  syncSpinnerVisibility();
}

/** Force-hide spinner and clear all pending layers. */
export function resetSpinner() {
  requestStack.length = 0;
  syncSpinnerVisibility();
}

/**
 * Run any async operation with the spinner (show → await → hide).
 * @param {() => Promise<*>|*} fn
 * @param {string} [message]
 */
export async function withSpinner(fn, message) {
  showSpinner(message);
  try {
    return await fn();
  } finally {
    hideSpinner();
  }
}

if (typeof window !== 'undefined') {
  window.showSpinner = showSpinner;
  window.hideSpinner = hideSpinner;
  window.resetSpinner = resetSpinner;
  window.withSpinner = withSpinner;
}
