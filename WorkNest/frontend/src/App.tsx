// src/App.tsx
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Sidebar from "./components/layout/Sidebar";
import WelcomeScreen from "./components/common/WelcomeScreen";
import BrowserPage from "./pages/BrowserPage";
import Calendar from "./pages/Calendar";
import Tasks from "./pages/Tasks";
import DeepWork from "./pages/DeepWork";
import AnimatedLoop from "./components/common/AnimatedLoop";

/* -------------  keep numbers in sync with Sidebar.tsx ------------- */
const SIDEBAR_EXPANDED = 192; // w-56 (14rem)
const SIDEBAR_COLLAPSED = 64; // w-20 (5rem) ←‑ wider rail

function App() {
  const [started, setStarted] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [timerActive, setTimerActive] = useState(false);

  const handleSidebarToggle = (collapsed: boolean) =>
    setSidebarCollapsed(collapsed);
  
  const handleTimerRunning = (isRunning: boolean) => {
    setTimerActive(isRunning);
  };

  const sidebarWidth = sidebarCollapsed
    ? SIDEBAR_COLLAPSED
    : SIDEBAR_EXPANDED;

  if (!started) {
    return <WelcomeScreen onGetStarted={() => setStarted(true)} />;
  }

  return (
    <Router>
      {/* Background animation tied to focus timer */}
      <AnimatedLoop show={timerActive} />

      <div className="flex h-screen w-screen overflow-hidden bg-[#181414]">
        {/* Sidebar */}
        <div
          className="z-20 h-full overflow-hidden transition-all duration-300"
          style={{ width: sidebarWidth }}
        >
          <Sidebar
            onToggle={handleSidebarToggle}
            onTimerRunning={handleTimerRunning}
          />
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-hidden relative">
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
            <Route
              path="/deepwork"
              element={
                <DeepWork
                  onScheduleDeepWork={(start, end) =>
                    console.log("Scheduled Deep Work:", start, end)
                  }
                />
              }
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;