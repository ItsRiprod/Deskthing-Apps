import React, { useState } from 'react'
import Sidebar from './Sidebar'
import CPUUsage from './CPUUsage'
import MEMUsage from './MEMUsage'

const Default: React.FC = () => {
    const [currentView, setCurrentView] = useState('cpu')
    return (
        <div className="bg-black flex w-screen h-screen">
            <Sidebar selectedTab={currentView} onTabChange={setCurrentView} />
            {currentView === 'cpu' && <CPUUsage />}
            {currentView === 'mem' && <MEMUsage />}
        </div>
    )
}

export default Default
