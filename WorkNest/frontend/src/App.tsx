import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import WelcomeScreen from "./components/common/WelcomeScreen";
import BrowserPage from "./pages/BrowserPage";
import Calendar from "./pages/Calendar";
import Tasks from "./pages/Tasks";
import DeepWork from "./pages/DeepWork";

/* -------------  keep numbers in sync with Sidebar.tsx ------------- */
const SIDEBAR_EXPANDED = 192; // w-56 (14rem)
const SIDEBAR_COLLAPSED = 64; // w-20 (5rem) ←‑ wider rail

function App() {
  const [started, setStarted] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleColorScheme = () => setIsDarkMode((p) => !p);

  const sidebarWidth = sidebarCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;

  if (!started) {
    return <WelcomeScreen onGetStarted={() => setStarted(true)} />;
  }

  return (
    <Router>
      <div className="flex h-screen w-screen overflow-hidden">
        <Sidebar
          onToggle={setSidebarCollapsed}
          isDarkMode={isDarkMode}
          toggleColorScheme={toggleColorScheme}
        />

        <div className="flex-1 h-full">
          <Routes>
            <Route
              path="/"
              element={
                <BrowserPage
                  sidebarWidth={sidebarWidth}
                  sidebarCollapsed={sidebarCollapsed}
                  isDarkMode={isDarkMode}
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
