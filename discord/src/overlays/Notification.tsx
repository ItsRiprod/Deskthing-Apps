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
      className={`fixed right-4 top-4 z-50 transform transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="flex w-72 items-center rounded-lg border border-gray-700 bg-gray-800 p-4 shadow-lg">
        <div className="mr-3 flex-shrink-0">
          {notification.author.profileUrl && (
            <img 
              src={notification.author.profileUrl} 
              alt={notification.author.username}
              className="h-6 w-6 rounded-full"
            />
          )}
        </div>
        <div className="grow text-gray-100">
          <h4 className="mb-1 font-medium">{notification.title}</h4>
          <p className="text-sm text-gray-300">{notification.content}</p>
          <span className="mt-1 text-xs text-gray-400">
            {notification.author.username}
          </span>
        </div>
        <button 
          onClick={handleClose}
          className="ml-2 shrink-0 rounded-full p-1 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
        >
          <IconX />
        </button>
      </div>
    </div>
  );
}