# About DeskThing

## 🚗➡️🖥️ **Take Back the Car Thing**

**DeskThing** is an open-source project that transforms Spotify's discontinued Car Thing into a versatile desktop assistant. When Spotify discontinued the Car Thing in December 2024 and encouraged users to throw them away as e-waste, the community stepped up to give these devices a second life.

## 📖 **The Story**

Spotify launched the Car Thing in 2022 as a voice-controlled music player for cars. The device was polarizing and ultimately flopped commercially. Rather than support it long-term, Spotify decided to discontinue both the product and all support, officially ending service on **December 9, 2024**. Spotify even encouraged users to discard their devices.

However, the community saw potential. Led by developer **Riprod** (ItsRiprod), DeskThing emerged as a way to "upcycle your discontinued Car Thing into a versatile desktop assistant that enhances your flow."

## 🏗️ **Architecture**

DeskThing works as a **two-part system**:

### **DeskThing Server** 
Desktop application running on your computer (Windows/Mac/Linux) that:
- Manages apps and communications
- Handles device flashing and setup
- Provides app store functionality
- Coordinates data between your computer and Car Thing

### **DeskThing Client**
Chromium-based web application running on the Car Thing that:
- Displays app interfaces on the Car Thing screen
- Handles touch input and physical controls
- Communicates with server via ADB (Android Debug Bridge)

## ✨ **Key Features**

### **🎵 Audio Control**
- **Spotify Integration**: Full playlist management, controls, output device selection
- **Local Audio Control**: Cross-platform media detection and control
- **Multi-source Support**: Works with various music apps and browsers

### **💬 Communication**
- **Discord Integration**: Show call participants, mute/unmute controls, voice activity
- **Real-time Notifications**: Push notifications with Car Thing integration

### **🌤️ Information Display**
- **Weather Integration**: Local weather, forecasts, AQI, UV index
- **System Monitoring**: CPU, GPU, RAM usage display
- **Custom Dashboards**: Configurable information panels

### **🎮 Interactive Apps**
- **Gaming**: Pong, multiplayer games with scorekeeping
- **Productivity**: Pomodoro timers, task management
- **Smart Home**: Home Assistant integration (planned)

### **🔧 Customization**
- **Configurable Controls**: Map any button to any function
- **Custom Themes**: CSS theming support through OpenAsar
- **App Development**: Easy app creation with `npm create deskthing@latest`

## 📊 **Community Impact**

The project has gained significant traction:
- **985+ GitHub Stars**
- **47,000+ Server Downloads**
- **144,000+ App Downloads**
- **4,800+ Discord Members**
- **Active Development Community**

## 🛠️ **Technical Innovation**

This isn't just a simple remote control - DeskThing solves complex technical challenges:

### **Cross-Window Browser Control**
Advanced Chrome extension architecture that bypasses browser security limitations to control media across different windows and tabs.

### **Multi-Platform Audio Detection**
- **Windows**: Native MediaSession API integration
- **macOS**: AppleScript fallback for system audio detection
- **Linux**: Cross-platform compatibility layers

### **Real-time Communication**
WebSocket-based architecture providing sub-100ms updates between devices.

### **Hardware Integration**
Complete device flashing and management system built into the application.

## 🌍 **Getting Started**

### **Requirements**
- Spotify Car Thing device
- Computer (Windows/Mac/Linux)
- USB-C cable

### **Setup Process**
1. **Flash Device**: Use DeskThing's built-in flashing tools
2. **Install Server**: Download DeskThing server for your OS
3. **Connect Device**: ADB connection via USB
4. **Install Apps**: Browse and install apps from built-in store

## 🔗 **Important Links**

### **Official Resources**
- **🌐 Website**: [deskthing.app](https://deskthing.app)
- **📱 Main Repository**: [github.com/ItsRiprod/DeskThing](https://github.com/ItsRiprod/DeskThing)
- **📦 Apps Repository**: [github.com/ItsRiprod/DeskThing-Apps](https://github.com/ItsRiprod/DeskThing-Apps)
- **📚 Documentation**: [carthing.wiki](https://carthing.wiki)

### **Community**
- **💬 Discord Server**: [DeskThing Discord](https://discord.gg/deskthing)
- **🗨️ Car Thing Hax Community**: [Car Thing Hax Discord](https://discord.gg/carthingthx)
- **📺 YouTube Channel**: [DeskThing YouTube](https://youtube.com/@deskthingapp)
- **🔴 Reddit**: [r/DeskThing](https://reddit.com/r/deskthing)

### **Development**
- **📋 Roadmap**: [Trello Board](https://trello.com/b/QfcSYUNL/deskthing)
- **🛠️ Development Docs**: App development guides and APIs
- **🎯 Issues**: Bug reports and feature requests on GitHub

### **Hardware Resources**
- **🔧 Flashing Tools**: [Thingify Tools](https://thingify.tools)
- **📖 Flashing Guide**: [iFixit Tutorial](https://www.ifixit.com/Guide/How+to+Install+Custom+Firmware+onto+Car+Thing/178814)
- **⚙️ Superbird Tool**: [github.com/bishopdynamics/superbird-tool](https://github.com/bishopdynamics/superbird-tool)

## 💝 **Supporting the Project**

DeskThing is developed by passionate volunteers. You can support the project:
- **☕ Buy Me a Coffee**: [buymeacoffee.com/riprod](https://buymeacoffee.com/riprod)
- **💎 GitHub Sponsors**: [github.com/sponsors/ItsRiprod](https://github.com/sponsors/ItsRiprod)
- **🤝 Contribute**: Submit PRs, report bugs, or create apps
- **📢 Share**: Help others discover DeskThing

## 🎯 **Vision**

> *"What started as a hobby project has turned into a passion project. We hope to continue to improve the DeskThing and make it a staple in the lives of our users... Take back the Car Thing."*
> 
> — Riprod, Creator

DeskThing represents more than just repurposing hardware - it's about **community-driven innovation**, **reducing e-waste**, and proving that discontinued doesn't mean dead. The project demonstrates how passionate developers can breathe new life into abandoned hardware and create something even better than the original.

---

**🚨 Disclaimer**: While bricking the Car Thing is extremely difficult, modification does carry some risk. DeskThing developers take no responsibility for any damage. Use common sense and follow official guides. 