// Date utilities

// Get month name in Spanish
export function getMonthName(month) {
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return months[month - 1] || '';
}

// Format date to string
export function formatDate(date, format = 'DD/MM/YYYY') {
  if (!date) return '';
  
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return format
    .replace('DD', day)
    .replace('MM', month)
    .replace('YYYY', year);
}

// Check if date is in range
export function isDateInRange(date, startDate, endDate) {
  if (!date) return false;
  
  const d = date instanceof Date ? date : new Date(date);
  const start = startDate instanceof Date ? startDate : new Date(startDate);
  const end = endDate instanceof Date ? endDate : new Date(endDate);
  
  return d >= start && d <= end;
}

// Maintain compatibility with existing code
if (typeof window !== 'undefined') {
  window.getMonthName = getMonthName;
}
