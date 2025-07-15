#!/usr/bin/env node

import { execSync } from 'child_process';
import os from 'os';
import WebSocket from 'ws';
import fetch from 'node-fetch';

class MusicDetector {
  constructor() {
    this.platform = os.platform();
  }

  async detectMusic() {
    try {
      // Try CDP approach first for rich media session data
      const cdpMusic = await this.detectViaCDP();
      if (cdpMusic) return cdpMusic;
      
      // Fallback to native apps
      const nativeMusic = await this.detectNativeMusic();
      if (nativeMusic) return nativeMusic;
      
    } catch (error) {
      console.error('Detection error:', error.message);
    }
    
    return null;
  }

  async detectViaCDP() {
    if (this.platform !== 'darwin') return null;
    
    try {
      // Get Chrome's debugging port and WebSocket URL
      const debugInfo = await this.getChromeDebugInfo();
      if (!debugInfo) {
        console.log('Chrome not running with remote debugging - launching with debugging enabled...');
        await this.launchChromeWithDebug();
        return null; // Return null for now, user can try again
      }

      // Connect to Chrome DevTools Protocol
      const ws = new WebSocket(debugInfo.webSocketDebuggerUrl, {perMessageDeflate: false});
      
      await new Promise((resolve, reject) => {
        ws.once('open', resolve);
        ws.once('error', reject);
        setTimeout(() => reject(new Error('CDP connection timeout')), 3000);
      });

      // Get media session data
      const mediaData = await this.getMediaSessionData(ws);
      ws.close();
      
      return mediaData;
      
    } catch (error) {
      console.error('CDP detection failed:', error.message);
      return null;
    }
  }

  async getChromeDebugInfo() {
    try {
      // First check if Chrome is running with remote debugging
      const processes = execSync('ps aux | grep -i chrome | grep remote-debugging-port', { encoding: 'utf8' });
      const match = processes.match(/--remote-debugging-port=(\d+)/);
      
      if (!match) return null;
      
      const port = match[1];
      
      // Get the browser WebSocket URL
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      const browserInfo = await response.json();
      
      return {
        port: port,
        webSocketDebuggerUrl: browserInfo.webSocketDebuggerUrl
      };
      
    } catch (error) {
      return null;
    }
  }

  async launchChromeWithDebug() {
    try {
      console.log('💡 To enable Chrome DevTools Protocol, restart Chrome with:');
      console.log('   /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222');
      console.log('   Then try detection again.');
    } catch (error) {
      // Ignore launch errors
    }
  }

  async getChromeDebugPort() {
    try {
      // Check if Chrome is running with remote debugging
      const processes = execSync('ps aux | grep -i chrome | grep remote-debugging-port', { encoding: 'utf8' });
      const match = processes.match(/--remote-debugging-port=(\d+)/);
      return match ? match[1] : null;
    } catch (error) {
      return null;
    }
  }

