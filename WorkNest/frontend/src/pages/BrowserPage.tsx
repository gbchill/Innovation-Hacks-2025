// src/pages/BrowserPage.tsx
import React from "react";
import ChromeBrowser from "../components/common/ChromeBrowser";

interface BrowserPageProps {
  sidebarWidth: number;
  sidebarCollapsed: boolean;
}

const BrowserPage: React.FC<BrowserPageProps> = ({
  sidebarWidth,
  sidebarCollapsed,
}) => {
  return (
    <div className="h-screen flex flex-col bg-[#181414]">
      <div className="flex-1">
        <ChromeBrowser
          initialUrl="https://www.google.com"
          sidebarWidth={sidebarWidth}
          sidebarCollapsed={sidebarCollapsed}
        />
      </div>
    </div>
  );
};

export default BrowserPage;