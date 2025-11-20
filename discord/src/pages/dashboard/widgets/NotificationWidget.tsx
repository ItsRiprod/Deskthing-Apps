import { createDeskThing } from "@deskthing/client";
import { DISCORD_ACTIONS } from "@shared/types/discord";
import { ToClientTypes, ToServerTypes } from "@shared/types/transit";
import { DISCORD_APP_ID } from "@src/constants/app";
import { useChatStore } from "@src/stores/chatStore";

const DeskThing = createDeskThing<ToClientTypes, ToServerTypes>();

const formatTimestamp = (timestamp: number) => {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(timestamp));
  } catch (error) {
    console.warn("Failed to format timestamp", error);
    return "";
  }
};

export const NotificationWidget = () => {
  const notifications =
    useChatStore((state) => state.notificationStatus?.notifications) ?? [];
  const markNotificationAsRead = useChatStore((state) => state.markNotificationAsRead);
  const markAllNotificationsAsRead = useChatStore(
    (state) => state.markAllNotificationsAsRead
  );

  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const visibleNotifications = notifications.slice(-4).reverse();

  const handleSendTestNotification = () => {
    void DeskThing.triggerAction({
      id: DISCORD_ACTIONS.SEND_TEST_NOTIFICATION,
      source: DISCORD_APP_ID,
    });
  };

  const handleMarkNotificationAsRead = (notificationId: string) => {
    markNotificationAsRead(notificationId);
  };

  return (
    <div className="pointer-events-auto fixed bottom-6 right-6 z-40 w-80 rounded-2xl border border-white/5 bg-[#05060a]/95 p-4 text-white shadow-2xl shadow-black/60 backdrop-blur">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-white/80">
            Notifications
          </p>
          <p className="text-xs text-white/50">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSendTestNotification}
          className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-indigo-500"
        >
          Send Test
        </button>
      </div>

      <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
        {visibleNotifications.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/10 bg-white/5 px-3 py-4 text-center text-xs text-white/60">
            Use "Send Test" to preview what notification toasts will look like on your DeskThing.
          </p>
        ) : (
          visibleNotifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => handleMarkNotificationAsRead(notification.id)}
              className={`w-full rounded-2xl border px-3 py-2 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                notification.read
                  ? "border-white/5 bg-white/5 text-white/70"
                  : "border-white/15 bg-white/10 text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                {notification.author.profileUrl && (
                  <img
                    src={notification.author.profileUrl}
                    alt={notification.author.username}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {notification.title || notification.author.username}
                  </p>
                  <p className="truncate text-xs text-white/70">{notification.content}</p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-wide text-white/50">
                <span>{notification.author.username}</span>
                <span>{formatTimestamp(notification.timestamp)}</span>
              </div>
            </button>
          ))
        )}
      </div>

      {visibleNotifications.length > 0 && (
        <button
          type="button"
          onClick={markAllNotificationsAsRead}
          className="mt-3 w-full rounded-2xl border border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white/80 transition hover:border-white/40 hover:text-white"
        >
          Mark all as read
        </button>
      )}
    </div>
  );
};
