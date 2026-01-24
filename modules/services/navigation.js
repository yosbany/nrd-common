// Navigation service
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

export class NavigationService {
  constructor() {
    this.currentView = null;
    this.views = ['dashboard', 'payroll-items'];
    this.viewHandlers = new Map();
  }

  // Register a view handler
  registerView(viewName, handler) {
    this.viewHandlers.set(viewName, handler);
  }

  // Switch to a view
  switchView(viewName) {
    // Prevent duplicate loading
    if (this.currentView === viewName) {
      getLogger().debug('View already active, skipping', { viewName });
      return;
    }
    
    getLogger().info('Switching view', { from: this.currentView, to: viewName });
    this.currentView = viewName;

    // Hide all views
    this.views.forEach(view => {
      const viewElement = document.getElementById(`${view}-view`);
      if (viewElement) {
        viewElement.classList.add('hidden');
      }
    });

    // Show selected view
    const selectedView = document.getElementById(`${viewName}-view`);
    if (selectedView) {
      selectedView.classList.remove('hidden');
      getLogger().debug('View shown', { viewName });
    } else {
      getLogger().warn('View element not found', { viewName });
    }

    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('border-red-600', 'text-red-600', 'bg-red-50', 'font-medium');
      btn.classList.add('border-transparent', 'text-gray-600');
    });
    const activeBtn = document.querySelector(`[data-view="${viewName}"]`);
    if (activeBtn) {
      activeBtn.classList.remove('border-transparent', 'text-gray-600');
      activeBtn.classList.add('border-red-600', 'text-red-600', 'bg-red-50', 'font-medium');
    } else {
      getLogger().warn('Active nav button not found', { viewName });
    }

    // Load data for the view
    getLogger().debug('Loading view data', { viewName });
    const handler = this.viewHandlers.get(viewName);
    if (handler) {
      handler();
    } else {
      // Fallback to global functions for backward compatibility
      if (viewName === 'dashboard') {
        if (typeof window.initializeDashboard === 'function') {
          window.initializeDashboard();
        } else if (typeof window.loadDashboard === 'function') {
          window.loadDashboard();
        }
      } else if (viewName === 'payroll-items') {
        if (typeof window.initializePayrollItems === 'function') {
          window.initializePayrollItems();
        } else if (typeof window.loadPayrollItems === 'function') {
          window.loadPayrollItems();
        }
      }
    }
    
    getLogger().debug('View switched successfully', { viewName });
  }

  // Setup nav button handlers
  setupNavButtons() {
    getLogger().debug('Setting up nav button handlers');
    document.querySelectorAll('.nav-btn').forEach(btn => {
      // Remove existing listeners by cloning
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      
      newBtn.addEventListener('click', () => {
        const view = newBtn.dataset.view;
        getLogger().debug('Nav button clicked', { view });
        this.switchView(view);
      });
    });
    getLogger().debug('Nav button handlers attached');
  }

  // Get current view
  getCurrentView() {
    return this.currentView;
  }
}

// Maintain compatibility with existing code
if (typeof window !== 'undefined') {
  // Export function for backward compatibility
  window.switchView = function(viewName) {
    if (window.navigationService) {
      window.navigationService.switchView(viewName);
    }
  };
}
