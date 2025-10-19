import React from 'react'
import { useMicrophoneStore } from '../stores/MicrophoneStore'
import { useUIStore } from '../stores/UIStore'

const MicrophoneIcon = (props: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
    <path d="M12 1v11" />
    <rect x="8" y="1" width="8" height="14" rx="4" />
    <path d="M19 11a7 7 0 0 1-14 0" />
    <path d="M12 21v2" />
    <path d="M8 23h8" />
  </svg>
)

const StopIcon = (props: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={props.className}>
    <rect x="5" y="5" width="14" height="14" rx="2" />
  </svg>
)

const ListIcon = (props: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
    <path d="M8 6h13" />
    <path d="M8 12h13" />
    <path d="M8 18h13" />
    <circle cx="3.5" cy="6" r="1.5" />
    <circle cx="3.5" cy="12" r="1.5" />
    <circle cx="3.5" cy="18" r="1.5" />
  </svg>
)

const CogIcon = (props: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
    <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 1 1 2.27 18.9l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09c.67 0 1.25-.37 1.51-1a1.65 1.65 0 0 0-.33-1.82L4.3 6.34A2 2 0 1 1 7.13 3.5l.06.06c.5.5 1.2.7 1.82.33.5-.3 1.08-.47 1.69-.47h.02c.61 0 1.19.17 1.69.47.62.37 1.32.17 1.82-.33l.06-.06A2 2 0 1 1 19.7 5.7l-.06.06c-.5.5-.7 1.2-.33 1.82.3.5.47 1.08.47 1.69v.02c0 .61-.17 1.19-.47 1.69-.37.62-.17 1.32.33 1.82l.06.06a2 2 0 0 1 .33 2.12z" />
  </svg>
)

export const MicrophoneComponent: React.FC = () => {
  const status = useMicrophoneStore((s) => s.status)
  const audioChunks = useMicrophoneStore((s) => s.audioChunks)
  const bytesReceived = useMicrophoneStore((s) => s.bytesReceived)
  const openMic = useMicrophoneStore((s) => s.openMic)
  const closeMic = useMicrophoneStore((s) => s.closeMic)
  const initialized = useMicrophoneStore((s) => s.initialized)

  const show = useUIStore((s) => s.show)

  const isRecording = ['recording', 'open', 'streaming', 'listening'].includes(status)

  return (
    <div className="bg-black rounded-2xl p-8 shadow-xl text-center text-gray-100 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-2 text-emerald-400 flex items-center justify-center gap-2">
        <MicrophoneIcon className="w-6 h-6 text-emerald-500" />
        DeskThing Recorder
      </h1>
      <p className="text-sm text-gray-300 mb-6">Lightweight audio capture. Use the controls below to start or stop recording.</p>

      <div className="flex items-center justify-center gap-4">
        {!isRecording ? (
          <button
            aria-label="Start recording"
            className={`flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-black font-semibold rounded transition disabled:opacity-50`}
            onClick={() => openMic()}
            disabled={!initialized}
          >
            <MicrophoneIcon className="w-5 h-5 text-black" />
            Start
          </button>
        ) : (
          <button
            aria-label="Stop recording"
            className={`flex items-center gap-2 px-6 py-3 bg-emerald-700 hover:bg-emerald-600 text-black font-semibold rounded transition`}
            onClick={() => closeMic()}
          >
            <StopIcon className="w-5 h-5 text-black" />
            Stop
          </button>
        )}
      </div>

      <div className="mt-6 flex items-center justify-center gap-4 text-sm text-gray-300">
        <div>State: <span className="font-medium text-emerald-400 ml-1">{status}</span></div>
        <div>Chunks: <span className="font-medium ml-1">{audioChunks}</span></div>
        <div>Bytes: <span className="font-medium ml-1">{bytesReceived}</span></div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          className="flex items-center gap-2 px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-sm text-gray-200"
          onClick={() => show('recordings')}
        >
          <ListIcon className="w-4 h-4 text-emerald-400" />
          Recordings
        </button>
        <button
          className="flex items-center gap-2 px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-sm text-gray-200"
          onClick={() => show('settings')}
        >
          <CogIcon className="w-4 h-4 text-emerald-400" />
          Settings
        </button>
      </div>

      {isRecording && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-gray-300">Recording</span>
        </div>
      )}
    </div>
  )
}

export default MicrophoneComponent