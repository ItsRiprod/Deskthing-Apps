import { create } from 'zustand'
import { AudioBackendStatus, AudioBackendType, audioManager, MicConfig } from '@deskthing/microphone'
import { DeskThing } from '@deskthing/client'

export type MicrophoneStoreState = {
  provider: AudioBackendType
  status: AudioBackendStatus
  audioChunks: number
  bytesReceived: number
  micConfig: MicConfig
  errorMsg?: string
  initialized: boolean

  init: () => Promise<void>
  retryBackend: () => Promise<void>
  reconfigureAudio: () => void
  openMic: () => void
  closeMic: () => void
  setMicConfig: (config: Partial<MicConfig>) => void
}

export const useMicrophoneStore = create<MicrophoneStoreState>((set, get) => ({
  provider: 'unset',
  status: 'disconnected',
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

  init: async () => {
    if (get().initialized) return
    set({ initialized: true })

    audioManager.onMicStateChange((newState) => {
      set((state) => ({
        micConfig: {
          ...state.micConfig,
          ...newState
        },
        provider: newState.backend,
        status: newState.status,
        audioChunks: newState.audioChunks,
        bytesReceived: newState.bytesReceived,
      }))
    })

    audioManager.onAudioPacket((chunk) => {
      // send it straight to the server
      DeskThing.sendBinary(chunk)
    })

    await audioManager.retryBackend()
    audioManager.configureMic(get().micConfig)
  },

  retryBackend: async () => {
    await audioManager.retryBackend()
  },

  reconfigureAudio: () => {
    audioManager.configureMic(get().micConfig)
  },

  openMic: async () => {
    try {
      console.log('Opening mic...')
      await audioManager.openMic()
      console.log('Mic opened successfully')
    } catch (error) {
      console.error('Error opening microphone:', error)
    }
  },

  closeMic: async () => {
    try {
      console.log('Closing mic...')
      await audioManager.closeMic()
      console.log('Mic closed successfully')
    } catch (error) {
      console.error('Error closing microphone:', error)
    }
  },

  setMicConfig: (config) => {
    set((state) => ({
      micConfig: { ...state.micConfig, ...config }
    }))
    audioManager.configureMic({ ...get().micConfig, ...config })
  }
}))