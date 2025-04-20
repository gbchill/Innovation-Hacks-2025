/**
 * Global typings for the IPC bridge exposed in `preload.js`.
 * Importing is not required — just keep the file inside `src/types`
 * (or add the folder to your `tsconfig.json` “include” array).
 */

export {}

declare global {
  interface Window {
    electronAPI?: {
      /* browser view */
      createBrowserView: (url?: string, sidebarWidth?: number, preferredColorScheme?: string) => void
      removeBrowserView: () => void
      browserGoBack: () => void
      browserGoForward: () => void
      browserReload: () => void
      browserNavigate: (url: string) => void
      getCurrentUrl: () => void
      getNavigationState: () => void
      updateBrowserViewBounds: (sidebarWidth: number) => void
      setColorScheme: (scheme: string) => void

      /* AI */
      generateAI: (prompt: any) => Promise<any>

      /* deep‑work lock‑down */
      startDeepWork: () => void
      stopDeepWork: () => void
      requestDeepWorkState: () => Promise<boolean>
      onDeepWorkState: (cb: (state: boolean) => void) => void

      /* misc event helpers */
      onBrowserViewCreated: (cb: (id: number) => void) => void
      onCurrentUrl:        (cb: (url: string) => void) => void
      onNavigationState:   (cb: (state: any) => void) => void
      onPageTitleUpdated:  (cb: (title: string) => void) => void
      removeAllListeners:  () => void
    }
  }
}
