// Formatting utilities for numbers, currency, and decimals

// Format number with comma for decimals and dot for thousands
// Always round to integer (0 decimals) and show as ,00
export function formatNumber(value, decimals = 0) {
  if (value === null || value === undefined || isNaN(value)) return '0,00';
  const num = Math.round(parseFloat(value)); // Round to nearest integer
  if (isNaN(num)) return '0,00';
  
  // Add thousand separators (dots) to integer part
  const formattedInteger = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  // Always return with ,00 for consistency
  return `${formattedInteger},00`;
}

// Format currency with $ symbol
// Always round to integer (0 decimals) and show as ,00
export function formatCurrency(value, decimals = 0) {
  return `$${formatNumber(value, decimals)}`;
}

// Helper functions for decimal number handling with comma
export function parseDecimalWithComma(value) {
  if (!value || value === '') return null;
  // Replace comma with dot for parsing
  const normalized = String(value).replace(',', '.');
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? null : parsed;
}

export function formatDecimalWithComma(value) {
  if (value === null || value === undefined || isNaN(value)) return '';
  // Convert to string and replace dot with comma
  return String(value).replace('.', ',');
}

// Maintain compatibility with existing code
if (typeof window !== 'undefined') {
  window.formatNumber = formatNumber;
  window.formatCurrency = formatCurrency;
  window.parseDecimalWithComma = parseDecimalWithComma;
  window.formatDecimalWithComma = formatDecimalWithComma;
}
