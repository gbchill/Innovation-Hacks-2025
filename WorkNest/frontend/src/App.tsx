import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import WelcomeScreen from "./components/common/WelcomeScreen";
import BrowserPage from "./pages/BrowserPage";
import Calendar from "./pages/Calendar";
import Tasks from "./pages/Tasks";
import DeepWork from "./pages/DeepWork";

function App() {
  const [started, setStarted] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const sidebarWidth = 256; // 16rem or 256px for w-64

  if (!started) {
    return <WelcomeScreen onGetStarted={() => setStarted(true)} />;
  }

  const handleSidebarToggle = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
  };

  return (
    <Router>
      <div className="flex h-screen w-screen overflow-hidden bg-[#F7F5EF]">
        <div className="z-10 h-full" style={{ width: sidebarCollapsed ? '0' : `${sidebarWidth}px` }}>
          <Sidebar onToggle={handleSidebarToggle} />
        </div>
        <div className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<BrowserPage sidebarWidth={sidebarWidth} sidebarCollapsed={sidebarCollapsed} />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/deepwork" element={<DeepWork />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;