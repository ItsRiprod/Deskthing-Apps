import NotificationOverlay from './Notification'
import { useAppSelector } from '../hooks/useAppSelector'
import { useAppState } from '../hooks/useAppState'

export default function OverlayWrapper() {
    const { markNotificationAsRead } = useAppState()
    const notifications = useAppSelector((state) => state.notificationStatus?.notifications);
  

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
