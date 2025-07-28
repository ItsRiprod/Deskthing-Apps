# Chrome Audio Control Platform (CACP)

**Universal Chrome Extension for Audio Control in DeskThing**

> **Previous Version:** [SoundCloud App README](../old/readme-old.md)

---

## 🎯 **What is CACP?**

CACP is a **universal Chrome audio control platform** that provides seamless music control integration between web-based audio services and DeskThing. Instead of being limited to just SoundCloud, CACP supports multiple music streaming platforms through a modular, contributor-friendly architecture.

## 🎵 **Supported Sites**

### **✅ Fully Supported**
- **SoundCloud** - Complete implementation with real-time control
- **YouTube** - *Coming Soon* - Basic implementation in progress

### **🚧 Planned Support**
- **Spotify Web** - Existing code needs refactoring
- **Apple Music Web** - Basic selectors implemented
- **YouTube Music** - Framework ready for implementation

## 🚀 **Quick Start**

### **For Users**
1. **Install** the Chrome Extension (CACP v1.0.1+)
2. **Install** the CACP app in DeskThing
3. **Configure** site priority in extension settings
4. **Open** any supported music site and start listening
5. **Control** music from your DeskThing device

### **For Contributors**
1. **Read** the [contributor guide](./contributing.md)
2. **Use** the [site handler template](./site-template.md)
3. **Implement** the required interface methods
4. **Test** your integration thoroughly
5. **Submit** a pull request

## 🏗️ **Architecture**

```
Chrome Extension (CACP)
├── Site Detection & Priority Management
├── Site-Specific Handlers (SoundCloud, YouTube, etc.)
├── WebSocket Communication Manager
└── Settings UI

DeskThing App (CACP)
├── WebSocket Server (port 8081)
├── Multi-Site Message Routing
└── DeskThing Integration
```

**Communication:** Single WebSocket connection with site identification in messages

## 📚 **Documentation**

- **[Roadmap](./roadmap.md)** - Project vision and implementation phases
- **[Architecture](./architecture.md)** - Technical design and patterns
- **[Contributing](./contributing.md)** - How to add new site support
- **[Site Template](./site-template.md)** - Template for new site handlers
- **[API Reference](./api-reference.md)** - Interface specifications

---

**Evolution Path:** SoundCloud App → Chrome Audio Control Platform (CACP)  
**Compatibility:** Maintains backward compatibility with existing SoundCloud functionality
