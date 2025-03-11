import { JSX } from 'react';
import { AppStateProvider } from './context/AppStateProvidor'
import { MainLayout } from './layouts/MainLayout';
import OverlayWrapper from './overlays/OverlayWrapper'

function App(): JSX.Element {
  return (
    <AppStateProvider>
      <div className="h-screen w-screen overflow-hidden bg-gray-900">
        <MainLayout />
        <OverlayWrapper />
      </div>
    </AppStateProvider>
  );
}

export default App;