// Custom Modal and Alert System

// Show confirmation modal
export function showConfirm(title, message, confirmText = 'Confirmar', cancelText = 'Cancelar') {
  return new Promise((resolve) => {
    const modal = document.getElementById('custom-modal');
    const titleEl = document.getElementById('modal-title');
    const messageEl = document.getElementById('modal-message');
    const confirmBtn = document.getElementById('modal-confirm');
    const cancelBtn = document.getElementById('modal-cancel');

    titleEl.textContent = title;
    messageEl.textContent = message;
    confirmBtn.textContent = confirmText;
    cancelBtn.textContent = cancelText;

    modal.classList.remove('hidden');

    const handleConfirm = () => {
      modal.classList.add('hidden');
      confirmBtn.removeEventListener('click', handleConfirm);
      cancelBtn.removeEventListener('click', handleCancel);
      resolve(true);
    };

    const handleCancel = () => {
      modal.classList.add('hidden');
      confirmBtn.removeEventListener('click', handleConfirm);
      cancelBtn.removeEventListener('click', handleCancel);
      resolve(false);
    };

    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);

    // Close on background click
    const handleBackgroundClick = (e) => {
      if (e.target === modal) {
        handleCancel();
        modal.removeEventListener('click', handleBackgroundClick);
      }
    };
    modal.addEventListener('click', handleBackgroundClick);
  });
}

// Show alert
export function showAlert(title, message) {
  return new Promise((resolve) => {
    const alert = document.getElementById('custom-alert');
    const titleEl = document.getElementById('alert-title');
    const messageEl = document.getElementById('alert-message');
    const okBtn = document.getElementById('alert-ok');

    titleEl.textContent = title;
    messageEl.textContent = message;

    alert.classList.remove('hidden');

    const handleOk = () => {
      alert.classList.add('hidden');
      okBtn.removeEventListener('click', handleOk);
      resolve();
    };

    okBtn.addEventListener('click', handleOk);

    // Close on background click
    const handleBackgroundClick = (e) => {
      if (e.target === alert) {
        handleOk();
        alert.removeEventListener('click', handleBackgroundClick);
      }
    };
    alert.addEventListener('click', handleBackgroundClick);
  });
}

// Show success alert
export function showSuccess(message) {
  return showAlert('Éxito', message);
}

// Show error alert
export function showErrorAlert(message) {
  return showAlert('Error', message);
}

// Alias for backward compatibility (showError is commonly used)
export function showError(message) {
  return showErrorAlert(message);
}

// Show info alert
export function showInfo(message) {
  return showAlert('Información', message);
}

// Maintain compatibility with existing code
if (typeof window !== 'undefined') {
  window.showConfirm = showConfirm;
  window.showAlert = showAlert;
  window.showSuccess = showSuccess;
  window.showError = showError; // Export showError for compatibility
  window.showErrorAlert = showErrorAlert;
  window.showInfo = showInfo;
}
