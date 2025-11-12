import { create } from "zustand";
import { CallStatus } from "@shared/types/discord";
import { createDeskThing } from "@deskthing/client";
import { DiscordEvents, ToClientTypes, ToServerTypes } from "@shared/types/transit";

type CallStoreState = {
  initialized: boolean;
  isLoading: boolean;
  callStatus: CallStatus | null;
  selfUserId: string | null;
  initialize: () => void;
  setCallStatus: (callStatus: CallStatus) => void;
  setTalkingStatus: (userId: string, isSpeaking: boolean) => void;
  refreshCallStatus: () => void;
  pollingIntervalId: ReturnType<typeof setInterval> | null;
};

const DeskThing = createDeskThing<ToClientTypes, ToServerTypes>();

export const useCallStore = create<CallStoreState>((set, get) => {
  const applyCallStatus = (incoming: CallStatus) => {
    set((state) => {
      const previousSelfId =
        state.selfUserId ?? state.callStatus?.user?.id ?? null;
      const resolvedSelfId = incoming.user?.id ?? previousSelfId;

      const resolvedUser =
        incoming.user ??
        (resolvedSelfId
          ? incoming.participants.find(
              (participant) => participant.id === resolvedSelfId
            ) ?? state.callStatus?.participants?.find(
              (participant) => participant.id === resolvedSelfId
            ) ?? state.callStatus?.user
          : state.callStatus?.user);

      return {
        callStatus: {
          ...incoming,
          user: resolvedUser ?? undefined,
        },
        selfUserId: resolvedSelfId ?? null,
        isLoading: false,
      };
    });
  };

  return {
    initialized: false,
    isLoading: true,
    callStatus: null,
    selfUserId: null,
    pollingIntervalId: null,

    initialize: () => {
      if (get().initialized) return;
      set({ initialized: true });

      // Initial fetch for call status
      get().refreshCallStatus();

      // Listen for call status updates
      DeskThing.on(DiscordEvents.CALL, (event) => {
        if (event.request === "set" && event.payload) {
          applyCallStatus(event.payload);
        } else if (event.request === "update" && event.payload) {
          get().setTalkingStatus(event.payload.userId, event.payload.isSpeaking);
        }
      });

      // Listen for call status updates
      DeskThing.on(DiscordEvents.VOICE_STATE, (event) => {
        if (event.request === "update" && event.payload) {
          set((state) => {
            const currentStatus = state.callStatus;
            if (!currentStatus) return {};

            const targetUserId =
              state.selfUserId ??
              currentStatus.user?.id ??
              (currentStatus.participants.length === 1
                ? currentStatus.participants[0].id
                : undefined);

            if (!targetUserId) {
              return {};
            }

            const participants = currentStatus.participants.map(
              (participant) =>
                participant.id === targetUserId
                  ? {
                      ...participant,
                      isDeafened: event.payload.isDeafened,
                      isMuted: event.payload.isMuted,
                    }
                  : participant
            );

            const updatedUser =
              currentStatus.user && currentStatus.user.id === targetUserId
                ? {
                    ...currentStatus.user,
                    isDeafened: event.payload.isDeafened,
                    isMuted: event.payload.isMuted,
                  }
                : participants.find(
                    (participant) => participant.id === targetUserId
                  );

            return {
              callStatus: {
                ...currentStatus,
                participants,
                user: updatedUser ?? currentStatus.user,
              },
              selfUserId: targetUserId,
            };
          });
        }
      });

      if (!get().pollingIntervalId) {
        const intervalId = setInterval(() => {
          get().refreshCallStatus();
        }, 2000);

        set({ pollingIntervalId: intervalId });
      }
    },

    setCallStatus: (callStatus) => {
      applyCallStatus(callStatus);
    },

    refreshCallStatus: () => {
      DeskThing.fetch(
        { type: DiscordEvents.GET, request: "call" },
        { type: DiscordEvents.CALL, request: "set" },
        (callStatus) => {
          if (callStatus?.payload) {
            applyCallStatus(callStatus.payload);
          }
        }
      );
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
            user:
              state.callStatus.user?.id === userId
                ? { ...state.callStatus.user, isSpeaking }
                : state.callStatus.user,
          },
        };
      });
    },
  };
});