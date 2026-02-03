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
import { showSpinner, hideSpinner } from '../ui/index.js';
import { initializeAppHeader } from '../ui/header.js';

export class AuthService {
  constructor(nrd) {
    this.nrd = nrd;
    this.currentUser = null;
    this.authCheckComplete = false;
    this.unsubscribe = null;
    
    this.init();
  }

  init() {
    if (this.nrd && this.nrd.auth) {
      // Check current auth state immediately (before waiting for listener)
      const currentUser = this.nrd.auth.getCurrentUser();
      if (currentUser) {
        getLogger().info('Current user found immediately', { uid: currentUser.uid, email: currentUser.email });
        this.authCheckComplete = true;
        this.currentUser = currentUser;
        this.hideRedirectingScreen();
        this.showAppScreen();
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
          
          this.authCheckComplete = true;
          this.currentUser = user;
          
          // Hide redirecting screen
          this.hideRedirectingScreen();
          
          if (user) {
            getLogger().info('User authenticated, showing app screen', { uid: user.uid, email: user.email });
            this.showAppScreen();
          } else {
            getLogger().info('User not authenticated, showing login screen');
            this.showLoginScreen();
          }
        } catch (error) {
          getLogger().error('Error in auth state change', error);
          this.hideRedirectingScreen();
          const loginScreen = document.getElementById('login-screen');
          const appScreen = document.getElementById('app-screen');
          if (loginScreen) loginScreen.classList.remove('hidden');
          if (appScreen) appScreen.classList.add('hidden');
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
      
      // Safety timeout: if auth check doesn't complete within 3 seconds, force a check
      setTimeout(() => {
        if (!this.authCheckComplete) {
          getLogger().warn('Auth check timeout, forcing check');
          const user = this.nrd.auth.getCurrentUser();
          if (user) {
            this.authCheckComplete = true;
            this.currentUser = user;
            this.hideRedirectingScreen();
            this.showAppScreen();
          } else {
            this.hideRedirectingScreen();
            this.showLoginScreen();
          }
        }
      }, 3000);
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
    const redirectingScreen = document.getElementById('redirecting-screen');
    const loginScreen = document.getElementById('login-screen');
    const appScreen = document.getElementById('app-screen');
    
    if (redirectingScreen) redirectingScreen.classList.remove('hidden');
    if (loginScreen) loginScreen.classList.add('hidden');
    if (appScreen) appScreen.classList.add('hidden');
  }

  // Hide redirecting screen
  hideRedirectingScreen() {
    const redirectingScreen = document.getElementById('redirecting-screen');
    if (redirectingScreen) redirectingScreen.classList.add('hidden');
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
    
    // Check current auth state again (in case it changed since init())
    const currentUser = this.nrd.auth.getCurrentUser();
    if (currentUser) {
      getLogger().info('Current user found in initAuthCheck', { uid: currentUser.uid });
      this.authCheckComplete = true;
      this.currentUser = currentUser;
      this.hideRedirectingScreen();
      this.showAppScreen();
      return;
    }
    
    // Check if there's a stored token
    const hasToken = this.hasStoredToken();
    
    if (hasToken) {
      getLogger().debug('Stored token found, waiting for auth state change');
      // Wait a bit for session to restore, but shorter timeout since we already checked
      setTimeout(() => {
        if (!this.authCheckComplete) {
          // Double-check one more time before giving up
          const user = this.nrd.auth.getCurrentUser();
          if (user) {
            this.authCheckComplete = true;
            this.currentUser = user;
            this.hideRedirectingScreen();
            this.showAppScreen();
          } else {
            // If still not authenticated after timeout, show login
            getLogger().info('Token found but authentication not restored, showing login');
            this.hideRedirectingScreen();
            this.showLoginScreen();
          }
        }
      }, 1500); // Reduced timeout since we already checked
    } else {
      getLogger().debug('No stored token found, showing login immediately');
      // No token, show login immediately
      setTimeout(() => {
        this.hideRedirectingScreen();
        this.showLoginScreen();
      }, 300); // Small delay for smooth transition
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
      
      // Initialize default view after showing app screen
      // Wait a bit longer to ensure DOM is ready and app.js has initialized
      setTimeout(() => {
        getLogger().debug('Attempting to switch to default view: dashboard');
        
        // Try multiple methods to switch view
        if (window.navigationService && typeof window.navigationService.switchView === 'function') {
          getLogger().debug('Switching to default view: dashboard (via navigationService)');
          window.navigationService.switchView('dashboard');
        } else if (typeof window.switchView === 'function') {
          getLogger().debug('Switching to default view: dashboard (via window.switchView)');
          window.switchView('dashboard');
        } else {
          getLogger().warn('switchView function and navigationService not available yet, will retry');
          // Retry after a longer delay
          setTimeout(() => {
            if (window.navigationService && typeof window.navigationService.switchView === 'function') {
              getLogger().debug('Retrying switch to dashboard view');
              window.navigationService.switchView('dashboard');
            } else if (typeof window.switchView === 'function') {
              getLogger().debug('Retrying switch to dashboard view (via window.switchView)');
              window.switchView('dashboard');
            }
          }, 1000);
        }
      }, 500);
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
            if (errorDiv) errorDiv.textContent = 'Por favor complete todos los campos';
            return;
          }

          getLogger().info('Attempting user login', { email });
          if (errorDiv) errorDiv.textContent = '';
          
          if (!this.nrd || !this.nrd.auth) {
            getLogger().error('nrd or nrd.auth is not available');
            if (errorDiv) errorDiv.textContent = 'Error: Servicio no disponible';
            return;
          }
          
          showSpinner('Iniciando sesión...');

          const userCredential = await this.nrd.auth.signIn(email, password);
          const user = userCredential.user;
          getLogger().audit('USER_LOGIN', { email, uid: user.uid, timestamp: Date.now() });
          getLogger().info('User login successful', { uid: user.uid, email });
          hideSpinner();
        } catch (error) {
          hideSpinner();
          getLogger().error('Login failed', error);
          const errorDiv = document.getElementById('login-error');
          if (errorDiv) {
            errorDiv.textContent = error.message || 'Error al iniciar sesión';
          }
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
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}
