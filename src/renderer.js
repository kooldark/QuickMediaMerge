// Main renderer script that initializes the React app
document.addEventListener('DOMContentLoaded', () => {
  const rootElement = document.getElementById('root');
  
  // Create root and render the App component
  const root = ReactDOM.createRoot(rootElement);
  root.render(React.createElement(App));
  
  // Handle window focus events for better UX
  window.addEventListener('focus', () => {
    document.body.classList.remove('window-blurred');
  });
  
  window.addEventListener('blur', () => {
    document.body.classList.add('window-blurred');
  });
  
  // Prevent default drag and drop on the window to avoid navigation
  window.addEventListener('dragover', (e) => {
    e.preventDefault();
  });
  
  window.addEventListener('drop', (e) => {
    e.preventDefault();
  });
  
  // Handle keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl+O to open files
    if (e.ctrlKey && e.key === 'o') {
      e.preventDefault();
      window.electronAPI?.selectFiles();
    }
    
    // Escape to close modals
    if (e.key === 'Escape') {
      // This would need to be handled by the React components
      const modals = document.querySelectorAll('.preview-modal, .processing-modal');
      if (modals.length > 0) {
        e.preventDefault();
      }
    }
  });
  
  // Error handling for uncaught errors
  window.addEventListener('error', (e) => {
    console.error('Uncaught error:', e.error);
    if (window.electronAPI) {
      window.electronAPI.showError('Application Error', 
        `An unexpected error occurred: ${e.error.message}`);
    }
  });
  
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    if (window.electronAPI) {
      window.electronAPI.showError('Application Error', 
        `An unexpected error occurred: ${e.reason}`);
    }
  });
});

// Additional utility functions for the renderer
window.utils = {
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
  
  formatDuration: (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  },
  
  debounce: (func, wait) => {
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
};
