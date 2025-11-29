
import React, { useState, useEffect } from 'react';

type TimerProps = {
  duration: number;
  onTimeout: () => void;
};

const Timer = ({ duration, onTimeout }: TimerProps) => {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeout();
      return;
    }

    const intervalId = setInterval(() => {
      setTimeLeft(prevTime => prevTime - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timeLeft, onTimeout]);
  
  const percentage = (timeLeft / duration) * 100;
  const colorClass = timeLeft <= 10 ? 'bg-red-500' : timeLeft <= 20 ? 'bg-yellow-500' : 'bg-cyan-500';


  return (
    <div className="w-24">
        <div className="flex justify-center items-baseline text-sm">
            <span className={`font-bold ${timeLeft <= 10 ? 'text-red-400' : 'text-slate-300'}`}>{timeLeft}s</span>
            <span className="text-slate-500 ml-1">left</span>
        </div>
      <div className="w-full bg-slate-700 rounded-full h-1 mt-1">
        <div 
          className={`h-1 rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default Timer;
