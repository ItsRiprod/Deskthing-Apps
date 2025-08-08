# Chrome Audio Control Platform (CACP)

**Universal Chrome Extension for Audio Control in DeskThing**

> **🎉 Latest Update:** Enhanced CACP with robust image processing and comprehensive logging system (v0.1.3 app / v0.3.26 extension)

---

## 📁 **Repository Structure**

### **🎵 Current Working Apps (SoundCloud)**
- **`soundcloud-app/`** - Working SoundCloud DeskThing app (v1.0.1 beta)
- **`soundcloud-extension/`** - Working Chrome extension for SoundCloud

### **🎯 Next Generation (CACP Development)**
- **`cacp-app/`** - Universal DeskThing app (v0.1.3) - **Enhanced with image processing & comprehensive logging**
- **`cacp-extension/`** - Multi-site Chrome extension (v0.3.26) - **90%+ complete**

### **🛠️ Shared Infrastructure**
- **`scripts/`** - Build tools and utilities
- **`docs/`** - Organized project documentation
  - **`docs/cacp/`** - CACP architecture and development guides
  - **`docs/soundcloud/`** - Historical SoundCloud implementation docs

---

## 🚀 **CACP Testing & Development Guide**

### **🔧 Building & Version Management**

#### **Version Bumping Protocol**
Always bump versions when making changes to ensure you're working with the right build:

```bash
# CACP App (cacp-app/)
# Edit package.json and deskthing/manifest.json - increment version
# Example: 0.1.3 → 0.1.4

# CACP Extension (cacp-extension/)  
# Edit manifest.json - increment version
# Example: 0.3.26 → 0.3.27

# Rebuild both after version changes
```

#### **Building CACP App**
```bash
cd cacp-app
npm run build
# Output: dist/cacp-v[VERSION].zip
```

#### **Building CACP Extension**
```bash
cd cacp-extension  
npm run build
# Output: dist/ folder for Chrome extension loading
```

### **🎯 Installation & Testing**

#### **1. Install CACP App in DeskThing**
1. **Build** the CACP app: `cd cacp-app && npm run build`
2. **Open DeskThing Desktop App**
3. **Navigate to** Apps → Install App → Local Installation
4. **Select** `cacp-app/dist/cacp-v[VERSION].zip`
5. **Install** and start the CACP app

#### **2. Load CACP Extension in Chrome**
1. **Build** the extension: `cd cacp-extension && npm run build`
2. **Open Chrome** → Extensions → Developer Mode (ON)
3. **Load Unpacked** → Select `cacp-extension/dist/` folder
4. **Pin** the CACP extension to toolbar for easy access

#### **3. Test Integration**
1. **Start CACP app** in DeskThing (should show "Ready for Chrome extension connections")
2. **Navigate** to SoundCloud or YouTube in Chrome
3. **Open** CACP extension popup (should show site detection)
4. **Play music** and test controls from DeskThing device

---

## 📊 **Logging & Debugging**

### **🔍 Finding Logs**

#### **DeskThing App Logs**
**Primary Location (macOS):**
```bash
/Users/[username]/Library/Application Support/DeskThing/logs/readable.log
```

**Alternative Locations:**
- **Desktop (macOS):** `/Users/[username]/Library/Application Support/DeskThing/`
- **Device (Linux):** `~/.config/DeskThing/logs/` or `/var/log/deskthing/`
- **Per-app logs:** `/Users/[username]/Library/Application Support/DeskThing/apps/cacp/logs/`

#### **CACP App Log Patterns**
Look for these log entries in DeskThing logs:
```bash
# Startup logs
🚀 [CACP-Server] Starting enhanced CACP app v0.1.3 with comprehensive logging and image processing
✅ [CACP-Server] CACP App v0.1.3 Started Successfully - Ready for Chrome extension connections

# Connection logs  
🔌 [CACP-Server] Chrome extension connected from: 127.0.0.1
📨 [CACP-Server] Received from extension: mediaData (soundcloud)

# Image processing logs
🖼️ [CACP-MediaStore] New artwork detected: https://i1.sndcdn.com/...
✅ [CACP-MediaStore] Artwork cached: /resource/image/cacp/track-artist.jpg

# Media control logs
📡 [CACP-Server] DeskThing NEXT event received
🎮 [CACP-MediaStore] Sending command to extension: nexttrack
```

#### **Chrome Extension Logs**
**Browser Console:**
1. **Open** Chrome DevTools (F12)
2. **Console** tab → Filter by "CACP" 
3. **Look for:** Extension version, site detection, WebSocket status

**Extension Popup Logs:**
1. **Click** CACP extension icon
2. **View** real-time connection status and logs
3. **Copy** logs for debugging (copy button in popup)

### **🎯 Version Verification**

#### **Confirm Correct Versions**
```bash
# CACP App - Check DeskThing logs for:
🚀 [CACP-Server] Starting enhanced CACP app v0.1.3

# CACP Extension - Check popup or console for:
CACP Extension v0.3.26 initialized

# Extension Popup - Shows version in bottom corner
v0.3.26
```

