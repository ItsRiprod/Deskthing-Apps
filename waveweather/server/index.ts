import {
  AppSettings,
  DESKTHING_EVENTS,
  SETTING_TYPES,
} from "@deskthing/types";
import { createDeskThing } from "@deskthing/server";
import WeatherService from "./weather";
import { ToClientData, GenericTransitData, WeatherEvents } from "./types"

const DeskThing = createDeskThing<GenericTransitData, ToClientData>()


const start = async () => {
  await setupSettings();

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
  }
});

DeskThing.on(DESKTHING_EVENTS.SETTINGS, (settings) => {
  // Syncs the data with the server
  if (settings) {
    DeskThing.sendDebug("Settings updating");
    WeatherService.updateData(settings.payload);
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
      id: 'temp_unit',
      value: "f",
      type: SETTING_TYPES.SELECT,
      options: [
        { label: "Fahrenheit", value: "f" },
        { label: "Celsius", value: "c" },
      ],
    },
    speed_unit: {
      label: "Wind Speed Unit",
      id: 'speed_unit',
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
      id: 'latitude',
      value: latitude,
      description:
        "The latitude of the location you want to get weather data for. Can be found on google maps.",
      type: SETTING_TYPES.NUMBER,
      min: -180,
      max: 180,
    },
    longitude: {
      label: "Longitude",
      id: 'longitude',
      description:
        "The longitude of the location you want to get weather data for. Can be found on google maps.",
      value: longitude,
      type: SETTING_TYPES.NUMBER,
      min: -180,
      max: 180,
    },
  };

  await DeskThing.initSettings(settings);
};


const stop = async () => {
  WeatherService.stop();
};
DeskThing.on(DESKTHING_EVENTS.STOP, stop);


// Main Entrypoint of the server
DeskThing.on(DESKTHING_EVENTS.START, start);
