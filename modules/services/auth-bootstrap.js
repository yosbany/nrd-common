// Post-authentication app bootstrap for NRD microfrontends
import { waitForNRD } from './data-loader.js';

function getLogger() {
  const logger = (typeof window !== 'undefined' && window.logger) || console;
  if (!logger.debug) logger.debug = logger.log || console.log;
  if (!logger.info) logger.info = logger.log || console.log;
  if (!logger.warn) logger.warn = console.warn || console.log;
  if (!logger.error) logger.error = console.error || console.log;
  return logger;
}

function showAppInitError(message) {
  const appScreen = document.getElementById('app-screen');
  if (!appScreen || appScreen.classList.contains('hidden')) return;

  const existing = document.getElementById('app-init-error');
  if (existing) {
    existing.textContent = message;
    return;
  }

  const errorMsg = document.createElement('div');
  errorMsg.id = 'app-init-error';
  errorMsg.className = 'fixed top-20 left-0 right-0 bg-red-600 text-white p-4 z-50 text-center';
  errorMsg.textContent = message;
  document.body.appendChild(errorMsg);
}

/** Show login if auth libraries fail to load (only if app is not visible yet). */
export function showLoginFallback() {
  const appScreen = document.getElementById('app-screen');
  const loginScreen = document.getElementById('login-screen');
  const redirectingScreen = document.getElementById('redirecting-screen');

  if (appScreen && !appScreen.classList.contains('hidden')) return;

  if (redirectingScreen) redirectingScreen.classList.add('hidden');
  if (loginScreen) loginScreen.classList.remove('hidden');
}

function exposeNRDGlobals() {
  const NRDCommon = window.NRDCommon;
  if (!NRDCommon) return;

  const globals = {
    showAlert: NRDCommon.showAlert,
    showConfirm: NRDCommon.showConfirm,
    showError: NRDCommon.showError,
    showSuccess: NRDCommon.showSuccess,
    showInfo: NRDCommon.showInfo,
    showWarning: NRDCommon.showWarning,
    showSpinner: NRDCommon.showSpinner,
    hideSpinner: NRDCommon.hideSpinner,
    formatNumber: NRDCommon.formatNumber,
    formatCurrency: NRDCommon.formatCurrency,
    formatDecimalWithComma: NRDCommon.formatDecimalWithComma,
    parseDecimalWithComma: NRDCommon.parseDecimalWithComma,
    escapeHtml: NRDCommon.escapeHtml,
    getMonthName: NRDCommon.getMonthName,
    formatDate: NRDCommon.formatDate
  };

  Object.entries(globals).forEach(([key, fn]) => {
    if (typeof fn === 'function' && typeof window[key] === 'undefined') {
      window[key] = fn;
    }
  });
}

function attachLegacyNrdGlobalAlias() {
  if (!window.nrd) return;
  const aliasScript = document.createElement('script');
  aliasScript.text = 'var nrd = window.nrd;';
  document.head.appendChild(aliasScript);
  aliasScript.remove();
}

/**
 * Initialize AuthService after NRDCommon CDN is loaded (call from index.html).
 * @param {Object} [options]
 * @param {string} [options.appName] - Logger app name; skip logger if window.logger exists
 * @param {boolean} [options.exposeGlobals=true]
 * @param {boolean} [options.setupInstallButton=true]
 * @param {boolean} [options.legacyNrdAlias=false] - var nrd = window.nrd for classic scripts
 * @returns {Promise<boolean>}
 */
export async function initializeAppAuth(options = {}) {
  const appName = options.appName || 'NRD App';
  const NRDCommon = window.NRDCommon;

  if (!NRDCommon) {
    showLoginFallback();
    return false;
  }

  try {
    if (!window.logger && appName && NRDCommon.Logger) {
      window.logger = new NRDCommon.Logger(appName, {
        logLevel: NRDCommon.LOG_LEVELS?.INFO ?? 1,
        enableColors: true,
        enableTimestamp: true
      });
    }

    if (options.exposeGlobals !== false) {
      exposeNRDGlobals();
    }

    if (!NRDCommon.initializeNRD) {
      showLoginFallback();
      return false;
    }

    const success = await NRDCommon.initializeNRD();
    if (!success || !NRDCommon.AuthService || !window.nrd) {
      showLoginFallback();
      return false;
    }

    window.authService = new NRDCommon.AuthService(window.nrd);

    if (options.setupInstallButton !== false && NRDCommon.setupInstallButton) {
      NRDCommon.setupInstallButton();
    }

    if (options.legacyNrdAlias) {
      attachLegacyNrdGlobalAlias();
    }

    flushAppStartQueue();
    return true;
  } catch (error) {
    getLogger().error('initializeAppAuth failed', error);
    showLoginFallback();
    return false;
  }
}

