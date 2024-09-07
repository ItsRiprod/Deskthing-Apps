import React, { useEffect, useState } from 'react'
import { WeatherStore } from './stores'
import { WeatherData } from './stores/weatherStore'
import Weather from './components/Weather'

const App: React.FC = () => {
    const weatherStore = WeatherStore
    const [weatherData, setWeatherData] = useState<WeatherData | null>(weatherStore.getWeatherData())

    useEffect(() => {
        const handleWeatherData = async (data: WeatherData | null) => {
            if (!data) {
                console.log('No weather data available')
                return
            }

            console.log('Weather data updated:', data)
            setWeatherData(data)
        }
        const removeListener = weatherStore.on(handleWeatherData)

        return () => {
            removeListener()
        }
    })

    return (
        <div className="bg-slate-800 w-screen h-screen flex justify-center items-center">
            <Weather weatherData={weatherData} />
        </div>

    )
}

export default App
