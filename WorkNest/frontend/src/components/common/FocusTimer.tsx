// src/components/common/FocusTimer.tsx
import { useState, useEffect, useRef } from "react";
import { ClockIcon, XMarkIcon } from "@heroicons/react/24/outline";

export default function FocusTimer({ onTimerRunning }: { onTimerRunning: (val: boolean) => void }) {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pauseWait, setPauseWait] = useState(false);
  const [clickedButton, setClickedButton] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const startCountdown = () => {
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setIsRunning(false);
          setIsPaused(false);
          onTimerRunning(false);
          alert("🎉 Time's up!");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleStart = () => {
    const totalSecs = hours * 3600 + minutes * 60;
    if (totalSecs === 0) return alert("⛔ Choose a real time!");

    setClickedButton("start");
    setTimeLeft(totalSecs);
    setIsRunning(true);
    setIsPaused(false);
    onTimerRunning(true);
    startCountdown();
  };

  const handlePause = () => {
    if (pauseWait) {
      alert("⛔ Be patient. You clicked too early.");
      return;
    }

    setClickedButton("pause");
    setPauseWait(true);
    setTimeout(() => {
      clearInterval(intervalRef.current!);
      intervalRef.current = null;
      setIsRunning(false);
      setIsPaused(true);
      setPauseWait(false);
      onTimerRunning(false);
    }, 5000);
  };

  const handleResume = () => {
    setClickedButton(null);
    setIsPaused(false);
    setIsRunning(true);
    onTimerRunning(true);
    startCountdown();
  };

  const handleReset = () => {
    setClickedButton(null);
    clearInterval(intervalRef.current!);
    intervalRef.current = null;
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(0);
    setHours(0);
    setMinutes(25);
    onTimerRunning(false);
  };

  useEffect(() => {
    return () => clearInterval(intervalRef.current!);
  }, []);

  // Timer setup UI - only shown when not running or paused
  if (!isRunning && !isPaused) {
    return (
      <div className="w-full bg-white rounded-lg shadow-sm p-4">
        <div className="mb-4">
          <h2 className="text-center font-medium text-[#1B3B29] mb-3">Set Timer</h2>
          
          <div className="flex gap-4 mb-4 justify-center">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Hours</label>
              <input
                type="number"
                className="w-16 border rounded p-2 text-center"
                value={hours}
                min="0"
                max="5"
                onChange={(e) => setHours(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Minutes</label>
              <input
                type="number"
                className="w-16 border rounded p-2 text-center"
                value={minutes}
                min="0"
                max="59"
                onChange={(e) => setMinutes(Number(e.target.value))}
              />
            </div>
          </div>

          <button
            onClick={handleStart}
            className="w-full py-2 rounded-lg bg-[#1B3B29] text-white hover:bg-opacity-90 transition-all flex items-center justify-center"
          >
            <ClockIcon className="w-5 h-5 mr-2" />
            Start Focus Timer
          </button>
        </div>
      </div>
    );
  }

  // Active timer UI
  return (
    <div className="w-full bg-white rounded-lg shadow-sm p-4">
      <div className="text-center mb-4">
        <div className="text-3xl font-mono text-[#1B3B29] font-bold mb-2">
          {formatTime(timeLeft)}
        </div>

        <div className="flex justify-center gap-3">
          {isRunning && (
            <button
              onClick={handlePause}
              className={`px-4 py-2 rounded-lg transition-colors ${
                clickedButton === "pause" 
                  ? "bg-[#1B3B29] text-white" 
                  : "bg-green-100 text-[#1B3B29] hover:bg-[#1B3B29] hover:text-white"
              }`}
            >
              Pause
            </button>
          )}
          {isPaused && (
            <button
              onClick={handleResume}
              className="bg-[#1B3B29] text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition"
            >
              Resume
            </button>
          )}
          <button
            onClick={handleReset}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
          >
            Reset
          </button>
        </div>

        {pauseWait && (
          <p className="text-sm text-red-600 mt-3">🧘 Hold on... pausing</p>
        )}
      </div>
    </div>
  );
}