// Authentication service
// Receives nrd instance as dependency (injection pattern)
// Get logger function that always returns the current logger (lazy evaluation)
function getLogger() {
  let logger = (typeof window !== 'undefined' && window.logger) || console;
  // Ensure logger has all required methods (for console fallback)
  if (!logger.debug) logger.debug = logger.log || console.log;
  if (!logger.info) logger.info = logger.log || console.log;
  if (!logger.warn) logger.warn = console.warn || console.log;
  if (!logger.error) logger.error = console.error || console.log;
  if (!logger.audit) logger.audit = logger.info || logger.log || console.log;
  return logger;
}
import { escapeHtml } from '../utils/dom.js';
import { showSpinner, hideSpinner, resetSpinner } from '../ui/index.js';
import { initializeAppHeader } from '../ui/header.js';

const AUTH_TOKEN_RESTORE_MS = 8000;
const AUTH_SAFETY_TIMEOUT_MS = 10000;

export class AuthService {
  constructor(nrd) {
    this.nrd = nrd;
    this.currentUser = null;
    this.authCheckComplete = false;
    this.unsubscribe = null;
    this._tokenWaitTimeout = null;
    this._safetyTimeout = null;
    
    this.init();
  }

  _clearAuthTimeouts() {
    if (this._tokenWaitTimeout) {
      clearTimeout(this._tokenWaitTimeout);
      this._tokenWaitTimeout = null;
    }
    if (this._safetyTimeout) {
      clearTimeout(this._safetyTimeout);
      this._safetyTimeout = null;
    }
  }

  _setRedirectingMessage(message) {
    try {
      const ensure = window.NRDCommon?.ensureSpinner || window.ensureSpinner;
      if (typeof ensure === 'function') ensure();

      const setMessage = window.setSpinnerMessage || window.NRDCommon?.setSpinnerMessage;
      if (typeof setMessage === 'function') {
        setMessage(message);
        return;
      }

      const show = window.showSpinner || window.NRDCommon?.showSpinner;
      if (typeof show === 'function') {
        show(message);
        return;
      }
    } catch (error) {
      getLogger().warn('Could not show spinner message', error);
    }

    const redirectingScreen = document.getElementById('redirecting-screen');
    if (!redirectingScreen) return;
    const messageEl = redirectingScreen.querySelector('[data-auth-status]') ||
      redirectingScreen.querySelector('p');
    if (messageEl) messageEl.textContent = message;
  }

  _notifyAuthReady(user) {
    try {
      window.dispatchEvent(new CustomEvent('nrd-auth-ready', {
        detail: {
          user: user || null,
          authenticated: !!user
        }
      }));
    } catch (error) {
      getLogger().warn('Could not dispatch nrd-auth-ready event', error);
    }
  }

  _setLoginError(message) {
    const errorDiv = document.getElementById('login-error');
    if (!errorDiv) return;
    if (message) {
      errorDiv.textContent = message;
      errorDiv.classList.remove('hidden');
    } else {
      errorDiv.textContent = '';
      errorDiv.classList.add('hidden');
    }
  }

  _resolveAuthState(user, source) {
    this.authCheckComplete = true;
    this.currentUser = user;
    this._clearAuthTimeouts();
    this.hideRedirectingScreen();

    if (user) {
      getLogger().info('User authenticated, showing app screen', {
        uid: user.uid,
        email: user.email,
        source
      });
      this.showAppScreen();
    } else {
      getLogger().info('User not authenticated, showing login screen', { source });
      this.showLoginScreen();
    }

    this._notifyAuthReady(user);
  }

