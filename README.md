# Deskthing Apps 

This is where all of the apps developed for the DeskThing is located! If you want to make your own or are just browsing, these act as great reference points! 

Every app here is the precompiled apps you download into DeskThing. The structure of each app is defined [here](https://github.com/itsriprod/deskthing-template)

## 🎵 Featured: Audio App - WebNowPlaying Integration ✅

### Status: ✅ FULLY FUNCTIONAL - WebNowPlaying Browser Extension Integration
**Major Update:** July 16, 2025 - Breakthrough WebNowPlaying integration complete!

**Revolutionary Architecture:**
```
Browser Media → WebNowPlaying Extension → Python Adapter → DeskThing API
```

### ✅ What Works Perfectly Now
- **🌐 All Browser-Based Music** - YouTube, SoundCloud, Spotify Web, Apple Music Web, Bandcamp
- **📊 Complete Metadata** - Title, artist, album, duration, position, artwork URLs
- **🎛️ Full Media Controls** - Play/pause, next/previous, seek, volume control
- **⚡ Real-time Updates** - Live progress tracking and state synchronization
- **🔗 API Compatibility** - Same endpoints, enhanced functionality

### 🚀 Quick Start
```bash
# Install WebNowPlaying extension (one-time setup)
# Visit: https://chromewebstore.google.com/detail/webnowplaying/jfakgfcdgpghbbefmdfjkbdlibjgnbli

# Start the WebNowPlaying adapter
npm run wnp-python

# Test with any browser music service
curl http://localhost:8080/api/media/status
curl http://localhost:8080/health
```

### 🎯 Supported Platforms
| Platform | Detection | Controls | Metadata | Artwork |
|----------|-----------|----------|----------|---------|
| YouTube | ✅ Perfect | ✅ Full | ✅ Complete | ✅ Yes |
| SoundCloud | ✅ Perfect | ✅ Full | ✅ Complete | ✅ Yes |
| Spotify Web | ✅ Perfect | ✅ Full | ✅ Complete | ✅ Yes |
| Apple Music Web | ✅ Perfect | ✅ Full | ✅ Complete | ✅ Yes |
| Bandcamp | ✅ Perfect | ✅ Full | ✅ Complete | ✅ Yes |

### 📡 API Endpoints (Enhanced)
```bash
GET  /api/media/detect   # Current playing media
GET  /api/media/status   # Enhanced metadata with artwork
POST /api/media/control  # Media controls (play-pause, next, prev, seek, volume)
GET  /health            # Service health check
GET  /                  # Enhanced web dashboard
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "title": "Circoloco Radio 390 - Enamour",
    "artist": "Circoloco",
    "album": "SoundCloud",
    "state": "PLAYING",
    "position": 1847,
    "duration": 3600,
    "volume": 75,
    "cover": "https://...",
    "source": "WebNowPlaying",
    "player": "SoundCloud"
  }
}
```

### 🔧 Setup Requirements
1. **WebNowPlaying Extension** - Install from Chrome Web Store (70k+ users, 4.6★)
2. **Python Environment** - Auto-managed by package scripts
3. **Browser Music** - Any supported web-based music service

### 💡 Key Advantages Over Previous AppleScript Approach
- ✅ **Cross-Platform** - Works on any OS with browsers
- ✅ **Reliable** - No macOS MediaRemote API restrictions
- ✅ **Real-time** - Instant updates and synchronization
- ✅ **Comprehensive** - Supports all major music platforms
- ✅ **Future-Proof** - Browser-based, not OS-dependent

**Migration Note:** The previous AppleScript approach has been completely replaced due to macOS 15.4+ compatibility issues.

## Making your own app

Prereqs: Ensure you have [node](https://nodejs.org/en/download/package-manager) installed! 

Run
```
npm create deskthing@latest
```
in the terminal and it will prompt you to make a new app!

From there, review https://github.com/ItsRiprod/Deskthing-Apps/wiki for the next steps

## Available Apps

### Core Apps
- **audio/** - Enhanced macOS media detection with web player support
- **spotify/** - Spotify integration with authentication  
- **weather/** - Weather display and forecasting
- **system/** - System monitoring and controls

### Utility Apps  
- **utility/** - General utility functions
- **logs/** - Log viewing and debugging
- **image/** - Image display and slideshow

### Experimental Apps
- **discord/** - Discord integration (beta)
- **gamething/** - Gaming-related features (beta)
- **settingstest/** - Settings interface testing

## Development Tools

### Dashboard Server
```bash
# Run media detection dashboard
node dashboard-server.js
# Endpoints: /api/media/detect, /api/media/status, /api/media/control
```

### Package Scripts
```bash
# Debug music detection
npm run debug-music

# Control media playback  
npm run player:control play-pause
```

Once things are more finalized, I will document things more thoroughly here. However, until then, you can go to the discord [linked here](https://deskthing.app/discord) and I can help you get started!