  async getMediaSessionData(ws) {
    let messageId = 1;
    
    // Helper to send CDP commands
    const sendCommand = (method, params = {}, sessionId = null) => {
      return new Promise((resolve, reject) => {
        const id = messageId++;
        const command = { id, method, params };
        if (sessionId) command.sessionId = sessionId;
        
        const handler = (data) => {
          const response = JSON.parse(data);
          if (response.id === id) {
            ws.removeListener('message', handler);
            if (response.error) {
              reject(new Error(response.error.message));
            } else {
              resolve(response.result);
            }
          }
        };
        
        ws.on('message', handler);
        ws.send(JSON.stringify(command));
        
        // Timeout after 2 seconds
        setTimeout(() => {
          ws.removeListener('message', handler);
          reject(new Error('Command timeout'));
        }, 2000);
      });
    };

    try {
      // Get all targets
      const targets = await sendCommand('Target.getTargets');
      const pageTargets = targets.targetInfos.filter(t => t.type === 'page' && t.url && !t.url.startsWith('chrome://'));
      
      console.log(`🔍 Found ${pageTargets.length} page targets`);
      
      // Check each page for media session data
      for (const target of pageTargets) {
        console.log(`📄 Checking target: ${target.url.substring(0, 50)}...`);
        
        try {
          // Attach to target
          const session = await sendCommand('Target.attachToTarget', {
            targetId: target.targetId,
            flatten: true
          });
          
          const sessionId = session.sessionId;
          console.log(`🔗 Attached to session: ${sessionId}`);
          
          // Get runtime info to check for media session
          const runtime = await sendCommand('Runtime.evaluate', {
            expression: `
              (function() {
                try {
                  const result = {
                    hasMediaSession: !!navigator.mediaSession,
                    hasMetadata: !!navigator.mediaSession?.metadata,
                    playbackState: navigator.mediaSession?.playbackState || 'none',
                    url: window.location.href
                  };
                  
                  if (navigator.mediaSession && navigator.mediaSession.metadata) {
                    const metadata = navigator.mediaSession.metadata;
                    result.metadata = {
                      title: metadata.title || '',
                      artist: metadata.artist || '',
                      album: metadata.album || '', 
                      artwork: metadata.artwork || []
                    };
                  }
                  
                  return result;
                } catch (e) {
                  return { error: e.message };
                }
              })()
            `,
            returnByValue: true
          }, sessionId);
          
          // Detach from target
          await sendCommand('Target.detachFromTarget', { sessionId });
          
          console.log(`📊 Full runtime response:`, JSON.stringify(runtime, null, 2));
          
          if (runtime.result && !runtime.result.exceptionDetails) {
            const resultValue = runtime.result.value;
            console.log(`📊 Media session data:`, JSON.stringify(resultValue, null, 2));
            
            if (resultValue && resultValue.metadata) {
              const mediaData = resultValue.metadata;
              
              // Only return if we have meaningful media data
              if (mediaData.title && (mediaData.artist || resultValue.playbackState !== 'none')) {
                console.log(`✅ Found valid media session data`);
                return {
                  title: mediaData.title,
                  artist: mediaData.artist,
                  album: mediaData.album,
                  artwork: mediaData.artwork && mediaData.artwork.length > 0 ? mediaData.artwork[0].src : null,
                  url: resultValue.url,
                  source: this.getSourceFromUrl(resultValue.url),
                  isPlaying: resultValue.playbackState === 'playing'
                };
              }
            } else if (resultValue && resultValue.error) {
              console.log(`❌ JavaScript error: ${resultValue.error}`);
            } else {
              console.log(`ℹ️  Media session status:`, {
                hasMediaSession: resultValue?.hasMediaSession,
                hasMetadata: resultValue?.hasMetadata,
                playbackState: resultValue?.playbackState
              });
            }
          } else if (runtime.result && runtime.result.exceptionDetails) {
            console.log(`❌ Runtime exception:`, runtime.result.exceptionDetails);
          }
          
        } catch (error) {
          console.log(`❌ Failed to check target: ${error.message}`);
          continue;
        }
      }
      
      console.log(`❌ No valid media session data found`);
      return null;
      
    } catch (error) {
      console.error('Failed to get media session data:', error.message);
      return null;
    }
  }

