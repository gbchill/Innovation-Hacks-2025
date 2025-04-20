import { useState } from "react";
import FocusTimer from "./components/common/FocusTimer";
import AnimatedLoop from "./components/common/AnimatedLoop";

function App() {
  const [timerActive, setTimerActive] = useState(false);

  return (
    <div className="min-h-screen bg-pastel relative overflow-hidden">
      {/* Background animation (no blur/dim) */}
      <AnimatedLoop show={timerActive} />

      {/* Top-right focus timer */}
      <div className="absolute top-4 right-4 z-20">
        <FocusTimer onTimerRunning={setTimerActive} />
      </div>

      {/* Centered title */}
      <div className="flex items-center justify-center h-screen z-10 relative">
        <h1 className="text-5xl font-bold text-forest text-center drop-shadow-xl">
          WorkNest is Ready!
        </h1>
      </div>
    </div>
  );
}

export default App;
