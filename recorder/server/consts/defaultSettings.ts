import { SETTING_TYPES } from "@deskthing/types";
import { RawRecorderSettingsType, RECORDER_SETTING_IDS } from "../../shared/types";

export const DefaultRecorderSettings: RawRecorderSettingsType = {
  [RECORDER_SETTING_IDS.AUDIO_FORMAT]: {
    id: RECORDER_SETTING_IDS.AUDIO_FORMAT,
    label: 'Audio Format',
    type: SETTING_TYPES.SELECT,
    value: 'wav',
    options: [
      { label: 'WAV', value: 'wav' },
      { label: 'MP3', value: 'mp3' },
    ]
  },
  [RECORDER_SETTING_IDS.SAMPLE_RATE]: {
    id: RECORDER_SETTING_IDS.SAMPLE_RATE,
    label: 'Sample Rate',
    type: SETTING_TYPES.SELECT,
    value: '16000',
    options: [
      { label: '44.1 kHz', value: '44100' },
      { label: '48 kHz', value: '48000' },
      { label: '16 kHz', value: '16000' },
    ],
    description: 'The number of samples of audio carried per second.'
  },
  [RECORDER_SETTING_IDS.CHANNELS]: {
    id: RECORDER_SETTING_IDS.CHANNELS,
    label: 'Channels',
    type: SETTING_TYPES.SELECT,
    value: '2',
    options: [
      { label: 'Mono', value: '1' },
      { label: 'Stereo', value: '2' },
    ],
    description: 'The number of audio channels.'
  },
  [RECORDER_SETTING_IDS.BITS_PER_SAMPLE]: {
    id: RECORDER_SETTING_IDS.BITS_PER_SAMPLE,
    label: 'Bits Per Sample',
    type: SETTING_TYPES.SELECT,
    value: '16',
    options: [
      { label: '16-bit', value: '16' },
      { label: '24-bit', value: '24' },
    ],
    description: 'The number of bits used for each audio sample.'
  },
  [RECORDER_SETTING_IDS.CHUNK_DURATION]: {
    id: RECORDER_SETTING_IDS.CHUNK_DURATION,
    label: 'Chunk Duration (seconds)',
    type: SETTING_TYPES.NUMBER,
    value: 5,
    min: 0.5,
    max: 60,
    description: 'The duration of each audio chunk in seconds.'
  },
}