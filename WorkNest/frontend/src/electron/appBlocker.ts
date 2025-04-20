import activeWin from 'active-win';
import { exec } from 'child_process';

const blockedApps = ['Discord', 'Google Chrome'];

let interval: NodeJS.Timeout | null = null;

export function startAppBlocker(): void {
  console.log('[AppBlocker] Started');

  interval = setInterval(async () => {
    const win = await activeWin();
    if (!win?.owner?.name) return;

    const appName = win.owner.name;
    if (blockedApps.includes(appName)) {
      console.log(`[AppBlocker] Blocking ${appName}`);
      exec(`taskkill /IM "${appName}.exe" /F`);
    }
  }, 3000);
}

export function stopAppBlocker(): void {
  if (interval) {
    clearInterval(interval);
    interval = null;
    console.log('[AppBlocker] Stopped');
  }
}
