import React from 'react'
import { useMicrophoneStore } from '../stores/MicrophoneStore'
import { useUIStore } from '../stores/UIStore'

export const MicrophoneComponent: React.FC = () => {
  const status = useMicrophoneStore((s) => s.status)
  const audioChunks = useMicrophoneStore((s) => s.audioChunks)
  const bytesReceived = useMicrophoneStore((s) => s.bytesReceived)
  const openMic = useMicrophoneStore((s) => s.openMic)
  const closeMic = useMicrophoneStore((s) => s.closeMic)

  const show = useUIStore((s) => s.show)

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 shadow-xl text-center">
      <h1 className="text-2xl font-bold mb-2">DeskThing Recorder</h1>
      <p className="text-sm text-gray-300 mb-6">A lightweight audio capture tool. Use the buttons below to record or open panels.</p>

      <div className="flex items-center justify-center gap-4">
        <button className="px-6 py-3 bg-green-500 rounded text-white font-semibold" onClick={() => openMic()}>
          Start
        </button>
        <button className="px-6 py-3 bg-red-500 rounded text-white font-semibold" onClick={() => closeMic()}>
          Stop
        </button>
      </div>

      <div className="mt-6 flex items-center justify-center gap-4 text-sm text-gray-300">
        <div>State: <span className="font-medium">{status}</span></div>
        <div>Chunks: <span className="font-medium">{audioChunks}</span></div>
        <div>Bytes: <span className="font-medium">{bytesReceived}</span></div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-3">
        <button className="px-3 py-1 bg-gray-700 rounded" onClick={() => show('recordings')}>Recordings</button>
        <button className="px-3 py-1 bg-gray-700 rounded" onClick={() => show('settings')}>Settings</button>
      </div>
    </div>
  )
}

export default MicrophoneComponent