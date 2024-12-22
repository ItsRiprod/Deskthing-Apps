import React from "react";
import { Call } from "./components/Call";
import ErrorBoundary from "./components/ErrorBoundary";

const App: React.FC = () => {
  return (
    <div className="bg-slate-800 w-screen h-screen flex-col flex justify-center items-center">
      <ErrorBoundary>
        <Call />
      </ErrorBoundary>
    </div>
  );
};

export default App;
