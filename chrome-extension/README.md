# 🎵 DeskThing Media Bridge - Chrome Extension

**The proper solution for `navigator.mediaSession` access!**

This Chrome extension provides clean access to `navigator.mediaSession` API and enhanced DOM scraping, sending real-time music data to your DeskThing dashboard.

## ✅ **Why This Approach Works Better**

- **🎯 Direct MediaSession Access** - No AppleScript quote escaping issues
- **⚡ Real-time Updates** - Instant detection of play/pause/track changes  
- **🎨 Enhanced Metadata** - Artwork, duration, position from MediaSession API
- **🎮 Working Controls** - Proper media control injection
- **🌐 Multi-site Support** - Works with SoundCloud, YouTube, Spotify, etc.

## 🚀 **Installation Instructions**

### **1. Install the Extension**

1. Open Chrome and go to `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in top right)
3. Click **"Load unpacked"**
4. Select the `chrome-extension` folder: `/Users/joe/Desktop/Repos/Personal/DeskThing-Apps/chrome-extension/`
5. Extension will auto-open the dashboard at `http://localhost:8080`

### **2. Start the Dashboard Server**

```bash
cd DeskThing-Apps
node dashboard-server.js
```

### **3. Test with Music**

1. Go to SoundCloud, YouTube, or Spotify Web
2. Play some music
3. Check the extension popup (click the extension icon)
4. Visit `http://localhost:8080` to see the enhanced dashboard

## 🎵 **What You Get**

### **MediaSession API Support**
- **Real metadata** from `navigator.mediaSession.metadata`
- **Artwork** from MediaSession or DOM fallback
- **Playback state** and position tracking
- **Duration** and real-time position updates

### **Enhanced DOM Extraction**
- **SoundCloud** - Title, artist, artwork, play state
- **YouTube** - Video title, channel, thumbnail, position
- **Spotify Web** - Track, artist, artwork, controls
- **YouTube Music** - Enhanced music-specific extraction

### **Working Controls**
- **Play/Pause** - Direct media element control + keyboard events
- **Next/Previous** - Site-specific button detection
- **Real-time Feedback** - Immediate status updates

## 📊 **API Endpoints Enhanced**

The dashboard now provides enhanced endpoints:

```bash
# Enhanced detection (MediaSession + Legacy fallback)
curl http://localhost:8080/api/media/detect

# Real-time status with position
curl http://localhost:8080/api/media/status  

# Working media controls
curl -X POST http://localhost:8080/api/media/control \
  -H "Content-Type: application/json" \
  -d '{"action": "pause"}'

# Enhanced metadata with artwork
curl http://localhost:8080/api/media/metadata
```

## 🎮 **Media Controls**

The extension supports these control actions:
- `play` - Resume playback
- `pause` - Pause playback  
- `nexttrack` - Skip to next
- `previoustrack` - Go to previous

## 🔧 **How It Works**

### **Priority Detection Order:**
1. **navigator.mediaSession** (if available and populated)
2. **DOM extraction** (site-specific selectors)
3. **Legacy AppleScript** (fallback via dashboard)

### **Data Flow:**
```
🌐 Music Site → 🔌 Extension → 📡 Dashboard API → 📱 DeskThing Device
   (MediaSession)   (Content Script)   (Express Server)   (WebSocket)
```

### **Extension Components:**
- **Content Script** - Runs on music sites, accesses MediaSession
- **Background Worker** - Manages extension lifecycle
- **Popup UI** - Shows status and connection info

## 🎯 **Advantages Over AppleScript**

| Feature | AppleScript Approach | Chrome Extension |
|---------|---------------------|------------------|
| **Quote Escaping** | ❌ Constant issues | ✅ No issues |
| **MediaSession API** | ❌ Can't access | ✅ Full access |
| **Real-time Updates** | ⚠️ Polling only | ✅ Event-driven |
| **Artwork** | ❌ Limited | ✅ Full support |
| **Duration/Position** | ❌ Disabled | ✅ Working |
| **Controls** | ⚠️ Unreliable | ✅ Reliable |
| **Multi-site Support** | ⚠️ Basic | ✅ Enhanced |

## 🧪 **Testing**

### **Test Current Detection:**
```bash
# Test the extension data
curl http://localhost:8080/api/media/detect | jq .
```

### **Test Controls:**
```bash
# Pause current music
curl -X POST http://localhost:8080/api/media/control \
  -H "Content-Type: application/json" \
  -d '{"action": "pause"}'
```

### **Check Extension Status:**
- Click the extension icon in Chrome toolbar
- Should show "Connected to Dashboard"
- Current track info should appear

## 📱 **DeskThing Integration**

Your DeskThing device can now consume:
- **WebSocket stream** at `ws://localhost:8080`
- **REST API** for current status and controls
- **Enhanced metadata** with artwork and position

## 🎉 **Result**

You now have:
- ✅ **Working dashboard** with real music detection
- ✅ **Chrome extension** for enhanced MediaSession access  
- ✅ **Proper controls** that actually work
- ✅ **Real-time updates** with artwork and position
- ✅ **Multi-site support** for all major music platforms

**This is the modern, reliable solution for browser music detection!** 