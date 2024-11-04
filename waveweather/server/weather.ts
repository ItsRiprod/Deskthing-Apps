import { fetchWeatherApi } from 'openmeteo'
import * as weatherUtils from './weatherUtils'
import { DeskThing } from './index'
import { DataInterface } from 'deskthing-server'

type WeatherData = {
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

class WeatherService {
    private weatherData: WeatherData
    private lastUpdateTime: Date | null
    private updateTaskId: (() => void) | null = null
    private deskthing: typeof DeskThing
    private static instance: WeatherService | null = null
    private speed_unit: string = 'mph'
    private temp_unit: string = 'f'
    private longitude: string = '-74.023568'
    private latitude: string = '40.709764'

    constructor() {
        this.deskthing = DeskThing
        this.updateWeather()
        this.scheduleHourlyUpdates()
    }

    static getInstance(): WeatherService {
        if (!WeatherService.instance) {
            WeatherService.instance = new WeatherService()
        }
        return WeatherService.instance
    }

    private async updateWeather() {
        console.log('Updating weather data...')
        const params = {
            "latitude": this.latitude || '40.709764',
            "longitude": this.longitude || '-74.023568',
            "hourly": ["temperature_2m", "relative_humidity_2m", "dew_point_2m", "apparent_temperature", "precipitation_probability", "precipitation", "rain", "showers", "snowfall", "snow_depth", "cloud_cover", "visibility", "wind_speed_10m", "wind_direction_10m", "uv_index"],
            "current": ["temperature_2m", "relative_humidity_2m", "apparent_temperature", "is_day", "precipitation", "rain", "cloud_cover", "wind_speed_10m", "wind_direction_10m", "wind_gusts_10m"],
            "daily": ["temperature_2m_max", "temperature_2m_min", "precipitation_probability_mean"],
            "temperature_unit": this.temp_unit == 'f' ? "fahrenheit" : "celsius",
            "wind_speed_unit": this.speed_unit == 'mph' ? "mph" : "kmh",
            "timeformat": "unixtime",
	        "forecast_days": 1,
            "models": "best_match",
        };
        const url = weatherUtils.url
        this.deskthing.sendLog(`Fetching weather data from OpenMeteo API with params: ${JSON.stringify(params)}`)
        const responses = await fetchWeatherApi(url, params)

        const response = responses[0]
        const timezone = response.timezone();
        const timezoneAbbreviation = response.timezoneAbbreviation();
        const hourly = response.hourly()!
        const current = response.current()!;
        const daily = response.daily()!;
        const utcOffsetSeconds = response.utcOffsetSeconds();

        this.deskthing.sendLog(`Weather data received from OpenMeteo API.`)


        this.weatherData = {
            hourly: {
                time: weatherUtils.range(Number(hourly.time()), Number(hourly.timeEnd()), hourly.interval()).map(
                    (t) => new Date((t + response.utcOffsetSeconds()) * 1000)
                ),
                temperature2m: hourly.variables(0)!.valuesArray()!,
                relativeHumidity2m: hourly.variables(1)!.valuesArray()!,
                dewPoint2m: hourly.variables(2)!.valuesArray()!,
                apparentTemperature: hourly.variables(3)!.valuesArray()!,
                precipitationProbability: hourly.variables(4)!.valuesArray()!,
                precipitation: hourly.variables(5)!.valuesArray()!,
                rain: hourly.variables(6)!.valuesArray()!,
                showers: hourly.variables(7)!.valuesArray()!,
                snowfall: hourly.variables(8)!.valuesArray()!,
                snowDepth: hourly.variables(9)!.valuesArray()!,
                cloudCover: hourly.variables(10)!.valuesArray()!,
                visibility: hourly.variables(11)!.valuesArray()!,
                windSpeed10m: hourly.variables(12)!.valuesArray()!,
                windDirection10m: hourly.variables(13)!.valuesArray()!,
                uvIndex: hourly.variables(14)!.valuesArray()!,
            },
            current: {
                time: new Date((Number(current.time()) + utcOffsetSeconds) * 1000),
                temperature2m: current.variables(0)!.value(),
                relativeHumidity2m: current.variables(1)!.value(),
                apparentTemperature: current.variables(2)!.value(),
                isDay: current.variables(3)!.value(),
                precipitation: current.variables(4)!.value(),
                rain: current.variables(5)!.value(),
                cloudCover: current.variables(6)!.value(),
                windSpeed10m: current.variables(7)!.value(),
                windDirection10m: current.variables(8)!.value(),
                windGusts10m: current.variables(9)!.value(),
            },
            daily: {
                time: weatherUtils.range(Number(daily.time()), Number(daily.timeEnd()), daily.interval()).map(
                    (t) => new Date((t + utcOffsetSeconds) * 1000)
                ),
                temperature2mMax: daily.variables(0)!.valuesArray()!,
                temperature2mMin: daily.variables(1)!.valuesArray()!,
                precipitationProbabilityMean: daily.variables(2)!.valuesArray()!,
            },
            tempUnit: this.temp_unit,
            speedUnit: this.speed_unit,
            longitude: this.longitude,
            latitude: this.latitude,
        }

        this.lastUpdateTime = new Date()

        this.deskthing.sendLog('Weather updated')
        this.deskthing.sendDataToClient({type: 'weather_data', payload: this.weatherData})
    }

    private scheduleHourlyUpdates() {
        if (this.updateTaskId) {
            this.updateTaskId()
        }
        this.updateTaskId = DeskThing.addBackgroundTaskLoop(async () => {
            this.updateWeather()
            await this.sleep(15 * 60 * 1000)
        }) // Update every hour
    }

    private sleep(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms))
    }

    public updateData(data: DataInterface) {
        if (!data.settings) {
            this.deskthing.sendLog('No settings defined')
            return
        }
        try {
            this.deskthing.sendLog('Updating settings')
            console.log('Updating weather data to', data)
            this.speed_unit = data.settings.speed_unit.value as string || 'mph'
            this.temp_unit = data.settings.temp_unit.value as string || 'f'
            this.longitude = data.settings.longitude.value as string || '-74.023568'
            this.latitude = data.settings.latitude.value as string || '40.709764'
    
            console.log('Updated weather data', this.speed_unit, this.temp_unit, this.longitude, this.latitude)
            this.updateWeather()
        } catch (error) {
            this.deskthing.sendLog('Error updating weather data: ' + error)
        }
    }

    async stop() {
        this.lastUpdateTime = null
    }

    public async getWeather(): Promise<WeatherData>  {
        // If it's been more than an hour since the last update, update the weather data
        if (!this.lastUpdateTime || new Date().getTime() - this.lastUpdateTime.getTime() > 15 * 60 * 1000) {
            DeskThing.sendLog('Fetching weather data...')
            await this.updateWeather()
        }
        DeskThing.sendLog('Returning weather data')
        return this.weatherData
    }
}

export default WeatherService