import { createDeskThing } from "@deskthing/server";
import {
  CLIENT_TYPE,
  RecordingEntry,
  RecordingList,
  SERVER_TYPE,
  ToClientData,
  ToServerData,
} from "../../shared/index";
import { DESKTHING_EVENTS } from "@deskthing/types";

const DeskThing = createDeskThing<ToServerData, ToClientData>();

class RecordingStore {
  private static instance: RecordingStore;

  private constructor() {}

  private recordingsList: Record<string, RecordingEntry> = {};
  public init = async () => {
    await this.getRecordingsFromFile();
    await this.setupListeners();
    console.log('RecordingStore initialized');
  };

  public exit = async () => {
    // stop and save recordings

    const recordings = this.getRecordings();

    await DeskThing.saveData({
      recordingData: recordings,
    });
  };

  public static getInstance(): RecordingStore {
    if (!RecordingStore.instance) {
      RecordingStore.instance = new RecordingStore();
    }
    return RecordingStore.instance;
  }

  private isRecordingData = (data: unknown): data is RecordingList => {
    return (
      Array.isArray(data) && data.every((item) => typeof item.id === "string")
    );
  };

  private setupListeners = async () => {
    DeskThing.on(CLIENT_TYPE.RECORDINGS, async (data) => {
      switch (data.request) {
        case "getRecordings": {
          const recordings = this.getRecordings();
          DeskThing.send({
            clientId: data.clientId,
            type: SERVER_TYPE.RECORDINGS,
            request: "list",
            payload: recordings,
          });
          break;
        }
        case "setPlaying": {
          this.setPlaying(data.payload.recordingId, data.payload.isPlaying);
          break;
        }
        case "setRecording": {
          this.setRecording(data.payload.recordingId, data.payload.isRecording);
          break;
        }
      }
    });
  };

  private getRecordingsFromFile = async () => {
    DeskThing.on(DESKTHING_EVENTS.DATA, (data) => {
      const savedData = data.payload;

      if (savedData && "recordingData" in savedData) {
        if (!this.isRecordingData(savedData.recordingData)) {
          console.error("Invalid recording data format received.");
          return;
        }
        savedData.recordingData.forEach((updatedRecording) => {
          // sanitize the data as it comes in to clear the flag artifacts
          this.recordingsList[updatedRecording.id] = {
            ...updatedRecording,
            isPlaying: false,
            isRecording: false,
          };
        });
        this.sendRecordingList();
      }
    });
    DeskThing.getData();
  };

  private sendRecordingList = () => {
    const recordingList = Object.values(this.recordingsList);

    DeskThing.send({
      type: SERVER_TYPE.RECORDINGS,
      request: "list",
      payload: recordingList,
    });
  };

  public getRecordings = (): RecordingList => {
    return Object.values(this.recordingsList);
  };

  public setPlaying = (recordingId: string, isPlaying: boolean) => {
    this.recordingsList[recordingId] = {
      ...this.recordingsList[recordingId],
      isPlaying: isPlaying,
    };
    this.sendRecordingList();

    // handle start/stop playing logic
  };

  public setRecording = (recordingId: string, isRecording: boolean) => {
    const existingRecording = this.recordingsList[recordingId];
    if (!existingRecording) {
      // Create a new blank RecordingEntry if not found
      const newRecording: RecordingEntry = {
        id: recordingId,
        isRecording,
        isPlaying: false, // Assuming default values; adjust as needed
      };
      this.recordingsList[recordingId] = newRecording;
    } else {
      // Update existing recording
      this.recordingsList[recordingId] = {
        ...this.recordingsList[recordingId],
        isRecording,
      };
    }
    this.sendRecordingList();
  };

  public addRecording = (updatedRecording: RecordingEntry) => {
    this.recordingsList[updatedRecording.id] = updatedRecording;
    this.sendRecordingList();
  };
}

export const recordingsStore = RecordingStore.getInstance();
