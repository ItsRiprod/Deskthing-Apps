import React, { useEffect } from 'react'
import { useUIStore } from '../stores/UIStore'

export const ErrorOverlay: React.FC = () => {
  const error = useUIStore((s) => s.errorMessage)
  const setError = useUIStore((s) => s.setError)

  useEffect(() => {
    if (!error) return
    const t = setTimeout(() => setError(null), 6000)
    return () => clearTimeout(t)
  }, [error, setError])

  if (!error) return null

  return (
    <div className="fixed top-6 right-6 z-50">
      <div className="bg-red-600 text-white px-4 py-3 rounded shadow-lg w-auto max-w-sm">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="font-semibold">Error</div>
            <div className="text-sm mt-1">{error}</div>
          </div>
          <div>
            <button className="text-white/80 text-sm" onClick={() => setError(null)}>Dismiss</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ErrorOverlay
