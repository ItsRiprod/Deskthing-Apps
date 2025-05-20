import React, { useState } from 'react'
import Dashboard from './Dashboard'

const Default: React.FC = () => {
    const [currentView, setCurrentView] = useState('dash')
    return (
        <div className="bg-black flex w-screen h-screen">
            {currentView === 'dash' && <Dashboard />}
        </div>
    )
}

export default Default
