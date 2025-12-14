import { createDeskThing } from "@deskthing/client";
import { create } from "zustand";
import {
  RecordingList,
  SERVER_TYPE,
  CLIENT_TYPE,
  ToClientData,
  ToServerData,
} from "@shared/index";

const DeskThing = createDeskThing<ToClientData, ToServerData>();

interface InputState {
  // which event types we've attached DOM listeners for
  recordings: RecordingList;
  initialized: boolean;

  init: () => Promise<void>;
  startRecording: (recordingId: string) => void;
  stopRecording: (recordingId: string) => void;
  startPlayback: (recordingId: string) => void;
  stopPlayback: (recordingId: string) => void;
  fetchRecordingsList: () => Promise<RecordingList | undefined>;
}

export const useRecordingStore = create<InputState>((set, get) => {
  return {
    initialized: false,
    recordings: [],

    init: async () => {
      if (get().initialized) return;
      set({ initialized: true });

      DeskThing.on(SERVER_TYPE.RECORDINGS, (data) => {
        switch (data.request) {
          case "list":
            set({ recordings: data.payload });
            break;
          case "update":
            {
              set((state) => {
                const updatedRecording = data.payload;
                const existingIndex = state.recordings.findIndex(
                  (r) => r.id === updatedRecording.id
                );
                let newRecordings: RecordingList;
                if (existingIndex !== -1) {
                  // Update existing recording
                  newRecordings = [...state.recordings];
                  newRecordings[existingIndex] = updatedRecording;
                } else {
                  // Add new recording
                  newRecordings = [...state.recordings, updatedRecording];
                }
                return { recordings: newRecordings };
              });
            }
            break;
        }
      });
    },

    startRecording: (recordingId: string) => {
      DeskThing.send({
        type: CLIENT_TYPE.RECORDINGS,
        request: "setRecording",
        payload: { recordingId, isRecording: true },
      });
    },
    stopRecording: (recordingId: string) => {
      DeskThing.send({
        type: CLIENT_TYPE.RECORDINGS,
        request: "setRecording",
        payload: { recordingId, isRecording: false },
      });
    },

    startPlayback: (recordingId: string) => {
      DeskThing.send({
        type: CLIENT_TYPE.RECORDINGS,
        request: "setPlaying",
        payload: { recordingId, isPlaying: true },
      });
    },

    stopPlayback: (recordingId: string) => {
      DeskThing.send({
        type: CLIENT_TYPE.RECORDINGS,
        request: "setPlaying",
        payload: { recordingId, isPlaying: false },
      });
    },

    fetchRecordingsList: async () => {
      const recordings = await DeskThing.fetch(
        {
          type: CLIENT_TYPE.RECORDINGS,
          request: "getRecordings",
          payload: undefined,
        },
        {
          type: SERVER_TYPE.RECORDINGS,
          request: "list",
        },
      );
      return recordings?.payload
    },
  };
});
