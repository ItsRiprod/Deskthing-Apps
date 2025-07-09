import { JSX } from "react";
import { MainLayout } from "./layouts/MainLayout";
import OverlayWrapper from "./overlays/OverlayWrapper";
import { StoreInitializer } from "./stores/storeInitializer"

function App(): JSX.Element {
  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-900">
      <StoreInitializer />
      <MainLayout />
      <OverlayWrapper />
    </div>
  );
}

export default App;
