#!/usr/bin/env node

import MusicDetector from './music-debug.js';
import { execSync } from 'child_process';

class PlayerController {
  constructor() {
    this.detector = new MusicDetector();
    this.currentPlayer = null;
  }

  async init() {
    const musicInfo = await this.detector.detectMusic();
    if (musicInfo) {
      this.currentPlayer = musicInfo;
      return true;
    }
    return false;
  }

  async playPause() {
    if (!this.currentPlayer) {
      await this.init();
    }
    
    if (this.currentPlayer) {
      console.log('🎵 Toggling play/pause...');
      
      try {
        // For SoundCloud, use direct JavaScript control
        if (this.currentPlayer.source === 'SoundCloud') {
          try {
            execSync(`osascript -e 'tell application "Google Chrome" to tell front window to tell (first tab whose URL contains "soundcloud.com") to execute javascript "document.querySelector(\\".playControl\\").click()"'`);
            console.log('✅ SoundCloud direct control executed');
            return { success: true, method: 'SoundCloud direct click' };
          } catch (error) {
            console.log('❌ SoundCloud control failed:', error.message);
            return { success: false, error: error.message };
          }
        }
        
        // For YouTube, use direct video control
        if (this.currentPlayer.source === 'YouTube') {
          try {
            execSync(`osascript -e 'tell application "Google Chrome" to tell front window to tell (first tab whose URL contains "youtube.com") to execute javascript "document.querySelector(\\"video\\").paused ? document.querySelector(\\"video\\").play() : document.querySelector(\\"video\\").pause()"'`);
            console.log('✅ YouTube direct control executed');
            return { success: true, method: 'YouTube direct control' };
          } catch (error) {
            console.log('❌ YouTube control failed:', error.message);
            return { success: false, error: error.message };
          }
        }
        
        // For Spotify Web, use direct button control
        if (this.currentPlayer.source === 'Spotify Web') {
          try {
            execSync(`osascript -e 'tell application "Google Chrome" to tell front window to tell (first tab whose URL contains "spotify.com") to execute javascript "document.querySelector(\\"[data-testid=\\\\\\"control-button-playpause\\\\\\"]\\").click()"'`);
            console.log('✅ Spotify Web direct control executed');
            return { success: true, method: 'Spotify Web direct click' };
          } catch (error) {
            console.log('❌ Spotify Web control failed:', error.message);
            return { success: false, error: error.message };
          }
        }
        
        // For native apps, use direct app control
        if (this.currentPlayer.source === 'Music') {
          execSync(`osascript -e 'tell application "Music" to playpause'`);
          console.log('✅ Music app control executed');
          return { success: true, method: 'Native Music app' };
        }
        
        if (this.currentPlayer.source === 'Spotify') {
          execSync(`osascript -e 'tell application "Spotify" to playpause'`);
          console.log('✅ Spotify app control executed');
          return { success: true, method: 'Native Spotify app' };
        }
        
        console.log('❌ Unsupported source:', this.currentPlayer.source);
        return { success: false, error: 'Unsupported source' };
        
      } catch (error) {
        console.error('❌ Control error:', error.message);
        return { success: false, error: error.message };
      }
    } else {
      console.log('❌ No music player detected');
      return { success: false, error: 'No player available' };
    }
  }

  async next() {
    if (!this.currentPlayer) {
      await this.init();
    }
    
    if (this.currentPlayer) {
      console.log('⏭️  Skipping to next track...');
      
      try {
        // For web players, use Command+Shift+Right Arrow which triggers next track
        if (this.currentPlayer.source === 'soundcloud' || 
            this.currentPlayer.source === 'youtube-music' ||
            this.currentPlayer.source === 'spotify-web') {
          
          execSync(`osascript -e 'tell application "System Events" to key code 124 using {command down, shift down}'`);
          console.log('✅ Media key next track sent');
          return { success: true, method: 'Media Session API key' };
        }
        
        // For native apps
        if (this.currentPlayer.source === 'Music') {
          execSync(`osascript -e 'tell application "Music" to next track'`);
          console.log('✅ Music app next executed');
          return { success: true, method: 'Native Music app' };
        }
        
        if (this.currentPlayer.source === 'Spotify') {
          execSync(`osascript -e 'tell application "Spotify" to next track'`);
          console.log('✅ Spotify app next executed');
          return { success: true, method: 'Native Spotify app' };
        }
        
        console.log('❌ Unsupported source:', this.currentPlayer.source);
        return { success: false, error: 'Unsupported source' };
        
      } catch (error) {
        console.error('❌ Control error:', error.message);
        return { success: false, error: error.message };
      }
    } else {
      console.log('❌ No music player detected');
      return { success: false, error: 'No player available' };
    }
  }

