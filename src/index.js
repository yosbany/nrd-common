// NRD Common Library - Main entry point
// This library exports all common modules for NRD applications

// Import all modules
import { Logger, LOG_LEVELS, createLogger } from '../modules/core/logger.js';
import * as config from '../modules/core/config.js';
import * as appInit from '../modules/core/app-init.js';
import * as modal from '../modules/ui/modal.js';
import * as spinner from '../modules/ui/spinner.js';
import * as header from '../modules/ui/header.js';
import * as format from '../modules/utils/format.js';
import * as dom from '../modules/utils/dom.js';
import * as date from '../modules/utils/date.js';
import * as search from '../modules/utils/search.js';
import { AuthService } from '../modules/services/auth.js';
import { NavigationService } from '../modules/services/navigation.js';
import * as dataLoader from '../modules/services/data-loader.js';

// Re-export all modules (for ES module imports)
export * from '../modules/core/logger.js';
export * from '../modules/core/config.js';
export * from '../modules/core/app-init.js';
export * from '../modules/ui/modal.js';
export * from '../modules/ui/spinner.js';
export * from '../modules/ui/header.js';
export * from '../modules/utils/format.js';
export * from '../modules/utils/dom.js';
export * from '../modules/utils/date.js';
export * from '../modules/utils/search.js';
export * from '../modules/services/auth.js';
export * from '../modules/services/navigation.js';
export * from '../modules/services/data-loader.js';

// Create a main object that contains all exports for easier access via CDN
// This allows: NRDCommon.Logger, NRDCommon.showAlert, etc.
const NRDCommon = {
  // Core
  Logger,
  LOG_LEVELS,
  createLogger,
  waitForGlobal: appInit.waitForGlobal,
  waitForAllScripts: appInit.waitForAllScripts,
  waitForGlobals: appInit.waitForGlobals,
  verifyModules: appInit.verifyModules,
  initializeNRD: appInit.initializeNRD,
  initializeApplication: appInit.initializeApplication,
  
  // UI
  showConfirm: modal.showConfirm,
  showAlert: modal.showAlert,
  showError: modal.showError,
  showErrorAlert: modal.showErrorAlert,
  showSuccess: modal.showSuccess,
  showInfo: modal.showInfo,
  showWarning: modal.showWarning,
  showSpinner: spinner.showSpinner,
  hideSpinner: spinner.hideSpinner,
  createAppHeader: header.createAppHeader,
  setupInstallButton: header.setupInstallButton,
  initializeAppHeader: header.initializeAppHeader,
  
  // Utils
  formatNumber: format.formatNumber,
  formatCurrency: format.formatCurrency,
  formatDecimalWithComma: format.formatDecimalWithComma,
  parseDecimalWithComma: format.parseDecimalWithComma,
  escapeHtml: dom.escapeHtml,
  querySelectorSafe: dom.querySelectorSafe,
  createElement: dom.createElement,
  getMonthName: date.getMonthName,
  formatDate: date.formatDate,
  normalizeSearchText: search.normalizeSearchText,
  matchesSearch: search.matchesSearch,
  filterBySearch: search.filterBySearch,
  
  // Services
  AuthService,
  NavigationService,
  waitForNRD: dataLoader.waitForNRD,
  waitForServices: dataLoader.waitForServices,
};

export default NRDCommon;
