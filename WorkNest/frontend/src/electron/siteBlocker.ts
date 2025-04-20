import { BrowserWindow, BrowserView } from 'electron';

const blockedSites = ['youtube.com', 'reddit.com'];

export function createSafeBrowserView(parentWindow: BrowserWindow): BrowserView {
  const view = new BrowserView();
  parentWindow.setBrowserView(view);
  view.setBounds({ x: 0, y: 0, width: 1200, height: 800 });

  view.webContents.on('will-navigate', (event, url) => {
    if (blockedSites.some(domain => url.includes(domain))) {
      console.log(`[SiteBlocker] Blocked: ${url}`);
      event.preventDefault();
      view.webContents.loadURL('data:text/html,<h1>🚫 Blocked</h1><p>This site is restricted during Focus Mode.</p>');
    }
  });

  return view;
}