### **🐛 Common Issues & Solutions**

#### **No Image Display**
- **Check logs for:** `🖼️ [CACP-MediaStore] New artwork detected`
- **Verify:** Image processing completes with `✅ [CACP-MediaStore] Artwork cached`
- **Path format:** Should be `/resource/image/cacp/filename.jpg`

#### **No Extension Connection**  
- **Check:** `🔌 [CACP-Server] Chrome extension connected` in DeskThing logs
- **Verify:** WebSocket server started on port 8081
- **Test:** Extension popup shows "Connected" status

#### **No Site Detection**
- **Check:** Extension popup shows current site
- **Verify:** Content script loaded on supported sites
- **Supported:** SoundCloud, YouTube (not YouTube Music yet)

---

## 🎯 **What is CACP?**

CACP is a **universal Chrome audio control platform** that provides seamless music control integration between web-based audio services and DeskThing. Instead of being limited to just SoundCloud, CACP supports multiple music streaming platforms through a modular, contributor-friendly architecture.

## 🎵 **Supported Sites**

### **✅ Currently Working (SoundCloud Apps)**
- **SoundCloud** - Complete implementation with real-time control via `soundcloud-extension/`

### **🚧 CACP Development Status**
- **SoundCloud** - ✅ Fully migrated to modular architecture (v0.3.26)
- **YouTube** - ✅ Handler implementation complete (testing phase)
- **Spotify Web** - 🔄 Framework ready, selectors need updates
- **Apple Music Web** - 🔄 Basic selectors implemented
- **YouTube Music** - 🔄 Framework ready for implementation

## 🏗️ **Architecture**

### **Current SoundCloud Architecture**
```
SoundCloud → Chrome Extension → SoundCloud App WebSocket (port 8081) → DeskThing → Car Thing
```

### **CACP Architecture (Enhanced)**
```
Multiple Sites → Universal Chrome Extension → CACP App WebSocket (port 8081) → DeskThing → Car Thing
                 ├── Site Detection & Priority
                 ├── Modular Site Handlers  
                 ├── Image Processing Pipeline
                 ├── Comprehensive Logging
                 └── User Settings UI
```

**Communication:** Single WebSocket connection with site identification in messages  
**Image Processing:** Downloads and caches artwork locally at `/resource/image/cacp/`  
**Logging:** Comprehensive debugging with DeskThing.sendLog throughout all components

## 📚 **Documentation**

### **🎯 CACP Development**
- **[Architecture](./docs/cacp/architecture.md)** - Technical design and patterns
- **[Roadmap](./docs/cacp/roadmap.md)** - Project vision and implementation phases  
- **[Contributing](./docs/cacp/contributing.md)** - How to add new site support
- **[Site Template](./docs/cacp/site-template.md)** - Template for new site handlers
- **[API Reference](./docs/cacp/api-reference.md)** - Interface specifications

### **🎵 SoundCloud Legacy**
- **[Implementation History](./docs/soundcloud/)** - Historical development documentation
- **[About DeskThing](./about-deskthing.md)** - Platform background and context

---

## 🔄 **Current Status & Recent Updates**

**Current Phase:** 🎉 **Enhanced Testing Phase**
- **CACP App v0.1.3:** Production-ready with image processing & comprehensive logging
- **CACP Extension v0.3.26:** 90%+ complete with SoundCloud + YouTube handlers
- **Image Processing:** ✅ Fixed - downloads and serves artwork locally
- **Logging System:** ✅ Complete - comprehensive debugging throughout

**Recent Enhancements (v0.1.3):**
- ✅ **Image Processing Pipeline** - Borrowed from SoundCloud app, fixes artwork display
- ✅ **Comprehensive Logging** - DeskThing.sendLog throughout all components  
- ✅ **Enhanced MediaStore** - Robust state management and error handling
- ✅ **Dynamic Version Logging** - Version numbers in all log outputs
- ✅ **Production Architecture** - Proper lifecycle management and resource cleanup

**Next Phase:** 🎯 **Multi-Site Validation**
- Complete extension testing across SoundCloud + YouTube
- Performance optimization and error recovery
- Community contribution pipeline

---

## ⚡ **Quick Development Workflow**

```bash
# 1. Make changes to CACP app or extension
# 2. Bump version numbers in manifests/package.json
# 3. Rebuild both components
cd cacp-app && npm run build
cd ../cacp-extension && npm run build

# 4. Reload in DeskThing and Chrome
# 5. Test with SoundCloud/YouTube
# 6. Check logs for version confirmation and debugging

# 7. Look for version logs:
# 🚀 [CACP-Server] Starting enhanced CACP app v0.1.3
# CACP Extension v0.3.26 initialized
```

---

**Evolution Path:** SoundCloud App → Chrome Audio Control Platform (CACP)  
**Current Focus:** Extension validation and multi-site testing with comprehensive logging  
**Image Processing:** ✅ **RESOLVED** - Local artwork caching working reliably