const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFiles: () => ipcRenderer.invoke('select-files'),
  selectOutputFolder: () => ipcRenderer.invoke('select-output-folder'),
  getFileInfo: (filePath) => ipcRenderer.invoke('get-file-info', filePath),
  mergeVideos: (files, outputPath) => ipcRenderer.invoke('merge-videos', files, outputPath),
  mergeImages: (files, outputPath, duration) => ipcRenderer.invoke('merge-images', files, outputPath, duration),
  showError: (title, message) => ipcRenderer.invoke('show-error', title, message),
  showSuccess: (title, message) => ipcRenderer.invoke('show-success', title, message),
  
  // Event listeners
  onMergeProgress: (callback) => {
    ipcRenderer.on('merge-progress', (event, progress) => callback(progress));
  },
  
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});
