import { useState, useEffect } from 'react';

// Declare the electronAPI interface
declare global {
  interface Window {
    electronAPI: {
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
  
  const actualSidebarWidth = sidebarCollapsed ? 0 : sidebarWidth;

  // Initialize browser view when component mounts
  useEffect(() => {
    // Set up event listeners
    window.electronAPI.onBrowserViewCreated((id) => {
      console.log('Browser view created with ID:', id);
    });

    window.electronAPI.onCurrentUrl((currentUrl) => {
      setUrl(currentUrl);
      setInputUrl(currentUrl);
    });

    window.electronAPI.onNavigationState((state) => {
      setCanGoBack(state.canGoBack);
      setCanGoForward(state.canGoForward);
      setIsLoading(state.isLoading);
      setUrl(state.currentUrl);
      setInputUrl(state.currentUrl);
    });

    // Create the browser view with sidebar width information
    window.electronAPI.createBrowserView(initialUrl, actualSidebarWidth);

    // Poll navigation state periodically
    const intervalId = setInterval(() => {
      window.electronAPI.getNavigationState();
    }, 500);

    // Clean up when component unmounts
    return () => {
      clearInterval(intervalId);
      window.electronAPI.removeAllListeners();
      window.electronAPI.removeBrowserView();
    };
  }, [initialUrl, actualSidebarWidth]);

  // Update browser view bounds when sidebar width changes
  useEffect(() => {
    window.electronAPI.updateBrowserViewBounds(actualSidebarWidth);
  }, [actualSidebarWidth]);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let processedUrl = inputUrl;
    
    // Add https:// if the URL doesn't have a protocol
    if (!/^https?:\/\//i.test(inputUrl)) {
      processedUrl = `https://${inputUrl}`;
    }
    
    setUrl(processedUrl);
    window.electronAPI.browserNavigate(processedUrl);
  };

  const goBack = () => {
    window.electronAPI.browserGoBack();
  };

  const goForward = () => {
    window.electronAPI.browserGoForward();
  };

  const reload = () => {
    window.electronAPI.browserReload();
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center p-2 bg-gray-100 border-b">
        <button 
          onClick={goBack} 
          disabled={!canGoBack}
          className={`p-2 rounded ${canGoBack ? 'text-gray-700 hover:bg-gray-200' : 'text-gray-400'}`}
        >
          ←
        </button>
        <button 
          onClick={goForward} 
          disabled={!canGoForward}
          className={`p-2 rounded ${canGoForward ? 'text-gray-700 hover:bg-gray-200' : 'text-gray-400'}`}
        >
          →
        </button>
        <button 
          onClick={reload} 
          className="p-2 rounded text-gray-700 hover:bg-gray-200"
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
        {isLoading && (
          <div className="ml-2 text-blue-500">Loading...</div>
        )}
      </div>
      {/* The actual browser content is rendered by Electron in the main process */}
      {/* This is just a placeholder to maintain the layout */}
      <div className="flex-1 bg-white" style={{ height: 'calc(100vh - 130px)' }}></div>
    </div>
  );
};

export default ChromeBrowser;