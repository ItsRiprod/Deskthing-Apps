import React from 'react'
import { useUIStore } from '../../../stores/UIStore'

const mockRecordings = [
  { id: 'r1', name: 'Interview 2025-10-01', duration: '00:03:12' },
  { id: 'r2', name: 'Note 2025-10-05', duration: '00:00:42' },
  { id: 'r3', name: 'Meeting 2025-09-28', duration: '00:22:10' },
]

export const RecordingsPanel: React.FC = () => {
  const hide = useUIStore((s) => s.hide)

  return (
    <div className="fixed inset-y-0 left-0 w-80 bg-gray-100 text-gray-900 shadow-lg z-50 flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="text-lg font-semibold">Recordings</h3>
        <button className="text-sm text-gray-600" onClick={() => hide('recordings')}>Close</button>
      </div>

      <div className="p-4 overflow-auto flex-1">
        <ul className="space-y-3">
          {mockRecordings.map((r) => (
            <li key={r.id} className="p-2 bg-white rounded shadow-sm flex items-center justify-between">
              <div>
                <div className="font-medium">{r.name}</div>
                <div className="text-xs text-gray-500">{r.duration}</div>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-2 py-1 bg-blue-600 text-white rounded text-sm">Play</button>
                <button className="px-2 py-1 bg-gray-200 rounded text-sm">⋯</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default RecordingsPanel
