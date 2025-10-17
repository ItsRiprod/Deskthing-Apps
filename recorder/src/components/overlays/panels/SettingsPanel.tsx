import React from 'react'
import { OverlayId, useUIStore } from '../../../stores/UIStore'

export const SettingsPanel: React.FC = () => {
  const overlays: Array<{ id: OverlayId; label: string }> = [
    { id: 'microphone', label: 'Microphone Status' },
    { id: 'error', label: 'Error Messages' },
    { id: 'recordings', label: 'Recordings Panel' },
  ]
  const showComponent = useUIStore((s) => s.show)
  const hideComponent = useUIStore((s) => s.hide)
  const visible = useUIStore((s) => s.visible)

  // Helper to toggle overlay visibility using UIStore
  const toggleOverlay = (id: OverlayId, enabled: boolean) => {
    if (enabled) {
      showComponent(id)
    } else {
      hideComponent(id)
    }
  }

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-white text-gray-900 shadow-lg z-50 flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="text-lg font-semibold">Settings</h3>
        <button className="text-sm text-gray-600" onClick={() => hideComponent('settings')}>Close</button>
      </div>

      <div className="p-4 overflow-auto flex-1">
        <div className="space-y-4">

          <div>
            <label className="text-sm font-medium mb-2 block">Enable Overlays</label>
            <div className="space-y-2">
              {overlays.map((overlay) => (
                <div key={overlay.id} className="flex items-center justify-between">
                  <span>{overlay.label}</span>
                  <input
                    type="checkbox"
                    checked={visible[overlay.id]}
                    onChange={e => toggleOverlay(overlay.id, e.target.checked)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Audio Format</label>
            <select className="mt-1 block w-full border rounded px-2 py-1">
              <option>wav</option>
              <option>mp3</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Sample Rate</label>
            <input className="mt-1 block w-full border rounded px-2 py-1" defaultValue={16000} />
          </div>

          <div>
            <label className="text-sm font-medium">Channels</label>
            <select className="mt-1 block w-full border rounded px-2 py-1">
              <option>1</option>
              <option>2</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Chunk Duration (s)</label>
            <input className="mt-1 block w-full border rounded px-2 py-1" defaultValue={1} type="number" />
          </div>
        </div>
      </div>

      <div className="p-4 border-t flex justify-end gap-2">
        <button className="px-3 py-1 bg-gray-200 rounded" onClick={() => hideComponent('settings')}>Cancel</button>
        <button className="px-3 py-1 bg-blue-600 text-white rounded">Save</button>
      </div>
    </div>
  )
}

export default SettingsPanel