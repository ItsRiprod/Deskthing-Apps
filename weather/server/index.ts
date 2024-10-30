import { DeskThing as DK, SocketData } from "deskthing-server";
import axios from 'axios';
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

  // Template Items

  // This is how to add settings (implementation may vary)
  if (!Data?.settings?.temp_unit || !Data?.settings?.speed_unit || !Data?.settings?.view ) {
    DeskThing.addSettings({
      temp_unit: {
        label: "Temperature Unit",
        value: "f",
        type: 'select',
        description: 'The current temperature unit',
        options: [
          { label: "Fahrenheit", value: "f" },
          { label: "Celsius", value: "c" },
        ],
      },
      speed_unit: {
        label: "Wind Speed Unit",
        value: "mph",
        type: 'select',
        description: 'The current wind speed unit',
        options: [
          { label: "Miles Per Hour", value: "mph" },
          { label: "Kilometers Per Hour", value: "kmh" },
        ],
      },
      view: { label: "Weather View", type:'select', description:'The current type of view to display', value: 'simple', options: [{ label: 'Graph View', value: 'graph' }, { label: 'Retro View', value: 'retro' }, { label: 'Simple View', value: 'simple' }] }
    });

    DeskThing.addSettings({
    })

    // This will make Data.settings.theme.value equal whatever the user selects
  }

  // Getting data from the user (Ensure these match)
  if (!Data?.longitude || !Data?.latitude) {
    try {
      const response = await axios.get('http://ip-api.com/json/?fields=lat,lon');
      const { lat, lon } = response.data;
      
      DeskThing.saveData({
        latitude: lat.toString(),
        longitude: lon.toString()
      });
      
      DeskThing.sendLog("Location data fetched automatically!");
    } catch (error) {
      console.error("Error fetching location data:", error);
      
      const requestScopes = {
        latitude: {
          value: "40.709764",
          label: "Latitude",
          instructions:
          "The latitude of the location you want to get weather data for. Can be found on google maps.",
        },
        longitude: {
          value: "-74.023568",
          label: "Longitude",
          instructions:
            "The longitude of the location you want to get weather data for. Can be found on google maps.",
        },
      };

      DeskThing.getUserInput(requestScopes, async (data) => {
        if (data.payload.longitude && data.payload.latitude) {
          // You can either save the returned data to your data object or do something with it
          DeskThing.saveData(data.payload);
        } else {
          DeskThing.sendError(
            "Please fill out all the fields! Restart to try again"
          );
        }
      });
    }
  } else {
    DeskThing.sendLog("Data Exists!");
    // This will be called is the data already exists in the server
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


// Main Entrypoint of the server
DeskThing.on("start", start);