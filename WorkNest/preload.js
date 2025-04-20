const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods for renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Browser view controls
  createBrowserView: (url, sidebarWidth, preferredColorScheme) =>
    ipcRenderer.send('create-browser-view', url, sidebarWidth, preferredColorScheme),
  removeBrowserView: () => ipcRenderer.send('remove-browser-view'),
  browserGoBack: () => ipcRenderer.send('browser-go-back'),
  browserGoForward: () => ipcRenderer.send('browser-go-forward'),
  browserReload: () => ipcRenderer.send('browser-reload'),
  browserNavigate: (url) => ipcRenderer.send('browser-navigate', url),
  getCurrentUrl: () => ipcRenderer.send('get-current-url'),
  getNavigationState: () => ipcRenderer.send('get-navigation-state'),
  updateBrowserViewBounds: (sidebarWidth) => ipcRenderer.send('update-browser-view-bounds', sidebarWidth),
  setColorScheme: (scheme) => ipcRenderer.send('set-color-scheme', scheme),
  
  // Event listeners
  onBrowserViewCreated: (callback) =>
    ipcRenderer.on('browser-view-created', (_, id) => callback(id)),
  onCurrentUrl: (callback) =>
    ipcRenderer.on('current-url', (_, url) => callback(url)),
  onNavigationState: (callback) =>
    ipcRenderer.on('navigation-state', (_, state) => callback(state)),
  onPageTitleUpdated: (callback) =>
    ipcRenderer.on('page-title-updated', (_, title) => callback(title)),
  
  // Remove event listeners when no longer needed
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('browser-view-created');
    ipcRenderer.removeAllListeners('current-url');
    ipcRenderer.removeAllListeners('navigation-state');
    ipcRenderer.removeAllListeners('page-title-updated');
  }
});

// Notify that preload script has loaded
window.addEventListener('DOMContentLoaded', () => {
  console.log('Preload script loaded');
});