import { FileType, SETTING_TYPES, SettingsType } from "@deskthing/types";

export enum RECORDER_SETTING_IDS {
  AUDIO_FORMAT = "audio_format",
  SAMPLE_RATE = "sample_rate",
  CHANNELS = "channels",
  BITS_PER_SAMPLE = "bits_per_sample",
  CHUNK_DURATION = "chunk_duration",
  SAVE_LOCATION = "save_location",
}

export type RecorderSettingsType = {
  [RECORDER_SETTING_IDS.AUDIO_FORMAT]: string;
  [RECORDER_SETTING_IDS.SAMPLE_RATE]: string;
  [RECORDER_SETTING_IDS.CHANNELS]: string;
  [RECORDER_SETTING_IDS.BITS_PER_SAMPLE]: number;
  [RECORDER_SETTING_IDS.CHUNK_DURATION]: number;
  [RECORDER_SETTING_IDS.SAVE_LOCATION]: string;
};

export type RawRecorderSettingsType = {
  [RECORDER_SETTING_IDS.AUDIO_FORMAT]: SettingsType & {
    type: SETTING_TYPES.SELECT;
    id: RECORDER_SETTING_IDS.AUDIO_FORMAT;
  };
  [RECORDER_SETTING_IDS.SAMPLE_RATE]: SettingsType & {
    type: SETTING_TYPES.SELECT;
    id: RECORDER_SETTING_IDS.SAMPLE_RATE;
  };
  [RECORDER_SETTING_IDS.CHANNELS]: SettingsType & {
    type: SETTING_TYPES.SELECT;
    id: RECORDER_SETTING_IDS.CHANNELS;
  };
  [RECORDER_SETTING_IDS.BITS_PER_SAMPLE]: SettingsType & {
    type: SETTING_TYPES.SELECT;
    id: RECORDER_SETTING_IDS.BITS_PER_SAMPLE;
  };
  [RECORDER_SETTING_IDS.CHUNK_DURATION]: SettingsType & {
    type: SETTING_TYPES.NUMBER;
    id: RECORDER_SETTING_IDS.CHUNK_DURATION;
  };
  [RECORDER_SETTING_IDS.SAVE_LOCATION]: SettingsType & {
    type: SETTING_TYPES.FILE;
    id: RECORDER_SETTING_IDS.SAVE_LOCATION;
    fileTypes: FileType[]
    
  };
};