# Chrome Audio Control Platform (CACP)

**Universal Chrome Extension for Audio Control in DeskThing**

> **🚧 Project Evolution:** This repository is transitioning from SoundCloud-only to universal audio control platform

---

## 📁 **Repository Structure**

### **🎵 Current Working Apps (SoundCloud)**
- **`soundcloud-app/`** - Working SoundCloud DeskThing app (v1.0.1 beta)
- **`soundcloud-extension/`** - Working Chrome extension for SoundCloud

### **🎯 Next Generation (CACP Development)**
- **`cacp-app/`** - New universal DeskThing app (in development)
- **`cacp-extension/`** - New multi-site Chrome extension (in development)

### **🛠️ Shared Infrastructure**
- **`scripts/`** - Build tools and utilities
- **`docs/`** - Project documentation

---

## 🎯 **What is CACP?**

CACP is a **universal Chrome audio control platform** that provides seamless music control integration between web-based audio services and DeskThing. Instead of being limited to just SoundCloud, CACP supports multiple music streaming platforms through a modular, contributor-friendly architecture.

## 🎵 **Supported Sites**

### **✅ Currently Working (SoundCloud Apps)**
- **SoundCloud** - Complete implementation with real-time control via `soundcloud-extension/`

### **🚧 Planned Support (CACP)**
- **SoundCloud** - Migrated to modular architecture
- **YouTube** - Basic implementation in progress
- **Spotify Web** - Existing code needs refactoring
- **Apple Music Web** - Basic selectors implemented
- **YouTube Music** - Framework ready for implementation

## 🚀 **Quick Start**

### **For Users (Current SoundCloud)**
1. **Install** the Chrome Extension from `soundcloud-extension/`
2. **Install** the SoundCloud app from `soundcloud-app/` in DeskThing
3. **Configure** and start using SoundCloud control
4. **Control** music from your DeskThing device

### **For Developers (CACP Development)**
1. **Working baseline** - Use `soundcloud-app/` and `soundcloud-extension/` as reference
2. **New development** - Work in `cacp-app/` and `cacp-extension/` directories
3. **Architecture** - See `cacp-app/docs/` for technical design
4. **Contribute** - Use modular site handler system in `cacp-extension/sites/`

## 🏗️ **Architecture**

### **Current SoundCloud Architecture**
```
SoundCloud → Chrome Extension → SoundCloud App WebSocket (port 8081) → DeskThing → Car Thing
```

### **CACP Architecture (In Development)**
```
Multiple Sites → Universal Chrome Extension → CACP App WebSocket (port 8081) → DeskThing → Car Thing
                 ├── Site Detection & Priority
                 ├── Modular Site Handlers  
                 └── User Settings UI
```

**Communication:** Single WebSocket connection with site identification in messages

## 📚 **Documentation**

- **[Current SoundCloud](./soundcloud-app/docs/)** - Working implementation docs
- **[CACP Development](./cacp-app/docs/)** - New architecture and design
- **[About DeskThing](./about-deskthing.md)** - Platform background

---

## 🔄 **Transition Status**

**Current Phase:** 🚧 **Dual Development**
- **SoundCloud apps** remain functional for daily use
- **CACP apps** under active development
- **No breaking changes** to existing functionality

**Next Phase:** 🎯 **CACP Foundation**
- Complete base handler class implementation
- Multi-site detection and routing
- User priority settings interface

---

**Evolution Path:** SoundCloud App → Chrome Audio Control Platform (CACP)  
**Compatibility:** Maintains backward compatibility with existing SoundCloud functionality
