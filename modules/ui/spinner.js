// Loading spinner functions

export function showSpinner(message = 'Cargando...') {
  const spinner = document.getElementById('loading-spinner');
  const messageEl = spinner.querySelector('p');
  if (messageEl) {
    messageEl.textContent = message;
  }
  spinner.classList.remove('hidden');
}

export function hideSpinner() {
  const spinner = document.getElementById('loading-spinner');
  spinner.classList.add('hidden');
}

// Maintain compatibility with existing code
if (typeof window !== 'undefined') {
  window.showSpinner = showSpinner;
  window.hideSpinner = hideSpinner;
}
