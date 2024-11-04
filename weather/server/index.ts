import { DeskThing as DK, SocketData } from "deskthing-server";
const DeskThing = DK.getInstance();
export { DeskThing }; // Required export of this exact name for the server to connect
import WeatherService from "./weather";

const start = async () => {
  const weather = WeatherService.getInstance();
  let Data = await DeskThing.getData();
  DeskThing.on("data", (newData) => {
    // Syncs the data with the server
    Data = newData;
    if (Data) {
      console.log("Data updating");
      weather.updateData(Data);
    }
  });

  // This is how to add settings (implementation may vary)
  if (!Data?.settings?.temp_unit || !Data?.settings?.speed_unit || !Data?.settings?.latitude || !Data?.settings?.longitude ) {
    setupSettings()
  }


  const handleGet = async (request: SocketData) => {
    if (request.request === "weather_data") {
      const weatherData = await weather.getWeather();
      if (weatherData) {
        DeskThing.sendDataToClient({type: "weather_data", payload: weatherData});
      } else {
        console.log("Error getting weather data");
      }
    }
  };
  
  DeskThing.on("get", handleGet);
  const stop = async () => {
    weather.stop()
  };
  DeskThing.on("stop", stop);
};

const setupSettings = async () => {
  const response = await fetch('http://ip-api.com/json/?fields=lat,lon');
  const { lat, lon } = await response.json();
  
  DeskThing.addSettings({
    temp_unit: {
      label: "Temperature Unit",
      value: "f",
      type: 'select',
      options: [
        { label: "Fahrenheit", value: "f" },
        { label: "Celsius", value: "c" },
      ],
    },
    speed_unit: {
      label: "Wind Speed Unit",
      value: "mph",
      type: 'select',
      options: [
        { label: "Miles Per Hour", value: "mph" },
        { label: "Kilometers Per Hour", value: "kmh" },
      ],
    },
    latitude: {
      label: "Latitude",
      value: lat,
      description: 'The latitude of the location you want to get weather data for. Can be found on google maps.',
      type: 'number',
      min: -180,
      max: 180,
    },
    longitude: {
      label: "Longitude",
      description: 'The longitude of the location you want to get weather data for. Can be found on google maps.',
      value: lon,
      type: 'number',
      min: -180,
      max: 180,
    }
  });
}

// Main Entrypoint of the server
DeskThing.on("start", start);