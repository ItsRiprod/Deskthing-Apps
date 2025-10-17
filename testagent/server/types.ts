// Shared types for the voice assistant

import { AgentMessage } from "@deskthing/types"

export interface WhisperSegment {
  start: string   // "00:00:14.310"
  end: string     // "00:00:16.480"
  speech: string  // "transcribed text"
}

export interface AudioFormat {
  channels: number
  sampleRate: number
  bitsPerSample: number
}

export type AgentHistory = Record<string, AgentMessage[]>

export interface VoiceAssistantConfig {
  maxHistoryLength: number
  modelName: string
  speakResponses: boolean
  prompt: string
}