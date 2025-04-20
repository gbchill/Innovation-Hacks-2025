// src/pages/BrowserPage.tsx
import React from "react";
import ChromeBrowser from "../components/common/ChromeBrowser";

interface BrowserPageProps {
  sidebarWidth: number;
  sidebarCollapsed: boolean;
  isDarkMode: boolean;
}

const BrowserPage: React.FC<BrowserPageProps> = ({
  sidebarWidth,
  sidebarCollapsed,
  isDarkMode,
}) => {
  return (
    <div className="h-screen flex flex-col bg-[#F7F5EF]">
      <div className="flex-1">
        <ChromeBrowser
          initialUrl="https://www.google.com"
          sidebarWidth={sidebarWidth}
          sidebarCollapsed={sidebarCollapsed}
          isDarkMode={isDarkMode}
        />
      </div>
    </div>
  );
};

export default BrowserPage;
