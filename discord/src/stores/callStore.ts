import { create } from "zustand";
import { CallStatus } from "@shared/types/discord";
import { createDeskThing } from "@deskthing/client";
import { DiscordEvents, ToClientTypes, ToServerTypes } from "@shared/types/transit";

type CallStoreState = {
  initialized: boolean;
  isLoading: boolean;
  callStatus: CallStatus | null;
  selfUserId: string | null;
  pollingIntervalId: ReturnType<typeof setInterval> | null;
  initialize: () => void;
  refreshCallStatus: () => void;
  setCallStatus: (callStatus: CallStatus) => void;
  setTalkingStatus: (userId: string, isSpeaking: boolean) => void;
};

const normalizeCallStatus = (
  incoming: CallStatus,
  state: Pick<CallStoreState, "callStatus" | "selfUserId">
): { callStatus: CallStatus; selfUserId: string | null } => {
  const previousStatus = state.callStatus;
  const resolvedSelfId =
    state.selfUserId ??
    incoming.user?.id ??
    previousStatus?.user?.id ??
    (incoming.participants.length === 1
      ? incoming.participants[0]?.id ?? null
      : null);

  if (!resolvedSelfId) {
    return { callStatus: incoming, selfUserId: null };
  }

  const incomingParticipants = incoming.participants ?? [];
  const incomingParticipant = incomingParticipants.find(
    (participant) => participant.id === resolvedSelfId
  );
  const previousParticipant = previousStatus?.participants.find(
    (participant) => participant.id === resolvedSelfId
  );

  const resolvedUser =
    incoming.user && incoming.user.id === resolvedSelfId
      ? incoming.user
      : incomingParticipant ??
        incoming.user ??
        previousParticipant ??
        previousStatus?.user ??
        null;

  const participantSource =
    resolvedUser ?? incomingParticipant ?? previousParticipant ?? null;

  const participants = participantSource
    ? incomingParticipants.map((participant) =>
        participant.id === resolvedSelfId
          ? {
              ...participant,
              isMuted:
                participantSource.isMuted ?? participant.isMuted,
              isDeafened:
                participantSource.isDeafened ?? participant.isDeafened,
            }
          : participant
      )
    : incomingParticipants;

  const updatedParticipant = participants.find(
    (participant) => participant.id === resolvedSelfId
  );

  const user = (() => {
    if (!resolvedUser && !updatedParticipant) {
      return undefined;
    }

    const base = resolvedUser ?? updatedParticipant!;
    return {
      ...base,
      isMuted:
        updatedParticipant?.isMuted ??
        resolvedUser?.isMuted ??
        base.isMuted,
      isDeafened:
        updatedParticipant?.isDeafened ??
        resolvedUser?.isDeafened ??
        base.isDeafened,
    };
  })();

  return {
    callStatus: {
      ...incoming,
      participants,
      ...(user ? { user } : {}),
    },
    selfUserId: resolvedSelfId,
  };
};

const DeskThing = createDeskThing<ToClientTypes, ToServerTypes>();

export const useCallStore = create<CallStoreState>((set, get) => ({
  initialized: false,
  isLoading: true,
  callStatus: null,
  selfUserId: null,
  pollingIntervalId: null,

  initialize: () => {
    if (get().initialized) return;
    set({ initialized: true });

    get().refreshCallStatus();

    // Listen for call status updates
    DeskThing.on(DiscordEvents.CALL, (event) => {
      if (event.request === "set" && event.payload) {
        set((state) => {
          const normalized = normalizeCallStatus(event.payload, state);
          return {
            callStatus: normalized.callStatus,
            selfUserId: normalized.selfUserId,
            isLoading: false,
          };
        });
      } else if (event.request === "update" && event.payload) {
        get().setTalkingStatus(event.payload.userId, event.payload.isSpeaking);
      }
    });

    DeskThing.on(DiscordEvents.VOICE_STATE, (event) => {
      if (event.request === "update" && event.payload) {
        set((state) => {
          if (!state.callStatus) return {};

          const participants = state.callStatus.participants.map(
            (participant) =>
              participant.id === event.payload.userId
                ? {
                    ...participant,
                    isDeafened: event.payload.isDeafened,
                    isMuted: event.payload.isMuted,
                  }
                : participant
          );

          const shouldUpdateUser =
            state.callStatus.user?.id === event.payload.userId ||
            state.selfUserId === event.payload.userId;

          const nextUser = shouldUpdateUser
            ? state.callStatus.user &&
              state.callStatus.user.id === event.payload.userId
              ? {
                  ...state.callStatus.user,
                  isDeafened: event.payload.isDeafened,
                  isMuted: event.payload.isMuted,
                }
              :
                participants.find(
                  (participant) => participant.id === event.payload.userId
                ) ?? state.callStatus.user
            : state.callStatus.user;

          return {
            callStatus: {
              ...state.callStatus,
              participants,
              ...(nextUser ? { user: nextUser } : {}),
            },
            selfUserId: shouldUpdateUser
              ? event.payload.userId
              : state.selfUserId,
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

  refreshCallStatus: () => {
    DeskThing.fetch(
      { type: DiscordEvents.GET, request: "call" },
      { type: DiscordEvents.CALL, request: "set" },
      (callStatus) => {
        if (!callStatus?.payload) return;

        set((state) => {
          const normalized = normalizeCallStatus(callStatus.payload, state);
          return {
            callStatus: normalized.callStatus,
            selfUserId: normalized.selfUserId,
            isLoading: false,
          };
        });
      }
    );
  },

  setCallStatus: (callStatus) => {
    set((state) => {
      const normalized = normalizeCallStatus(callStatus, state);
      return {
        callStatus: normalized.callStatus,
        selfUserId: normalized.selfUserId,
        isLoading: false,
      };
    });
  },

  setTalkingStatus: (userId, isSpeaking) => {
    set((state) => {
      if (!state.callStatus) return {};

      const participants = state.callStatus.participants.map((participant) =>
        participant.id === userId
          ? { ...participant, isSpeaking }
          : participant
      );

      const shouldUpdateUser =
        state.callStatus.user?.id === userId || state.selfUserId === userId;

      const nextUser = shouldUpdateUser
        ? state.callStatus.user && state.callStatus.user.id === userId
          ? { ...state.callStatus.user, isSpeaking }
          : participants.find((participant) => participant.id === userId) ??
            state.callStatus.user
        : state.callStatus.user;

      return {
        callStatus: {
          ...state.callStatus,
          participants,
          ...(nextUser ? { user: nextUser } : {}),
        },
        selfUserId: shouldUpdateUser ? userId : state.selfUserId,
      };
    });
  },
}));