#!/usr/bin/env node

import MusicDetector from './music-debug.js';

class PlayerController {
  constructor() {
    this.detector = new MusicDetector();
    this.currentPlayer = null;
  }

  async init() {
    const musicInfo = await this.detector.detectMusic();
    if (musicInfo && musicInfo.controls) {
      this.currentPlayer = musicInfo;
      return true;
    }
    return false;
  }

  async playPause() {
    if (!this.currentPlayer) {
      await this.init();
    }
    
    if (this.currentPlayer && this.currentPlayer.controls) {
      console.log('🎵 Toggling play/pause...');
      const result = await this.currentPlayer.controls.playPause();
      console.log('✅ Result:', result);
      return result;
    } else {
      console.log('❌ No controllable music player found');
      return { success: false, error: 'No player available' };
    }
  }

  async next() {
    if (!this.currentPlayer) {
      await this.init();
    }
    
    if (this.currentPlayer && this.currentPlayer.controls) {
      console.log('⏭️  Skipping to next track...');
      const result = await this.currentPlayer.controls.next();
      console.log('✅ Result:', result);
      return result;
    } else {
      console.log('❌ No controllable music player found');
      return { success: false, error: 'No player available' };
    }
  }

  async previous() {
    if (!this.currentPlayer) {
      await this.init();
    }
    
    if (this.currentPlayer && this.currentPlayer.controls) {
      console.log('⏮️  Skipping to previous track...');
      const result = await this.currentPlayer.controls.previous();
      console.log('✅ Result:', result);
      return result;
    } else {
      console.log('❌ No controllable music player found');
      return { success: false, error: 'No player available' };
    }
  }

  async getPosition() {
    if (!this.currentPlayer) {
      await this.init();
    }
    
    if (this.currentPlayer && this.currentPlayer.controls) {
      console.log('⏱️  Getting playback position...');
      const result = await this.currentPlayer.controls.getPosition();
      console.log('📊 Position:', result);
      return result;
    } else {
      console.log('❌ No controllable music player found');
      return { success: false, error: 'No player available' };
    }
  }

  async setPosition(percentage) {
    if (!this.currentPlayer) {
      await this.init();
    }
    
    if (this.currentPlayer && this.currentPlayer.controls) {
      console.log(`🎯 Seeking to ${percentage}%...`);
      const result = await this.currentPlayer.controls.setPosition(percentage);
      console.log('✅ Result:', result);
      return result;
    } else {
      console.log('❌ No controllable music player found');
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
      
      if (musicInfo.controls) {
        const position = await musicInfo.controls.getPosition();
        if (position && position.current) {
          console.log(`⏰ Time: ${position.current} / ${position.total}`);
          console.log(`📊 Progress: ${position.progress}`);
        }
        console.log('🎛️  Controls: Available');
      } else {
        console.log('🎛️  Controls: Not available');
      }
      
      return musicInfo;
    } else {
      console.log('🎵 No music currently playing');
      return null;
    }
  }

  showHelp() {
    console.log(`
🎵 Player Controller - Usage:

npm run player:control -- <command> [args]

Commands:
  play-pause    Toggle play/pause
  next          Skip to next track
  prev          Skip to previous track
  status        Show current player status
  position      Get current playback position
  seek <n>      Seek to percentage (0-100)
  help          Show this help

Examples:
  npm run player:control -- play-pause
  npm run player:control -- next
  npm run player:control -- seek 50
  npm run player:control -- status

Supported Players:
  • SoundCloud (Chrome)
  • YouTube Music (Chrome)
  • Spotify Web (Chrome)
  • Other web players with Media Session API

Note: Chrome tab must be active for JavaScript injection to work.
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
        
      case 'position':
        await controller.getPosition();
        break;
        
      case 'seek':
        const percentage = parseInt(args[1]);
        if (isNaN(percentage) || percentage < 0 || percentage > 100) {
          console.log('❌ Invalid percentage. Use 0-100.');
          return;
        }
        await controller.setPosition(percentage);
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