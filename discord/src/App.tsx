import { JSX } from "react";
import { StoreInitializer } from "./stores/storeInitializer"
import { PageManager } from "./pages";
import SizeListener from "./components/SizeListener";
import OverlayWrapper from "./overlays/OverlayWrapper";

function App(): JSX.Element {
  return (
    <div className="h-screen max-h-screen w-screen bg-black overflow-hidden">
      <StoreInitializer />
      <PageManager />
      <OverlayWrapper />
      <SizeListener />
    </div>
  );
}

export default App;