  getSourceFromUrl(url) {
    if (url.includes('soundcloud.com')) return 'soundcloud';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('music.youtube.com')) return 'youtube-music';
    if (url.includes('spotify.com')) return 'spotify';
    if (url.includes('apple.com') || url.includes('music.apple.com')) return 'apple-music';
    return 'web-music';
  }

  async detectChromeMusic() {
    if (this.platform !== 'darwin') return null;
    
    try {
      // Get Chrome tab titles and URLs
      const titleScript = `tell application "Google Chrome" to get title of every tab of every window`;
      const urlScript = `tell application "Google Chrome" to get URL of every tab of every window`;
      
      const titlesResult = execSync(`osascript -e '${titleScript}'`, { encoding: 'utf8' }).trim();
      const urlsResult = execSync(`osascript -e '${urlScript}'`, { encoding: 'utf8' }).trim();
      
      if (!titlesResult || !urlsResult) return null;
      
      // Parse comma-separated results
      const titles = titlesResult.split(', ');
      const urls = urlsResult.split(', ');
      
      // Find SoundCloud or music tabs
      for (let i = 0; i < titles.length && i < urls.length; i++) {
        const title = titles[i];
        const url = urls[i];
        
        // SoundCloud detection
        if (url.includes('soundcloud.com') && title.includes(' by ')) {
          return {
            title: title,
            url: url,
            source: 'soundcloud'
          };
        }
        
        // General music patterns
        if (title.includes(' by ') && (title.includes(' - ') || title.includes('Live from'))) {
          return {
            title: title,
            url: url,
            source: 'web-music'
          };
        }
        
        // YouTube Music
        if (url.includes('music.youtube.com') || title.includes(' - YouTube Music')) {
          return {
            title: title,
            url: url,
            source: 'youtube-music'
          };
        }
        
        // Spotify Web
        if (url.includes('open.spotify.com') || title.includes(' | Spotify')) {
          return {
            title: title,
            url: url,
            source: 'spotify'
          };
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  async detectNativeMusic() {
    if (this.platform !== 'darwin') return null;
    
    try {
      // Try Apple Music first
      const musicScript = `
        tell application "System Events"
          if exists (process "Music") then
            tell application "Music"
              if player state is playing then
                set trackName to name of current track
                set artistName to artist of current track
                return trackName & " by " & artistName
              end if
            end tell
          end if
          return ""
        end tell
      `;
      
      const musicResult = execSync(`osascript -e '${musicScript}'`, { encoding: 'utf8' }).trim();
      if (musicResult) {
        return {
          title: musicResult,
          source: 'apple-music'
        };
      }
      
      // Try Spotify
      const spotifyScript = `
        tell application "System Events"
          if exists (process "Spotify") then
            tell application "Spotify"
              if player state is playing then
                set trackName to name of current track
                set artistName to artist of current track
                return trackName & " by " & artistName
              end if
            end tell
          end if
          return ""
        end tell
      `;
      
      const spotifyResult = execSync(`osascript -e '${spotifyScript}'`, { encoding: 'utf8' }).trim();
      if (spotifyResult) {
        return {
          title: spotifyResult,
          source: 'spotify'
        };
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  async displayResults(musicInfo) {
    if (!musicInfo) {
      console.log('🎵 No music currently playing detected');
      return;
    }

    console.log('🎵 Music Detection Results:');
    console.log('═══════════════════════════');
    console.log(`📍 Source: ${musicInfo.source}`);
    console.log(`🎼 Title: ${musicInfo.title}`);
    if (musicInfo.url) {
      console.log(`🔗 URL: ${musicInfo.url}`);
    }
    console.log('═══════════════════════════');
    
    // Check if source supports control
    const supportsControl = this.supportsControl(musicInfo.source);
    console.log(`🎛️  Controls: ${supportsControl ? 'Available via Media Session API' : 'Not available'}`);
  }

  supportsControl(source) {
    const supportedSources = [
      'soundcloud', 'youtube-music', 'spotify', 'apple-music',  // Web players via Media Session API
      'Music', 'Spotify'  // Native apps via AppleScript
    ];
    
    return supportedSources.includes(source);
  }
}

// Main execution
async function main() {
  const detector = new MusicDetector();
  const music = await detector.detectMusic();
  
  if (music) {
    console.log('🎵 Music Detection Results:');
    console.log('═══════════════════════════');
    console.log(`📍 Source: ${music.source}`);
    console.log(`🎼 Title: ${music.title}`);
    if (music.artist) console.log(`🎤 Artist: ${music.artist}`);
    if (music.album) console.log(`💿 Album: ${music.album}`);
    if (music.artwork) console.log(`🎨 Artwork: ${music.artwork}`);
    if (music.url) console.log(`🔗 URL: ${music.url}`);
    if (music.isPlaying !== undefined) console.log(`▶️ Playing: ${music.isPlaying ? 'Yes' : 'No'}`);
    console.log('═══════════════════════════');
    console.log('🎛️  Controls: Available via Media Session API');
    console.log('💡 Try: npm run player:control -- play-pause');
  } else {
    console.log('❌ No music detected');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default MusicDetector; 