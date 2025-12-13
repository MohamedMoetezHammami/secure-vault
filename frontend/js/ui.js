// UI utility functions and components

/**
 * Show toast message
 */
function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, duration);
}

/**
 * Confirm dialog
 */
function confirmDialog(message) {
  return new Promise((resolve) => {
    const dialog = document.createElement('div');
    dialog.className = 'confirm-dialog-overlay';
    dialog.innerHTML = `
      <div class="confirm-dialog">
        <h3>Confirm</h3>
        <p>${message}</p>
        <div class="confirm-dialog-actions">
          <button class="btn btn-secondary" data-action="cancel">Cancel</button>
          <button class="btn btn-primary" data-action="confirm">Confirm</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(dialog);
    
    dialog.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        document.body.removeChild(dialog);
        resolve(action === 'confirm');
      });
    });
  });
}

/**
 * Format date for display
 */
function formatDate(date) {
  if (!date) return 'N/A';
  
  const d = date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
}

/**
 * Debounce function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Truncate text
 */
function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Validate email format
 */
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Validate URL format
 */
function validateURL(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Export passwords to JSON file
 */
function exportPasswords(passwords) {
  const dataStr = JSON.stringify(passwords, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `passwords-export-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Import passwords from JSON file
 */
function importPasswords(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        resolve(data);
      } catch (error) {
        reject(new Error('Invalid file format'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

