// Barrel export for UI components
export * from './modal.js';
export * from './spinner.js';
export * from './header.js';

// Re-export showError for convenience (it's an alias of showErrorAlert)
export { showError, showErrorAlert } from './modal.js';
