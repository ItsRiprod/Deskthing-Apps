import React from "react";

const App: React.FC = () => {
  return (
    <div className="bg-black gap-4 flex-col w-screen h-screen flex justify-center items-center">
      <p className="font-bold text-5xl text-white">Test Agent App</p>

      <div className="text-center text-xl font-semibold text-gray-300 max-w-lg">
        <div>This is a working proof of concept.</div>
        <div className="mt-3 text-sm text-gray-400">
          Requires Lite Client and server version v0.11.18 to function.
        </div>

        <div className="mt-2 text-sm text-gray-400">
          Press "Open Voice" from the dashboard or press <span className="font-mono bg-white/5 px-2 rounded">M</span> to open it
        </div>
      </div>
    </div>
  );
};

export default App;
