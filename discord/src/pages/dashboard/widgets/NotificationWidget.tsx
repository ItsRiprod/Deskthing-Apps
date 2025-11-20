import { useCallback, useMemo, useState } from "react";
import { createDeskThing } from "@deskthing/client";
import { useChatStore } from "@src/stores/chatStore";
import { useUIStore } from "@src/stores/uiStore";
import { DiscordEvents, ToClientTypes, ToServerTypes } from "@shared/types/transit";

const DeskThing = createDeskThing<ToClientTypes, ToServerTypes>();

const formatRelativeTime = (timestamp: number): string => {
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
};

export const NotificationWidget = () => {
  const notifications = useChatStore(
    (state) => state.notificationStatus?.notifications ?? [],
  );
  const markNotificationAsRead = useChatStore((state) => state.markNotificationAsRead);
  const markAllNotificationsAsRead = useChatStore(
    (state) => state.markAllNotificationsAsRead,
  );
  const toastsEnabled = useUIStore((state) => state.notification_toasts_enabled);
  const [isToggling, setIsToggling] = useState(false);

  const unreadNotifications = useMemo(
    () => notifications.filter((notification) => !notification.read),
    [notifications],
  );

  const recentNotifications = useMemo(() => {
    return [...notifications].sort((a, b) => b.timestamp - a.timestamp).slice(0, 4);
  }, [notifications]);

  const unreadCount = unreadNotifications.length;

  const handleToggle = useCallback(() => {
    if (isToggling) return;
    setIsToggling(true);
    DeskThing.send({
      type: DiscordEvents.SET,
      request: "notificationToasts",
      payload: { enabled: !toastsEnabled },
    });
    setTimeout(() => setIsToggling(false), 250);
  }, [isToggling, toastsEnabled]);

  const handleMarkNotificationAsRead = useCallback(
    (notificationId: string) => {
      markNotificationAsRead(notificationId);
    },
    [markNotificationAsRead],
  );

  return (
    <div className="absolute right-6 top-6 z-20 w-80 rounded-3xl border border-white/10 bg-[#111318]/85 p-4 text-white shadow-2xl shadow-black/40 backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">Notifications</p>
          <p className="text-lg font-semibold">Dashboard Feed</p>
          <p className="text-xs text-white/60">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={toastsEnabled}
          aria-label="Toggle toast notifications"
          onClick={handleToggle}
          disabled={isToggling}
          className={`relative inline-flex h-6 w-12 items-center rounded-full transition ${
            toastsEnabled ? "bg-emerald-500/90" : "bg-white/20"
          } ${isToggling ? "opacity-70" : ""}`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
              toastsEnabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
      <p className="mt-1 text-xs text-white/60">
        Toast overlay {toastsEnabled ? "is active" : "is disabled"}. Use the toggle to
        {toastsEnabled ? " hide" : " surface"} pop-up notifications.
      </p>

      <div className="mt-4 space-y-2">
        {recentNotifications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 text-sm text-white/70">
            {toastsEnabled
              ? "No notifications yet. We'll drop the latest alerts here and as toasts."
              : "Enable toasts to start seeing pop-up alerts when new notifications arrive."}
          </div>
        ) : (
          recentNotifications.map((notification) => (
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
              <div className="flex items-center justify-between text-xs text-white/60">
                <span className="font-semibold text-white/80">
                  {notification.title || "Notification"}
                </span>
                <span>{formatRelativeTime(notification.timestamp)}</span>
              </div>
              <p
                className="mt-1 text-sm text-white/80"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {notification.content}
              </p>
              <p className="mt-2 text-[11px] text-white/60">{notification.author.username}</p>
            </button>
          ))
        )}
      </div>

      {recentNotifications.length > 0 && unreadCount > 0 && (
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
