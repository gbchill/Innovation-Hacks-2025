// electron.d.ts (or globals.d.ts)

interface ElectronAPI {
    startDeepWorkMode: (startTime: string, endTime: string) => Promise<boolean>;
    endDeepWorkMode: () => Promise<boolean>;
    isDeepWorkActive: () => Promise<boolean>;
  }
  
  interface Window {
    electronAPI?: ElectronAPI;
  }
  