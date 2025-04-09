import React, { useEffect } from "react";
import useClientStore, { initializeClientStore } from "./clientStore";
import ClientList from "./components/ClientList";
import UnifiedControls from "./components/UnifiedControls"

const App: React.FC = () => {
  const { initialized } = useClientStore();

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
    <div className="bg-zinc-950 min-h-screen flex flex-col p-4 sm:p-6 text-gray-200">
      <main className="flex-1 flex flex-col">
        <div className="w-full bg-zinc-900 rounded-xl p-6 shadow-2xl mb-6 border border-zinc-800">
          <h2 className="text-3xl font-bold mb-6 text-purple-400 tracking-tight">Connected Clients</h2>
          <ClientList />
        </div>
        <UnifiedControls />
      </main>
    </div>
  );
};

export default App;