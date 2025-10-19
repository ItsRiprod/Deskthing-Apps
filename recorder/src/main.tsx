import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import OverlayManager from './overlays/OverlayManager'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OverlayManager />
    <App />
  </StrictMode>,
)
