import { JSX } from 'react';
import { AppStateProvider } from './context/AppStateProvidor'
import { MainLayout } from './layouts/MainLayout';
import OverlayWrapper from './overlays/OverlayWrapper'
import { UIProvider } from './context/UIProvider'

function App(): JSX.Element {
  return (
    <AppStateProvider>
      <UIProvider>
        <div className="h-screen w-screen overflow-hidden bg-gray-900">
          <MainLayout />
          <OverlayWrapper />
        </div>
      </UIProvider>
    </AppStateProvider>
  );
}

export default App;