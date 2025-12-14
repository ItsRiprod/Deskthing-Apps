import { Notification } from '@shared/types/discord';
import { useState, useEffect, useMemo, JSX } from 'react';
import { IconX } from '../assets/icons'
import { DeskThing } from '@deskthing/client';

interface NotificationProps {
  notification: Notification;
  onClose: (id: string) => void;
  autoHideDuration?: number;
}

export default function NotificationOverlay({
  notification,
  onClose,
  autoHideDuration = 10000
}: NotificationProps): JSX.Element {
  const [isVisible, setIsVisible] = useState(true);
  const proxiedProfileUrl = useMemo(() => {
    if (!notification.author.profileUrl) return null;
    return DeskThing.useProxy(notification.author.profileUrl);
  }, [notification.author.profileUrl]);

  const mediaUrls = useMemo(() => {
    return (notification.mediaUrls || []).map((url) => DeskThing.useProxy(url));
  }, [notification.mediaUrls]);

  useEffect(() => {
    setIsVisible(true);
  }, [notification.id]);

  // Handle auto-hide
  useEffect(() => {
    if (autoHideDuration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose(notification.id), 300); // Allow fade out animation
      }, autoHideDuration);
      
      return () => clearTimeout(timer);
    }
  }, [notification.id, autoHideDuration, onClose]);

  // Handle manual close
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(notification.id), 300); // Allow fade out animation
  };

  return (
    <div
      className={`pointer-events-auto w-full transform transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
      }`}
    >
      <div className="flex w-full items-start rounded-2xl border border-white/5 bg-[#1b1f25]/95 p-5 text-white shadow-2xl shadow-black/60 backdrop-blur">
        <div className="mr-3 flex-shrink-0">
          {proxiedProfileUrl && (
            <img
              src={proxiedProfileUrl}
              alt={notification.author.username}
              className="h-10 w-10 rounded-full"
            />
          )}
        </div>
        <div className="grow">
          <p className="text-sm font-semibold text-white">{notification.author.username}</p>
          <h4 className="mt-1 text-base font-semibold leading-tight">{notification.title}</h4>
          {notification.content ? (
            <p
              className="mt-2 text-base font-normal text-white/80"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {notification.content}
            </p>
          ) : null}
          {mediaUrls.length > 0 && (
            <div className="mt-3 flex flex-col gap-2">
              {mediaUrls.map((url, idx) => (
                <img
                  key={`${notification.id}-media-${idx}`}
                  src={url}
                  className="w-full max-h-48 rounded-lg border border-white/10 bg-neutral-800 object-contain"
                  alt="attachment"
                />
              ))}
            </div>
          )}
          {(notification.guildName || notification.channelName) && (
            <p className="mt-2 text-xs text-white/50">
              {notification.guildName ?? ''}
              {notification.guildName && notification.channelName ? ' | ' : ''}
              {notification.channelName ? `#${notification.channelName}` : ''}
            </p>
          )}
        </div>
        <button
          onClick={handleClose}
          aria-label="Dismiss notification"
          className="ml-3 rounded-full p-1 text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          <IconX />
        </button>
      </div>
    </div>
  );
}
