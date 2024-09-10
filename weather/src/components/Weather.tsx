import { useEffect, useState } from "react";
import { WeatherData } from "../stores/weatherStore";
import Graph from "./Graph";

interface WeatherProps {
  weatherData: WeatherData | null;
}

const Weather = ({ weatherData }: WeatherProps) => {
  const [selectedTimeIndex, setSelectedTimeIndex] = useState<number>(0);
  const [isManualSelection, setIsManualSelection] = useState<boolean>(false);

  useEffect(() => {
    if (!isManualSelection || !weatherData) return;

    const timer = setTimeout(() => {
      revertToLocalTime();
    }, 5000); // Revert back to local time after 10 seconds

    // Cleanup timeout on component unmount or when new selection is made
    return () => clearTimeout(timer);
  }, [selectedTimeIndex, isManualSelection]);

  const revertToLocalTime = () => {
    setIsManualSelection(false);
    if (!weatherData) return;

    const now = Date.now();
    const times = weatherData.hourly.time.map((t) => new Date(t).getTime());
    const closestIndex = times.findIndex((t) => t >= now);

    if (closestIndex === -1) {
      setSelectedTimeIndex(times.length - 1);
    } else {
      setSelectedTimeIndex(closestIndex);
    }
  };

  useEffect(() => {
    if (!weatherData) return;

    revertToLocalTime(); // Initialize to local time on mount or data change
  }, [weatherData]);

  // Get temperature for the selected time
  const getTemperatureForSelectedTime = () => {
    if (!weatherData) return null;
    
    return weatherData.hourly.temperature2m[selectedTimeIndex] || null;
  };

  const handleTimeSelect = (index: number) => {
    setSelectedTimeIndex(index);
    setIsManualSelection(true); // Mark as a manual selection to trigger the timer
  };

  const selectedTemperature = getTemperatureForSelectedTime();

  return (
    <div>
      <Graph weatherData={weatherData} onTimeSelect={handleTimeSelect} />
      <div className="absolute font-semibold rounded-xl shadow-lg bottom-1/3 left-16 bg-slate-500 p-3 text-4xl text-white">
        <p>
            {new Date(weatherData?.hourly.time[selectedTimeIndex] || Date.now()).toLocaleTimeString().replace(':00', '')}
        </p>
        <p>
            {selectedTemperature !== null ? `${Math.round(selectedTemperature)}°${weatherData?.tempUnit.toUpperCase()}` : 'N/A'}
        </p>
      </div>
    </div>
  );
};

export default Weather;
