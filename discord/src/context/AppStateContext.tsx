import React, { createContext } from 'react';

// Import from shared types (based on your shared types setup)
import { CallStatus, ChatStatus, NotificationStatus } from '@shared/types/discord';

// Define app state structure
export interface AppState {
  callStatus: CallStatus | null;
  chatStatus: ChatStatus | null;
  notificationStatus: NotificationStatus | null;
  connectionStatus: {
    isConnected: boolean;
    lastConnected: number | null;
  };
}

// Action types with proper typing
type Action = 
  | { type: 'SET_CALL_STATUS'; payload: CallStatus }
  | { type: 'SET_CHAT_STATUS'; payload: ChatStatus }
  | { type: 'SET_CHAT_EXPANDED'; payload: boolean }
  | { type: 'SET_NOTIFICATION_STATUS'; payload: NotificationStatus }
  | { type: 'SET_CONNECTION_STATUS'; payload: boolean }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'MARK_ALL_NOTIFICATIONS_READ' }

// Context type definition
export interface AppStateContextType {
  callStatus: CallStatus | null;
  chatStatus: ChatStatus | null;
  notificationStatus: NotificationStatus | null;
  state: AppState;
  isLoading: boolean;
  dispatch: React.Dispatch<Action>;
  // Convenience methods
  setChatExpanded: (expanded: boolean) => void;
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
}

// Create context
export const AppStateContext = createContext<AppStateContextType | undefined>(undefined);