import React from 'react'
import { useFlags } from '../../hooks/useFlags'
import { useUIStore } from '../../stores/UIStore'

export const WelcomeOverlay: React.FC = () => {
  const [hasVisited, setHasVisited] = useFlags('hasVisitedPage')
  const show = useUIStore((s) => s.show)

  const handleClose = () => {
    setHasVisited(true)
  }

  if (hasVisited) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
      <div className="bg-white text-gray-900 rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="p-6">
          <h2 className="text-2xl font-bold">Welcome to DeskThing Recorder</h2>
          <p className="mt-2 text-sm text-gray-700">A lightweight audio recording app. Use the central controls to start and stop recording. Open the Recordings panel to replay past captures, or the Settings to adjust audio options.</p>

          <div className="mt-4 flex gap-2">
            <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={() => { handleClose(); show('microphone') }}>
              Get started
            </button>
            <button className="px-3 py-2 bg-gray-200 rounded" onClick={() => { handleClose(); show('settings') }}>
              Open Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WelcomeOverlay
