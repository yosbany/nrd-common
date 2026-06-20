// Unified loading spinner for all NRD frontend apps.
// Generic: works for any async operation with optional message.

const SPINNER_ID = 'loading-spinner';
const STYLE_ID = 'nrd-spinner-styles';
const SPINNER_VERSION = '4';

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
.nrd-spinner-mark {
  animation: nrd-spinner-spin 0.9s linear infinite;
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

function getSpinnerMarkup() {
  return `
    <div class="flex flex-col items-center gap-4">
      <div class="nrd-spinner-mark w-12 h-12 border-4 border-gray-200 border-t-red-600" aria-hidden="true"></div>
      <p id="nrd-spinner-message" class="nrd-spinner-message-hidden text-sm text-gray-600 font-light tracking-wide text-center"></p>
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
    'fixed inset-0 z-[2147483646] hidden flex-col items-center justify-center bg-white p-4';
  spinner.innerHTML = getSpinnerMarkup();

  return spinner;
}

/** Update message of the active spinner without adding a stack layer. */
export function setSpinnerMessage(message) {
  ensureSpinner();
  if (requestStack.length === 0) {
    requestStack.push(message);
    syncSpinnerVisibility();
    return;
  }
  requestStack[requestStack.length - 1] = message;
  applyMessage(message);
}

/**
 * Show the global spinner.
 * @param {string} [message] - Optional context (e.g. "Guardando..."). Omit for animation only.
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
  window.setSpinnerMessage = setSpinnerMessage;
  window.withSpinner = withSpinner;
}
