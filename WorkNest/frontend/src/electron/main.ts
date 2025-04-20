import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { startAppBlocker, stopAppBlocker } from './appBlocker';
import { createSafeBrowserView } from './siteBlocker';

let mainWindow: BrowserWindow;

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Make sure this matches your compiled preload
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL('http://localhost:5173'); // or use loadFile() if you're building your app

  ipcMain.handle('start-focus-mode', () => {
    startAppBlocker();
    createSafeBrowserView(mainWindow);
  });

  ipcMain.handle('stop-focus-mode', () => {
    stopAppBlocker();
    mainWindow.setBrowserView(null);
  });
});
