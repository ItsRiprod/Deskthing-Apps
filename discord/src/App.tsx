import { JSX } from "react";
import { StoreInitializer } from "./stores/storeInitializer"
import { PageManager } from "./pages";

function App(): JSX.Element {
  return (
    <div className="h-screen w-screen bg-black overflow-hidden">
      <StoreInitializer />
      <PageManager />
    </div>
  );
}

export default App;
