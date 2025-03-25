import {
  AppSettings,
  DESKTHING_EVENTS,
  SETTING_TYPES,
} from "@deskthing/types";
import { createDeskThing } from "@deskthing/server";
import WeatherService from "./weather";
import { TemperatureTypes, ToClientData, GenericTransitData, ViewOptions, WeatherEvents } from "./types"

const DeskThing = createDeskThing<GenericTransitData, ToClientData>()


const start = async () => {
  setupSettings();

};


DeskThing.on(WeatherEvents.GET, async (request) => {
  if (request.request === "weather_data") {
    DeskThing.sendLog("Getting weather data");
    const weatherData = await WeatherService.getWeather();
    if (weatherData) {
      DeskThing.send({ type: "weather_data", payload: weatherData });
    } else {
      console.log("Error getting weather data");
    }
  } else if (request.request === "view") {
    const settings = await DeskThing.getSettings()
    if (settings?.view.type == SETTING_TYPES.SELECT) {
      DeskThing.send({ type: "view", payload: settings?.view.value as ViewOptions });
    }
  } else if (request.request === "temp_type") {
    const settings = await DeskThing.getSettings()
    if (settings?.temp_type.type == SETTING_TYPES.SELECT) {
      DeskThing.send({ type: "temp_type", payload: settings?.temp_type.value as TemperatureTypes });
    }
  }
});

DeskThing.on(DESKTHING_EVENTS.SETTINGS, (socketData) => {
  // Syncs the data with the server
  if (socketData) {
    DeskThing.sendDebug("Settings updating");
    WeatherService.updateData(socketData.payload);

    if (socketData?.payload.view.type == SETTING_TYPES.SELECT) {
      DeskThing.sendDebug(`View updated to ${socketData.payload.view.value}`);
      DeskThing.send({ type: "view", payload: socketData.payload.view.value as ViewOptions });
    }

    if (socketData?.payload.temp_type.type == SETTING_TYPES.SELECT) {
      DeskThing.sendDebug(`Temp type updated to ${socketData.payload.temp_type.value}`);
      DeskThing.send({ type: "temp_type", payload: socketData.payload.temp_type.value as TemperatureTypes });
    }
  }
});


const setupSettings = async () => {
  let latitude: number = 0, longitude: number = 0;
  
  try {

    const response = await fetch("http://ip-api.com/json/?fields=lat,lon");
    
    
    if (!response.ok) {
      throw new Error(response.statusText);
    } else {
      const { lat, lon } = await response.json();
      latitude = lat;
      longitude = lon;
      DeskThing.sendDebug(`Latitude: ${latitude}, Longitude: ${longitude}`);
    }
  } catch (error) {
    DeskThing.sendWarning("Error getting location: " + (error instanceof Error ? error.message : error));
  }

  const settings: AppSettings = {
    temp_unit: {
      label: "Temperature Unit",
      id: "temp_unit",
      value: "f",
      type: SETTING_TYPES.SELECT,
      options: [
        { label: "Fahrenheit", value: "f" },
        { label: "Celsius", value: "c" },
      ],
    },
    speed_unit: {
      label: "Wind Speed Unit",
      id: "speed_unit",
      value: "mph",
      placeholder: "mph",
      type: SETTING_TYPES.SELECT,
      options: [
        { label: "Miles Per Hour", value: "mph" },
        { label: "Kilometers Per Hour", value: "kmh" },
      ],
    },
    latitude: {
      label: "Latitude",
      id: "latitude",
      value: latitude,
      description:
        "The latitude of the location you want to get weather data for. Can be found on google maps.",
      type: SETTING_TYPES.NUMBER,
      min: -180,
      max: 180,
    },
    longitude: {
      label: "Longitude",
      id: "longitude",
      description:
        "The longitude of the location you want to get weather data for. Can be found on google maps.",
      value: longitude,
      type: SETTING_TYPES.NUMBER,
      min: -180,
      max: 180,
    },
    view: {
      label: "View",
      id: "view",
      description:
        "What the weather UI should be",
      value: ViewOptions.SIMPLE,
      type: SETTING_TYPES.SELECT,
      options: [
        { label: "Graph", value: ViewOptions.GRAPH },
        { label: "Retro", value: ViewOptions.RETRO },
        { label: "Simple", value: ViewOptions.SIMPLE },
      ]
    },
    temp_type: {
      label: "Temperature Type",
      id: "temp_type",
      description:
        "The type of temperature to display",
      value: "apparentTemperature",
      type: SETTING_TYPES.SELECT,
      options: [
        { label: "Apparent Temperature", value: TemperatureTypes.APPARENT_TEMPERATURE },
        { label: "Actual Temperature", value: TemperatureTypes.TEMPERATURE_2M },
      ]
    },
  };


  DeskThing.initSettings(settings);
};


const stop = async () => {
  WeatherService.stop();
};
DeskThing.on(DESKTHING_EVENTS.STOP, stop);


// Main Entrypoint of the server
DeskThing.on(DESKTHING_EVENTS.START, start);