  init() {
    if (this.nrd && this.nrd.auth) {
      // Check current auth state immediately (before waiting for listener)
      const currentUser = this.nrd.auth.getCurrentUser();
      if (currentUser) {
        getLogger().info('Current user found immediately', { uid: currentUser.uid, email: currentUser.email });
        this._resolveAuthState(currentUser, 'immediate');
      }
      
      // Listen for auth state changes using NRD Data Access
      this.unsubscribe = this.nrd.auth.onAuthStateChanged((user) => {
        try {
          // Skip if we already handled this user
          if (this.authCheckComplete && this.currentUser && user &&
              this.currentUser.uid === user.uid) {
            getLogger().debug('Auth state change for same user, skipping');
            return;
          }

          this._resolveAuthState(user, 'onAuthStateChanged');
        } catch (error) {
          getLogger().error('Error in auth state change', error);
          this.hideRedirectingScreen();
          const loginScreen = document.getElementById('login-screen');
          const appScreen = document.getElementById('app-screen');
          if (loginScreen) loginScreen.classList.remove('hidden');
          if (appScreen) appScreen.classList.add('hidden');
          this._notifyAuthReady(null);
        }
      });
      
      // Initialize auth check when DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.initAuthCheck());
      } else {
        this.initAuthCheck();
      }
      
      // Setup login form handler
      this.setupLoginForm();
      
      // Initialize app header automatically (will setup profile handlers internally)
      this.initializeHeader();
      
      // Safety timeout: only force login if there is no stored SSO token still restoring
      this._safetyTimeout = setTimeout(() => {
        if (this.authCheckComplete) return;

        getLogger().warn('Auth check safety timeout, forcing final check');
        const user = this.nrd.auth.getCurrentUser();
        if (user) {
          this._resolveAuthState(user, 'safety-timeout');
          return;
        }

        if (this.hasStoredToken()) {
          getLogger().warn('Stored token present but auth not restored yet; keeping redirecting screen');
          this._setRedirectingMessage('Restaurando sesión...');
          return;
        }

        this._resolveAuthState(null, 'safety-timeout-no-token');
      }, AUTH_SAFETY_TIMEOUT_MS);
    } else {
      getLogger().error('nrd or nrd.auth is not available');
      // Still show login screen if nrd is not available
      this.showRedirectingScreen();
      setTimeout(() => {
        this.hideRedirectingScreen();
        this.showLoginScreen();
      }, 300);
    }
  }

  // Show redirecting screen
  showRedirectingScreen() {
    const loginScreen = document.getElementById('login-screen');
    const appScreen = document.getElementById('app-screen');
    const redirectingScreen = document.getElementById('redirecting-screen');

    if (redirectingScreen) redirectingScreen.classList.add('hidden');
    if (loginScreen) loginScreen.classList.add('hidden');
    if (appScreen) appScreen.classList.add('hidden');
  }

  // Hide redirecting screen
  hideRedirectingScreen() {
    const redirectingScreen = document.getElementById('redirecting-screen');
    if (redirectingScreen) redirectingScreen.classList.add('hidden');
    resetSpinner();
  }

  // Check for stored token in localStorage
  hasStoredToken() {
    try {
      // Firebase stores auth tokens in localStorage with keys like "firebase:authUser:{API_KEY}:{PROJECT_ID}"
      const keys = Object.keys(localStorage);
      const firebaseAuthKeys = keys.filter(key => key.startsWith('firebase:authUser:'));
      return firebaseAuthKeys.length > 0;
    } catch (error) {
      getLogger().error('Error checking stored token', error);
      return false;
    }
  }

  // Initialize auth check
  initAuthCheck() {
    // If we already have a user, skip showing redirecting screen
    if (this.authCheckComplete && this.currentUser) {
      getLogger().debug('User already authenticated, skipping redirecting screen');
      return;
    }
    
    // Show redirecting screen first
    this.showRedirectingScreen();
    this._setRedirectingMessage('Verificando sesión...');
    
    // Check current auth state again (in case it changed since init())
    const currentUser = this.nrd.auth.getCurrentUser();
    if (currentUser) {
      getLogger().info('Current user found in initAuthCheck', { uid: currentUser.uid });
      this._resolveAuthState(currentUser, 'initAuthCheck-immediate');
      return;
    }
    
    // Check if there's a stored token
    const hasToken = this.hasStoredToken();
    
    if (hasToken) {
      getLogger().debug('Stored token found, waiting for auth state change');
      this._setRedirectingMessage('Restaurando sesión...');
      // Wait for Firebase SSO restore; onAuthStateChanged remains the source of truth
      this._tokenWaitTimeout = setTimeout(() => {
        if (this.authCheckComplete) return;

        const user = this.nrd.auth.getCurrentUser();
        if (user) {
          this._resolveAuthState(user, 'token-wait');
          return;
        }

        getLogger().info('Token found but authentication not restored, showing login');
        this._resolveAuthState(null, 'token-wait-expired');
      }, AUTH_TOKEN_RESTORE_MS);
    } else {
      getLogger().debug('No stored token found, showing login immediately');
      setTimeout(() => {
        if (!this.authCheckComplete) {
          this._resolveAuthState(null, 'no-token');
        }
      }, 300);
    }
  }

  // Show login screen
  showLoginScreen() {
    getLogger().debug('Showing login screen');
    try {
      const loginScreen = document.getElementById('login-screen');
      const appScreen = document.getElementById('app-screen');
      if (loginScreen) loginScreen.classList.remove('hidden');
      if (appScreen) appScreen.classList.add('hidden');
    } catch (error) {
      getLogger().error('Error showing login screen', error);
    }
  }

  // Show app screen
  // NOTE: Navigation (switchView) is NOT handled here — each project's app.js
  // is responsible for initializing its own default view via onAuthStateChanged.
  // AuthService only manages screen visibility (login vs app vs redirecting).
  showAppScreen() {
    getLogger().debug('Showing app screen');
    try {
      const loginScreen = document.getElementById('login-screen');
      const appScreen = document.getElementById('app-screen');
      const redirectingScreen = document.getElementById('redirecting-screen');

      // Hide login and redirecting screens
      if (loginScreen) loginScreen.classList.add('hidden');
      if (redirectingScreen) redirectingScreen.classList.add('hidden');

      // Show app screen
      if (appScreen) {
        appScreen.classList.remove('hidden');
        getLogger().debug('App screen shown successfully');
      } else {
        getLogger().error('App screen element not found');
      }
    } catch (error) {
      getLogger().error('Error showing app screen', error);
    }
  }

  // Setup login form handler
  setupLoginForm() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          const email = document.getElementById('login-email')?.value;
          const password = document.getElementById('login-password')?.value;
          const errorDiv = document.getElementById('login-error');

          if (!email || !password) {
            getLogger().warn('Login attempt with empty fields');
            this._setLoginError('Por favor complete todos los campos');
            return;
          }

          getLogger().info('Attempting user login', { email });
          this._setLoginError('');
          
          if (!this.nrd || !this.nrd.auth) {
            getLogger().error('nrd or nrd.auth is not available');
            this._setLoginError('Error: Servicio no disponible');
            return;
          }

          this.showRedirectingScreen();
          this._setRedirectingMessage('Iniciando sesión...');

          const userCredential = await this.nrd.auth.signIn(email, password);
          const user = userCredential.user;
          getLogger().audit('USER_LOGIN', { email, uid: user.uid, timestamp: Date.now() });
          getLogger().info('User login successful', { uid: user.uid, email });
        } catch (error) {
          this.hideRedirectingScreen();
          getLogger().error('Login failed', error);
          this.showLoginScreen();
          this._setLoginError(error.message || 'Error al iniciar sesión');
        }
      });
    }
  }

  // Setup profile handlers
  setupProfileHandlers() {
    // Profile button handler - remove existing listeners first to avoid duplicates
    const profileBtn = document.getElementById('profile-btn');
    if (profileBtn) {
      // Clone and replace to remove all event listeners
      const newProfileBtn = profileBtn.cloneNode(true);
      profileBtn.parentNode.replaceChild(newProfileBtn, profileBtn);
      
      newProfileBtn.addEventListener('click', () => {
        this.showProfileModal();
      });
    }

    // Close profile modal button
    const closeProfileModalBtn = document.getElementById('close-profile-modal');
    if (closeProfileModalBtn) {
      closeProfileModalBtn.addEventListener('click', () => {
        this.closeProfileModal();
      });
    }

    // Logout handler (from profile modal)
    const profileLogoutBtn = document.getElementById('profile-logout-btn');
    if (profileLogoutBtn) {
      profileLogoutBtn.addEventListener('click', async () => {
        try {
          const user = this.getCurrentUser();
          getLogger().info('Attempting user logout', { uid: user?.uid, email: user?.email });
          this.closeProfileModal();
          
          if (!this.nrd || !this.nrd.auth) {
            getLogger().error('nrd or nrd.auth is not available');
            return;
          }
          
          showSpinner('Cerrando sesión...');
          await this.nrd.auth.signOut();
          getLogger().audit('USER_LOGOUT', { uid: user?.uid, email: user?.email, timestamp: Date.now() });
          getLogger().info('User logout successful');
          hideSpinner();
        } catch (error) {
          hideSpinner();
          getLogger().error('Logout failed', error);
        }
      });
    }
  }

  // Show profile modal
  showProfileModal() {
    getLogger().debug('Showing profile modal');
    const modal = document.getElementById('profile-modal');
    const content = document.getElementById('profile-modal-content');
    
    if (!modal || !content) {
      getLogger().warn('Profile modal elements not found');
      return;
    }
    
    const user = this.getCurrentUser();
    if (!user) {
      getLogger().warn('No user found when showing profile modal');
      return;
    }
    
    getLogger().debug('Displaying user profile data', { uid: user.uid, email: user.email });
    
    let userDataHtml = `
      <div class="space-y-3 sm:space-y-4">
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
          <span class="text-gray-600 font-light text-sm sm:text-base">Email:</span>
          <span class="font-light text-sm sm:text-base">${escapeHtml(user.email || 'N/A')}</span>
        </div>
        ${user.displayName ? `
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
          <span class="text-gray-600 font-light text-sm sm:text-base">Nombre:</span>
          <span class="font-light text-sm sm:text-base">${escapeHtml(user.displayName)}</span>
        </div>
        ` : ''}
      </div>
    `;
    
    content.innerHTML = userDataHtml;
    modal.classList.remove('hidden');
    getLogger().debug('Profile modal shown');
  }

  // Close profile modal
  closeProfileModal() {
    getLogger().debug('Closing profile modal');
    const modal = document.getElementById('profile-modal');
    if (modal) {
      modal.classList.add('hidden');
      getLogger().debug('Profile modal closed');
    }
  }

  // Initialize header
  initializeHeader() {
    // Wait for DOM to be ready
    const initHeader = () => {
      initializeAppHeader();
      // Setup profile handlers after header is created
      // Use setTimeout to ensure header is fully inserted in DOM
      setTimeout(() => {
        this.setupProfileHandlers();
      }, 100);
    };
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initHeader);
    } else {
      initHeader();
    }
  }

  // Get current user
  getCurrentUser() {
    return (this.nrd && this.nrd.auth && this.nrd.auth.getCurrentUser()) || this.currentUser;
  }

  // Cleanup
  destroy() {
    this._clearAuthTimeouts();
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}
