// Authentication service
// Receives nrd instance as dependency (injection pattern)
import { logger } from '../core/logger.js';
import { escapeHtml } from '../utils/dom.js';
import { showSpinner, hideSpinner } from '../ui/index.js';

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
      // Listen for auth state changes using NRD Data Access
      this.unsubscribe = this.nrd.auth.onAuthStateChanged((user) => {
        try {
          this.authCheckComplete = true;
          this.currentUser = user;
          
          // Hide redirecting screen
          this.hideRedirectingScreen();
          
          if (user) {
            logger.info('User authenticated, showing app screen', { uid: user.uid, email: user.email });
            this.showAppScreen();
          } else {
            logger.info('User not authenticated, showing login screen');
            this.showLoginScreen();
          }
        } catch (error) {
          logger.error('Error in auth state change', error);
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
      this.setupProfileHandlers();
    } else {
      logger.error('nrd or nrd.auth is not available');
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
      logger.error('Error checking stored token', error);
      return false;
    }
  }

  // Initialize auth check
  initAuthCheck() {
    // Show redirecting screen first
    this.showRedirectingScreen();
    
    // Check if there's a stored token
    const hasToken = this.hasStoredToken();
    
    if (hasToken) {
      logger.debug('Stored token found, waiting for auth state change');
      // Wait a bit for session to restore
      setTimeout(() => {
        if (!this.authCheckComplete) {
          // If still not authenticated after timeout, show login
          logger.info('Token found but authentication not restored, showing login');
          this.hideRedirectingScreen();
          this.showLoginScreen();
        }
      }, 2000); // 2 second timeout
    } else {
      logger.debug('No stored token found, showing login immediately');
      // No token, show login immediately
      setTimeout(() => {
        this.hideRedirectingScreen();
        this.showLoginScreen();
      }, 300); // Small delay for smooth transition
    }
  }

  // Show login screen
  showLoginScreen() {
    logger.debug('Showing login screen');
    try {
      const loginScreen = document.getElementById('login-screen');
      const appScreen = document.getElementById('app-screen');
      if (loginScreen) loginScreen.classList.remove('hidden');
      if (appScreen) appScreen.classList.add('hidden');
    } catch (error) {
      logger.error('Error showing login screen', error);
    }
  }

  // Show app screen
  showAppScreen() {
    logger.debug('Showing app screen');
    try {
      const loginScreen = document.getElementById('login-screen');
      const appScreen = document.getElementById('app-screen');
      if (loginScreen) loginScreen.classList.add('hidden');
      if (appScreen) appScreen.classList.remove('hidden');
      
      // Initialize default view after showing app screen
      setTimeout(() => {
        if (typeof window.switchView === 'function') {
          logger.debug('Switching to default view: dashboard');
          window.switchView('dashboard');
        }
      }, 100);
    } catch (error) {
      logger.error('Error showing app screen', error);
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
            logger.warn('Login attempt with empty fields');
            if (errorDiv) errorDiv.textContent = 'Por favor complete todos los campos';
            return;
          }

          logger.info('Attempting user login', { email });
          if (errorDiv) errorDiv.textContent = '';
          
          if (!this.nrd || !this.nrd.auth) {
            logger.error('nrd or nrd.auth is not available');
            if (errorDiv) errorDiv.textContent = 'Error: Servicio no disponible';
            return;
          }
          
          showSpinner('Iniciando sesión...');

          const userCredential = await this.nrd.auth.signIn(email, password);
          const user = userCredential.user;
          logger.audit('USER_LOGIN', { email, uid: user.uid, timestamp: Date.now() });
          logger.info('User login successful', { uid: user.uid, email });
          hideSpinner();
        } catch (error) {
          hideSpinner();
          logger.error('Login failed', error);
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
    // Profile button handler
    const profileBtn = document.getElementById('profile-btn');
    if (profileBtn) {
      profileBtn.addEventListener('click', () => {
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
          logger.info('Attempting user logout', { uid: user?.uid, email: user?.email });
          this.closeProfileModal();
          
          if (!this.nrd || !this.nrd.auth) {
            logger.error('nrd or nrd.auth is not available');
            return;
          }
          
          showSpinner('Cerrando sesión...');
          await this.nrd.auth.signOut();
          logger.audit('USER_LOGOUT', { uid: user?.uid, email: user?.email, timestamp: Date.now() });
          logger.info('User logout successful');
          hideSpinner();
        } catch (error) {
          hideSpinner();
          logger.error('Logout failed', error);
        }
      });
    }
  }

  // Show profile modal
  showProfileModal() {
    logger.debug('Showing profile modal');
    const modal = document.getElementById('profile-modal');
    const content = document.getElementById('profile-modal-content');
    
    if (!modal || !content) {
      logger.warn('Profile modal elements not found');
      return;
    }
    
    const user = this.getCurrentUser();
    if (!user) {
      logger.warn('No user found when showing profile modal');
      return;
    }
    
    logger.debug('Displaying user profile data', { uid: user.uid, email: user.email });
    
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
    logger.debug('Profile modal shown');
  }

  // Close profile modal
  closeProfileModal() {
    logger.debug('Closing profile modal');
    const modal = document.getElementById('profile-modal');
    if (modal) {
      modal.classList.add('hidden');
      logger.debug('Profile modal closed');
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
