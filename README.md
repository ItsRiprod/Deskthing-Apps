# Deskthing Apps 

This repository contains apps developed for the DeskThing platform. If you want to make your own or are just browsing, these act as great reference points! 

Every app here is structured according to the [DeskThing template](https://github.com/itsriprod/deskthing-template).

## 🚨 **CURRENT STATUS: DEVELOPMENT/EXPERIMENTAL**

**Reality Check**: This project is in active development with **basic functionality** working, but many features are incomplete or temporarily disabled.

## 🎵 **Audio App - Current Working State**

### ✅ **What Actually Works**
- **Basic Media Detection** - SoundCloud track detection from browser tabs
- **Dashboard Server** - Web interface with basic API endpoints  
- **AppleScript Integration** - macOS browser tab scanning

### ⚠️ **What's Broken/Disabled**
- **Enhanced Metadata** - Duration, artwork, position (temporarily disabled due to quote escaping issues)
- **WebNowPlaying Python Adapter** - Crashes with port binding conflicts
- **Multi-platform Detection** - YouTube, Spotify Web (unreliable)
- **Media Controls** - Play/pause may work occasionally, other controls unreliable

### 📊 **Real Feature Status**

| Feature | Status | Notes |
|---------|--------|-------|
| SoundCloud Detection | ✅ Working | Basic title/artist only |
| Dashboard UI | ✅ Working | Web interface on port 8080 |
| API Endpoints | ⚠️ Partial | Defined but not all functional |
| WebNowPlaying | ❌ Broken | Port conflicts, crashes on startup |
| Enhanced Metadata | ❌ Disabled | Quote escaping issues |
| Media Controls | ❌ Unreliable | Basic controls sometimes work |

## 🛠️ **Setup Instructions (Correct Directory)**

**IMPORTANT**: All commands must be run from the `DeskThing-Apps` directory, not the parent directory.

```bash
# Navigate to the correct directory first
cd DeskThing-Apps

# Now you can run the scripts
npm run dashboard        # Basic dashboard server
npm run debug-music     # Music detection test
npm run webnowplaying   # JavaScript WebNowPlaying server
npm run wnp-python      # Python adapter (currently broken)
```

### **What Works Right Now**

```bash
# ✅ This works - Basic media detection
cd DeskThing-Apps
npm run dashboard
# Visit: http://localhost:8080
# Shows: Basic SoundCloud track info

# ✅ This works - Direct music detection test  
npm run debug-music
# Output: Track title and artist if music is playing
```

### **What Doesn't Work**

```bash
# ❌ This crashes - Python adapter has port conflicts
npm run wnp-python
# Error: "OSError: [Errno 48] address already in use"

# ❌ Enhanced features disabled
# Enhanced metadata detection temporarily disabled
```

## 📁 **Available Apps**

### **Core Apps (Various States)**
- **audio/** - Basic macOS media detection (partially working)
- **spotify/** - Spotify integration (template state)  
- **weather/** - Weather display (status unknown)
- **system/** - System monitoring (status unknown)

### **Utility Apps**  
- **utility/** - General utilities (template state)
- **logs/** - Log viewing (status unknown)
- **image/** - Image display (status unknown)

### **Experimental Apps (Beta/Template State)**
- **discord/** - Discord integration (template)
- **gamething/** - Gaming features (template)
- **settingstest/** - Settings interface (template)

## 🎯 **Making Your Own App**

Prerequisites: [Node.js](https://nodejs.org/en/download/package-manager) installed

```bash
npm create deskthing@latest
```

Follow the prompts and review the [DeskThing Apps Wiki](https://github.com/ItsRiprod/Deskthing-Apps/wiki) for next steps.

## 🔧 **Development Tools**

### **Working Commands** (from DeskThing-Apps directory)
```bash
# Basic media detection dashboard
npm run dashboard

# Test music detection  
npm run debug-music

# Try JavaScript WebNowPlaying server
npm run webnowplaying
```

### **Broken Commands** (known issues)
```bash
# Python adapter crashes
npm run wnp-python  # Port binding issues

# Enhanced controls unreliable  
npm run player:control  # May or may not work
```

## 📊 **Real vs Documentation Claims**

**Previous Documentation Claimed**: "✅ MAJOR BREAKTHROUGH - WebNowPlaying integration working!"

**Reality**: Basic SoundCloud detection works, enhanced features disabled, Python adapter crashes.

**Previous Documentation Claimed**: "✅ All browser-based music services supported"  

**Reality**: Only basic SoundCloud detection confirmed working.

## 🚧 **Known Issues**

1. **Directory Confusion** - Commands only work from DeskThing-Apps directory
2. **Port Conflicts** - Multiple servers competing for port 8080
3. **Quote Escaping** - AppleScript issues causing feature disabling
4. **Python Environment** - WebNowPlaying adapter startup failures
5. **Documentation Overselling** - Previous claims vs actual functionality

## 💡 **Getting Help**

For questions or assistance, join the [Discord](https://deskthing.app/discord). Please note that many features are currently experimental or broken.

## ⚠️ **Honest Assessment**

This is a **development/testing version** with basic functionality. Enhanced features require significant debugging before being production-ready. The documentation has been updated to reflect the actual current state rather than aspirational goals.
