# Chrome Audio Control Platform (CACP)

**Universal Chrome Extension for Multi-Site Audio Control in DeskThing**

> **🚧 Development Status:** Active development - transitioning from SoundCloud-only to universal platform

---

## 🎯 **Project Overview**

CACP transforms the concept of single-site audio control into a **universal platform** that supports multiple streaming services through a modular, contributor-friendly architecture.

### **Current State (July 2025)**
- **✅ Working baseline:** SoundCloud implementation functional (`soundcloud-app/`, `soundcloud-extension/`)
- **🚧 CACP development:** New universal platform under development (`cacp-app/`, `cacp-extension/`)
- **📋 Architecture:** Dual development structure preserving working functionality

## 🏗️ **Repository Structure**

```
DeskThing-Apps/
├── cacp-app/               # 🎯 New universal DeskThing app
│   ├── server/            # Multi-site WebSocket server
│   ├── src/               # React frontend
│   └── deskthing/         # App manifest & assets
├── cacp-extension/         # 🎯 New universal Chrome extension
│   ├── sites/             # Site-specific handlers
│   ├── managers/          # Core system managers
│   └── settings/          # Priority configuration UI
├── soundcloud-app/        # ✅ Working SoundCloud DeskThing app
├── soundcloud-extension/  # ✅ Working Chrome extension
└── docs/cacp/            # 📚 This documentation
```

## 🎵 **Supported Sites**

### **✅ Production Ready**
- **SoundCloud** - Complete via `soundcloud-extension/` + `soundcloud-app/`

### **🚧 CACP Development Pipeline**
- **SoundCloud** - Migrating to modular architecture
- **YouTube** - Handler framework ready
- **Spotify Web** - Selectors identified, implementation pending
- **Apple Music Web** - Basic support planned
- **YouTube Music** - Extension of YouTube handler

## 🚀 **Quick Start**

### **For Users (Current)**
Use the working SoundCloud implementation:
```bash
# Use soundcloud-extension/ + soundcloud-app/
```

### **For Developers (CACP)**
Develop the new universal platform:
```bash
npm run dev:cacp          # Start CACP app development
# Load cacp-extension/ in Chrome Developer Mode
```

## 📚 **Documentation**

- **[Architecture](./architecture.md)** - Technical design and system overview
- **[Roadmap](./roadmap.md)** - Development phases and current status
- **[Contributing](./contributing.md)** - How to add new site support
- **[Site Template](./site-template.md)** - Template for new site handlers
- **[API Reference](./api-reference.md)** - Interface specifications

## 🔄 **Development Status**

**Phase 1: Foundation** 🚧 **Current**
- [x] Repository restructure with dual development
- [x] CACP architecture documentation
- [x] Scaffold files and manifest structure
- [ ] **Next:** Base handler class implementation

**Target:** Universal platform supporting 5+ streaming services with contributor-friendly architecture.

---

**Last Updated:** July 28, 2025  
**Current Focus:** Base handler implementation and site detection system
