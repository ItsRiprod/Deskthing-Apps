import React, { useEffect } from "react";
import { DeskThing } from "deskthing-client";
import { SocketData } from "deskthing-client/dist/types";
import { Call } from "./assets/components/Call";

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
      <Call />
    </div>
  );
};

export default App;
