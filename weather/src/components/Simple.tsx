import { useEffect, useState } from "react";
import { WeatherData } from "../stores/weatherStore";
import WeatherIcon from "./WeatherIcon";
import { SettingsStore } from "../stores/settingsStore";

interface WeatherProps {
  weatherData: WeatherData | null;
}

const Simple = ({ weatherData }: WeatherProps) => {
  const [time, setTime] = useState(SettingsStore.getInstance().getTime())

  useEffect(() => {
    const handleTime = async (time: string) => {
      setTime(time)
    }

    const removeListener = SettingsStore.getInstance().onTime(handleTime)

    return () => {
      removeListener()
    }
  }, [])

  if (!weatherData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="font-HelveticaNeue w-full h-full bg-zinc-700 text-white p-24 text-7xl sm:text-9xl xl:text-[17rem] flex flex-col justify-between">
      <div className="flex justify-between w-full items-center">
        <div>
          <p>
          {Math.round(weatherData.current.temperature2m) + '°' + weatherData.tempUnit.toUpperCase()}
          </p>
          <p className="text-2xl sm:text-6xl xl:text-8xl">
            {time}
          </p>
          <p className="fixed bottom-3 right-3 italic text-xs sm:text-base xl:text-3xl">
            Last Updated {new Date(weatherData.current.time).toLocaleTimeString().replace(':00', '')}
          </p>
          </div>
          <div className="-my-16">
            <WeatherIcon weatherData={weatherData} iconSize={300} />

          </div>
      </div>
      <div className="text-xl sm:text-3xl xl:text-7xl font-thin flex w-full">
        <p>
        {Math.round(weatherData.daily.temperature2mMax[0]) + '° / ' + Math.round(weatherData.daily.temperature2mMin[0]) + '° '}
        Feels Like {Math.round(weatherData.current.apparentTemperature) + '°' + weatherData.tempUnit.toUpperCase()}
        {' | ' + Math.trunc(weatherData.daily.precipitationProbabilityMean[0]*100) + '%'}
        </p>
      </div>
    </div>
  );
};

export default Simple;
