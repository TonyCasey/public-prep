import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface TimerProps {
  initialTime?: number; // in seconds (0 for count-up timer)
  isPaused?: boolean;
  onTimeChange?: (time: number) => void;
  className?: string;
  countUp?: boolean; // Enable count-up functionality
}

export default function Timer({ initialTime = 0, isPaused = false, onTimeChange, className, countUp = false }: TimerProps) {
  const [time, setTime] = useState(initialTime);

  useEffect(() => {
    setTime(initialTime);
  }, [initialTime]);

  useEffect(() => {
    if (isPaused || (!countUp && time <= 0)) return;

    const interval = setInterval(() => {
      setTime((prev) => {
        const newTime = countUp ? prev + 1 : Math.max(0, prev - 1);
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, time, countUp]);

  // Handle onTimeChange callback separately to avoid setState in render
  useEffect(() => {
    onTimeChange?.(time);
  }, [time, onTimeChange]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (countUp) {
      if (time > 120) return "text-red-600"; // Over 2 minutes - red
      return "text-accent"; // Under 2 minutes - normal
    } else {
      if (time <= 60) return "text-red-600"; // Last minute - red
      if (time <= 120) return "text-orange-600"; // Last 2 minutes - orange
      return "text-accent"; // Normal - accent color
    }
  };

  return (
    <div className={`flex items-center space-x-2 bg-accent/10 px-3 py-2 rounded-lg ${className}`}>
      <Clock className={`w-4 h-4 ${getTimerColor()}`} />
      <span className={`font-mono ${getTimerColor()}`}>
        {formatTime(time)}
      </span>
      {countUp && time > 120 && (
        <span className="text-xs text-red-600 animate-pulse">
          Over recommended
        </span>
      )}
    </div>
  );
}
