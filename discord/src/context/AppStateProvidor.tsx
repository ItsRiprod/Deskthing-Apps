import React, {
  useReducer,
  useEffect,
  ReactNode,
  useMemo,
  useState,
} from "react";
import { createDeskThing } from "@deskthing/client";
import {
  DiscordEvents,
  ToClientTypes,
  ToServerTypes,
} from "@shared/types/transit";

import {
  CallStatus,
  ChannelStatus,
  ChatStatus,
  GuildListStatus,
  NotificationStatus,
} from "@shared/types/discord";
import { Action, AppState, AppStateContext } from "./AppStateContext";

const DeskThing = createDeskThing<ToClientTypes, ToServerTypes>();

// Initial state
const initialState: AppState = {
  callStatus: null,
  chatStatus: null,
  notificationStatus: null,
  connectionStatus: {
    isConnected: false,
    lastConnected: null,
  },
  guildList: null,
};

// Reducer with explicit return types
function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_CALL_STATUS":
      return {
        ...state,
        callStatus: action.payload,
      };
    case "SET_TALKING_STATUS":
      return {
        ...state,
        callStatus: state.callStatus
          ? {
              ...state.callStatus,
              participants: state.callStatus.participants.map((participant) =>
                participant.id === action.payload.userId
                  ? { ...participant, isSpeaking: action.payload.isSpeaking }
                  : participant
              ),
            }
          : null,
      };

    case "SET_CHAT_STATUS":
      return {
        ...state,
        chatStatus: action.payload,
      };
    case "SET_NOTIFICATION_STATUS":
      return {
        ...state,
        notificationStatus: action.payload,
      };

    case "SET_CONNECTION_STATUS":
      return {
        ...state,
        connectionStatus: {
          isConnected: action.payload,
          lastConnected: action.payload
            ? Date.now()
            : state.connectionStatus.lastConnected,
        },
      };
    case "MARK_NOTIFICATION_READ":
      return {
        ...state,
        notificationStatus: {
          ...state.notificationStatus,
          notifications:
            state.notificationStatus?.notifications.map((notification) =>
              notification.id === action.payload
                ? { ...notification, read: true }
                : notification
            ) || [],
        },
      };
    case "MARK_ALL_NOTIFICATIONS_READ":
      return {
        ...state,
        notificationStatus: {
          ...state.notificationStatus,
          notifications:
            state.notificationStatus?.notifications.map((notification) => ({
              ...notification,
              read: true,
            })) || [],
        },
      };
    case "SET_CHANNELS_STATUS":
      return {
        ...state,
        guildList: {
          ...state.guildList,
          textChannels: action.payload,
        } as GuildListStatus,
      };
    case "SET_GUILD_LIST":
      return {
        ...state,
        guildList: action.payload,
      };
    case "SET_SELECTED_GUILD":
      return {
        ...state,
        guildList: {
          ...state.guildList,
          selectedGuildId: action.payload,
        } as GuildListStatus,
      };
    case "SET_CHAT_LOADING":
      return {
        ...state,
        chatStatus: {
          ...state.chatStatus,
          isLoading: action.payload,
        } as ChatStatus,
      };
    case "SET_SELECTED_CHANNEL":
      return {
        ...state,
        chatStatus: {
          ...state.chatStatus,
          currentChannelId: action.payload,
        } as ChatStatus,
      };
    default:
      return state;
  }
}

