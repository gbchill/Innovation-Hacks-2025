require('dotenv').config();                          // load .env first

const { app, BrowserWindow, BrowserView, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const aiClient = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-features', 'DawnExperimentalSubgroupLimits');

let mainWindow;
let browserView;
let currentUrl = 'https://www.google.com';
let currentColorScheme = 'light';
let currentSidebarWidth = 0;

/* ─────── NEW: deep‑work state ─────── */
let deepWorkActive = false;

/* ───────── Window creation ───────── */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.setMaxListeners(20);

  mainWindow.on('resize', () => {
    if (browserView) {
      const { width, height } = mainWindow.getBounds();
      browserView.setBounds({
        x: currentSidebarWidth,
        y: 100,
        width: width - currentSidebarWidth,
        height: height - 100,
      });
    }
  });

  /* prevent closing while in deep work */
  mainWindow.on('close', e => {
    if (deepWorkActive) {
      e.preventDefault();
    }
  });

  mainWindow.loadURL('http://localhost:5173');
}

/* ─────────── AI handler (unchanged) ─────────── */
ipcMain.handle('ai-generate', async (_event, prompt) => {
  try {
    const response = await aiClient.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });
    return { text: response.text };
  } catch (err) {
    console.error('AI generate error:', err);
    return { error: err.message };
  }
});

/* ─────────── Deep‑Work lock‑down IPC ─────────── */
const enterDeepWork = () => {
  if (deepWorkActive) return;
  deepWorkActive = true;
  mainWindow.setKiosk(true);
  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.webContents.send('deep-work-state', true);
};

const exitDeepWork = () => {
  if (!deepWorkActive) return;
  deepWorkActive = false;
  mainWindow.setKiosk(false);
  mainWindow.setAlwaysOnTop(false);
  mainWindow.webContents.send('deep-work-state', false);
};

/* handle requests from renderer */
ipcMain.on('start-deep-work', enterDeepWork);
ipcMain.on('stop-deep-work',  exitDeepWork);
ipcMain.handle('get-deep-work-state', () => deepWorkActive);

/* emergency shortcut to unlock: Ctrl+Shift+D */
app.whenReady().then(() => {
  globalShortcut.register('CommandOrControl+Shift+D', () => {
    exitDeepWork();
  });
});

/* ────────── color‑scheme helpers (unchanged) ────────── */
function applyLightMode() {
  if (!browserView) return;
  browserView.webContents.executeJavaScript(`
    try {
      document.documentElement.style.colorScheme = 'light';
      let style = document.querySelector('style[data-force-color-scheme]');
      if (!style) {
        style = document.createElement('style');
        style.setAttribute('data-force-color-scheme', 'true');
        document.head.appendChild(style);
      }
      style.textContent = \`
        html, body { color-scheme: light !important; background: #F7F5EF !important; color: #000 !important; }
        * { color: #000 !important; background: #F7F5EF !important; }
      \`;
      let meta = document.querySelector('meta[name="color-scheme"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'color-scheme';
        document.head.appendChild(meta);
      }
      meta.content = 'light';
    } catch (e) { console.error(e); }
  `).catch(console.error);
}

function applyDarkMode() {
  if (!browserView) return;
  browserView.webContents.executeJavaScript(`
    try {
      document.documentElement.style.colorScheme = 'dark';
      let style = document.querySelector('style[data-force-color-scheme]');
      if (!style) {
        style = document.createElement('style');
        style.setAttribute('data-force-color-scheme', 'true');
        document.head.appendChild(style);
      }
      style.textContent = \`
        html, body { color-scheme: dark !important; background: #121212 !important; color: #fff !important; }
      \`;
      let meta = document.querySelector('meta[name="color-scheme"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'color-scheme';
        document.head.appendChild(meta);
      }
      meta.content = 'dark';
    } catch (e) { console.error(e); }
  `).catch(console.error);
}

/* ───────── Browser‑view handling (unchanged) ───────── */
ipcMain.on('create-browser-view', (event, url, sidebarWidth = 0, colorScheme = 'light') => {
  currentUrl = url || currentUrl;
  currentColorScheme = colorScheme;
  currentSidebarWidth = sidebarWidth;

  if (!browserView) {
    browserView = new BrowserView({
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
      }
    });
    mainWindow.setBrowserView(browserView);
  }

  const { width, height } = mainWindow.getBounds();
  browserView.setBounds({
    x: currentSidebarWidth,
    y: 100,
    width: width - currentSidebarWidth,
    height: height - 100,
  });

  browserView.webContents.loadURL(currentUrl);
  event.reply('browser-view-created', browserView.id);

  browserView.webContents.on('page-title-updated', (_e, title) => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send('page-title-updated', title);
    }
  });

  const applyScheme = currentColorScheme === 'light' ? applyLightMode : applyDarkMode;
  browserView.webContents.on('did-finish-load', applyScheme);
  browserView.webContents.on('dom-ready',       applyScheme);
});

/* the rest of the browser‑view IPC (unchanged) */
ipcMain.on('browser-go-back',      () => browserView && browserView.webContents.canGoBack()     && browserView.webContents.goBack());
ipcMain.on('browser-go-forward',   () => browserView && browserView.webContents.canGoForward()  && browserView.webContents.goForward());
ipcMain.on('browser-reload',       () => browserView && browserView.webContents.reload());
ipcMain.on('browser-navigate',     (_e, url) => { if (browserView) { currentUrl = url; browserView.webContents.loadURL(url); }});
ipcMain.on('get-current-url',      (e) => e.reply('current-url', browserView ? browserView.webContents.getURL() : currentUrl));
ipcMain.on('get-navigation-state', (e) => {
  if (browserView) {
    e.reply('navigation-state', {
      canGoBack:  browserView.webContents.canGoBack(),
      canGoForward: browserView.webContents.canGoForward(),
      isLoading: browserView.webContents.isLoading(),
      currentUrl: browserView.webContents.getURL(),
    });
  } else {
    e.reply('navigation-state', { canGoBack:false, canGoForward:false, isLoading:false, currentUrl });
  }
});
ipcMain.on('update-browser-view-bounds', (_e, sidebarWidth = 0) => {
  currentSidebarWidth = sidebarWidth;
  if (browserView) {
    const { width, height } = mainWindow.getBounds();
    browserView.setBounds({ x: sidebarWidth, y:100, width: width-sidebarWidth, height: height-100 });
  }
});
ipcMain.on('set-color-scheme', (_e, scheme='light') => {
  currentColorScheme = scheme;
  if (browserView) {
    (scheme === 'light' ? applyLightMode : applyDarkMode)();
    setTimeout(() => {
      try {
        const wc = browserView.webContents;
        if (!wc.isDestroyed()) {
          const url = wc.getURL();
          if (/(google\.com|youtube\.com|github\.com)/.test(url)) wc.reload();
        }
      } catch {}
    }, 500);
  }
});
ipcMain.on('remove-browser-view', () => {
  if (browserView) {
    mainWindow.removeBrowserView(browserView);
    browserView = null;
    currentUrl = '';
  }
});

/* ─────────── app lifecycle ─────────── */
app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
