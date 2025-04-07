import React, { useEffect } from "react";
import useClientStore, { initializeClientStore, getCurrentClient } from "./clientStore";
import ClientList from "./components/ClientList";
import ScoreControls from "./components/ScoreControls";
import ColorPicker from "./components/ColorPicker";

const App: React.FC = () => {
  const { initialized, requestNewClient } = useClientStore();
  const currentClient = getCurrentClient();

  useEffect(() => {
    // Initialize the client store when the component mounts
    if (!initialized) {
      initializeClientStore();
    }
  }, [initialized]);

  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh * 100}px`)
    }

    setVh()
    window.addEventListener('resize', setVh)
    return () => window.removeEventListener('resize', setVh)
  }, [])

  return (
    <div className="bg-gray-900 w-screen h-screen flex flex-col p-6 text-white">

      <main className="flex-1 flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/3 bg-gray-800 rounded-lg p-4 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4 text-blue-300">Your Profile</h2>
          {initialized && currentClient ? (
            <>
              <ColorPicker />
              <ScoreControls />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-48">
              <button 
                onClick={requestNewClient}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Connect to Server
              </button>
              <p className="text-gray-400 mt-3">Connect to access customization options</p>
            </div>
          )}
        </div>

        <div className="w-full md:w-2/3 bg-gray-800 rounded-lg p-4 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4 text-blue-300">Connected Clients</h2>
          <ClientList />
        </div>
      </main>
    </div>
  );
};

export default App;