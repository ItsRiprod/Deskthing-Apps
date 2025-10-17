import React from 'react'
import { useMicrophoneStore } from '../../stores/MicrophoneStore'
import { useUIStore } from '../../stores/UIStore'

export const MicrophoneStatusOverlay: React.FC = () => {
  const status = useMicrophoneStore((s) => s.status)
  const openMic = useMicrophoneStore((s) => s.openMic)
  const closeMic = useMicrophoneStore((s) => s.closeMic)

  const showSettings = useUIStore((s) => s.show)

  const color = status === 'connected' ? 'bg-green-500' : status === 'connecting' ? 'bg-yellow-500' : 'bg-gray-500'

  return (
    <div className="fixed bottom-6 left-6 z-40">
      <div className={`flex items-center gap-3 px-3 py-1 rounded-full text-white shadow ${color}`}>
        <div className="text-sm font-medium">Mic</div>
        <div className="text-xs opacity-90">{status}</div>
        <button className="ml-2 text-xs underline" onClick={() => openMic()}>Open</button>
        <button className="ml-1 text-xs underline" onClick={() => closeMic()}>Close</button>
        <button className="ml-2 text-xs" onClick={() => showSettings('settings')}>⚙️</button>
      </div>
    </div>
  )
}

export default MicrophoneStatusOverlay
