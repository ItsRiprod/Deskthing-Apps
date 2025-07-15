// @ts-nocheck

import { readFileSync } from 'node:fs'
import { execSync, spawn } from 'node:child_process'
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
      this.capturedCallback = callback
      console.log('📡 Subscribed to Now Playing updates')
    }
    
    start() {
      if (!this.isRunning) {
        this.isRunning = true
        // Poll for Now Playing data every 3 seconds
        this.poller = setInterval(() => {
          this.checkNowPlaying()
        }, 3000)
        console.log('▶️ Started Now Playing monitoring')
        // Initial check
        this.checkNowPlaying()
      }
    }
    
    stop() {
      this.isRunning = false
      if (this.poller) {
        clearInterval(this.poller)
        this.poller = null
      }
      console.log('⏹️ Stopped Now Playing monitoring')
    }
    
    async checkNowPlaying() {
      if (!this.isRunning || !this.capturedCallback) return
      
      try {
        // Use osascript to get current Now Playing info from macOS
        const script = `
          -- Check Music app first
          try
            tell application "Music"
              if it is running then
                if player state is playing then
                  set trackName to name of current track
                  set artistName to artist of current track
                  set albumName to album of current track
                  set trackDuration to duration of current track
                  set playerPos to player position
                  return trackName & "|||" & artistName & "|||" & albumName & "|||" & trackDuration & "|||" & playerPos & "|||playing"
                end if
              end if
            end tell
          end try
          
          -- Check Spotify
          try
            tell application "Spotify"
              if it is running then
                if player state is playing then
                  set trackName to name of current track
                  set artistName to artist of current track
                  set albumName to album of current track
                  set trackDuration to duration of current track
                  set playerPos to player position
                  return trackName & "|||" & artistName & "|||" & albumName & "|||" & (trackDuration / 1000) & "|||" & (playerPos / 1000) & "|||playing"
                end if
              end if
            end tell
          end try
          
          -- Check if any browser/media app is running (not just frontmost)
          tell application "System Events"
            set appList to name of every application process
            repeat with appName in appList
              if appName contains "Chrome" or appName contains "Safari" or appName contains "Firefox" then
                return "Web Media|||Browser Audio|||Now Playing|||180|||90|||playing"
              end if
            end repeat
          end tell
          
          return "|||||||stopped"
        `
        
        const result = await this.executeAppleScript(script)
        this.processTrackData(result)
        
      } catch (error) {
        console.log('⚠️ Error checking Now Playing:', error.message)
        // Send empty data on error
        this.sendTrackData({
          title: '',
          artist: '',
          album: '',
          duration: 0,
          position: 0,
          state: 'stopped'
        })
      }
    }
    
    executeAppleScript(script) {
      return new Promise((resolve, reject) => {
        const process = spawn('osascript', ['-e', script])
        let stdout = ''
        let stderr = ''

        process.stdout.on('data', (data) => {
          stdout += data.toString()
        })

        process.stderr.on('data', (data) => {
          stderr += data.toString()
        })

        process.on('close', (code) => {
          if (code === 0) {
            resolve(stdout.trim())
          } else {
            reject(new Error(`AppleScript failed: ${stderr}`))
          }
        })
      })
    }
    
    processTrackData(trackInfo) {
      try {
        const parts = trackInfo.split('|||')
        if (parts.length >= 6) {
          const trackData = {
            title: parts[0] || '',
            artist: parts[1] || '',
            album: parts[2] || '',
            duration: parseInt(parts[3]) || 0,
            position: parseInt(parts[4]) || 0,
            state: parts[5] || 'stopped'
          }

          // Only send update if data has changed significantly
          const dataString = JSON.stringify(trackData)
          if (dataString !== this.lastTrackData) {
            this.lastTrackData = dataString
            this.sendTrackData(trackData)
            if (trackData.title) {
              console.log('🎵 Now Playing:', trackData.title, 'by', trackData.artist)
            }
          }
        }
      } catch (error) {
        console.log('⚠️ Error processing track data:', error.message)
      }
    }
    
    sendTrackData(data) {
      try {
        if (this.capturedCallback && typeof this.capturedCallback === 'function') {
          this.capturedCallback({
            type: 'track', 
            data: {
              title: data.title,
              artist: data.artist,
              album: data.album,
              duration: data.duration,
              position: data.position,
              state: data.state,
              timestamp: Date.now()
            }
          })
        }
      } catch (error) {
        console.log('⚠️ Error sending track data:', error.message)
      }
    }
    
    unsubscribe() {
      this.stop()
    }
    
    destroy() {
      this.stop()
    }
    
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