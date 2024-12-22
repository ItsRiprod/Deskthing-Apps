type ACTION_TYPES = "speaking" | "connect" | "disconnect" | "update" | "status";

export interface UserData {
  user_id: string;
  username?: string;
  nick?: string;
  speaking?: boolean;
  volume?: number;
  avatar?: string;
  mute?: boolean;
  deaf?: boolean;
  profile?: string;
}

export interface Device {
  id: string;
  name: string;
}

export interface VoiceSettingsInput {
  device_id: string;
  volume: number; // min: 0, max: 100
  available_devices: Device[];
}

export interface VoiceSettingsOutput {
  device_id: string;
  volume: number; // min: 0, max: 200
  available_devices: Device[];
}

export interface ShortcutKeyCombo {
  type: number; // see key types
  code: number; // key code
  name: string; // key name
}

export interface VoiceSettingsMode {
  type: string; // can be PUSH_TO_TALK or VOICE_ACTIVITY
  auto_threshold: boolean;
  threshold: number; // min: -100, max: 0
  shortcut: ShortcutKeyCombo;
  delay: number; // min: 0, max: 2000
}

export interface ClientVoiceState {
  input: VoiceSettingsInput;
  output: VoiceSettingsOutput;
  mode: VoiceSettingsMode;
  automatic_gain_control: boolean;
  echo_cancellation: boolean;
  noise_suppression: boolean;
  qos: boolean;
  silence_warning: boolean;
  mute: boolean;
  deaf: boolean;
}

export interface UserVoiceState {
  user_id: string;
  mute?: boolean;
  volume?: number;
  pan?: {
    left: number;
    right: number;
  };
}

export type discordData = {
  action: ACTION_TYPES;
  user: User;
  voice_state: ClientVoiceState;
  speaking: boolean;
  nick: string;
  volume: number;
  mute: boolean;
  [key: string]: string | boolean | undefined | User | UserVoiceState | number;
};
