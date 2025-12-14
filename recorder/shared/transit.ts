import { RecordingEntry, RecordingList } from "./recordings";
import { RawRecorderSettingsType } from "./types";

export enum CLIENT_TYPE {
  RECORDINGS = "recordings",
  SETTINGS = "recorder-settings",
}

export enum SERVER_TYPE {
  RECORDINGS = "recordings",
}

export type ToClientData =
  | {
      type: SERVER_TYPE.RECORDINGS;
      request: "list";
      payload: RecordingList;
    }
  | {
      type: SERVER_TYPE.RECORDINGS;
      request: "update"; // a single recording has changed
      payload: RecordingEntry;
    };

export type ToServerData =
  | {
      type: CLIENT_TYPE.RECORDINGS;
      request: "setPlaying";
      payload: { recordingId: string; isPlaying: boolean };
      clientId?: string;
    }
  | {
      type: CLIENT_TYPE.RECORDINGS;
      request: "getRecordings";
      payload: undefined;
      clientId?: string;
    }
  | {
      type: CLIENT_TYPE.RECORDINGS;
      request: "setRecording";
      payload: { recordingId: string; isRecording: boolean };
      clientId?: string;
    }
  | {
      type: CLIENT_TYPE.SETTINGS;
      request: 'set';
      payload: RawRecorderSettingsType;
      clientId?: string;
    };
