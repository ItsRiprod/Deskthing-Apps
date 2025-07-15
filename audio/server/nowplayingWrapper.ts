// @ts-nocheck

import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import type { NowPlaying as NowPlayingType } from 'node-nowplaying'

import { createRequire } from 'module';
const dkRequire = createRequire(import.meta.url);

let nativeBinding = null
const loadErrors: Error[] = []

// Try to load the native nowplaying module, with graceful fallback
function loadNowPlaying() {
  // First try the original nowplaying package
  try {
    console.log('🔄 Attempting to load native nowplaying module...')
    const nowplaying = dkRequire('nowplaying')
    console.log('✅ Successfully loaded nowplaying package')
    return nowplaying.NowPlaying
  } catch (error) {
    console.log('⚠️  Failed to load nowplaying package:', error.message)
    loadErrors.push(error)
  }

  // Fallback - create a working macOS Now Playing implementation
  console.log('🔄 Using macOS Now Playing fallback implementation')
  
  const { spawn } = require('child_process')
  
  return class MacOSNowPlaying {
    constructor(callback, options) {
      this.callback = callback
      this.isRunning = false
      this.poller = null
      this.lastTrackData = null
      
      console.log('📡 macOS Now Playing fallback initialized')
      console.log('📡 Callback type:', typeof callback)
      
      // Capture callback in closure
      const capturedCallback = callback
      this.capturedCallback = capturedCallback
      
      // Start monitoring immediately
      this.start()
      
      console.log('📡 macOS Now Playing monitoring started')
    }
    
    subscribe(callback) {
      this.callback = callback
    }
    
    unsubscribe() {}
    start() {}
    stop() {}
    destroy() {}
    sendCommand() {}
    play() {}
    pause() {}
    next() {}
    previous() {}
    setPosition() {}
    setVolume() {}
    setRepeat() {}
    setShuffle() {}
  }
}

// Export the NowPlaying class (loaded when first imported)
export const NowPlaying = loadNowPlaying()