
import { DeskThing } from 'deskthing-client';
import { SocketData } from 'deskthing-server';

export type WeatherData = {
    hourly: {
      time: Date[] | string[];
      temperature2m: {[key: number]: number} | Float32Array;
      relativeHumidity2m: {[key: number]: number} | Float32Array;
      dewPoint2m: {[key: number]: number} | Float32Array;
      apparentTemperature: {[key: number]: number} | Float32Array;
      precipitationProbability: {[key: number]: number} | Float32Array;
      precipitation: {[key: number]: number} | Float32Array;
      rain: {[key: number]: number} | Float32Array;
      showers: {[key: number]: number} | Float32Array;
      snowfall: {[key: number]: number} | Float32Array;
      snowDepth: {[key: number]: number} | Float32Array;
      cloudCover: {[key: number]: number} | Float32Array;
      visibility: {[key: number]: number} | Float32Array;
      windSpeed10m: {[key: number]: number} | Float32Array;
      windDirection10m: {[key: number]: number} | Float32Array;
      uvIndex: {[key: number]: number} | Float32Array;
    };
    current: {
      time: string;
      temperature2m: number;
      relativeHumidity2m: number;
      apparentTemperature: number;
      isDay: number;
      precipitation: number;
      rain: number;
      cloudCover: number;
      windSpeed10m: number;
      windDirection10m: number;
      windGusts10m: number;
    };
    daily: {
      time: string[];
      temperature2mMax: {[key: number]: number} | Float32Array;
      temperature2mMin: {[key: number]: number} | Float32Array;
      precipitationProbabilityMean: {[key: number]: number} | Float32Array;
    };
    tempUnit: string
    speedUnit: string
    longitude: string
    latitude: string
  };
type WeatherListener = (weatherData: WeatherData | null) => void;

export class WeatherStore {
  private static instance: WeatherStore | null = null;
  private weatherData: WeatherData | null = null
  private deskThing: DeskThing;
  private listeners: WeatherListener[] = []

  constructor() {
    this.deskThing = DeskThing.getInstance();
    this.deskThing.on('weather_data', (data: SocketData) => {
      this.weatherData = data.payload as WeatherData;
      this.notifyListeners();
    });

    this.requestWeatherData()
  }

  static getInstance(): WeatherStore {
    if (!WeatherStore.instance) {
      WeatherStore.instance = new WeatherStore();
    }
    return WeatherStore.instance;
  }

  on(listener: WeatherListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }
  getWeatherData(): WeatherData | null {
    if (!this.weatherData) {
      this.requestWeatherData()
    }
    return this.weatherData;
  }

  private notifyListeners() {
    if (!this.weatherData) {
      this.getWeatherData()
    }
    this.deskThing.send({ app: 'client', type: 'log', payload: 'getting weatherData' });
    console.log('notifyListeners')
    this.listeners.forEach((listener) => listener(this.weatherData));
  }
  async requestWeatherData(): Promise<void> {
    this.deskThing.send({ type: 'get', request: 'weather_data'});
  }



}

export default WeatherStore.getInstance();