/**
 * Poll until NRDCommon is available, then initializeAppAuth.
 * @param {Object} options - Passed to initializeAppAuth (+ maxWait)
 */
export function pollInitializeAppAuth(options = {}) {
  const maxWait = options.maxWait ?? 10000;
  const startTime = Date.now();

  const check = setInterval(() => {
    if (typeof window.NRDCommon !== 'undefined' && window.NRDCommon.initializeAppAuth) {
      clearInterval(check);
      window.NRDCommon.initializeAppAuth(options);
    } else if (Date.now() - startTime >= maxWait) {
      clearInterval(check);
      getLogger().error('pollInitializeAppAuth: NRDCommon not available after timeout');
      showLoginFallback();
    }
  }, 100);
}

/**
 * Queue app init; runs after AuthService is ready (call from app.js).
 */
export function startApp(onReady, options = {}) {
  if (typeof onReady !== 'function') {
    throw new Error('startApp requires an onReady callback');
  }

  window.__nrdStartQueue = window.__nrdStartQueue || [];
  window.__nrdStartQueue.push({ onReady, options });
  flushAppStartQueue();
}

export function flushAppStartQueue() {
  if (!window.authService || !window.nrd?.auth) return;
  if (!window.NRDCommon?.setupAuthenticatedApp) return;

  const queue = window.__nrdStartQueue;
  if (!queue?.length) return;

  const pending = queue.splice(0, queue.length);
  pending.forEach(({ onReady, options }) => {
    setupAuthenticatedApp(onReady, options);
  });
}

/**
 * Run app initialization once the user is authenticated.
 */
export function setupAuthenticatedApp(onReady, options = {}) {
  if (typeof onReady !== 'function') {
    throw new Error('setupAuthenticatedApp requires an onReady callback');
  }

  const maxWait = options.maxWait ?? 10000;
  const initDelay = options.initDelay ?? 100;
  const appInitTimeout = options.appInitTimeout ?? 8000;
  let initialized = false;
  let initWatchdog = null;

  function clearWatchdog() {
    if (initWatchdog) {
      clearTimeout(initWatchdog);
      initWatchdog = null;
    }
  }

  function runInit(user) {
    if (initialized || !user) return;

    initialized = true;
    clearWatchdog();

    initWatchdog = setTimeout(() => {
      showAppInitError('No se pudo cargar la vista inicial. Recarga la página.');
    }, appInitTimeout);

    setTimeout(() => {
      try {
        onReady(user);
        clearWatchdog();
        const errorBanner = document.getElementById('app-init-error');
        if (errorBanner) errorBanner.remove();
      } catch (error) {
        clearWatchdog();
        getLogger().error('setupAuthenticatedApp onReady failed', error);
        showAppInitError('Error al iniciar la aplicación. Recarga la página.');
      }
    }, initDelay);
  }

  function resetInit() {
    initialized = false;
    clearWatchdog();
    const errorBanner = document.getElementById('app-init-error');
    if (errorBanner) errorBanner.remove();
    if (typeof options.onLogout === 'function') {
      try {
        options.onLogout();
      } catch (error) {
        getLogger().error('setupAuthenticatedApp onLogout failed', error);
      }
    }
  }

  function handleAuthReady(event) {
    const detail = (event && event.detail) || {};
    if (detail.authenticated && detail.user) {
      runInit(detail.user);
    } else {
      resetInit();
    }
  }

  window.addEventListener('nrd-auth-ready', handleAuthReady);

  function tryImmediateUser() {
    const authService = window.authService;
    const userFromAuth = authService && typeof authService.getCurrentUser === 'function'
      ? authService.getCurrentUser()
      : null;
    const userFromNrd = window.nrd && window.nrd.auth
      ? window.nrd.auth.getCurrentUser()
      : null;
    const user = userFromAuth || userFromNrd;

    if (user && authService && authService.authCheckComplete) {
      runInit(user);
    } else if (user && !authService) {
      runInit(user);
    }
  }

  waitForNRD(maxWait)
    .then((nrd) => {
      tryImmediateUser();

      if (!nrd.auth) {
        getLogger().error('setupAuthenticatedApp: nrd.auth not available');
        return;
      }

      nrd.auth.onAuthStateChanged((user) => {
        if (user) {
          runInit(user);
        } else {
          resetInit();
        }
      });
    })
    .catch((error) => {
      getLogger().error('setupAuthenticatedApp: NRD not available', error);
    });

  return function cleanupAuthenticatedApp() {
    window.removeEventListener('nrd-auth-ready', handleAuthReady);
    resetInit();
  };
}

/** @deprecated Use startApp instead */
export function bootstrapAuthenticatedApp(onReady, options = {}) {
  startApp(onReady, options);
}
