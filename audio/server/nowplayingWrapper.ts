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
          
          -- Enhanced browser media detection with JavaScript state checking
          tell application "Google Chrome"
            try
              repeat with w from 1 to count of windows
                repeat with t from 1 to count of tabs of window w
                  set tabURL to URL of tab t of window w
                  set tabTitle to title of tab t of window w
                  
                  try
                    if tabURL contains "youtube.com/watch" then
                      -- Check if YouTube video is actually playing
                      set isPlaying to (execute tab t of window w javascript "document.querySelector('video') && !document.querySelector('video').paused")
                      
                      if isPlaying then
                        -- Parse video title (remove view count and " - YouTube" suffix)
                        set cleanTitle to tabTitle
                        if cleanTitle contains " - YouTube" then
                          set AppleScript's text item delimiters to " - YouTube"
                          set titleParts to every text item of cleanTitle
                          set cleanTitle to item 1 of titleParts
                          set AppleScript's text item delimiters to ""
                        end if
                        
                        -- Remove view count prefix like "(1412) "
                        if cleanTitle starts with "(" and cleanTitle contains ") " then
                          set AppleScript's text item delimiters to ") "
                          set titleParts to every text item of cleanTitle
                          set AppleScript's text item delimiters to ""
                          if (count of titleParts) > 1 then
                            set cleanTitle to ""
                            repeat with i from 2 to count of titleParts
                              set cleanTitle to cleanTitle & item i of titleParts
                              if i < count of titleParts then set cleanTitle to cleanTitle & ") "
                            end repeat
                          end if
                        end if
                        
                        return cleanTitle & "|||YouTube|||YouTube Video|||180|||90|||playing"
                      end if
                      
                    else if tabURL contains "soundcloud.com" then
                      -- Check if SoundCloud is actually playing
                      set isPlaying to (execute tab t of window w javascript "document.querySelector('.playControl') && document.querySelector('.playControl').title.includes('Pause')")
                      
                      if isPlaying then
                        -- Parse track info from title
                        if tabTitle contains " by " then
                          set AppleScript's text item delimiters to " by "
                          set titleParts to every text item of tabTitle
                          set trackName to item 1 of titleParts
                          set artistPart to item 2 of titleParts
                          set AppleScript's text item delimiters to ""
                          
                          -- Clean up track name
                          if trackName starts with "Stream " then
                            set trackName to text 8 thru -1 of trackName
                          end if
                          
                          -- Clean up artist (remove " | Listen online..." part)
                          if artistPart contains " | " then
                            set AppleScript's text item delimiters to " | "
                            set artistParts to every text item of artistPart
                            set artistPart to item 1 of artistParts
                            set AppleScript's text item delimiters to ""
                          end if
                          
                          return trackName & "|||" & artistPart & "|||SoundCloud|||180|||90|||playing"
                        else
                          return tabTitle & "|||SoundCloud|||Browser Audio|||180|||90|||playing"
                        end if
                      end if
                      
                    else if tabURL contains "open.spotify.com" then
                      -- Check if Spotify Web Player is actually playing
                      set isPlaying to (execute tab t of window w javascript "document.querySelector('[data-testid=\"control-button-playpause\"]') && document.querySelector('[data-testid=\"control-button-playpause\"]').getAttribute('aria-label').includes('Pause')")
                      
                      if isPlaying then
                        if tabTitle contains " • " then
                          set AppleScript's text item delimiters to " • "
                          set titleParts to every text item of tabTitle
                          set AppleScript's text item delimiters to ""
                          if (count of titleParts) >= 2 then
                            return (item 1 of titleParts) & "|||" & (item 2 of titleParts) & "|||Spotify Web|||180|||90|||playing"
                          end if
                        else
                          return tabTitle & "|||Spotify|||Spotify Web Player|||180|||90|||playing"
                        end if
                      end if
                      
                    else if tabURL contains "music.youtube.com" then
                      -- Check if YouTube Music is actually playing
                      set isPlaying to (execute tab t of window w javascript "document.querySelector('video') && !document.querySelector('video').paused")
                      
                      if isPlaying then
                        if tabTitle contains " - " then
                          set AppleScript's text item delimiters to " - "
                          set titleParts to every text item of tabTitle
                          set AppleScript's text item delimiters to ""
                          if (count of titleParts) >= 2 then
                            return (item 1 of titleParts) & "|||" & (item 2 of titleParts) & "|||YouTube Music|||180|||90|||playing"
                          end if
                        else
                          return tabTitle & "|||YouTube Music|||Browser Audio|||180|||90|||playing"
                        end if
                      end if
                      
                    end if
                  on error
                    -- Skip tabs that can't execute JavaScript or don't support the selectors
                  end try
                end repeat
              end repeat
            on error
              -- Chrome not available or accessible
            end try
          end tell
          
          -- Fallback: Check other browsers with basic detection
          tell application "System Events"
            set browserNames to {"Safari", "Firefox", "Microsoft Edge"}
            repeat with browserName in browserNames
              if (name of processes) contains browserName then
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