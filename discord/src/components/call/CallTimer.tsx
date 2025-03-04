import React, { useState, useEffect } from 'react';

interface CallTimerProps {
  startTime: number;
}

const CallTimer: React.FC<CallTimerProps> = ({ startTime }) => {
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const elapsedTimeInSeconds = Math.floor((currentTime - startTime) / 1000);
  const minutes = Math.floor(elapsedTimeInSeconds / 60);
  const seconds = elapsedTimeInSeconds % 60;

  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <span>{formattedTime}</span>
  );
};

export default CallTimer;
