import React, { useReducer, useEffect, ReactNode, useMemo, useState } from 'react';
import { DeskThing } from '@deskthing/client';

// Import from shared types (based on your shared types setup)
import { CallStatus, ChatStatus, NotificationStatus } from '@shared/types/discord';
import { AppStateContext } from './AppStateContext'

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

// Initial state
const initialState: AppState = {
  callStatus: null,
  chatStatus: null,
  notificationStatus: null,
  connectionStatus: {
    isConnected: false,
    lastConnected: null
  }
};

// Action types with proper typing
type Action = 
  | { type: 'SET_CALL_STATUS'; payload: CallStatus }
  | { type: 'SET_TALKING_STATUS'; payload: { userId: string, isSpeaking: boolean } }
  | { type: 'SET_CHAT_STATUS'; payload: ChatStatus }
  | { type: 'SET_CHAT_EXPANDED'; payload: boolean }
  | { type: 'SET_NOTIFICATION_STATUS'; payload: NotificationStatus }
  | { type: 'SET_CONNECTION_STATUS'; payload: boolean }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'MARK_ALL_NOTIFICATIONS_READ' }


// Reducer with explicit return types
function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_CALL_STATUS':
      return { 
        ...state, 
        callStatus: action.payload 
      };
    case 'SET_TALKING_STATUS':
      return {
        ...state,
        callStatus: state.callStatus ? {
          ...state.callStatus,
          participants: state.callStatus.participants.map(participant =>
            participant.id === action.payload.userId
              ? { ...participant, isSpeaking: action.payload.isSpeaking }
              : participant
          )
        } : null
      };
      
    case 'SET_CHAT_STATUS':
      return { 
        ...state, 
        chatStatus: action.payload 
      };
    case 'SET_CHAT_EXPANDED':
      return {
        ...state,
        chatStatus: state.chatStatus
          ? { ...state.chatStatus, isExpanded: action.payload }
          : { isExpanded: action.payload, currentChannelId: null, messages: [], typingUsers: [] }
      };
    case 'SET_NOTIFICATION_STATUS':
      return {
        ...state,
        notificationStatus: action.payload,
      };
      
    case 'SET_CONNECTION_STATUS':
      return {
        ...state,
        connectionStatus: {
          isConnected: action.payload,
          lastConnected: action.payload ? Date.now() : state.connectionStatus.lastConnected
        }
      };

    case 'MARK_NOTIFICATION_READ':
      DeskThing.send({
        type: "notification",
        payload: action.payload,
        request: "update",
      });
      return state;

    case 'MARK_ALL_NOTIFICATIONS_READ':
      DeskThing.send({
        type: "notification",
        request: "updateAll",
      });
      return state;
      
    default:
      return state;
  }
}

// Provider component
export const AppStateProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isLoading, setIsLoading] = useState(true);

  // Convenience methods
  const setChatExpanded = (expanded: boolean) => {
    dispatch({ type: 'SET_CHAT_EXPANDED', payload: expanded });
  };

  const markNotificationAsRead = (notificationId: string) => {
    dispatch({ type: 'MARK_NOTIFICATION_READ', payload: notificationId });
  };

  const markAllNotificationsAsRead = () => {
    dispatch({ type: 'MARK_ALL_NOTIFICATIONS_READ' });
  };

  // Set up listeners to fetch and subscribe to data
  useEffect(() => {

    let isValid = true

    // Fetch is safe to use in useEffect as it caches calls and resolves them all at once 
    DeskThing.fetch<CallStatus>({ type: "get", request: 'call'}, { type: "call", request: "set" }, (callStatus) => {
      if (!isValid) return

      if (callStatus) {
        dispatch({ type: 'SET_CALL_STATUS', payload: callStatus })
      } else {
        DeskThing.warn('Initial request for call data returned undefined')
      }
    })

    DeskThing.fetch<ChatStatus>({ type: "get", request: "chat" }, { type: "chat", request: "set" }, (chatStatus) => {
      if (!isValid) return
      
      if (chatStatus) {
        dispatch({ type: 'SET_CHAT_STATUS', payload: chatStatus });
      } else {
        DeskThing.warn('Initial request for chat data returned undefined')
      }
    });

    DeskThing.fetch<NotificationStatus>(
      { type: "get", request: "notification" },
      { type: "notification", request: "set" },
      (notificationStatus) => {
        if (!isValid) return
        
        if (notificationStatus) {
          dispatch({ type: "SET_NOTIFICATION_STATUS", payload: notificationStatus });
        } else {
          DeskThing.warn('Initial request for notification data returned undefined')
        }
      }
    );

    // Set up event listeners
    const unsubscribeCallStatus = DeskThing.on('call', (event) => {
      if (!isValid) return
      DeskThing.info('Got call information')
      
      if (event.request === 'set' && event.payload) {
        DeskThing.info('Updating call', event)
        if (event.payload.user) {
          setIsLoading(false)
        }
        dispatch({ type: 'SET_CALL_STATUS', payload: event.payload });
      } else if (event.request === 'update' && event.payload) {
        dispatch({ type: 'SET_TALKING_STATUS', payload: event.payload });
      }
    });

    const unsubscribeChatStatus = DeskThing.on('chat', (event) => {
      if (!isValid) return
      if (event.request === 'set' && event.payload) {
        DeskThing.info('Updating chat', event)
        dispatch({ type: 'SET_CHAT_STATUS', payload: event.payload });
      }
    });
    
    const unsubscribeNotification = DeskThing.on('notification', (event) => {
      if (!isValid) return
      
      if (event.payload) {
        DeskThing.info('Updating notification', event)
        dispatch({ type: 'SET_NOTIFICATION_STATUS', payload: event.payload });
      }
    });

    // Clean up listeners on unmount
    return () => {
      isValid = false
      unsubscribeCallStatus();
      unsubscribeChatStatus()
      unsubscribeNotification();
    };
  }, []);

  const callStatus = useMemo(() => state.callStatus, [state.callStatus]);
  const chatStatus = useMemo(() => state.chatStatus, [state.chatStatus]);
  const notificationStatus = useMemo(() => state.notificationStatus, [state.notificationStatus]);

  const fullContextMemo = useMemo(() => ({
    callStatus,
    chatStatus,
    notificationStatus,
    state,
    isLoading,
    dispatch,
    setChatExpanded,
    markNotificationAsRead,
    markAllNotificationsAsRead
  }), [
    callStatus,
    chatStatus,
    notificationStatus,
    state,
    isLoading,
    dispatch,
    setChatExpanded,
    markNotificationAsRead,
    markAllNotificationsAsRead
  ]);

  return (
    <AppStateContext.Provider 
      value={fullContextMemo}
    >
      {children}
    </AppStateContext.Provider>
  );
};