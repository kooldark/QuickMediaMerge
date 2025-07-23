const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFiles: () => ipcRenderer.invoke('select-files'),
  selectOutputFolder: () => ipcRenderer.invoke('select-output-folder'),
  getFileInfo: (filePath) => ipcRenderer.invoke('get-file-info', filePath),
  mergeVideos: (files, outputPath) => ipcRenderer.invoke('merge-videos', files, outputPath),
  mergeImages: (files, outputPath, duration) => ipcRenderer.invoke('merge-images', files, outputPath, duration),
  
  // New video editing features
  changeVideoSpeed: (filePath, outputPath, speed) => ipcRenderer.invoke('change-video-speed', filePath, outputPath, speed),
  trimVideo: (filePath, outputPath, startTime, duration) => ipcRenderer.invoke('trim-video', filePath, outputPath, startTime, duration),
  extractAudio: (filePath, outputPath, format) => ipcRenderer.invoke('extract-audio', filePath, outputPath, format),
  compressVideo: (filePath, outputPath, quality) => ipcRenderer.invoke('compress-video', filePath, outputPath, quality),
  rotateVideo: (filePath, outputPath, rotation) => ipcRenderer.invoke('rotate-video', filePath, outputPath, rotation),
  
  showError: (title, message) => ipcRenderer.invoke('show-error', title, message),
  showSuccess: (title, message) => ipcRenderer.invoke('show-success', title, message),
  
  // Event listeners
  onMergeProgress: (callback) => {
    ipcRenderer.on('merge-progress', (event, progress) => callback(progress));
  },
  
  onProcessingProgress: (callback) => {
    ipcRenderer.on('processing-progress', (event, progress) => callback(progress));
  },
  
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});
