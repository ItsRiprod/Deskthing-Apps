import { useMemo } from 'react'
import NotificationOverlay from './Notification'
import { useChatStore } from '@src/stores/chatStore'
import { useUIStore } from '@src/stores/uiStore'

export default function OverlayWrapper() {
  const markNotificationAsRead = useChatStore((state) => state.markNotificationAsRead)
  const notifications = useChatStore((state) => state.notificationStatus?.notifications)
  const toastsEnabled = useUIStore((state) => state.notification_toasts_enabled)

  const unreadNotifications = useMemo(() => {
    if (!notifications) return []
    return notifications
      .filter((notification) => !notification.read)
      .sort((a, b) => a.timestamp - b.timestamp)
  }, [notifications])

  if (!toastsEnabled || unreadNotifications.length === 0) {
    return null
  }

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-40 flex justify-end px-6"
      style={{ bottom: '12vh' }}
    >
      <div className="flex w-full max-w-sm flex-col items-stretch gap-3">
        {unreadNotifications.map((notification) => (
          <NotificationOverlay
            key={notification.id}
            notification={notification}
            onClose={markNotificationAsRead}
          />
        ))}
      </div>
    </div>
  )
}