  async previous() {
    if (!this.currentPlayer) {
      await this.init();
    }
    
    if (this.currentPlayer) {
      console.log('⏮️  Skipping to previous track...');
      
      try {
        // For web players, use Command+Shift+Left Arrow
        if (this.currentPlayer.source === 'soundcloud' || 
            this.currentPlayer.source === 'youtube-music' ||
            this.currentPlayer.source === 'spotify-web') {
          
          execSync(`osascript -e 'tell application "System Events" to key code 123 using {command down, shift down}'`);
          console.log('✅ Media key previous track sent');
          return { success: true, method: 'Media Session API key' };
        }
        
        // For native apps
        if (this.currentPlayer.source === 'Music') {
          execSync(`osascript -e 'tell application "Music" to previous track'`);
          console.log('✅ Music app previous executed');
          return { success: true, method: 'Native Music app' };
        }
        
        if (this.currentPlayer.source === 'Spotify') {
          execSync(`osascript -e 'tell application "Spotify" to previous track'`);
          console.log('✅ Spotify app previous executed');
          return { success: true, method: 'Native Spotify app' };
        }
        
        console.log('❌ Unsupported source:', this.currentPlayer.source);
        return { success: false, error: 'Unsupported source' };
        
      } catch (error) {
        console.error('❌ Control error:', error.message);
        return { success: false, error: error.message };
      }
    } else {
      console.log('❌ No music player detected');
      return { success: false, error: 'No player available' };
    }
  }

  async status() {
    const musicInfo = await this.detector.detectMusic();
    if (musicInfo) {
      console.log('🎵 Current Player Status:');
      console.log('═══════════════════════════');
      console.log(`📍 Source: ${musicInfo.source}`);
      console.log(`🎼 Title: ${musicInfo.title}`);
      if (musicInfo.url) {
        console.log(`🔗 URL: ${musicInfo.url}`);
      }
      
      // Check control support
      const supportsControl = this.supportsControl(musicInfo.source);
      console.log(`🎛️  Controls: ${supportsControl ? 'Available' : 'Not available'}`);
      
      if (supportsControl) {
        console.log('🎮 Available controls: play/pause, next, previous');
        
        if (musicInfo.source === 'soundcloud' || 
            musicInfo.source === 'youtube-music' ||
            musicInfo.source === 'spotify-web') {
          console.log('💡 Uses Chrome Media Session API (keyboard media keys)');
        } else {
          console.log('💡 Uses native app AppleScript controls');
        }
      }
      
      return musicInfo;
    } else {
      console.log('🎵 No music currently playing');
      return null;
    }
  }

  supportsControl(source) {
    const supportedSources = [
      'soundcloud', 'youtube-music', 'spotify-web',  // Web players via Media Session API
      'Music', 'Spotify'  // Native apps via AppleScript
    ];
    
    return supportedSources.includes(source);
  }

  showHelp() {
    console.log(`
🎵 Player Controller - Chrome Media Session API Integration

npm run player:control -- <command>

Commands:
  play-pause    Toggle play/pause
  next          Skip to next track  
  prev          Skip to previous track
  status        Show current player status
  help          Show this help

Examples:
  npm run player:control -- play-pause
  npm run player:control -- next
  npm run player:control -- status

Supported Players:
  📱 Web Players (via Chrome Media Session API):
    • SoundCloud
    • YouTube Music  
    • Spotify Web Player
    
  🖥️  Native Apps (via AppleScript):
    • Apple Music
    • Spotify Desktop

How It Works:
  • Web players: Uses keyboard media keys that Chrome maps to Media Session API
  • Native apps: Direct AppleScript commands to control the application
  • System-wide: Works even when browser is in background

Note: For web players, the browser tab must be the active audio source.
    `);
  }
}

// CLI interface
async function main() {
  const controller = new PlayerController();
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    controller.showHelp();
    return;
  }

  const command = args[0].toLowerCase();
  
  try {
    switch (command) {
      case 'play-pause':
      case 'toggle':
        await controller.playPause();
        break;
        
      case 'next':
        await controller.next();
        break;
        
      case 'prev':
      case 'previous':
        await controller.previous();
        break;
        
      case 'status':
        await controller.status();
        break;
        
      case 'help':
      default:
        controller.showHelp();
        break;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  main().catch(console.error);
}

export default PlayerController; 