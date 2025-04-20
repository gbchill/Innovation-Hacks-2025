import { useState, useEffect } from "react";
import {
  PlusIcon,
  XMarkIcon,
  HomeIcon
} from "@heroicons/react/24/outline";

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
  sidebarWidth: number;              // ← always the exact pixel width
  sidebarCollapsed: boolean;         // kept for parent‑child consistency
  isDarkMode: boolean;
}

interface Tab {
  id: string;
  url: string;
  title: string;
}

const ChromeBrowser: React.FC<ChromeBrowserProps> = ({
  initialUrl = "https://www.google.com",
  sidebarWidth,
  sidebarCollapsed, // eslint-disable-line @typescript-eslint/no-unused-vars
  isDarkMode
}) => {
  /* ---------- tab + nav state ---------- */
  const [tabs, setTabs] = useState<Tab[]>([
    { id: "1", url: initialUrl, title: "Google" }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>("1");
  const [inputUrl, setInputUrl] = useState(initialUrl);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isElectron, setIsElectron] = useState(false);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [noTabs, setNoTabs] = useState(false);

  /* -------------- IMPORTANT LINE -------------- */
  const actualSidebarWidth = sidebarWidth; // ← use whatever the parent sends
  /* -------------------------------------------- */

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  /* ---------- environment checks ---------- */
  useEffect(() => {
    const runningElectron = window.electronAPI !== undefined;
    setIsElectron(runningElectron);
    if (!runningElectron) setFallbackMode(true);
  }, []);

  /* ---------- tabs existence ---------- */
  useEffect(() => {
    if (tabs.length === 0) {
      setNoTabs(true);
      if (isElectron && !fallbackMode) window.electronAPI?.removeBrowserView();
    } else {
      setNoTabs(false);
    }
  }, [tabs.length, isElectron, fallbackMode]);

  /* ---------- electron listeners ---------- */
  useEffect(() => {
    if (!isElectron || fallbackMode || noTabs) return;

    window.electronAPI?.onBrowserViewCreated((id) =>
      console.log("BrowserView ID:", id)
    );

    window.electronAPI?.onCurrentUrl((url) => {
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTabId ? { ...t, url } : t))
      );
      setInputUrl(url);
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
      setInputUrl(state.currentUrl);
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
      isDarkMode ? "dark" : "light"
    );

    const navPoll = setInterval(() => {
      window.electronAPI?.getNavigationState();
    }, 500);

    return () => {
      clearInterval(navPoll);
      window.electronAPI?.removeAllListeners();
      if (!noTabs) window.electronAPI?.removeBrowserView();
    };
  }, [activeTabId, actualSidebarWidth, isElectron, noTabs, isDarkMode]);

  /* ---------- update bounds whenever width changes ---------- */
  useEffect(() => {
    if (!isElectron || fallbackMode || noTabs) return;
    window.electronAPI?.updateBrowserViewBounds(actualSidebarWidth);
  }, [actualSidebarWidth, isElectron, noTabs]);

  /* ---------- apply color‑scheme change ---------- */
  useEffect(() => {
    if (isElectron && !fallbackMode && !noTabs)
      window.electronAPI?.setColorScheme(isDarkMode ? "dark" : "light");
    if (fallbackMode && !noTabs) setTabs((prev) => [...prev]);
  }, [isDarkMode, isElectron, fallbackMode, noTabs]);

  /* ---------- navigation handlers ---------- */
  const urlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let url = inputUrl;
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, url } : t))
    );
    if (isElectron && !fallbackMode && !noTabs)
      window.electronAPI?.browserNavigate(url);
  };
  const goBack = () =>
    isElectron && !fallbackMode && !noTabs
      ? window.electronAPI?.browserGoBack()
      : null;
  const goForward = () =>
    isElectron && !fallbackMode && !noTabs
      ? window.electronAPI?.browserGoForward()
      : null;
  const reload = () =>
    isElectron && !fallbackMode && !noTabs
      ? window.electronAPI?.browserReload()
      : null;

  /* ---------- tab helpers ---------- */
  const addNewTab = () => {
    const id = Date.now().toString();
    const newTab = { id, url: "https://www.google.com", title: "New Tab" };
    setTabs([...tabs, newTab]);
    setActiveTabId(id);
    setInputUrl(newTab.url);
    if (isElectron && !fallbackMode)
      window.electronAPI?.browserNavigate(newTab.url);
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
    if (t && isElectron && !fallbackMode)
      window.electronAPI?.browserNavigate(t.url);
  };

  const getTabTitle = (url: string) => {
    try {
      return new URL(url).hostname.replace("www.", "") || "New Tab";
    } catch {
      return "New Tab";
    }
  };

  /* ---------- render ---------- */
  return (
    <div className="w-full h-full flex flex-col bg-[#F7F5EF]">
      {/* Tabs bar */}
      <div className="flex items-center bg-[#F7F5EF] border-b">
        <div className="flex-1 flex overflow-x-auto">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              className={`flex items-center min-w-[140px] max-w-[240px] px-3 py-2 border-r cursor-pointer ${
                tab.id === activeTabId
                  ? "bg-[#F7F5EF] text-gray-900 font-medium"
                  : "bg-[#F7F5EF] text-gray-700 hover:bg-gray-100"
              }`}
            >
              <div className="truncate flex-1 text-black">
                {tab.title || getTabTitle(tab.url)}
              </div>
              <button
                onClick={(e) => closeTab(tab.id, e)}
                className="ml-2 p-1 rounded-full hover:bg-gray-200 text-gray-500"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            onClick={addNewTab}
            className="p-2 mx-1 text-gray-700 hover:bg-gray-100 rounded flex-shrink-0"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* URL + nav */}
      <div className="flex items-center p-2 bg-[#F7F5EF] border-b">
        <button
          onClick={goBack}
          disabled={!canGoBack || fallbackMode || noTabs}
          className={`p-2 rounded ${
            canGoBack && !fallbackMode && !noTabs
              ? "text-gray-700 hover:bg-gray-200"
              : "text-gray-400"
          }`}
        >
          ←
        </button>
        <button
          onClick={goForward}
          disabled={!canGoForward || fallbackMode || noTabs}
          className={`p-2 rounded ${
            canGoForward && !fallbackMode && !noTabs
              ? "text-gray-700 hover:bg-gray-200"
              : "text-gray-400"
          }`}
        >
          →
        </button>
        <button
          onClick={reload}
          disabled={fallbackMode || noTabs}
          className={`p-2 rounded ${
            !fallbackMode && !noTabs
              ? "text-gray-700 hover:bg-gray-200"
              : "text-gray-400"
          }`}
        >
          ↻
        </button>

        <form onSubmit={urlSubmit} className="flex-1 ml-2">
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Backspace" || e.key === "Delete")
                e.stopPropagation();
            }}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#1B3B29] text-black"
            placeholder="Enter URL…"
            disabled={noTabs}
          />
        </form>
        {isLoading && !fallbackMode && !noTabs && (
          <div className="ml-2 text-gray-600">Loading…</div>
        )}
      </div>

      {/* Content */}
      {noTabs ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#F7F5EF]">
          <div className="text-center max-w-md p-6 bg-gray-50 rounded-lg shadow-sm">
            <HomeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-gray-800 mb-2">
              No Open Tabs
            </h2>
            <p className="text-gray-600 mb-6">
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
        <div className="flex-1 bg-[#F7F5EF]">
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
          className="flex-1 bg-[#F7F5EF]"
          style={{ height: "calc(100vh - 130px)" }}
        />
      )}

      {fallbackMode && !noTabs && (
        <div className="bg-yellow-100 text-yellow-800 p-2 text-sm">
          Running in browser preview mode. For full functionality, launch the
          Electron build.
        </div>
      )}
    </div>
  );
};

export default ChromeBrowser;
