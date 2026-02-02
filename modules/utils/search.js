// Search and filtering utilities

/**
 * Normalizes text for flexible search matching
 * Handles:
 * - Accents removal (á → a, é → e, etc.)
 * - Case insensitive (converts to lowercase)
 * - ñ → n
 * - b ↔ v (both directions)
 * - z, c, s → normalized (all treated similarly)
 * - y ↔ ll (both directions)
 * 
 * @param {string} text - Text to normalize
 * @returns {string} - Normalized text for search comparison
 * 
 * @example
 * normalizeSearchText('José') === normalizeSearchText('jose') // true
 * normalizeSearchText('Muñoz') === normalizeSearchText('munoz') // true
 * normalizeSearchText('Barcelona') === normalizeSearchText('Varcelona') // true
 * normalizeSearchText('Casa') === normalizeSearchText('Kasa') // false (c/s normalization)
 */
export function normalizeSearchText(text) {
  if (!text || typeof text !== 'string') return '';
  
  return text
    // Convert to lowercase
    .toLowerCase()
    // Remove accents (á → a, é → e, í → i, ó → o, ú → u, etc.)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Normalize ñ → n
    .replace(/ñ/g, 'n')
    // Normalize b ↔ v (both directions - normalize both to 'b' for matching)
    // This allows "Barcelona" to match "Varcelona"
    .replace(/v/g, 'b')
    // Normalize z, c (before e/i), s → normalize to 's' for matching
    // Replace 'c' before 'e' or 'i' with 's' (cielo → sielo, cena → sena)
    // Replace 'z' with 's' (zapato → sapato)
    // This allows "casa" to match "kasa" (if user types k), "zapato" to match "sapato"
    .replace(/c([ei])/g, 's$1')
    .replace(/z/g, 's')
    // Normalize y ↔ ll (both directions - normalize both to 'y' for matching)
    // Replace 'll' with 'y' (llave → yave)
    // This allows "llave" to match "yave"
    .replace(/ll/g, 'y')
    // Remove extra spaces
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Checks if a text matches a search term using normalized comparison
 * 
 * @param {string} text - Text to search in
 * @param {string} searchTerm - Search term to find
 * @returns {boolean} - True if text matches search term
 * 
 * @example
 * matchesSearch('José Muñoz', 'jose munoz') // true
 * matchesSearch('Barcelona', 'Varcelona') // true
 */
export function matchesSearch(text, searchTerm) {
  if (!searchTerm || !searchTerm.trim()) return true;
  if (!text) return false;
  
  const normalizedText = normalizeSearchText(text);
  const normalizedTerm = normalizeSearchText(searchTerm);
  
  return normalizedText.includes(normalizedTerm);
}

/**
 * Filters an array of items by a search term, checking multiple fields
 * 
 * @param {Array} items - Array of items to filter
 * @param {string} searchTerm - Search term
 * @param {Array<string>|Function} fields - Field names to search in, or a function that returns searchable text
 * @returns {Array} - Filtered array
 * 
 * @example
 * // Search in specific fields
 * filterBySearch(products, 'jose', ['name', 'sku'])
 * 
 * @example
 * // Custom search function
 * filterBySearch(products, 'jose', (item) => `${item.name} ${item.description}`)
 */
export function filterBySearch(items, searchTerm, fields) {
  if (!searchTerm || !searchTerm.trim()) return items;
  if (!Array.isArray(items)) return [];
  
  const normalizedTerm = normalizeSearchText(searchTerm);
  
  return items.filter(item => {
    if (typeof fields === 'function') {
      const searchableText = fields(item);
      return matchesSearch(searchableText, normalizedTerm);
    }
    
    if (Array.isArray(fields)) {
      return fields.some(field => {
        const value = getNestedValue(item, field);
        return matchesSearch(String(value || ''), normalizedTerm);
      });
    }
    
    // If no fields specified, search in all string values
    return Object.values(item).some(value => {
      if (typeof value === 'string') {
        return matchesSearch(value, normalizedTerm);
      }
      return false;
    });
  });
}

/**
 * Helper function to get nested object values by dot notation
 * @private
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, prop) => current?.[prop], obj);
}

// Maintain compatibility with existing code
if (typeof window !== 'undefined') {
  window.normalizeSearchText = normalizeSearchText;
  window.matchesSearch = matchesSearch;
  window.filterBySearch = filterBySearch;
}
