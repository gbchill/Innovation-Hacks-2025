import { useState, useEffect } from 'react';

// Declare the electronAPI interface
declare global {
  interface Window {
    electronAPI?: {
      createBrowserView: (url?: string, sidebarWidth?: number) => void;
      removeBrowserView: () => void;
      browserGoBack: () => void;
      browserGoForward: () => void;
      browserReload: () => void;
      browserNavigate: (url: string) => void;
      getCurrentUrl: () => void;
      getNavigationState: () => void;
      updateBrowserViewBounds: (sidebarWidth: number) => void;
      onBrowserViewCreated: (callback: (id: number) => void) => void;
      onCurrentUrl: (callback: (url: string) => void) => void;
      onNavigationState: (callback: (state: NavigationState) => void) => void;
      removeAllListeners: () => void;
    };
  }
}

interface NavigationState {
  canGoBack: boolean;
  canGoForward: boolean;
  isLoading: boolean;
  currentUrl: string;
}

interface ChromeBrowserProps {
  initialUrl?: string;
  sidebarWidth?: number;
  sidebarCollapsed?: boolean;
}

const ChromeBrowser: React.FC<ChromeBrowserProps> = ({ 
  initialUrl = 'https://www.google.com',
  sidebarWidth = 64, // default width in pixels when sidebar is not collapsed
  sidebarCollapsed = false
}) => {
  const [url, setUrl] = useState(initialUrl);
  const [inputUrl, setInputUrl] = useState(initialUrl);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isElectron, setIsElectron] = useState(false);
  const [fallbackMode, setFallbackMode] = useState(false);
  
  const actualSidebarWidth = sidebarCollapsed ? 0 : sidebarWidth;

  // Check if running in Electron
  useEffect(() => {
    const isRunningInElectron = window.electronAPI !== undefined;
    setIsElectron(isRunningInElectron);
    
    if (!isRunningInElectron) {
      console.log('Running in browser mode (not Electron). Using fallback mode with iframe.');
      setFallbackMode(true);
    }
  }, []);

  // Initialize browser view when component mounts - only in Electron
  useEffect(() => {
    if (!isElectron || fallbackMode) return;

    // Set up event listeners
    window.electronAPI?.onBrowserViewCreated((id) => {
      console.log('Browser view created with ID:', id);
    });

    window.electronAPI?.onCurrentUrl((currentUrl) => {
      setUrl(currentUrl);
      setInputUrl(currentUrl);
    });

    window.electronAPI?.onNavigationState((state) => {
      setCanGoBack(state.canGoBack);
      setCanGoForward(state.canGoForward);
      setIsLoading(state.isLoading);
      setUrl(state.currentUrl);
      setInputUrl(state.currentUrl);
    });

    // Create the browser view with sidebar width information
    window.electronAPI?.createBrowserView(initialUrl, actualSidebarWidth);

    // Poll navigation state periodically
    const intervalId = setInterval(() => {
      window.electronAPI?.getNavigationState();
    }, 500);

    // Clean up when component unmounts
    return () => {
      clearInterval(intervalId);
      window.electronAPI?.removeAllListeners();
      window.electronAPI?.removeBrowserView();
    };
  }, [initialUrl, actualSidebarWidth, isElectron]);

  // Update browser view bounds when sidebar width changes - only in Electron
  useEffect(() => {
    if (!isElectron || fallbackMode) return;
    window.electronAPI?.updateBrowserViewBounds(actualSidebarWidth);
  }, [actualSidebarWidth, isElectron]);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let processedUrl = inputUrl;
    
    // Add https:// if the URL doesn't have a protocol
    if (!/^https?:\/\//i.test(inputUrl)) {
      processedUrl = `https://${inputUrl}`;
    }
    
    setUrl(processedUrl);
    
    if (isElectron && !fallbackMode) {
      window.electronAPI?.browserNavigate(processedUrl);
    } else {
      // In fallback mode, just update the URL for the iframe
      setUrl(processedUrl);
    }
  };

  const goBack = () => {
    if (isElectron && !fallbackMode) {
      window.electronAPI?.browserGoBack();
    }
  };

  const goForward = () => {
    if (isElectron && !fallbackMode) {
      window.electronAPI?.browserGoForward();
    }
  };

  const reload = () => {
    if (isElectron && !fallbackMode) {
      window.electronAPI?.browserReload();
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center p-2 bg-gray-100 border-b">
        <button 
          onClick={goBack} 
          disabled={!canGoBack || fallbackMode}
          className={`p-2 rounded ${(!fallbackMode && canGoBack) ? 'text-gray-700 hover:bg-gray-200' : 'text-gray-400'}`}
        >
          ←
        </button>
        <button 
          onClick={goForward} 
          disabled={!canGoForward || fallbackMode}
          className={`p-2 rounded ${(!fallbackMode && canGoForward) ? 'text-gray-700 hover:bg-gray-200' : 'text-gray-400'}`}
        >
          →
        </button>
        <button 
          onClick={reload} 
          disabled={fallbackMode}
          className={`p-2 rounded ${!fallbackMode ? 'text-gray-700 hover:bg-gray-200' : 'text-gray-400'}`}
        >
          ↻
        </button>
        <form onSubmit={handleUrlSubmit} className="flex-1 ml-2">
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Enter URL..."
          />
        </form>
        {isLoading && !fallbackMode && (
          <div className="ml-2 text-blue-500">Loading...</div>
        )}
      </div>
      
      {/* If in fallback mode, show an iframe instead */}
      {fallbackMode ? (
        <div className="flex-1 bg-white">
          <iframe 
            src={url} 
            className="w-full h-full border-0"
            title="Browser Fallback"
            style={{ height: 'calc(100vh - 130px)' }}
          />
        </div>
      ) : (
        /* The actual browser content is rendered by Electron in the main process */
        /* This is just a placeholder to maintain the layout */
        <div className="flex-1 bg-white" style={{ height: 'calc(100vh - 130px)' }}></div>
      )}
      
      {fallbackMode && (
        <div className="bg-yellow-100 text-yellow-800 p-2 text-sm">
          Running in browser preview mode. For full browser functionality, launch in Electron.
        </div>
      )}
    </div>
  );
};

export default ChromeBrowser;