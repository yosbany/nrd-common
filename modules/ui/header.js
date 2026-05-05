// Header component for NRD applications
// Generates the standard header with install and profile buttons

import { escapeHtml } from '../utils/dom.js';

/**
 * Create the app header HTML
 * @param {Object} options - Configuration options
 * @param {string} options.appName - Name of the application (e.g., "NRD RRHH")
 * @param {string} options.iconPath - Path to the app icon (e.g., "assets/icons/icon-192.png")
 * @returns {string} HTML string for the header
 */
export function createAppHeader({ appName, iconPath = 'assets/icons/icon-192.png' }) {
  return `
    <header class="bg-red-600 border-b border-red-700 px-3 sm:px-4 py-2.5 sm:py-3 flex justify-between items-center sticky top-0 z-10">
      <div class="flex items-center gap-2 sm:gap-3">
        <img src="${escapeHtml(iconPath)}" alt="${escapeHtml(appName)}" class="w-8 h-8 sm:w-10 sm:h-10 rounded">
        <h1 class="text-lg sm:text-xl font-light tracking-tight text-white">${escapeHtml(appName)}</h1>
      </div>
      
      <div class="flex gap-2 items-center">
        <button id="install-btn" 
          class="px-3 sm:px-4 py-1.5 sm:py-2 border border-white/30 hover:border-white text-white hover:bg-white/10 transition-colors uppercase tracking-wider text-xs font-light hidden">
          Instalar
        </button>
        
        <button id="profile-btn" 
          class="px-3 sm:px-4 py-1.5 sm:py-2 border border-white/30 hover:border-white text-white hover:bg-white/10 transition-colors uppercase tracking-wider text-xs font-light">
          Perfil
        </button>
      </div>
    </header>
  `;
}

/**
 * Setup PWA install button functionality
 * This should be called after the header is inserted into the DOM
 */
export function setupInstallButton() {
  // PWA Install prompt
  let deferredPrompt = null;
  const installBtn = document.getElementById('install-btn');

  if (!installBtn) {
    console.warn('Install button not found');
    return;
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBtn) installBtn.classList.remove('hidden');
  });

  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) {
      const showInfo = window.showInfo || ((msg) => alert(msg));
      await showInfo('Para instalar la app, usa el menú del navegador.');
      return;
    }
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    if (installBtn) installBtn.classList.add('hidden');
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    if (installBtn) installBtn.classList.add('hidden');
  });
}

/**
 * Initialize app header automatically
 * Reads configuration from data attributes or page title
 * This should be called once when the app initializes
 */
export function initializeAppHeader() {
  const headerContainer = document.getElementById('app-header-container');
  if (!headerContainer) {
    console.warn('Header container not found');
    return;
  }

  // Get app name from data attribute, title, or default
  const appName = headerContainer.dataset.appName || 
                 document.querySelector('title')?.textContent?.replace('NRD ', '') || 
                 'NRD App';
  
  // Get icon path from data attribute or default
  const iconPath = headerContainer.dataset.iconPath || 'assets/icons/icon-192.png';

  // Create and insert header
  headerContainer.innerHTML = createAppHeader({ appName, iconPath });

  // Setup install button
  setupInstallButton();

  // Setup portal link URL based on environment
  const portalLink = document.getElementById('portal-link');
  if (portalLink) {
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname === '0.0.0.0';
    portalLink.href = isLocalhost 
      ? '/nrd-portal/'
      : 'https://yosbany.github.io/nrd-portal';
  }
}