// Provider component
export const AppStateProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isLoading, setIsLoading] = useState(true);

  const markNotificationAsRead = (notificationId: string) => {
    dispatch({ type: "MARK_NOTIFICATION_READ", payload: notificationId });
  };

  const markAllNotificationsAsRead = () => {
    dispatch({ type: "MARK_ALL_NOTIFICATIONS_READ" });
  };

  const getGuildList = () => {
    
    dispatch({ type: "SET_CHAT_LOADING", payload: true });
    DeskThing.send({ type: DiscordEvents.GET, request: "refreshGuildList" });
  };

  const setSelectedGuildID = (guildId: string) => {
    if (state.guildList?.selectedGuildId === guildId) return;
    dispatch({ type: "SET_CHAT_LOADING", payload: true });
    dispatch({ type: "SET_SELECTED_GUILD", payload: guildId });
    DeskThing.send({
      type: DiscordEvents.SET,
      request: "guild",
      payload: { guildId },
    });
  };

  const setSelectedChannelID = (channelId: string) => {
    if (state.chatStatus?.currentChannelId === channelId) return;
    dispatch({
      type: "SET_CHAT_STATUS",
      payload: {
        currentChannelId: channelId,
        isLoading: true,
        messages: [],
        typingUsers: [],
      },
    });
    DeskThing.send({
      type: DiscordEvents.SET,
      request: "channel",
      payload: { channelId },
    });
  };

  // Set up listeners to fetch and subscribe to data
  useEffect(() => {
    let isValid = true;

    // Fetch is safe to use in useEffect as it caches calls and resolves them all at once
    DeskThing.fetch(
      { type: DiscordEvents.GET, request: "call" },
      { type: DiscordEvents.CALL, request: "set" },
      (callStatus) => {
        if (!isValid) return;

        if (callStatus) {
          dispatch({ type: "SET_CALL_STATUS", payload: callStatus });
        } else {
          DeskThing.warn("Initial request for call data returned undefined");
        }
      }
    );

    DeskThing.fetch(
      { type: DiscordEvents.GET, request: "chat" },
      { type: DiscordEvents.CHAT, request: "set" },
      (chatStatus) => {
        if (!isValid) return;

        if (chatStatus) {
          dispatch({ type: "SET_CHAT_STATUS", payload: chatStatus });
        } else {
          DeskThing.warn("Initial request for chat data returned undefined");
        }
      }
    );

    DeskThing.fetch(
      { type: DiscordEvents.GET, request: "notification" },
      { type: DiscordEvents.NOTIFICATION, request: "set" },
      (notificationStatus) => {
        if (!isValid) return;

        if (notificationStatus) {
          dispatch({
            type: "SET_NOTIFICATION_STATUS",
            payload: notificationStatus,
          });
        } else {
          DeskThing.warn(
            "Initial request for notification data returned undefined"
          );
        }
      }
    );

    DeskThing.fetch(
      { type: DiscordEvents.GET, request: "guildList" },
      { type: DiscordEvents.GUILD_LIST, request: "set" },
      (guildList) => {
        if (!isValid) return;

        if (guildList) {
          dispatch({ type: "SET_GUILD_LIST", payload: guildList });
        } else {
          DeskThing.warn(
            "Initial request for guild list data returned undefined"
          );
        }
      }
    );

    // Set up event listeners
    const unsubscribeCallStatus = DeskThing.on(DiscordEvents.CALL, (event) => {
      if (!isValid) return;
      DeskThing.info("Got call information");

      if (event.request === "set" && event.payload) {
        DeskThing.info("Updating call", event);
        if (event.payload.user) {
          setIsLoading(false);
        }
        dispatch({ type: "SET_CALL_STATUS", payload: event.payload });
      } else if (event.request === "update" && event.payload) {
        dispatch({ type: "SET_TALKING_STATUS", payload: event.payload });
      }
    });

    const unsubscribeChatStatus = DeskThing.on(DiscordEvents.CHAT, (event) => {
      if (!isValid) return;
      if (event.request === "set" && event.payload) {
        DeskThing.info("Updating chat", event);
        dispatch({ type: "SET_CHAT_STATUS", payload: event.payload });
      }
    });

    const unsubscribeGuildStatus = DeskThing.on(
      DiscordEvents.GUILD_LIST,
      (event) => {
        if (!isValid) return;
        if (event.request === "set" && event.payload) {
          DeskThing.info("Updating chat", event);
          dispatch({ type: "SET_GUILD_LIST", payload: event.payload });
        }
      }
    );

    const unsubscribeChannelsStatus = DeskThing.on(
      DiscordEvents.CHANNELS,
      (event) => {
        if (!isValid) return;
        if (event.request === "set" && event.payload) {
          DeskThing.info("Updating chat", event);
          dispatch({
            type: "SET_CHANNELS_STATUS",
            payload: event.payload.channels,
          });
        }
      }
    );

    const unsubscribeNotification = DeskThing.on(
      DiscordEvents.NOTIFICATION,
      (event) => {
        if (!isValid) return;

        if (event.request != "set") return;

        if (event.payload) {
          DeskThing.info("Updating notification", event);
          dispatch({ type: "SET_NOTIFICATION_STATUS", payload: event.payload });
        }
      }
    );

    // Clean up listeners on unmount
    return () => {
      isValid = false;
      unsubscribeCallStatus();
      unsubscribeGuildStatus();
      unsubscribeChannelsStatus();
      unsubscribeChatStatus();
      unsubscribeNotification();
    };
  }, []);

  const callStatus = useMemo(() => state.callStatus, [state.callStatus]);
  const chatStatus = useMemo(() => state.chatStatus, [state.chatStatus]);
  const notificationStatus = useMemo(
    () => state.notificationStatus,
    [state.notificationStatus]
  );
  const guildList = useMemo(() => state.guildList, [state.guildList]);
  const channels = useMemo(
    () => state.guildList?.textChannels || [],
    [state.guildList?.textChannels]
  );

  const functionsContextMemo = useMemo(
    () => ({
      setSelectedGuildID,
      setSelectedChannelID,
      dispatch,
      getGuildList,
      markNotificationAsRead,
      markAllNotificationsAsRead,
    }),
    [
      setSelectedGuildID,
      setSelectedChannelID,
      dispatch,
      getGuildList,
      markNotificationAsRead,
      markAllNotificationsAsRead,
    ]
  );

  const dataContextMemo = useMemo(
    () => ({
      callStatus,
      chatStatus,
      notificationStatus,
      state,
      isLoading,
      guildList,
      channels,
    }),
    [
      callStatus,
      chatStatus,
      notificationStatus,
      state,
      isLoading,
      channels,
      guildList,
    ]
  );

  const fullContextMemo = useMemo(
    () => ({
      ...dataContextMemo,
      ...functionsContextMemo,
    }),
    [dataContextMemo, functionsContextMemo]
  );
  const memoizedChildren = useMemo(() => children, [children]);

  return (
    <AppStateContext.Provider value={fullContextMemo}>
      {memoizedChildren}
    </AppStateContext.Provider>
  );
};
