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
  updateLocalVoiceState: (update: {
    isMuted?: boolean;
    isDeafened?: boolean;
  }) => void;
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

export const useCallStore = create<CallStoreState>((set, get) => {
  const startPolling = () => {
    if (get().pollingIntervalId) return;

    const intervalId = setInterval(() => {
      get().refreshCallStatus();
    }, 2000);

    set({ pollingIntervalId: intervalId });
  };

  const stopPolling = () => {
    const intervalId = get().pollingIntervalId;

    if (intervalId) {
      clearInterval(intervalId);
      set({ pollingIntervalId: null });
    }
  };

  return {
    initialized: false,
    isLoading: true,
    callStatus: null,
    pollingIntervalId: null,

    updateLocalVoiceState: (update) => {
      set((state) => {
        if (!state.callStatus) return {};

        const targetUserId = state.callStatus.user?.id ?? state.selfUserId;
        if (!targetUserId) return {};

        const participantExists = state.callStatus.participants.some(
          (participant) => participant.id === targetUserId
        );

        const updatedParticipants = state.callStatus.participants.map(
          (participant) =>
            participant.id === targetUserId
              ? {
                  ...participant,
                  ...(update.isMuted !== undefined
                    ? { isMuted: update.isMuted }
                    : {}),
                  ...(update.isDeafened !== undefined
                    ? { isDeafened: update.isDeafened }
                    : {}),
                }
              : participant
        );

        const participants = participantExists
          ? updatedParticipants
          : [
              ...updatedParticipants,
              {
                id: targetUserId,
                username:
                  state.callStatus.user?.username ??
                  state.callStatus.user?.id ??
                  targetUserId,
                profileUrl: state.callStatus.user?.profileUrl,
                isSpeaking: false,
                isMuted: update.isMuted ?? false,
                isDeafened: update.isDeafened ?? false,
              },
            ];

        const nextUser =
          state.callStatus.user && state.callStatus.user.id === targetUserId
            ? {
                ...state.callStatus.user,
                ...(update.isMuted !== undefined
                  ? { isMuted: update.isMuted }
                  : {}),
                ...(update.isDeafened !== undefined
                  ? { isDeafened: update.isDeafened }
                  : {}),
              }
            : state.callStatus.user;

        return {
          callStatus: {
            ...state.callStatus,
            participants,
            ...(nextUser ? { user: nextUser } : {}),
          },
          selfUserId: targetUserId,
        };
      });
    },

    initialize: () => {
      if (get().initialized) return;
      set({ initialized: true });

      // Initial fetch for call status
      get().refreshCallStatus();

      // Listen for call status updates
      DeskThing.on(DiscordEvents.CALL, (event) => {
        if (event.request === "set" && event.payload) {
          get().setCallStatus(event.payload);
        } else if (event.request === "update" && event.payload) {
          get().setTalkingStatus(event.payload.userId, event.payload.isSpeaking);
        }
      });

      DeskThing.on(DiscordEvents.VOICE_STATE, (event) => {
        if (event.request === "update" && event.payload) {
          set((state) => {
            if (!state.callStatus) return {};

            const payload = event.payload as {
              userId?: string;
              username?: string;
              profileUrl?: string;
              isSpeaking?: boolean;
              isMuted?: boolean;
              isDeafened?: boolean;
            };

            if (!payload.userId) return {};

            const participantExists = state.callStatus.participants.some(
              (participant) => participant.id === payload.userId
            );

            const updatedParticipants = state.callStatus.participants.map(
              (participant) =>
                participant.id === payload.userId
                  ? {
                      ...participant,
                      isDeafened: payload.isDeafened,
                      isMuted: payload.isMuted,
                    }
                  : participant
            );

            const participants = participantExists
              ? updatedParticipants
              : [
                  ...updatedParticipants,
                  {
                    id: payload.userId,
                    username: payload.username ?? payload.userId,
                    profileUrl: payload.profileUrl,
                    isSpeaking: payload.isSpeaking ?? false,
                    isMuted: payload.isMuted ?? false,
                    isDeafened: payload.isDeafened ?? false,
                  },
                ];

            const shouldUpdateUser =
              state.callStatus.user?.id === payload.userId ||
              state.selfUserId === payload.userId;

            const nextUser = shouldUpdateUser
              ? state.callStatus.user &&
                state.callStatus.user.id === payload.userId
                ? {
                    ...state.callStatus.user,
                    isDeafened: payload.isDeafened,
                    isMuted: payload.isMuted,
                  }
                :
                  participants.find(
                    (participant) => participant.id === payload.userId
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
              isLoading: false,
            };
          });
        }
      });

      startPolling();
    },

    setCallStatus: (callStatus) => {
      if (!callStatus.isConnected) {
        stopPolling();
        set({ callStatus: null, selfUserId: null, isLoading: false });
        return;
      }

      set((state) => {
        const normalized = normalizeCallStatus(callStatus, state);
        return {
          callStatus: normalized.callStatus,
          selfUserId: normalized.selfUserId,
          isLoading: false,
        };
      });

      startPolling();
    },

    refreshCallStatus: () => {
      DeskThing.fetch(
        { type: DiscordEvents.GET, request: "call" },
        { type: DiscordEvents.CALL, request: "set" },
        (callStatus) => {
          if (!callStatus || !callStatus.payload?.isConnected) {
            stopPolling();
            set({ callStatus: null, selfUserId: null, isLoading: false });
            return;
          }

          set((state) => {
            const normalized = normalizeCallStatus(callStatus.payload, state);
            return {
              callStatus: normalized.callStatus,
              selfUserId: normalized.selfUserId,
              isLoading: false,
            };
          });

          startPolling();
        }
      );
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
  };
});