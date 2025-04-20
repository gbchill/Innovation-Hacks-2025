import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Logo from "/logo.png";

const menuItems = [
  { name: "Dashboard", path: "/" },
  { name: "Calendar", path: "/calendar" },
  { name: "Tasks", path: "/tasks" },
  { name: "Deep Work", path: "/deepwork" },
];

interface SidebarProps {
  onToggle?: (collapsed: boolean) => void;
}

function Sidebar({ onToggle }: SidebarProps) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    const newCollapsedState = !collapsed;
    setCollapsed(newCollapsedState);
    if (onToggle) {
      onToggle(newCollapsedState);
    }
  };

  // Call onToggle on initial render to set correct initial state
  useEffect(() => {
    if (onToggle) {
      onToggle(collapsed);
    }
  }, []);

  return (
    <div className="relative h-full">
      {/* Sidebar */}
      <div
        className={`bg-[#F7F5EF] h-full shadow-md flex flex-col transition-all duration-500 ease-in-out ${
          collapsed ? "w-0 overflow-hidden" : "w-64 p-6"
        }`}
      >
        {!collapsed && (
          <>
            <div className="flex items-center gap-3 mb-10">
              <img src={Logo} alt="WorkNest Logo" className="w-12 h-12 rounded-full shadow-sm" />
              <h2 className="text-3xl font-bold text-[#1B3B29] tracking-wide">WorkNest</h2>
            </div>
            <nav className="flex flex-col gap-4">
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`text-left px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    location.pathname === item.path
                      ? "bg-[#1B3B29] text-white shadow-md"
                      : "text-[#3D3D3D] hover:bg-[#DAD5C4] hover:text-[#1B3B29]"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </>
        )}
      </div>
      {/* Tiny Tab Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="absolute top-6 -right-5 w-10 h-10 rounded-r-full bg-[#1B3B29] text-white flex items-center justify-center
         shadow-md hover:bg-[#145A32] active:scale-90 transition-all duration-300 z-20"
        title={collapsed ? "Open Sidebar" : "Close Sidebar"}
      >
        {collapsed ? "➔" : "←"}
      </button>
    </div>
  );
}

export default Sidebar;