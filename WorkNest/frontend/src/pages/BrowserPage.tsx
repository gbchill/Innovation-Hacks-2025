import ChromeBrowser from '../components/common/ChromeBrowser';

interface BrowserPageProps {
  sidebarWidth?: number;
  sidebarCollapsed?: boolean;
}

const BrowserPage = ({ 
  sidebarWidth = 256, 
  sidebarCollapsed = false 
}: BrowserPageProps) => {
  return (
    <div className="h-screen flex flex-col bg-[#F7F5EF]">
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