// Common application configuration and constants
// These are default values that can be overridden by specific applications

// Timeouts for initialization
export const INIT_TIMEOUT = 15000; // 15 seconds
export const MODULE_CHECK_INTERVAL = 100; // Check every 100ms

// Required global variables that must be available
export const REQUIRED_GLOBALS = [
  'NRDDataAccess',
  'logger'
];

// Required modules/functions that must be available after scripts load
// Applications can extend this list with their own requirements
export const REQUIRED_MODULES = [
  'showAlert',
  'showSpinner',
  'hideSpinner',
  'showConfirm',
  'window.nrd'
];

// Default log level configuration
export const DEFAULT_LOG_LEVEL = 'INFO'; // DEBUG, INFO, WARN, ERROR
