import React, { useEffect, useState } from 'react'
import { WeatherStore } from './stores'
import { WeatherData } from './stores/weatherStore'
import Weather from './components/Weather'
import { SettingsStore } from './stores/settingsStore'
import { Settings } from 'deskthing-client'
import Retro from './components/Retro'
import Simple from './components/Simple'

const App: React.FC = () => {
    const weatherStore = WeatherStore
    const [weatherData, setWeatherData] = useState<WeatherData | null>(weatherStore.getWeatherData())
    const settingsStore = SettingsStore.getInstance()
    const [currentView, setCurrentview] = useState('simple')

    useEffect(() => {
        const onSettings = async (data: Settings) => {
            console.log('Received data from the server!')
            console.log(data)
            if (data.weather.view.value) {
                const currentView = data.weather.view.value
                setCurrentview(currentView as string)
            }
        }
        const handleWeatherData = async (data: WeatherData | null) => {
            if (!data) {
                console.log('No weather data available')
                return
            }

            console.log('Weather data updated:', data)
            setWeatherData(data)
        }
        
        const listener = settingsStore.on(onSettings)
        const removeListener = weatherStore.on(handleWeatherData)


        // Get the settings initially (if available)
        const getSettings = async () => {
            const settings = settingsStore.getSettings()
            if (settings) {
                if (settings.weather.view.value) {
                    const currentView = settings.weather.view.value
                    setCurrentview(currentView as string)
                }
            } else {
                console.log('Attempted to get settings too quick - none found')
                await new Promise((resolve) => setTimeout(resolve, 1000))
                const settings = settingsStore.getSettings()
                if (settings) {
                    if (settings.weather.view.value) {
                        const currentView = settings.weather.view.value
                        setCurrentview(currentView as string)
    
                        }
                }
            }
        }

        getSettings()

        return () => {
            listener()
            removeListener()
        }

    }, [])

    const renderView = () => {
        switch (currentView) {
            case 'graph':
                return <Weather weatherData={weatherData} />
            case 'retro':
                return <Retro weatherData={weatherData} />
            case 'simple':
                return <Simple weatherData={weatherData} />
            default:
                return <div className="text-white">Unknown View</div>
        }
    }

    return (
        <div className="bg-slate-800 w-screen h-screen flex justify-center items-center">
            {renderView()}
        </div>

    )
}

export default App
