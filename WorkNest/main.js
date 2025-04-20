// main.js
require('dotenv').config();                          // ← load .env before anything else

const { app, BrowserWindow, BrowserView, ipcMain } = require('electron');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');     // ← require the GenAI client

// Instantiate the AI client with your key from .env
const aiClient = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY
});

let mainWindow;
let browserView;
let currentUrl = 'https://www.google.com';
let currentColorScheme = 'light';
let currentSidebarWidth = 0;

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

  // Prevent “MaxListenersExceededWarning”
  mainWindow.setMaxListeners(20);

  // Always adjust BrowserView on resize
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

  mainWindow.loadURL('http://localhost:5173');
}

// -- AI GENERATION HANDLER ----------------------------------------
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
// -----------------------------------------------------------------

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
        html, body {
          color-scheme: light !important;
          background: #F7F5EF !important;
          color: #000 !important;
        }
        * {
          color: #000 !important;
          background: #F7F5EF !important;
        }
      \`;
      let meta = document.querySelector('meta[name="color-scheme"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'color-scheme';
        document.head.appendChild(meta);
      }
      meta.content = 'light';
    } catch (e) {
      console.error(e);
    }
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
        html, body {
          color-scheme: dark !important;
          background: #121212 !important;
          color: #fff !important;
        }
      \`;
      let meta = document.querySelector('meta[name="color-scheme"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'color-scheme';
        document.head.appendChild(meta);
      }
      meta.content = 'dark';
    } catch (e) {
      console.error(e);
    }
  `).catch(console.error);
}

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

  browserView.webContents.on('page-title-updated', (e, title) => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send('page-title-updated', title);
    }
  });

  browserView.webContents.on('did-finish-load', () => {
    currentColorScheme === 'light' ? applyLightMode() : applyDarkMode();
  });
  browserView.webContents.on('dom-ready', () => {
    currentColorScheme === 'light' ? applyLightMode() : applyDarkMode();
  });
});

ipcMain.on('browser-go-back', () => {
  if (browserView && browserView.webContents.navigationHistory.canGoBack()) {
    browserView.webContents.goBack();
  }
});

ipcMain.on('browser-go-forward', () => {
  if (browserView && browserView.webContents.navigationHistory.canGoForward()) {
    browserView.webContents.goForward();
  }
});

ipcMain.on('browser-reload', () => {
  if (browserView) browserView.webContents.reload();
});

ipcMain.on('browser-navigate', (_, url) => {
  if (browserView) {
    currentUrl = url;
    browserView.webContents.loadURL(url);
  }
});

ipcMain.on('get-current-url', (event) => {
  const replyUrl = browserView ? browserView.webContents.getURL() : currentUrl;
  event.reply('current-url', replyUrl);
});

ipcMain.on('get-navigation-state', (event) => {
  if (browserView) {
    const nav = browserView.webContents.navigationHistory;
    event.reply('navigation-state', {
      canGoBack: nav.canGoBack(),
      canGoForward: nav.canGoForward(),
      isLoading: browserView.webContents.isLoading(),
      currentUrl: browserView.webContents.getURL(),
    });
  } else {
    event.reply('navigation-state', {
      canGoBack: false,
      canGoForward: false,
      isLoading: false,
      currentUrl,
    });
  }
});

ipcMain.on('update-browser-view-bounds', (_, sidebarWidth = 0) => {
  currentSidebarWidth = sidebarWidth;
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

ipcMain.on('set-color-scheme', (_, scheme = 'light') => {
  currentColorScheme = scheme;
  if (!browserView) return;

  scheme === 'light' ? applyLightMode() : applyDarkMode();

  // reload heavy sites if still alive
  setTimeout(() => {
    try {
      const wc = browserView.webContents;
      if (!wc.isDestroyed()) {
        const url = wc.getURL();
        if (/(google\.com|youtube\.com|github\.com)/.test(url)) {
          wc.reload();
        }
      }
    } catch (err) {
      console.error('Error reloading after color‑scheme change:', err);
    }
  }, 500);
});

ipcMain.on('remove-browser-view', () => {
  if (browserView) {
    mainWindow.removeBrowserView(browserView);
    browserView = null;
  }
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
