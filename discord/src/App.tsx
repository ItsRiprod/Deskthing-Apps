import React from "react";
import { Call } from "./components/Call";

const App: React.FC = () => {
  return (
    <div className="bg-slate-800 w-screen h-screen flex-col flex justify-center items-center">
      <Call />
    </div>
  );
};

export default App;
