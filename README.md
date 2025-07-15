# Deskthing Apps 

This is where all of the apps developed for the DeskThing is located! If you want to make your own or are just browsing, these act as great reference points! 

Every app here is the precompiled apps you download into DeskThing. The structure of each app is defined [here](https://github.com/itsriprod/deskthing-template)

## 🎵 Featured: Audio App (Basic macOS Detection)

### Status: ⚠️ LIMITED FUNCTIONALITY - Basic SoundCloud detection only
The audio app has minimal working features:
- **SoundCloud** - Basic track/artist detection from browser tabs only
- **Dashboard Server** - Runs for testing, enhanced features broken
- **API** - Basic `/api/media/detect` returns title/artist/source

### Known Issues
- ❌ **Enhanced Metadata** - Duration, position, artwork all broken
- ❌ **YouTube/Spotify** - Detection unreliable or non-functional  
- ❌ **Controls** - Only basic pause might work
- ❌ **AppleScript Errors** - JavaScript injection failing

### Basic Testing
```bash
# Test basic detection only
npm run dashboard
# Visit: http://localhost:8080
# Expect: Basic title/artist info only
```

**Current Detection Example:**
- ✅ Basic: "Rinzen - Live from Silo Brooklyn (2025)" by "Rinzen" 
- ❌ Enhanced: Duration, artwork, controls mostly broken

See `audio/README.md` for detailed limitations.

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
