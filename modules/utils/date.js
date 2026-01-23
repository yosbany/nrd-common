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

// Check if employee was active (vigente) during a specific year
export function isEmployeeActiveInYear(employee, year) {
  if (!employee) return false;
  
  const yearStart = new Date(year, 0, 1); // January 1 of the year
  const yearEnd = new Date(year, 11, 31); // December 31 of the year
  
  // Check startDate: employee must have started before or during the year
  if (employee.startDate) {
    const startDate = new Date(employee.startDate);
    if (startDate > yearEnd) {
      return false; // Employee started after the year ended
    }
  }
  
  // Check endDate: if exists, employee must have ended after or during the year
  if (employee.endDate) {
    const endDate = new Date(employee.endDate);
    if (endDate < yearStart) {
      return false; // Employee ended before the year started
    }
  }
  
  // Employee was active during the year
  return true;
}

// Maintain compatibility with existing code
if (typeof window !== 'undefined') {
  window.getMonthName = getMonthName;
  window.isEmployeeActiveInYear = isEmployeeActiveInYear;
}
