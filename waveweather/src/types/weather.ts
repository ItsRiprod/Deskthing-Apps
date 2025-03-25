
export type WeatherData = {
    hourly: {
      time: Date[];
      temperature2m: number[] | Float32Array;
      relativeHumidity2m: number[] | Float32Array;
      dewPoint2m: number[] | Float32Array;
      apparentTemperature: number[] | Float32Array;
      precipitationProbability: number[] | Float32Array;
      precipitation: number[] | Float32Array;
      rain: number[] | Float32Array;
      showers: number[] | Float32Array;
      snowfall: number[] | Float32Array;
      snowDepth: number[] | Float32Array;
      cloudCover: number[] | Float32Array;
      visibility: number[] | Float32Array;
      windSpeed10m: number[] | Float32Array;
      windDirection10m: number[] | Float32Array;
      uvIndex: number[] | Float32Array;
    };
    current: {
        time: Date;
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
        time: Date[];
        temperature2mMax: number[] | Float32Array;
        temperature2mMin: number[] | Float32Array;
        precipitationProbabilityMean: number[] | Float32Array;
      };
    tempUnit: string
    speedUnit: string
    longitude: string
    latitude: string
  };

export enum WeatherEvents {
    GET = 'get',
  }
  
  export type ToClientData = {
      type: 'weather_data',
      payload: WeatherData
  }
  
  export type GenericTransitData = {
      type: WeatherEvents.GET,
      request: 'weather_data',
      payload?: string
  }