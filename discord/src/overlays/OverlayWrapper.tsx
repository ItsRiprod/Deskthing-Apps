import NotificationOverlay from './Notification'
import { useChatStore } from '@src/stores/chatStore'
import { useUIStore } from '@src/stores/uiStore'


export default function OverlayWrapper() {
    const markNotificationAsRead = useChatStore((state) => state.markNotificationAsRead)
    const notifications = useChatStore((state) => state.notificationStatus?.notifications);
    const showNotificationToasts = useUIStore((state) => state.showNotificationToasts)

  return (
    <>
      {showNotificationToasts && notifications?.map((notification) => (
        <NotificationOverlay
          key={notification.id}
          notification={notification}
          onClose={markNotificationAsRead}
        />
      ))}
    </>
  )
}
