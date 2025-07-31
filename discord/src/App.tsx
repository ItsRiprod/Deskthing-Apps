import { JSX } from "react";
import { StoreInitializer } from "./stores/storeInitializer"
import { PageManager } from "./pages";
import SizeListener from "./components/SizeListener";

function App(): JSX.Element {
  return (
    <div className="h-screen max-h-screen w-screen bg-black overflow-hidden">
      <StoreInitializer />
      <PageManager />
      <SizeListener />
    </div>
  );
}

export default App;
