import React, { useEffect, useState } from "react";
import Simple from "./components/Simple";
import { createDeskThing } from "@deskthing/client";
import { ToClientData, GenericTransitData, WeatherData, WeatherEvents } from "./types/weather";

const DeskThing = createDeskThing<ToClientData, GenericTransitData>()

const App: React.FC = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);

  useEffect(() => {
    let invalid = false
    
    const removeListener = DeskThing.on('weather_data', (data) => {
      if (invalid) return
      if (!data) {
        DeskThing.warn(`No weather data available`);
        return;
      }
      DeskThing.debug(`Weather data updated from callback`);
      setWeatherData(data.payload);
    });

    const fetchInitialData = async () => {
      const weatherData = await DeskThing.fetch({ type: WeatherEvents.GET, request: 'weather_data' }, { type: 'weather_data' });
      if (invalid) return
      if (!weatherData?.payload) {
        DeskThing.warn(`No weather data available`);
        return;
      }
      DeskThing.debug(`Weather data updated from fetch`);
      setWeatherData(weatherData.payload);
    }

    fetchInitialData()


    return () => {
      invalid = true
      removeListener();
    };
  }, []);

  return (
    <div className="bg-slate-800 w-screen h-screen flex justify-center items-center">
      <Simple weatherData={weatherData} />
    </div>
  );
};

export default App;
