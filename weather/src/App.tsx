import React, { useEffect, useMemo, useState } from "react";
import Weather from "./components/Weather";
import Retro from "./components/Retro";
import Simple from "./components/Simple";
import { createDeskThing } from "@deskthing/client";
import {
    TemperatureTypes,
  ToClientData,
  GenericTransitData,
  ViewOptions,
  WeatherData,
  WeatherEvents,
} from "./types/types";

const DeskThing = createDeskThing<ToClientData, GenericTransitData>();

const App: React.FC = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>();
  const [currentView, setCurrentView] = useState<ViewOptions>(
    ViewOptions.SIMPLE
  );
  const [tempType, setTempType] = useState<TemperatureTypes>(TemperatureTypes.APPARENT_TEMPERATURE);

  useEffect(() => {
    let invalid = false;

    const removeWeatherListener = DeskThing.on("weather_data", (data) => {
      if (invalid) return;
      if (!data) {
        DeskThing.warn(`No weather data available`);
        return;
      }
      DeskThing.debug(`Weather data updated from callback`);
      console.log(data.payload)
      setWeatherData(data.payload);
    });

    const removeViewListener = DeskThing.on("view", (data) => {
      if (invalid) return;
      if (!data) {
        DeskThing.warn(`No weather data available`);
        return;
      }
      DeskThing.debug(`View data updated from callback`);
      setCurrentView(data.payload);
    });

    const removeTempTypeListener = DeskThing.on("temp_type", (data) => {
      if (invalid) return;
      if (!data) {
        DeskThing.warn(`No weather data available`);
        return;
      }
      DeskThing.debug(`Temp type updated from callback`);
      setTempType(data.payload);
    });

    const fetchInitialData = async () => {
      DeskThing.fetch(
        { type: WeatherEvents.GET, request: "weather_data" },
        { type: "weather_data" },
        (callback) => {
          if (invalid) return;
          if (!callback?.payload) {
            DeskThing.warn(`No weather data available`);
            return;
          }
          DeskThing.debug(`Weather data updated from fetch`);
          setWeatherData(callback.payload);
        }
      );
      DeskThing.fetch(
        { type: WeatherEvents.GET, request: "view" },
        { type: "view" },
        (socketData) => {
          if (invalid) return;
          if (!socketData?.payload) {
            DeskThing.warn(`No weather data available`);
            return;
          }
          DeskThing.debug(
            `View data updated from fetch ${JSON.stringify(socketData.payload)}`
          );
          setCurrentView(socketData.payload);
        }
      );
      DeskThing.fetch(
        { type: WeatherEvents.GET, request: "temp_type" },
        { type: "temp_type" },
        (callback) => {
          if (invalid) return;
          if (!callback?.payload) {
            DeskThing.warn(`No weather data available`);
            return;
          }
          DeskThing.debug(`Temp type updated from fetch`);
          setTempType(callback.payload);
        }
      );
    };

    fetchInitialData();

    return () => {
      invalid = true;
      removeWeatherListener();
      removeViewListener();
      removeTempTypeListener();
    };
  }, []);

  const CurrentViewElement = useMemo(() => {
    switch (currentView) {
      case ViewOptions.GRAPH:
        return Weather;
      case ViewOptions.RETRO:
        return Retro;
      case ViewOptions.SIMPLE:
        return Simple;
    }
  }, [currentView, weatherData]);

  return (
    <div className="bg-slate-800 w-screen h-screen flex justify-center items-center">
      {weatherData ? (
        CurrentViewElement ? (
          <CurrentViewElement weatherData={weatherData} tempType={tempType} />
        ) : (
          <div className="font-HelveticaNeue w-full h-full bg-zinc-700 text-white p-24 text-7xl flex justify-center items-center">
            Unknown View {currentView}
          </div>
        )
      ) : (
        <div className="font-HelveticaNeue w-full h-full bg-zinc-700 text-white p-24 text-7xl sm:text-7xl xl:text-[17rem] flex flex-col justify-between">
          <div className="flex justify-center items-center h-full">
            <div className="w-24 h-24 border-t-4 animate-spin rounded-full mr-2 border-4 border-transparent border-y-white" />
            <p>Loading Weather Data</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
