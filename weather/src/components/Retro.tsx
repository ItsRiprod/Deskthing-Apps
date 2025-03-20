import { TemperatureTypes, WeatherData } from "../types/types"
import WeatherIcon from "./WeatherIcon";

interface WeatherProps {
  weatherData: WeatherData;
  tempType: TemperatureTypes;
}

const Retro = ({ weatherData }: WeatherProps) => {


  return (
    <div className="font-interstate w-full h-full text-4xl text-white font-semibold flex flex-col items-center bg-gradient-to-t from-orange-500 via-orange-900 to-orange-500">
        <div className="flex justify-between w-4/6 items-end">
          <p className="font-semibold text-yellow-300">Current<br /> Conditions</p>
          <div>{new Date(weatherData?.current.time || new Date()).toLocaleTimeString()}</div>
        </div>
        <div className="flex bg-blue-900 border-8 border-blue-700 w-5/6 h-4/6 p-2">
          <div className="w-full flex flex-col items-center">
            <p className="text-5xl">{Math.round(weatherData?.current.temperature2m || 0) + '°' + weatherData?.tempUnit.toUpperCase()}</p>
            <p className="text-base">{'Feels Like ' + Math.round(weatherData?.current.apparentTemperature || 0) + '°' + weatherData?.tempUnit.toUpperCase()}</p>
            <div className="-m-[50px]">
              <WeatherIcon weatherData={weatherData}  iconSize={200} />
            </div>
            <p>{(weatherData?.current.cloudCover || 0) > 50 ? 'Overcast' : 'Clear'}</p>
            <p>{'Wind: ' + Math.round(weatherData?.current.windDirection10m || 0) + '° ' + Math.round(weatherData?.current.windSpeed10m || 0) + ' ' + weatherData?.speedUnit}</p>
          </div>
          <div className="w-full">
            <p>Precipitation {weatherData?.current.precipitation}mm</p>
            <p>Rain {weatherData?.current.rain}mm</p>
          </div>
        </div>
    </div>
  );
};

export default Retro;
