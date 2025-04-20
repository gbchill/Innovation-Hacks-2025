import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import WelcomeScreen from "./components/common/WelcomeScreen";
import BrowserPage from "./pages/BrowserPage";
import Calendar from "./pages/Calendar";
import Tasks from "./pages/Tasks";
import DeepWork from "./pages/DeepWork";
import FocusTimer from "./components/common/FocusTimer";
import AnimatedLoop from "./components/common/AnimatedLoop";

function App() {
  const [started, setStarted] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const sidebarWidth = 256; // 16rem or 256px for w-64

  // If app hasn't been started yet, show welcome screen
  if (!started) {
    return <WelcomeScreen onGetStarted={() => setStarted(true)} />;
  }

  const handleSidebarToggle = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
  };

  return (
    <Router>
      {/* Background animation tied to focus timer */}
      <AnimatedLoop show={timerActive} />
      
      <div className="flex h-screen w-screen overflow-hidden bg-[#F7F5EF] relative z-10">
        {/* Sidebar */}
        <div 
          className="z-20 h-full transition-all duration-300" 
          style={{ width: sidebarCollapsed ? '0' : `${sidebarWidth}px` }}
        >
          <Sidebar onToggle={handleSidebarToggle} />
        </div>
        
        {/* Main content area */}
        <div className="flex-1 overflow-hidden relative">
          {/* Top-right floating Focus Timer */}
          <div className="absolute top-4 right-4 z-30">
            <FocusTimer onTimerRunning={setTimerActive} />
          </div>
          
          {/* Routes */}
          <Routes>
            <Route 
              path="/" 
              element={
                <BrowserPage 
                  sidebarWidth={sidebarWidth} 
                  sidebarCollapsed={sidebarCollapsed} 
                />
              } 
            />
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