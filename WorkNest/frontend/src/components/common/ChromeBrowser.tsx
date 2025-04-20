import { useState, useEffect } from 'react';
import { PlusIcon, XMarkIcon, HomeIcon } from '@heroicons/react/24/outline';

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

interface Tab {
  id: string;
  url: string;
  title: string;
}

const ChromeBrowser: React.FC<ChromeBrowserProps> = ({ 
  initialUrl = 'https://www.google.com',
  sidebarWidth = 64, // default width in pixels when sidebar is not collapsed
  sidebarCollapsed = false
}) => {
  // Tab management
  const [tabs, setTabs] = useState<Tab[]>([
    { id: '1', url: initialUrl, title: 'Google' }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('1');
  
  // URL and navigation state
  const [inputUrl, setInputUrl] = useState(initialUrl);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isElectron, setIsElectron] = useState(false);
  const [fallbackMode, setFallbackMode] = useState(false);
  
  // Track if there are no tabs open
  const [noTabs, setNoTabs] = useState(false);
  
  const actualSidebarWidth = sidebarCollapsed ? 0 : sidebarWidth;
  
  // Get the active tab
  const activeTab = tabs.find(tab => tab.id === activeTabId) || tabs[0];

  // Check if running in Electron
  useEffect(() => {
    const isRunningInElectron = window.electronAPI !== undefined;
    setIsElectron(isRunningInElectron);
    
    if (!isRunningInElectron) {
      console.log('Running in browser mode (not Electron). Using fallback mode with iframe.');
      setFallbackMode(true);
    }
  }, []);

  // Handle tabs state
  useEffect(() => {
    if (tabs.length === 0) {
      setNoTabs(true);
      
      // Hide browser view if in Electron mode
      if (isElectron && !fallbackMode) {
        window.electronAPI?.removeBrowserView();
      }
    } else {
      setNoTabs(false);
    }
  }, [tabs.length, isElectron, fallbackMode]);

  // Initialize browser view when component mounts - only in Electron
  useEffect(() => {
    if (!isElectron || fallbackMode || noTabs) return;

    // Set up event listeners
    window.electronAPI?.onBrowserViewCreated((id) => {
      console.log('Browser view created with ID:', id);
    });

    window.electronAPI?.onCurrentUrl((currentUrl) => {
      // Update the URL for the active tab
      setTabs(prevTabs => 
        prevTabs.map(tab => 
          tab.id === activeTabId 
            ? { ...tab, url: currentUrl } 
            : tab
        )
      );
      setInputUrl(currentUrl);
    });

    window.electronAPI?.onNavigationState((state) => {
      setCanGoBack(state.canGoBack);
      setCanGoForward(state.canGoForward);
      setIsLoading(state.isLoading);
      
      // Update the URL for the active tab
      setTabs(prevTabs => 
        prevTabs.map(tab => 
          tab.id === activeTabId 
            ? { ...tab, url: state.currentUrl } 
            : tab
        )
      );
      setInputUrl(state.currentUrl);
    });

    // Create the browser view with sidebar width information
    window.electronAPI?.createBrowserView(activeTab.url, actualSidebarWidth);

    // Poll navigation state periodically
    const intervalId = setInterval(() => {
      window.electronAPI?.getNavigationState();
    }, 500);

    // Clean up when component unmounts
    return () => {
      clearInterval(intervalId);
      window.electronAPI?.removeAllListeners();
      if (!noTabs) {
        window.electronAPI?.removeBrowserView();
      }
    };
  }, [activeTabId, actualSidebarWidth, isElectron, noTabs]);

  // Update browser view bounds when sidebar width changes - only in Electron
  useEffect(() => {
    if (!isElectron || fallbackMode || noTabs) return;
    window.electronAPI?.updateBrowserViewBounds(actualSidebarWidth);
  }, [actualSidebarWidth, isElectron, noTabs]);

  // Navigation control handler for URL submission
  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Add https:// if the URL doesn't have a protocol
    let processedUrl = inputUrl;
    if (!/^https?:\/\//i.test(inputUrl)) {
      processedUrl = `https://${inputUrl}`;
    }
    
    // Update the URL for the active tab
    setTabs(prevTabs => 
      prevTabs.map(tab => 
        tab.id === activeTabId 
          ? { ...tab, url: processedUrl } 
          : tab
      )
    );
    
    if (isElectron && !fallbackMode && !noTabs) {
      window.electronAPI?.browserNavigate(processedUrl);
    }
  };

  // Navigation controls
  const goBack = () => {
    if (isElectron && !fallbackMode && !noTabs) {
      window.electronAPI?.browserGoBack();
    }
  };

  const goForward = () => {
    if (isElectron && !fallbackMode && !noTabs) {
      window.electronAPI?.browserGoForward();
    }
  };

  const reload = () => {
    if (isElectron && !fallbackMode && !noTabs) {
      window.electronAPI?.browserReload();
    }
  };

  // Tab management functions
  const addNewTab = () => {
    const newTabId = Date.now().toString();
    const newTab = {
      id: newTabId,
      url: 'https://www.google.com',
      title: 'New Tab'
    };
    
    setTabs([...tabs, newTab]);
    setActiveTabId(newTabId);
    setInputUrl('https://www.google.com');
    
    if (isElectron && !fallbackMode) {
      window.electronAPI?.browserNavigate('https://www.google.com');
    }
  };

  const closeTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Find the index of the tab to close
    const tabIndex = tabs.findIndex(tab => tab.id === tabId);
    
    // Handle closing the last tab
    if (tabs.length === 1) {
      setTabs([]);
      return;
    }
    
    // Determine the new active tab ID if closing the active tab
    if (tabId === activeTabId) {
      // If closing the last tab, activate the previous one
      // Otherwise activate the next tab
      const newActiveIndex = tabIndex === tabs.length - 1 ? tabIndex - 1 : tabIndex + 1;
      setActiveTabId(tabs[newActiveIndex].id);
    }
    
    // Remove the tab
    setTabs(tabs.filter(tab => tab.id !== tabId));
  };

  const switchTab = (tabId: string) => {
    if (tabId === activeTabId) return;
    
    setActiveTabId(tabId);
    const tab = tabs.find(tab => tab.id === tabId);
    if (tab) {
      setInputUrl(tab.url);
      
      if (isElectron && !fallbackMode) {
        window.electronAPI?.browserNavigate(tab.url);
      }
    }
  };

  // Extract domain name for tab title
  const getTabTitle = (url: string) => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain || 'New Tab';
    } catch {
      return 'New Tab';
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Tabs bar */}
      <div className="flex items-center bg-white border-b">
        <div className="flex-1 flex overflow-x-auto">
          {tabs.map(tab => (
            <div
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              className={`flex items-center min-w-[140px] max-w-[240px] px-3 py-2 border-r cursor-pointer ${
                tab.id === activeTabId 
                  ? 'bg-white text-gray-900 font-medium' 
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="truncate flex-1">
                {getTabTitle(tab.url)}
              </div>
              <button
                onClick={(e) => closeTab(tab.id, e)}
                className="ml-2 p-1 rounded-full hover:bg-gray-200 text-gray-500"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
          
          {/* Plus button positioned right after the last tab */}
          <button
            onClick={addNewTab}
            className="p-2 mx-1 text-gray-700 hover:bg-gray-100 rounded flex-shrink-0"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* URL bar and navigation controls */}
      <div className="flex items-center p-2 bg-[#F7F5EF] border-b">
        <button 
          onClick={goBack} 
          disabled={!canGoBack || fallbackMode || noTabs}
          className={`p-2 rounded ${(!fallbackMode && canGoBack && !noTabs) ? 'text-gray-700 hover:bg-gray-200' : 'text-gray-400'}`}
        >
          ←
        </button>
        <button 
          onClick={goForward} 
          disabled={!canGoForward || fallbackMode || noTabs}
          className={`p-2 rounded ${(!fallbackMode && canGoForward && !noTabs) ? 'text-gray-700 hover:bg-gray-200' : 'text-gray-400'}`}
        >
          →
        </button>
        <button 
          onClick={reload} 
          disabled={fallbackMode || noTabs}
          className={`p-2 rounded ${(!fallbackMode && !noTabs) ? 'text-gray-700 hover:bg-gray-200' : 'text-gray-400'}`}
        >
          ↻
        </button>
        <form onSubmit={handleUrlSubmit} className="flex-1 ml-2">
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={(e) => {
              // Make sure deletion works
              if (e.key === 'Backspace' || e.key === 'Delete') {
                e.stopPropagation();
              }
            }}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Enter URL..."
            disabled={noTabs}
          />
        </form>
        {isLoading && !fallbackMode && !noTabs && (
          <div className="ml-2 text-green-600">Loading...</div>
        )}
      </div>
      
      {/* Content area */}
      {noTabs ? (
        <div className="flex-1 bg-white flex flex-col items-center justify-center">
          <div className="text-center max-w-md p-6 bg-gray-50 rounded-lg shadow-sm">
            <HomeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-gray-800 mb-2">No Open Tabs</h2>
            <p className="text-gray-600 mb-6">Open a new tab to start browsing.</p>
            <button
              onClick={addNewTab}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center mx-auto"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              New Tab
            </button>
          </div>
        </div>
      ) : fallbackMode ? (
        <div className="flex-1 bg-white">
          {tabs.map(tab => (
            <iframe 
              key={tab.id}
              src={tab.url} 
              className="w-full h-full border-0"
              title={`Browser Tab ${tab.id}`}
              style={{ 
                display: tab.id === activeTabId ? 'block' : 'none',
                height: 'calc(100vh - 130px)' 
              }}
            />
          ))}
        </div>
      ) : (
        /* The actual browser content is rendered by Electron in the main process */
        <div className="flex-1 bg-white" style={{ height: 'calc(100vh - 130px)' }}></div>
      )}
      
      {fallbackMode && !noTabs && (
        <div className="bg-yellow-100 text-yellow-800 p-2 text-sm">
          Running in browser preview mode. For full browser functionality, launch in Electron.
        </div>
      )}
    </div>
  );
};

export default ChromeBrowser;