import React, { useEffect } from "react";
import { DeskThing } from "deskthing-client";
import { SocketData } from "deskthing-client/dist/types";
import { Call } from "./components/Call";
import Controls from "./components/Controls";
import ErrorBoundary from "./components/ErrorBoundary";

const App: React.FC = () => {
  const deskthing = DeskThing.getInstance();

  useEffect(() => {
    const onAppData = async (data: SocketData) => {
      console.log("Received data from the server!");
      console.log(data);
    };
    const removeListener = deskthing.on("discord", onAppData);

    return () => {
      removeListener();
    };
  });

  return (
    <div className="bg-slate-800 w-screen h-screen flex-col flex justify-center items-center">
      <ErrorBoundary>
        <Call />
        <Controls />
      </ErrorBoundary>
    </div>
  );
};

export default App;
