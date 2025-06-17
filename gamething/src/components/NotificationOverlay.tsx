import { useNotificationStore } from '@src/stores/notificationStore'
import { useEffect } from 'react'

export const NotificationOverlay = () => {
  const { notification, clearNotification } = useNotificationStore()

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        clearNotification()
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [notification, clearNotification])

  if (!notification) return null

  return (
    <div className="fixed top-4 left-4 z-50">
      <div className="bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg">
        <div className="flex items-center space-x-2">
          <span>{notification.message}</span>
          <button
            onClick={clearNotification}
            className="ml-2 text-gray-400 hover:text-gray-200"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}