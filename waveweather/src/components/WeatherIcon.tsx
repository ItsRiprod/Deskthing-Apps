import React from 'react';
import { WeatherData } from '../types/weather';
import { IconWeather } from '../assets/Icons';

interface WeatherIconProps {
  weatherData: WeatherData | null;
  iconSize?: number;
}

const WeatherIcon: React.FC<WeatherIconProps> = ({ weatherData, iconSize = 24 }) => {
  if (!weatherData || !weatherData.current) {
    return null;
  }

  const { cloudCover, isDay, precipitation } = weatherData.current;

  const getWeatherType = () => {
    if (precipitation > 0) {
      const rainyLevel = Math.min(Math.ceil(precipitation / 10), 7);
      return `rainy-${rainyLevel}`;
    } else if (cloudCover > 50) {
      return 'cloudy';
    } else {
      return isDay ? 'day' : 'night';
    }
  };

  return (
    <div className="weather-icon">
      <IconWeather type={getWeatherType()} iconSize={iconSize} />
    </div>
  );
};

export default WeatherIcon;