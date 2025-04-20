import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Logo from "/logo.png";
import {
  Bars3Icon,
  MoonIcon,
  SunIcon,
  NoSymbolIcon,
  ClockIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";

const menuItems = [
  { name: "Dashboard", path: "/" },
  { name: "Calendar", path: "/calendar" },
  { name: "Tasks", path: "/tasks" },
  { name: "Deep Work", path: "/deepwork" }
];

interface SidebarProps {
  onToggle?: (collapsed: boolean) => void;
  isDarkMode: boolean;
  toggleColorScheme: () => void;
}

function Sidebar({
  onToggle,
  isDarkMode,
  toggleColorScheme
}: SidebarProps) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [showBlockSitePopup, setShowBlockSitePopup] = useState(false);
  const [blockUrl, setBlockUrl] = useState("");

  const toggleSidebar = () => {
    const next = !collapsed;
    setCollapsed(next);
    onToggle?.(next);
  };

  const handleBlockSite = (e: React.FormEvent) => {
    e.preventDefault();
    // Here would go the functionality to actually block the site
    // For now, we'll just clear the input and close the popup
    setBlockUrl("");
    setShowBlockSitePopup(false);
  };

  useEffect(() => {
    onToggle?.(collapsed);
  }, []);

  /* utility: choose text color per state */
  const iconColor = collapsed ? "text-gray-700" : "text-[#1B3B29]";

  return (
    <div className="h-full z-30 relative">
      <div
        className={`
          bg-[#F7F5EF] h-full flex flex-col transition-all duration-500 ease-in-out
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
            className="p-1 rounded hover:bg-[#DAD5C4] transition"
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
              <h2 className="text-lg font-bold text-[#1B3B29]">WorkNest</h2>
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
            onClick={toggleColorScheme}
            className="p-2 rounded hover:bg-[#DAD5C4] transition"
            title={isDarkMode ? "Light mode" : "Dark mode"}
          >
            {isDarkMode ? (
              <SunIcon className={`h-6 w-6 ${iconColor}`} />
            ) : (
              <MoonIcon className={`h-6 w-6 ${iconColor}`} />
            )}
          </button>

          <button
            onClick={() => !collapsed && setShowBlockSitePopup(true)}
            className="p-2 rounded hover:bg-[#DAD5C4] transition"
            title="Block sites"
          >
            <NoSymbolIcon className={`h-6 w-6 ${iconColor}`} />
          </button>

          <button
            className="p-2 rounded hover:bg-[#DAD5C4] transition"
            title="Focus timer"
          >
            <ClockIcon className={`h-6 w-6 ${iconColor}`} />
          </button>
        </div>

        {/* nav menu */}
        <nav className="flex flex-col gap-3 mt-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const itemClasses = collapsed
              ? // mini‑sidebar: neutral look, no green block
                "justify-center text-gray-700 hover:bg-[#DAD5C4]"
              : isActive
              ? // expanded + active
                "bg-[#1B3B29] text-white shadow"
              : // expanded + inactive
                "text-[#3D3D3D] hover:bg-[#DAD5C4] hover:text-[#1B3B29]";

            return (
              <Link
                key={item.name}
                to={item.path}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-xl font-semibold transition-all
                  ${itemClasses}
                `}
              >
                {!collapsed && item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Block Site Popup - Only shown when sidebar is expanded */}
      {!collapsed && showBlockSitePopup && (
        <div className="absolute top-1/2 left-0 w-full transform -translate-y-1/2 px-4">
          <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-[#1B3B29] font-semibold text-sm">Block Website</h3>
              <button 
                onClick={() => setShowBlockSitePopup(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
            
            <form onSubmit={handleBlockSite}>
              <div className="mb-3">
                <label htmlFor="blockUrl" className="block text-xs text-gray-600 mb-1">
                  Enter URL to block:
                </label>
                <input
                  type="text"
                  id="blockUrl"
                  value={blockUrl}
                  onChange={(e) => setBlockUrl(e.target.value)}
                  placeholder="example.com"
                  className="w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-[#1B3B29] text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">
                  URLs will be blocked in all browser tabs
                </p>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#1B3B29] text-white text-xs rounded hover:bg-opacity-90 transition-colors"
                >
                  Block Site
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sidebar;