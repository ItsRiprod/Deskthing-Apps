import { Notification } from '@shared/types/discord';
import { useState, useEffect, JSX } from 'react';
import { IconX } from '../assets/icons'

interface NotificationProps {
  notification: Notification;
  onClose: (id: string) => void;
  autoHideDuration?: number;
}

export default function NotificationOverlay({
  notification,
  onClose,
  autoHideDuration = 5000
}: NotificationProps): JSX.Element {
  const [isVisible, setIsVisible] = useState(true);

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
      <div className="flex w-full items-start rounded-2xl border border-white/5 bg-[#1b1f25]/95 p-4 text-white shadow-2xl shadow-black/60 backdrop-blur">
        <div className="mr-3 flex-shrink-0">
          {notification.author.profileUrl && (
            <img
              src={notification.author.profileUrl}
              alt={notification.author.username}
              className="h-8 w-8 rounded-full"
            />
          )}
        </div>
        <div className="grow">
          <p className="text-xs uppercase tracking-wide text-white/60">{notification.author.username}</p>
          <h4 className="mt-1 text-sm font-semibold leading-tight">{notification.title}</h4>
          <p
            className="mt-1 text-sm text-white/80"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {notification.content}
          </p>
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