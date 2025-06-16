import React from "react";
import { PageManager } from "./pages";
import { StoreInitializer } from "./components/StoreInitializer";
import { NotificationOverlay } from "./components/NotificationOverlay";
import { BackButton } from "./components/BackButton";

const App: React.FC = () => {

  return (
    <div className="bg-black text-white flex-col w-screen h-screen flex justify-center items-center">
      <NotificationOverlay />
      <StoreInitializer />
      <BackButton />
      <PageManager />
    </div>
  );
};

export default App;
