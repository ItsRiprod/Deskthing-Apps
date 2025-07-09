import NotificationOverlay from './Notification'
import { useChatStore } from '@src/stores/chatStore'


export default function OverlayWrapper() {
    const markNotificationAsRead = useChatStore((state) => state.markNotificationAsRead)
    const notifications = useChatStore((state) => state.notificationStatus?.notifications);
  

  return (
    <>
      {notifications?.map((notification) => (
        <NotificationOverlay
          key={notification.id}
          notification={notification}
          onClose={markNotificationAsRead}
        />
      ))}
    </>
  )
}
