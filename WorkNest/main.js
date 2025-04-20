const { app, BrowserWindow, BrowserView, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
let browserView;
let currentUrl = 'https://www.google.com';

function createWindow() {
  // Create the main application window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // This tells Electron where your frontend is during development
  mainWindow.loadURL('http://localhost:5173');
  
  // Uncomment this to open DevTools automatically
  // mainWindow.webContents.openDevTools();
}

// Create browser view when requested by the renderer
ipcMain.on('create-browser-view', (event, url, sidebarWidth = 0) => {
  // Save current URL if provided
  if (url) {
    currentUrl = url;
  }

  // Create browser view if it doesn't exist yet
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
  
  // Set the bounds to fill most of the window, accounting for sidebar
  const bounds = mainWindow.getBounds();
  browserView.setBounds({ 
    x: sidebarWidth, 
    y: 100, // Leave more space for tab bar and controls at top
    width: bounds.width - sidebarWidth, 
    height: bounds.height - 100 
  });
  
  // Navigate to the URL
  browserView.webContents.loadURL(currentUrl);
  
  // Send back the browserView ID to the renderer
  event.reply('browser-view-created', browserView.id);
  
  // Handle window resize to adjust the browser view
  mainWindow.on('resize', () => {
    if (browserView) {
      const bounds = mainWindow.getBounds();
      const currentBounds = browserView.getBounds();
      browserView.setBounds({ 
        x: currentBounds.x, // Keep the current X position (for sidebar)
        y: 100, // Keep space for tabs and controls
        width: bounds.width - currentBounds.x, 
        height: bounds.height - 100 
      });
    }
  });
  
  // Listen for page title updates
  browserView.webContents.on('page-title-updated', (event, title) => {
    // Send the title back to the renderer
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('page-title-updated', title);
    }
  });
});

// Update browser view bounds when the sidebar is toggled
ipcMain.on('update-browser-view-bounds', (event, sidebarWidth = 0) => {
  if (browserView) {
    const bounds = mainWindow.getBounds();
    browserView.setBounds({ 
      x: sidebarWidth, 
      y: 100, // Keep space for tabs and controls
      width: bounds.width - sidebarWidth, 
      height: bounds.height - 100 
    });
  }
});

// Handle navigation controls
ipcMain.on('browser-go-back', () => {
  if (browserView && browserView.webContents.canGoBack()) {
    browserView.webContents.goBack();
  }
});

ipcMain.on('browser-go-forward', () => {
  if (browserView && browserView.webContents.canGoForward()) {
    browserView.webContents.goForward();
  }
});

ipcMain.on('browser-reload', () => {
  if (browserView) {
    browserView.webContents.reload();
  }
});

ipcMain.on('browser-navigate', (event, url) => {
  if (browserView) {
    currentUrl = url; // Save the current URL
    browserView.webContents.loadURL(url);
  }
});

ipcMain.on('get-current-url', (event) => {
  if (browserView) {
    event.reply('current-url', browserView.webContents.getURL());
  } else {
    event.reply('current-url', currentUrl);
  }
});

ipcMain.on('get-navigation-state', (event) => {
  if (browserView) {
    event.reply('navigation-state', {
      canGoBack: browserView.webContents.canGoBack(),
      canGoForward: browserView.webContents.canGoForward(),
      isLoading: browserView.webContents.isLoading(),
      currentUrl: browserView.webContents.getURL()
    });
  } else {
    event.reply('navigation-state', {
      canGoBack: false,
      canGoForward: false,
      isLoading: false,
      currentUrl: currentUrl
    });
  }
});

// Remove browser view when requested
ipcMain.on('remove-browser-view', () => {
  if (browserView) {
    mainWindow.removeBrowserView(browserView);
    browserView = null;
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});