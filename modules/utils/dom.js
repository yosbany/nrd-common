// DOM utilities

// Escape HTML to prevent XSS
export function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Safe query selector that returns null instead of throwing
export function querySelectorSafe(selector, parent = document) {
  try {
    return parent.querySelector(selector);
  } catch (e) {
    return null;
  }
}

// Create element with attributes and children
export function createElement(tag, attributes = {}, children = []) {
  const element = document.createElement(tag);
  
  // Set attributes
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'textContent') {
      element.textContent = value;
    } else if (key === 'innerHTML') {
      element.innerHTML = value;
    } else {
      element.setAttribute(key, value);
    }
  });
  
  // Append children
  children.forEach(child => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      element.appendChild(child);
    }
  });
  
  return element;
}

// Maintain compatibility with existing code
if (typeof window !== 'undefined') {
  window.escapeHtml = escapeHtml;
}
