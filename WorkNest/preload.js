const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods for renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Browser view controls
  createBrowserView: (url) => ipcRenderer.send('create-browser-view', url),
  removeBrowserView: () => ipcRenderer.send('remove-browser-view'),
  browserGoBack: () => ipcRenderer.send('browser-go-back'),
  browserGoForward: () => ipcRenderer.send('browser-go-forward'),
  browserReload: () => ipcRenderer.send('browser-reload'),
  browserNavigate: (url) => ipcRenderer.send('browser-navigate', url),
  getCurrentUrl: () => ipcRenderer.send('get-current-url'),
  getNavigationState: () => ipcRenderer.send('get-navigation-state'),
  
  // Event listeners
  onBrowserViewCreated: (callback) => 
    ipcRenderer.on('browser-view-created', (_, id) => callback(id)),
  onCurrentUrl: (callback) => 
    ipcRenderer.on('current-url', (_, url) => callback(url)),
  onNavigationState: (callback) => 
    ipcRenderer.on('navigation-state', (_, state) => callback(state)),
  
  // Remove event listeners when no longer needed
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('browser-view-created');
    ipcRenderer.removeAllListeners('current-url');
    ipcRenderer.removeAllListeners('navigation-state');
  }
});

// Notify that preload script has loaded
window.addEventListener('DOMContentLoaded', () => {
  console.log('Preload script loaded');
});
