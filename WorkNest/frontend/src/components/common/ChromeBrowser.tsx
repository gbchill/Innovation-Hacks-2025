// src/components/common/ChromeBrowser.tsx
import { useState, useEffect } from "react";
import {
  PlusIcon,
  XMarkIcon,
  HomeIcon,
  NoSymbolIcon
} from "@heroicons/react/24/outline";
import { getBlockedWebsites } from "../../services/sitesSupabase";

declare global {
  interface Window {
    electronAPI?: {
      createBrowserView: (
        url?: string,
        sidebarWidth?: number,
        preferredColorScheme?: string
      ) => void;
      removeBrowserView: () => void;
      browserGoBack: () => void;
      browserGoForward: () => void;
      browserReload: () => void;
      browserNavigate: (url: string) => void;
      getCurrentUrl: () => void;
      getNavigationState: () => void;
      updateBrowserViewBounds: (sidebarWidth: number) => void;
      setColorScheme: (scheme: string) => void;
      onBrowserViewCreated: (callback: (id: number) => void) => void;
      onCurrentUrl: (callback: (url: string) => void) => void;
      onNavigationState: (callback: (state: NavigationState) => void) => void;
      onPageTitleUpdated: (callback: (title: string) => void) => void;
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
  sidebarWidth: number;
  sidebarCollapsed: boolean;
  isDarkMode?: boolean;  // Made optional since we're removing light mode
}

interface Tab {
  id: string;
  url: string;
  title: string;
}

const ChromeBrowser: React.FC<ChromeBrowserProps> = ({
  initialUrl = "https://www.google.com",
  sidebarWidth,
  sidebarCollapsed
}) => {
  /* ---------- tab + nav state ---------- */
  const [tabs, setTabs] = useState<Tab[]>([
    { id: "1", url: initialUrl, title: "Google" }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>("1");
  const [inputUrl, setInputUrl] = useState(initialUrl);
  const [isEditingInput, setIsEditingInput] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isElectron, setIsElectron] = useState(false);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [noTabs, setNoTabs] = useState(false);
  
  // Blocking state
  const [blockedSites, setBlockedSites] = useState<string[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);

  const actualSidebarWidth = sidebarWidth;
  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  // Fetch blocked sites on mount
  useEffect(() => {
    async function fetchBlockedSites() {
      try {
        const sites = await getBlockedWebsites();
        setBlockedSites(sites.map(site => site.url));
      } catch (error) {
        console.error("Failed to fetch blocked websites:", error);
      }
    }
    
    fetchBlockedSites();
  }, []);

  // Check if current URL is blocked
  useEffect(() => {
    if (!activeTab || blockedSites.length === 0) return;
    
    try {
      const currentUrl = new URL(activeTab.url);
      const currentHost = currentUrl.hostname;
      
      // Check if any blocked site matches the current host
      const isCurrentSiteBlocked = blockedSites.some(site => {
        try {
          const blockedUrl = new URL(site.startsWith('http') ? site : `https://${site}`);
          return blockedUrl.hostname === currentHost;
        } catch (e) {
          // If URL parsing fails, try a simple includes check
          return currentHost.includes(site) || site.includes(currentHost);
        }
      });
      
      if (isCurrentSiteBlocked) {
        // Block site by showing block screen
        setIsBlocked(true);
        
        // Remove the browser view (immediately stops audio, etc.)
        if (isElectron && !fallbackMode) {
          window.electronAPI?.removeBrowserView();
        }
      }
    } catch (error) {
      console.error("Error checking blocked status:", error);
    }
  }, [activeTab?.url, blockedSites, isElectron, fallbackMode]);

  /* ---------- environment checks ---------- */
  useEffect(() => {
    const runningElectron = window.electronAPI !== undefined;
    setIsElectron(runningElectron);
    if (!runningElectron) setFallbackMode(true);
  }, []);

  /* ---------- tabs existence ---------- */
  useEffect(() => {
    if (tabs.length === 0 && !isBlocked) {
      setNoTabs(true);
      if (isElectron && !fallbackMode) window.electronAPI?.removeBrowserView();
    } else {
      setNoTabs(false);
    }
  }, [tabs.length, isBlocked, isElectron, fallbackMode]);

  /* ---------- electron listeners ---------- */
  useEffect(() => {
    if (!isElectron || fallbackMode || noTabs || isBlocked) return;

    window.electronAPI?.onBrowserViewCreated((id) =>
      console.log("BrowserView ID:", id)
    );

    window.electronAPI?.onCurrentUrl((url) => {
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTabId ? { ...t, url } : t))
      );
      if (!isEditingInput) setInputUrl(url);
    });

    window.electronAPI?.onNavigationState((state) => {
      setCanGoBack(state.canGoBack);
      setCanGoForward(state.canGoForward);
      setIsLoading(state.isLoading);
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId ? { ...t, url: state.currentUrl } : t
        )
      );
      if (!isEditingInput) setInputUrl(state.currentUrl);
    });

    window.electronAPI?.onPageTitleUpdated((title) => {
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId
            ? { ...t, title: title || getTabTitle(t.url) }
            : t
        )
      );
    });

    window.electronAPI?.createBrowserView(
      activeTab.url,
      actualSidebarWidth,
      "dark" // Always use dark mode
    );

    const navPoll = setInterval(() => {
      window.electronAPI?.getNavigationState();
    }, 500);

    return () => {
      clearInterval(navPoll);
      window.electronAPI?.removeAllListeners();
      if (!noTabs) window.electronAPI?.removeBrowserView();
    };
  }, [activeTabId, actualSidebarWidth, isElectron, noTabs, isEditingInput, isBlocked]);

  /* ---------- update bounds whenever width changes ---------- */
  useEffect(() => {
    if (!isElectron || fallbackMode || noTabs || isBlocked) return;
    window.electronAPI?.updateBrowserViewBounds(actualSidebarWidth);
  }, [actualSidebarWidth, isElectron, noTabs, isBlocked]);

  /* ---------- always use dark mode ---------- */
  useEffect(() => {
    if (isElectron && !fallbackMode && !noTabs && !isBlocked)
      window.electronAPI?.setColorScheme("dark");
    if (fallbackMode && !noTabs && !isBlocked) setTabs((prev) => [...prev]);
  }, [isElectron, fallbackMode, noTabs, isBlocked]);

  /* ---------- navigation handlers ---------- */
  const urlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let url = inputUrl;
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, url } : t))
    );
    if (isElectron && !fallbackMode && !noTabs && !isBlocked)
      window.electronAPI?.browserNavigate(url);
  };
  
  const goBack = () =>
    isElectron && !fallbackMode && !noTabs && !isBlocked
      ? window.electronAPI?.browserGoBack()
      : null;
      
  const goForward = () =>
    isElectron && !fallbackMode && !noTabs && !isBlocked
      ? window.electronAPI?.browserGoForward()
      : null;
      
  const reload = () =>
    isElectron && !fallbackMode && !noTabs && !isBlocked
      ? window.electronAPI?.browserReload()
      : null;

  /* ---------- tab helpers ---------- */
  const addNewTab = () => {
    // Reset block state when adding a new tab
    setIsBlocked(false);
    
    // Clear any existing tabs when coming from blocked state
    if (isBlocked) {
      setTabs([]);
    }
    
    const id = Date.now().toString();
    const newTab = { id, url: "https://www.google.com", title: "New Tab" };
    setTabs(prev => isBlocked ? [newTab] : [...prev, newTab]);
    setActiveTabId(id);
    setInputUrl(newTab.url);
    
    if (isElectron && !fallbackMode) {
      window.electronAPI?.browserNavigate(newTab.url);
    }
  };
  
  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = tabs.findIndex((t) => t.id === id);
    if (tabs.length === 1) {
      setTabs([]);
      return;
    }
    if (id === activeTabId) {
      const newIdx = idx === tabs.length - 1 ? idx - 1 : idx + 1;
      setActiveTabId(tabs[newIdx].id);
      if (isElectron && !fallbackMode)
        window.electronAPI?.browserNavigate(tabs[newIdx].url);
    }
    setTabs(tabs.filter((t) => t.id !== id));
  };
  
  const switchTab = (id: string) => {
    if (id === activeTabId) return;
    setActiveTabId(id);
    const t = tabs.find((x) => x.id === id);
    if (t && isElectron && !fallbackMode && !isBlocked)
      window.electronAPI?.browserNavigate(t.url);
  };

  const getTabTitle = (url: string) => {
    try {
      return new URL(url).hostname.replace("www.", "") || "New Tab";
    } catch {
      return "New Tab";
    }
  };

  // Render blocked screen
  if (isBlocked) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#181414]">
        <div className="text-center max-w-md p-6 bg-[#242424] rounded-lg shadow-lg">
          <NoSymbolIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">
            This Site is Blocked
          </h2>
          <p className="text-gray-300 mb-6">
            This website has been blocked in your focus settings.
          </p>
          <button
            onClick={addNewTab}
            className="px-6 py-3 bg-[#1B3B29] text-white rounded-lg shadow hover:bg-[#152b1f] transition-colors flex items-center mx-auto"
          >
            <PlusIcon className="h-5 w-5 mr-2" /> Open New Tab
          </button>
        </div>
      </div>
    );
  }

  /* ---------- render ---------- */
  return (
    <div className="w-full h-full flex flex-col bg-[#181414]">
      {/* Tabs bar */}
      <div className="flex items-center bg-[#181414] border-b border-gray-700">
        <div className="flex-1 flex overflow-x-auto">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              className={`flex items-center min-w-[140px] max-w-[240px] px-3 py-2 border-r border-gray-700 cursor-pointer ${
                tab.id === activeTabId
                  ? "bg-[#242424] text-white font-medium"
                  : "bg-[#181414] text-gray-300 hover:bg-[#242424]"
              }`}
            >
              <div className="truncate flex-1 text-white">
                {tab.title || getTabTitle(tab.url)}
              </div>
              <button
                onClick={(e) => closeTab(tab.id, e)}
                className="ml-2 p-1 rounded-full hover:bg-gray-700 text-gray-400"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            onClick={addNewTab}
            className="p-2 mx-1 text-gray-300 hover:bg-[#242424] rounded flex-shrink-0"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* URL + nav */}
      <div className="flex items-center p-2 bg-[#181414] border-b border-gray-700">
        <button
          onClick={goBack}
          disabled={!canGoBack || fallbackMode || noTabs}
          className={`p-2 rounded ${
            canGoBack && !fallbackMode && !noTabs
              ? "text-white hover:bg-[#242424]"
              : "text-gray-600"
          }`}
        >
          ←
        </button>
        <button
          onClick={goForward}
          disabled={!canGoForward || fallbackMode || noTabs}
          className={`p-2 rounded ${
            canGoForward && !fallbackMode && !noTabs
              ? "text-white hover:bg-[#242424]"
              : "text-gray-600"
          }`}
        >
          →
        </button>
        <button
          onClick={reload}
          disabled={fallbackMode || noTabs}
          className={`p-2 rounded ${
            !fallbackMode && !noTabs
              ? "text-white hover:bg-[#242424]"
              : "text-gray-600"
          }`}
        >
          ↻
        </button>

        <form onSubmit={urlSubmit} className="flex-1 ml-2">
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onFocus={() => setIsEditingInput(true)}
            onBlur={() => setIsEditingInput(false)}
            onKeyDown={(e) => {
              if (e.key === "Backspace" || e.key === "Delete")
                e.stopPropagation();
            }}
            className="w-full px-3 py-2 border border-gray-700 rounded bg-[#242424] focus:outline-none focus:ring-2 focus:ring-[#1B3B29] text-white"
            placeholder="Enter URL…"
            disabled={noTabs}
          />
        </form>
        {isLoading && !fallbackMode && !noTabs && (
          <div className="ml-2 text-gray-300">Loading…</div>
        )}
      </div>

      {/* Content */}
      {noTabs ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#181414]">
          <div className="text-center max-w-md p-6 bg-[#242424] rounded-lg shadow-sm">
            <HomeIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-white mb-2">
              No Open Tabs
            </h2>
            <p className="text-gray-300 mb-6">
              Open a new tab to start browsing.
            </p>
            <button
              onClick={addNewTab}
              className="px-4 py-2 bg-[#1B3B29] text-white rounded hover:opacity-90 transition-colors flex items-center mx-auto"
            >
              <PlusIcon className="h-4 w-4 mr-2" /> New Tab
            </button>
          </div>
        </div>
      ) : fallbackMode ? (
        <div className="flex-1 bg-[#181414]">
          {tabs.map((tab) => (
            <iframe
              key={tab.id}
              src={tab.url}
              className="w-full h-full border-0"
              title={`Browser Tab ${tab.id}`}
              style={{
                display: tab.id === activeTabId ? "block" : "none",
                height: "calc(100vh - 130px)"
              }}
            />
          ))}
        </div>
      ) : (
        <div
          className="flex-1 bg-[#181414]"
          style={{ height: "calc(100vh - 130px)" }}
        />
      )}

      {fallbackMode && !noTabs && (
        <div className="bg-yellow-900 text-yellow-200 p-2 text-sm">
          Running in browser preview mode. For full functionality, launch the
          Electron build.
        </div>
      )}
    </div>
  );
};

export default ChromeBrowser;