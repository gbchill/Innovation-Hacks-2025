import { useState, useEffect, useRef } from "react";
import { ClockIcon, XMarkIcon } from "@heroicons/react/24/outline";

export default function FocusTimer({ onTimerRunning }: { onTimerRunning: (val: boolean) => void }) {
  const [showPopup, setShowPopup] = useState(false);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(1500);
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

  const togglePopup = () => setShowPopup(!showPopup);

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
    setShowPopup(false);
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

  return (
    <div className="relative">
      <button
        onClick={() => {
          togglePopup();
          setClickedButton("clock");
        }}
        className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors duration-300 shadow-md ${
          clickedButton === "clock" ? "bg-forest text-white" : "bg-green-200 text-forest hover:bg-forest hover:text-white"
        }`}
      >
        <ClockIcon className="w-6 h-6 transition-colors duration-300" />
      </button>

      {showPopup && (
        <div className="absolute right-0 mt-2 p-4 bg-white rounded-lg shadow-lg w-72 border text-forest z-20">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-bold">Set Timer</h2>
            <button onClick={togglePopup} className="text-forest hover:text-green-800">
              <XMarkIcon className="w-5 h-5 transition-colors duration-300" />
            </button>
          </div>

          <div className="flex gap-4 mb-4">
            <div>
              <label className="text-sm">Hours</label>
              <input
                type="number"
                className="w-16 border rounded p-1"
                value={hours}
                min="0"
                max="5"
                onChange={(e) => setHours(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-sm">Minutes</label>
              <input
                type="number"
                className="w-16 border rounded p-1"
                value={minutes}
                min="0"
                max="59"
                onChange={(e) => setMinutes(Number(e.target.value))}
              />
            </div>
          </div>

          <button
            onClick={handleStart}
            className={`w-full py-2 rounded shadow-md transition-colors duration-300 ${
              clickedButton === "start" ? "bg-forest text-white" : "bg-green-200 text-forest hover:bg-forest hover:text-white"
            }`}
          >
            Start
          </button>
        </div>
      )}

      {(isRunning || isPaused) && (
        <div className="absolute right-0 top-20 mt-4 p-4 bg-white rounded-xl shadow-lg w-72 border text-center z-10">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-forest">Focus Timer</h3>
            <button onClick={togglePopup} className="text-forest hover:text-green-800">
              <XMarkIcon className="w-5 h-5 transition-colors duration-300" />
            </button>
          </div>

          <div className="text-4xl font-mono text-forest mb-4">
            {formatTime(timeLeft)}
          </div>

          <div className="flex justify-center gap-3">
            {isRunning && (
              <button
                onClick={handlePause}
                className={`px-4 py-2 rounded transition-colors duration-300 ${
                  clickedButton === "pause" ? "bg-forest text-white" : "bg-green-200 text-forest hover:bg-forest hover:text-white"
                }`}
              >
                Pause
              </button>
            )}
            {isPaused && (
              <button
                onClick={handleResume}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                Resume
              </button>
            )}
            <button
              onClick={handleReset}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
            >
              Reset
            </button>
          </div>

          {pauseWait && (
            <p className="text-sm text-red-600 mt-2">🧘 Hold on... pausing</p>
          )}
        </div>
      )}
    </div>
  );
}