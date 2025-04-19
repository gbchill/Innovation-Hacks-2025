import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import WelcomeScreen from "./components/common/WelcomeScreen";
import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import Tasks from "./pages/Tasks";
import DeepWork from "./pages/DeepWork";

function App() {
  const [started, setStarted] = useState(false);

  if (!started) {
    return <WelcomeScreen onGetStarted={() => setStarted(true)} />;
  }

  return (
    <Router>
      <div className="flex h-screen w-screen overflow-hidden bg-[#F7F5EF]">
        <Sidebar />
        <div className="flex-1 p-6 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
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
