import React, { useState } from 'react'
import Sidebar from './components/Sidebar'
import CPUUsage from './components/CPUUsage'
import MEMUsage from './components/MEMUsage'

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState('cpu')
    return (
        <div className="bg-black flex w-screen h-screen">
            <Sidebar selectedTab={currentView} onTabChange={setCurrentView} />
            {currentView === 'cpu' && <CPUUsage />}
            {currentView === 'mem' && <MEMUsage />}
        </div>
    )
}

export default App