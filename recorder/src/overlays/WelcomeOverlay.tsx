import React from 'react'
import { useFlags } from '../hooks/useFlags'
import { useUIStore } from '../stores/UIStore'

export const WelcomeOverlay: React.FC = () => {
  const [hasVisited, setHasVisited] = useFlags('hasVisitedPage')
  const show = useUIStore((s) => s.show)

  const handleClose = () => {
    setHasVisited(true)
  }

  if (hasVisited) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
      className="w-full max-w-2xl mx-4 bg-gray-900/95 text-slate-100 rounded-2xl shadow-2xl ring-1 ring-black/40 overflow-hidden"
      >
      <div className="flex items-start justify-between p-6">
        <div>
        <h2 id="welcome-title" className="text-2xl font-semibold text-emerald-400">
          Welcome to DeskThing Recorder
        </h2>
        <p className="mt-2 text-sm text-slate-300 max-w-prose">
          A lightweight audio recording app. Use the central controls to start and stop recordings. Open the Recordings panel to replay past captures, or the Settings to adjust audio options.
        </p>
        </div>

        <button
        onClick={handleClose}
        aria-label="Close welcome"
        className="ml-4 p-2 rounded-md text-slate-300 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 011.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
        </button>
      </div>

      <div className="px-6 pb-6 flex justify-end gap-3">
        <button
        onClick={() => { handleClose(); show('microphone'); }}
        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
        >
        Get started
        </button>

        <button
        onClick={() => { handleClose(); show('settings'); }}
        className="inline-flex items-center px-4 py-2 bg-transparent border border-slate-700 text-slate-300 rounded-md hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
        >
        Open Settings
        </button>
      </div>
      </div>
    </div>
  )
}

export default WelcomeOverlay
