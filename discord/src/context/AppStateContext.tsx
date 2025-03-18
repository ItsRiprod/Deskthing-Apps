import React, { createContext } from 'react';

// Import from shared types (based on your shared types setup)
import { CallStatus, ChannelStatus, ChatStatus, GuildListStatus, NotificationStatus } from '@shared/types/discord';

// Define app state structure
export interface AppState {
  callStatus: CallStatus | null;
  chatStatus: ChatStatus | null;
  notificationStatus: NotificationStatus | null;
  connectionStatus: {
    isConnected: boolean;
    lastConnected: number | null;
  };
  guildList: GuildListStatus | null;
}

// Action types with proper typing
export type Action =
  | { type: "SET_CALL_STATUS"; payload: CallStatus }
  | {
      type: "SET_TALKING_STATUS";
      payload: { userId: string; isSpeaking: boolean };
    }
  | { type: "SET_CHAT_STATUS"; payload: ChatStatus }
  | { type: "SET_NOTIFICATION_STATUS"; payload: NotificationStatus }
  | { type: "SET_CONNECTION_STATUS"; payload: boolean }
  | { type: "MARK_NOTIFICATION_READ"; payload: string }
  | { type: "MARK_ALL_NOTIFICATIONS_READ" }
  | { type: "SET_GUILD_LIST"; payload: GuildListStatus }
  | { type: "SET_CHAT_LOADING"; payload: boolean }
  | { type: "SET_CHANNELS_STATUS"; payload: ChannelStatus[] }
  | { type: "SET_SELECTED_GUILD"; payload: string }
  | { type: "SET_SELECTED_CHANNEL"; payload: string };

// Context type definition
export interface AppStateContextType {
  callStatus: CallStatus | null;
  chatStatus: ChatStatus | null;
  guildList: GuildListStatus | null;
  channels: ChannelStatus[] | null;
  notificationStatus: NotificationStatus | null;
  state: AppState;
  isLoading: boolean;
  dispatch: React.Dispatch<Action>;
  getGuildList: () => void;
  setSelectedGuildID: (guildId: string) => void;
  setSelectedChannelID: (channelId: string) => void;
  // Convenience methods
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
}

// Create context
export const AppStateContext = createContext<AppStateContextType | undefined>(undefined);