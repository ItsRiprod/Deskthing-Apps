import React, { useEffect } from "react";
import { DeskThing } from "deskthing-client";
import { SocketData } from "deskthing-client/dist/types";
import { Call } from "./assets/components/Call";
import Controls from "./assets/components/Controls";
import ErrorBoundary from "./assets/components/ErrorBoundary";

const App: React.FC = () => {
  const DeskThingClient = DeskThing.getInstance();

  useEffect(() => {
    const onAppData = async (data: SocketData) => {
      console.log("Received data from the server!");
      console.log(data);
    };
    const removeListener = DeskThingClient.on("get", onAppData);

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
