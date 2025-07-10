import { create } from "zustand";
import { CallStatus } from "@shared/types/discord";
import { createDeskThing } from "@deskthing/client";
import { DiscordEvents, ToClientTypes, ToServerTypes } from "@shared/types/transit";

type CallStoreState = {
  initialized: boolean;
  isLoading: boolean;
  callStatus: CallStatus | null;
  initialize: () => void;
  setCallStatus: (callStatus: CallStatus) => void;
  setTalkingStatus: (userId: string, isSpeaking: boolean) => void;
};

const DeskThing = createDeskThing<ToClientTypes, ToServerTypes>();

export const useCallStore = create<CallStoreState>((set, get) => ({
  initialized: false,
  isLoading: true,
  callStatus: null,

  initialize: () => {
    if (get().initialized) return;
    set({ initialized: true });

    // Initial fetch for call status
    DeskThing.fetch(
      { type: DiscordEvents.GET, request: "call" },
      { type: DiscordEvents.CALL, request: "set" },
      (callStatus) => {
        if (callStatus) set({ callStatus: callStatus.payload, isLoading: false });
      }
    );

    // Listen for call status updates
    DeskThing.on(DiscordEvents.CALL, (event) => {
      if (event.request === "set" && event.payload) {
        set({ callStatus: event.payload, isLoading: false });
      } else if (event.request === "update" && event.payload) {
        get().setTalkingStatus(event.payload.userId, event.payload.isSpeaking);
      }
    });

    // Listen for call status updates
    DeskThing.on(DiscordEvents.VOICE_STATE, (event) => {
      if (event.request === "update" && event.payload) {
        set((state) => {
          if (!state.callStatus || !state.callStatus.user) return {};
          // Ensure all required fields are present and not undefined
          return {
            callStatus: {
              ...state.callStatus,
              user: {
                ...state.callStatus.user,
                isDeafened: event.payload.isDeafened,
                isMuted: event.payload.isMuted,
              },
            },
          };
        });
      }
    });
  },

  setCallStatus: (callStatus) => {
    set({ callStatus });
  },

  setTalkingStatus: (userId, isSpeaking) => {
    set((state) => {
      if (!state.callStatus) return {};
      return {
        callStatus: {
          ...state.callStatus,
          participants: state.callStatus.participants.map((participant) =>
            participant.id === userId
              ? { ...participant, isSpeaking }
              : participant
          ),
          user: state.callStatus.user?.id === userId
            ? { ...state.callStatus.user, isSpeaking }
            : state.callStatus.user,
        },
      };
    });
  },
}));