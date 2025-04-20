// src/components/layout/Sidebar.tsx
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Logo from "/logo.png";
import {
  Bars3Icon,
  NoSymbolIcon,
  ClockIcon,
  XMarkIcon,
  HomeIcon,
  CalendarIcon,
  ClipboardDocumentCheckIcon,
  LightBulbIcon
} from "@heroicons/react/24/outline";
import FocusTimer from "../common/FocusTimer";

const menuItems = [
  { name: "Dashboard", path: "/", icon: HomeIcon },
  { name: "Calendar", path: "/calendar", icon: CalendarIcon },
  { name: "Tasks", path: "/tasks", icon: ClipboardDocumentCheckIcon },
  { name: "Deep Work", path: "/deepwork", icon: LightBulbIcon }
];

interface SidebarProps {
  onToggle?: (collapsed: boolean) => void;
  onTimerRunning: (isRunning: boolean) => void;
}

function Sidebar({
  onToggle,
  onTimerRunning
}: SidebarProps) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [showBlockSitePopup, setShowBlockSitePopup] = useState(false);
  const [blockUrl, setBlockUrl] = useState("");
  const [showFocusTimer, setShowFocusTimer] = useState(false);

  const toggleSidebar = () => {
    const next = !collapsed;
    setCollapsed(next);
    onToggle?.(next);
  };

  const toggleFocusTimer = () => {
    setShowFocusTimer(!showFocusTimer);
    if (showBlockSitePopup) {
      setShowBlockSitePopup(false);
    }
  };

  const handleBlockSite = (e: React.FormEvent) => {
    e.preventDefault();
    setBlockUrl("");
    setShowBlockSitePopup(false);
  };

  useEffect(() => {
    onToggle?.(collapsed);
  }, []);

  // default icon color
  const iconColor = "text-white";

  return (
    <div className="h-full relative">
      <div
        className={`
          bg-[#181414] h-full flex flex-col transition-all duration-500 ease-in-out
          ${collapsed ? "w-16 p-2" : "w-48 p-4"}
        `}
        style={{
          boxShadow: "inset -4px 0 8px -2px rgba(0,0,0,0.18)"
        }}
      >
        {/* burger + logo row */}
        <div
          className={`
            flex items-center ${collapsed ? "justify-center" : "justify-between"}
            mb-6
          `}
        >
          <button
            onClick={toggleSidebar}
            className="p-1 rounded hover:bg-[#242424] transition"
            title={collapsed ? "Expand" : "Collapse"}
          >
            <Bars3Icon className={`h-6 w-6 ${iconColor}`} />
          </button>

          {!collapsed && (
            <div className="flex items-center gap-2">
              <img
                src={Logo}
                className="w-8 h-8 rounded-full shadow-sm"
                alt="WorkNest Logo"
              />
              <h2 className="text-lg font-bold text-white">WorkNest</h2>
            </div>
          )}
        </div>

        {/* icon strip */}
        <div
          className={`
            ${collapsed
              ? "flex flex-col gap-5 items-center"
              : "flex justify-center gap-6 mb-6 px-2"}
          `}
        >
          <button
            onClick={() => !collapsed && setShowBlockSitePopup(true)}
            className="p-2 rounded hover:bg-[#242424] transition"
            title="Block sites"
          >
            <NoSymbolIcon className={`h-6 w-6 ${iconColor}`} />
          </button>

          <button
            onClick={toggleFocusTimer}
            className="p-2 rounded hover:bg-[#242424] transition"
            title="Focus timer"
          >
            <ClockIcon className={`h-6 w-6 ${iconColor}`} />
          </button>
        </div>

        {/* Horizontal divider */}
        <div className={`${collapsed ? "mx-1 my-3" : "mx-2 my-3"}`}>
          <div className="border-t border-gray-700"></div>
        </div>

        {/* nav menu */}
        <nav className="flex flex-col gap-3 mt-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const ItemIcon = item.icon;

            // always white by default
            const iconColorForNav = isActive ? "text-white" : "text-white";

            // if hovered (bg-[#242424]), force text back to dark
            const hoverTextDark = "hover:text-white";

            // collapsed vs expanded, active vs inactive
            const itemClasses = collapsed
              ? isActive
                ? "justify-center bg-[#1B3B29] text-white shadow"
                : `justify-center text-white hover:bg-[#242424] ${hoverTextDark}`
              : isActive
              ? "bg-[#1B3B29] text-white shadow"
              : `text-white hover:bg-[#242424] ${hoverTextDark}`;

            return (
              <Link
                key={item.name}
                to={item.path}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-xl font-semibold transition-all
                  ${itemClasses}
                `}
                title={item.name}
              >
                {collapsed ? (
                  <ItemIcon className={`h-6 w-6 ${iconColorForNav}`} />
                ) : (
                  item.name
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Focus Timer Popup */}
      {!collapsed && showFocusTimer && (
        <div className="absolute inset-0 bg-[#181414] p-4 z-40">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-white text-lg">Focus Timer</h3>
            <button
              onClick={toggleFocusTimer}
              className="text-gray-400 hover:text-white p-1"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-2">
            <FocusTimer onTimerRunning={onTimerRunning} />
          </div>
        </div>
      )}

      {/* Block Site Popup */}
      {!collapsed && showBlockSitePopup && (
        <div className="absolute inset-0 bg-[#181414] p-4 z-40">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-white text-lg">Block Website</h3>
            <button
              onClick={() => setShowBlockSitePopup(false)}
              className="text-gray-400 hover:text-white p-1"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleBlockSite}>
            <div className="mb-4">
              <label htmlFor="blockUrl" className="block text-white mb-2">
                Enter URL to block:
              </label>
              <input
                type="text"
                id="blockUrl"
                value={blockUrl}
                onChange={(e) => setBlockUrl(e.target.value)}
                placeholder="example.com"
                className="w-full px-3 py-2 text-sm border border-gray-700 rounded-lg bg-[#242424] focus:outline-none focus:ring-2 focus:ring-[#1B3B29] text-white"
              />
              <p className="text-xs text-gray-400 mt-2">
                URLs will be blocked in all browser tabs
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-[#1B3B29] text-white text-sm rounded-lg hover:bg-opacity-90 transition-colors"
              >
                Block Site
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default Sidebar;