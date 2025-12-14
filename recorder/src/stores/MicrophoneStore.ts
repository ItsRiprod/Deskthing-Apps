import { create } from "zustand";
import {
  AudioBackendStatus,
  AudioBackendType,
  audioManager,
  MicConfig,
} from "@deskthing/microphone";
import { createDeskThing } from "@deskthing/client";
import { AppSettings, DEVICE_CLIENT, SETTING_TYPES } from "@deskthing/types";
import { RawRecorderSettingsType, RECORDER_SETTING_IDS } from "@shared/types";
import { DefaultRecorderSettings } from "@shared/consts/defaultSettings";
import { CLIENT_TYPE, ToClientData, ToServerData } from "@shared/transit";

const DeskThing = createDeskThing<ToClientData, ToServerData>();

export type MicrophoneStoreState = {
  provider: AudioBackendType;
  status: AudioBackendStatus;
  audioChunks: number;
  bytesReceived: number;
  micConfig: MicConfig;
  errorMsg?: string;
  initialized: boolean;

  baseSettings: RawRecorderSettingsType;

  init: () => Promise<void>;
  retryBackend: () => Promise<void>;
  reconfigureAudio: () => void;
  openMic: () => void;
  closeMic: () => void;
  setMicConfig: (config: Partial<MicConfig>) => void;
};

export const useMicrophoneStore = create<MicrophoneStoreState>((set, get) => {
  const normalizeSettings = (
    settings: AppSettings
  ): RawRecorderSettingsType => {
    const normalized: RawRecorderSettingsType = Object.fromEntries(
      Object.values([
        RECORDER_SETTING_IDS.SAMPLE_RATE,
        RECORDER_SETTING_IDS.CHANNELS,
        RECORDER_SETTING_IDS.BITS_PER_SAMPLE,
        RECORDER_SETTING_IDS.CHUNK_DURATION,
      ]).map((key) => {
        const setting = settings[key];
        if (setting && setting.type == DefaultRecorderSettings[key].type) {
          return [key, setting];
        } else {
          return [key, DefaultRecorderSettings[key]];
        }
      })
    ) as RawRecorderSettingsType;

    return normalized;
  };

  const getMicConfigFromSettings = (
    settings: AppSettings
  ): Partial<MicConfig> => {
    const micConfigUpdates: Partial<MicConfig> = {};
    if (
      settings[RECORDER_SETTING_IDS.SAMPLE_RATE] &&
      settings[RECORDER_SETTING_IDS.SAMPLE_RATE].type === SETTING_TYPES.NUMBER
    ) {
      micConfigUpdates.sampleRate =
        settings[RECORDER_SETTING_IDS.SAMPLE_RATE].value;
    }
    if (
      settings[RECORDER_SETTING_IDS.CHANNELS] &&
      settings[RECORDER_SETTING_IDS.CHANNELS].type === SETTING_TYPES.NUMBER
    ) {
      micConfigUpdates.channelCount =
        settings[RECORDER_SETTING_IDS.CHANNELS].value;
    }
    if (
      settings[RECORDER_SETTING_IDS.BITS_PER_SAMPLE] &&
      settings[RECORDER_SETTING_IDS.BITS_PER_SAMPLE].type ===
        SETTING_TYPES.NUMBER
    ) {
      micConfigUpdates.bytesPerSample =
        settings[RECORDER_SETTING_IDS.BITS_PER_SAMPLE].value / 8;
    }
    if (
      settings[RECORDER_SETTING_IDS.CHUNK_DURATION] &&
      settings[RECORDER_SETTING_IDS.CHUNK_DURATION].type ===
        SETTING_TYPES.NUMBER
    ) {
      micConfigUpdates.secondsPerChunk =
        settings[RECORDER_SETTING_IDS.CHUNK_DURATION].value;
    }
    return micConfigUpdates;
  };

  const getUpdatedSettings = (
    micConfig: MicConfig
  ): RawRecorderSettingsType => {
    const updatedSettings: RawRecorderSettingsType = { ...get().baseSettings };

    if (micConfig.sampleRate)
      updatedSettings[RECORDER_SETTING_IDS.SAMPLE_RATE].value = String(
        micConfig.sampleRate
      );
    if (micConfig.channelCount)
      updatedSettings[RECORDER_SETTING_IDS.CHANNELS].value = String(
        micConfig.channelCount
      );

    if (micConfig.bytesPerSample)
      updatedSettings[RECORDER_SETTING_IDS.BITS_PER_SAMPLE].value = String(
        micConfig.bytesPerSample * 8
      );
    if (micConfig.secondsPerChunk)
      updatedSettings[RECORDER_SETTING_IDS.CHUNK_DURATION].value =
        micConfig.secondsPerChunk;

    return updatedSettings;
  };

  return {
    provider: "unset",
    status: "disconnected",
    audioChunks: 0,
    bytesReceived: 0,
    micConfig: {
      sampleRate: 16000,
      channelCount: 1,
      bytesPerSample: 2,
      secondsPerChunk: 1,
    },
    errorMsg: undefined,
    initialized: false,

    baseSettings: DefaultRecorderSettings,

    init: async () => {
      if (get().initialized) return;
      set({ initialized: true });

      audioManager.onMicStateChange((newState) => {
        set((state) => ({
          micConfig: {
            ...state.micConfig,
            ...newState,
          },
          provider: newState.backend,
          status: newState.status,
          audioChunks: newState.audioChunks,
          bytesReceived: newState.bytesReceived,
        }));
      });

      DeskThing.on(DEVICE_CLIENT.SETTINGS, (data) => {
        if (data.payload) {
          const settings = data.payload;
          console.log("Received updated settings:", settings);

          const micConfigUpdates: Partial<MicConfig> =
            getMicConfigFromSettings(settings);

          if (Object.keys(micConfigUpdates).length > 0) {
            set((state) => ({
              micConfig: { ...state.micConfig, ...micConfigUpdates },
            }));
          }

          set({ baseSettings: normalizeSettings(settings) });
        }
      });

      // request, but handle in the event above
      DeskThing.getSettings();

      audioManager.onAudioPacket((chunk) => {
        // send it straight to the server
        console.log("Sending audio chunk of size", chunk.byteLength);
        DeskThing.sendBinary(chunk);
      });

      await audioManager.retryBackend();
      audioManager.configureMic(get().micConfig);
    },

    retryBackend: async () => {
      await audioManager.retryBackend();
    },

    reconfigureAudio: () => {
      audioManager.configureMic(get().micConfig);
    },

    openMic: async () => {
      try {
        console.log("Opening mic...");

        // configure the mic right before loading
        audioManager.configureMic(get().micConfig);
        await audioManager.openMic();
        console.log("Mic opened successfully");
      } catch (error) {
        console.error("Error opening microphone:", error);
      }
    },

    closeMic: async () => {
      try {
        console.log("Closing mic...");
        await audioManager.closeMic();
        console.log("Mic closed successfully");
      } catch (error) {
        console.error("Error closing microphone:", error);
      }
    },

    setMicConfig: (config) => {

      const combinedMicConfig = { ...get().micConfig, ...config };

      set({ micConfig: combinedMicConfig });

      // update the settings as well with the new info

      const settings = getUpdatedSettings(combinedMicConfig)

      set({ baseSettings: settings });

      DeskThing.send({
        type: CLIENT_TYPE.SETTINGS,
        request: "set",
        payload: settings,
      });
    },
  };
});
