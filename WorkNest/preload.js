const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  /* ───────── Browser‑view controls (unchanged) ───────── */
  createBrowserView:    (url, sidebarWidth, preferredColorScheme) =>
    ipcRenderer.send('create-browser-view', url, sidebarWidth, preferredColorScheme),
  removeBrowserView:    () => ipcRenderer.send('remove-browser-view'),
  browserGoBack:        () => ipcRenderer.send('browser-go-back'),
  browserGoForward:     () => ipcRenderer.send('browser-go-forward'),
  browserReload:        () => ipcRenderer.send('browser-reload'),
  browserNavigate:      (url) => ipcRenderer.send('browser-navigate', url),
  getCurrentUrl:        () => ipcRenderer.send('get-current-url'),
  getNavigationState:   () => ipcRenderer.send('get-navigation-state'),
  updateBrowserViewBounds: (sidebarWidth) =>
    ipcRenderer.send('update-browser-view-bounds', sidebarWidth),
  setColorScheme:       (scheme) => ipcRenderer.send('set-color-scheme', scheme),

  /* ───────── AI generation (unchanged) ───────── */
  generateAI: (prompt) => ipcRenderer.invoke('ai-generate', prompt),

  /* ───────── Deep‑Work lock‑down ───────── */
  startDeepWork:        () => ipcRenderer.send('start-deep-work'),
  stopDeepWork:         () => ipcRenderer.send('stop-deep-work'),
  requestDeepWorkState: () => ipcRenderer.invoke('get-deep-work-state'),
  onDeepWorkState:      (callback) =>
    ipcRenderer.on('deep-work-state', (_e, state) => callback(state)),

  /* ───────── Event listeners (browser view) ───────── */
  onBrowserViewCreated: (callback) =>
    ipcRenderer.on('browser-view-created',    (_e, id)    => callback(id)),
  onCurrentUrl:        (callback) =>
    ipcRenderer.on('current-url',            (_e, url)   => callback(url)),
  onNavigationState:   (callback) =>
    ipcRenderer.on('navigation-state',      (_e, state) => callback(state)),
  onPageTitleUpdated:  (callback) =>
    ipcRenderer.on('page-title-updated',    (_e, title) => callback(title)),

  /* remove listeners */
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('browser-view-created')
    ipcRenderer.removeAllListeners('current-url')
    ipcRenderer.removeAllListeners('navigation-state')
    ipcRenderer.removeAllListeners('page-title-updated')
    ipcRenderer.removeAllListeners('deep-work-state')
  }
});

window.addEventListener('DOMContentLoaded', () => {
  console.log('Preload script loaded')
});
