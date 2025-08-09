import React from "react";
import { Clock } from "./components/Clock";
import { StoreInitializer } from "./store/storeInitializer";
import { BackgroundComponent } from "./components/Background";

const App: React.FC = () => {

  return (
    <div className="bg-slate-900 relative w-screen h-screen overflow-hidden flex justify-center items-center">
      <StoreInitializer />
      <BackgroundComponent />
      <Clock />
    </div>
  );
};

export default App;
