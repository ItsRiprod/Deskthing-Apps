# CACP Portable Logger System

**Smart Adaptive Logger with Multi-Environment Support & Advanced Configuration**

A sophisticated logging system that automatically detects its environment (browser, CLI, server) and provides optimal logging experience for each, with powerful file-level overrides and granular control.

## 🚀 **BREAKTHROUGH: Direct Browser Logger (July 29, 2025)**

**Major Achievement:** We bypassed Pino entirely in browser environments to achieve 100% control over console formatting.

**Why This Matters:**
- ✅ **Perfect Visual Formatting**: Beautiful console styling with proper colors and emojis
- ✅ **JSON Tree Expansion**: Gorgeous context data display with tree structure
- ✅ **Readable Timestamps**: `12:00 AM` format instead of milliseconds
- ✅ **Component Colors**: Purple CACP-CORE and all custom styling working
- ✅ **Chrome Extension Integration**: Seamless config loading via XHR

**The Innovation:** Our custom direct browser logger provides Pino-compatible API while giving us complete control over console output. Uses Pino for CLI/server, custom implementation for browser - the best of both worlds.

## ✨ Features

- 🧠 **Smart Environment Detection** - Auto-adapts to browser, CLI, or server
- 🎨 **Beautiful Visual Output** - Emoji, colors, and structured context display
- 📱 **Multi-Environment** - Browser console, terminal, and production JSON
- 🏪 **Log Store** - In-memory storage for debugging and popup interfaces
- ⚙️ **Runtime Controls** - Dynamic log level adjustment and configuration
- 📊 **Component Organization** - Separate loggers for different system components
- 🔧 **External Configuration** - JSON-based configuration system
- 📁 **File-Level Overrides** - Per-file and pattern-based control
- ⏰ **Timestamp Modes** - Absolute, readable, relative, or disabled
- 🎛️ **Display Toggles** - Control every aspect of log output
- 🎯 **Smart Level Resolution** - Hierarchical level determination

## 🚀 Quick Start

```javascript
import logger from '@cacp/logger';

// Use component-specific loggers with smart level resolution
const log = logger.soundcloud;
log.info('SoundCloud handler initialized', {
  url: window.location.href,
  isReady: true
});

// Runtime controls
logger.controls.enableDebugMode(); // Enable debug for all components
logger.controls.setLevel('websocket', 'trace'); // Set specific component level
logger.controls.addFileOverride('src/popup.js', { level: 'trace' }); // File-specific control
```

## 🎯 **Level Resolution Hierarchy**

The logger uses intelligent level resolution with the following priority:

1. **File Override** - `fileOverrides["src/popup.js"].level`
2. **Component Level** - `components["websocket"].level` 
3. **Global Level** - `globalLevel`

This allows surgical debugging - you can turn on trace logging for just one problematic file while keeping everything else quiet.

## ⚙️ **Advanced Configuration**

### **Full Configuration Example**

```json
{
  "projectName": "My Advanced Project",
  "globalLevel": "info",
  "timestampMode": "absolute",
  "display": {
    "timestamp": true,
    "emoji": true,
    "component": true,
    "level": false,
    "message": true,
    "jsonPayload": true,
    "stackTrace": true
  },
  "components": {
    "api": { 
      "emoji": "🌐", 
      "color": "#4A90E2", 
      "name": "API",
      "level": "debug"
    },
    "database": { 
      "emoji": "💾", 
      "color": "#00C896", 
      "name": "Database",
      "level": "warn"
    }
  },
  "fileOverrides": {
    "src/auth/login.js": { 
      "level": "trace",
      "emoji": "🔐",
      "display": {
        "level": true,
        "jsonPayload": true
      }
    },
    "src/managers/*.js": { 
      "level": "warn",
      "display": {
        "jsonPayload": false
      }
    },
    "src/popup.js": {
      "level": "debug",
      "timestampMode": "relative",
      "display": {
        "jsonPayload": false
      }
    }
  }
}
```

### **File Override Patterns**

File overrides support powerful pattern matching:

- **Exact files**: `"src/popup.js"`
- **Wildcards**: `"src/managers/*.js"` 
- **Patterns**: `"src/test-*.js"`
- **Directories**: `"src/sites/*.js"`

Each override can specify:
- `level` - Log level for this file/pattern
- `emoji` - Custom emoji override
- `timestampMode` - File-specific timestamp mode
- `display` - Individual display toggles

## ⏰ **Timestamp Modes**

Control how timestamps are displayed:

- **`absolute`** - `22:15:30.123` (default)
- **`readable`** - `10:15 PM`
- **`relative`** - `2s ago`, `5m ago`
- **`disable`** - No timestamp

```javascript
// Set globally
logger.controls.setTimestampMode('relative');

// Or per-file in config
"fileOverrides": {
  "src/popup.js": { "timestampMode": "relative" }
}
```

## 🎛️ **Display Controls**

Toggle individual parts of log output:

```javascript
// Available display options
const displayConfig = {
  timestamp: true,    // Show/hide timestamp
  emoji: true,        // Show/hide level emoji
  component: true,    // Show/hide [COMPONENT-NAME]
  level: false,       // Show/hide level name (DEBUG, INFO, etc.)
  message: true,      // Show/hide log message
  jsonPayload: true,  // Show/hide context data trees
  stackTrace: true    // Show/hide error stack traces
};

// Runtime control
logger.controls.setDisplayOption('jsonPayload', false);
logger.controls.toggleDisplayOption('level');
```

## 🏗️ Architecture

```
logger/
├── index.js                    # Main entry point with smart initialization
├── config/
│   ├── config-manager.js       # Smart configuration system
│   ├── default-config.json     # Default configuration
│   └── component-schemes.js    # Component styling definitions
├── formatters/
│   ├── browser-formatter.js    # Advanced browser console output
│   ├── cli-formatter.js        # Terminal output with pino-colada
│   └── server-formatter.js     # Production JSON logging
├── stores/
│   └── log-store.js            # In-memory log storage with filtering
├── utils/
│   └── environment-detector.js # Environment detection
└── examples/
    └── advanced-config.json    # Full configuration example
```

## 🎯 **Usage Examples**

### **Per-Component Level Control**
```javascript
// Different components at different levels
logger.controls.setComponentLevel('websocket', 'warn');   // Quiet websocket
logger.controls.setComponentLevel('soundcloud', 'trace'); // Verbose SoundCloud
logger.controls.setComponentLevel('popup', 'debug');      // Debug popup
```

### **Surgical File Debugging**
```javascript
// Turn on trace logging for just one problematic file
logger.controls.addFileOverride('src/sites/soundcloud.js', {
  level: 'trace',
  display: { level: true, jsonPayload: true }
});

// Quiet all manager files
logger.controls.addFileOverride('src/managers/*.js', {
  level: 'warn',
  display: { jsonPayload: false }
});
```

### **Dynamic Display Control**
```javascript
// Hide JSON payloads but keep error stacks
logger.controls.setDisplayOption('jsonPayload', false);
logger.controls.setDisplayOption('stackTrace', true);

// Show level names for debugging
logger.controls.setDisplayOption('level', true);

// Use relative timestamps for popup
logger.controls.addFileOverride('src/popup.js', {
  timestampMode: 'relative'
});
```

### **Context Data**
```javascript
logger.soundcloud.error('Track extraction failed', {
  url: window.location.href,
  selectors: {
    title: '.track-title',
    artist: '.track-artist'
  },
  retryCount: 3,
  lastError: error.message,
  userAgent: navigator.userAgent
});

// With file override for src/sites/soundcloud.js level: "trace":
// 22:15:30.123 🚨 [SOUNDCLOUD] Track extraction failed
//    ├─ url: https://soundcloud.com/track/example
//    ├─ selectors: {title: ".track-title", artist: ".track-artist"}
//    ├─ retryCount: 3
//    ├─ lastError: "Element not found"
//    ├─ userAgent: "Mozilla/5.0..."
```

## 🎛️ **Runtime Controls API**

### **Level Controls**
```javascript
logger.controls.setLevel(component, level)           // Set component level
logger.controls.getLevel(component)                  // Get effective level
logger.controls.setComponentLevel(component, level)  // Set in config
logger.controls.enableDebugMode()                    // All components → debug
logger.controls.enableTraceMode()                    // All components → trace
```

### **File Override Controls**
```javascript
logger.controls.addFileOverride(path, config)       // Add file override
logger.controls.removeFileOverride(path)             // Remove override
logger.controls.listFileOverrides()                  // List all overrides
```

### **Display Controls**
```javascript
logger.controls.setDisplayOption(option, enabled)   // Set display option
logger.controls.getDisplayConfig()                   // Get current config
logger.controls.toggleDisplayOption(option)          // Toggle option
```

### **Timestamp Controls**
```javascript
logger.controls.setTimestampMode(mode)               // Set timestamp mode
logger.controls.getTimestampMode()                   // Get current mode
logger.controls.getTimestampModes()                  // List available modes
```

### **System Controls**
```javascript
logger.controls.refresh()                            // Refresh all loggers
logger.controls.reset()                              // Reset to defaults
logger.controls.getConfigSummary()                   // Get config summary
logger.controls.getStats()                           // Get logging stats
```

## 📊 **Log Store & Statistics**

### **Advanced Log Filtering**
```javascript
// Get recent logs with file context
const recentLogs = logger.logStore.getRecent(20);
const websocketLogs = logger.logStore.getByComponent('websocket', 10);
const errorLogs = logger.logStore.getByLevel(50, 5); // Errors only

// Enhanced log entries include:
// - filePath: 'src/sites/soundcloud.js'
// - effectiveLevel: 'trace'
// - component: 'soundcloud'
// - displayConfig: { timestamp: true, ... }
```

### **Real-time Statistics**
```javascript
const stats = logger.controls.getStats();
// Returns:
// {
//   total: 156,
//   byLevel: { debug: 45, info: 89, warn: 15, error: 7 },
//   byComponent: { soundcloud: 67, websocket: 23, popup: 66 },
//   timeRange: { start: 1627846260000, end: 1627846320000 }
// }
```

## 🎨 **Output Examples**

### **🚀 BREAKTHROUGH: Perfect Browser Formatting**
```
// Direct browser logger with 100% style control:
12:00 AM 🎯 [CACP-CORE] ✨ CACP Extension v0.3.2 - Logger Ready!
12:00 AM 🎵 [SOUNDCLOUD] MediaSession track change detected
   ├─ title: Alt-J - Breezeblocks (Gkat Remix)
   ├─ artist: Gkat
   ├─ hasArtwork: true
12:00 AM 🎯 [CACP-CORE] 🧪 Testing JSON context display
   ├─ testData: {nested: {...}, simple: 'test string', boolean: true}
   ├─ location: {href: 'https://soundcloud.com/discover', hostname: 'soundcloud.com'}
   ├─ timestamp: 2025-07-29T06:00:53.837Z
```

### **File Override in Action**
```
// src/sites/soundcloud.js with level: "trace" override:
12:00 AM 🎵 TRACE [SOUNDCLOUD] Detailed selector matching
   ├─ selector: ".playButton"
   ├─ found: true
   ├─ timing: 2.3ms

// src/managers/websocket-manager.js with level: "warn" (quiet):
(no debug/info logs shown)

// src/popup.js with timestampMode: "relative":
2s ago 🎛️ [POPUP] User clicked debug button
   ├─ component: "soundcloud"
```

### **Display Toggles in Action**
```javascript
// With display: { level: true, jsonPayload: false }:
12:00 AM 🚨 ERROR [SOUNDCLOUD] Track extraction failed

// With display: { timestamp: false, level: true, jsonPayload: true }:
🚨 ERROR [SOUNDCLOUD] Track extraction failed
   ├─ url: https://soundcloud.com/track/example
   ├─ retryCount: 3
```

## 📦 Installation

```bash
npm install @cacp/logger
```

## 🎯 Environment Detection

The logger automatically detects its environment and uses optimal implementations:

- **Browser**: **🚀 BREAKTHROUGH** - Custom direct logger (bypasses Pino) for 100% console styling control
- **CLI**: Uses pino-colada for beautiful terminal output  
- **Server**: Uses structured JSON for production logging

**Why Browser is Different:**
Our testing revealed that Pino's browser detection was interfering with custom formatters, especially in Chrome extensions. By creating a custom direct browser logger that bypasses Pino entirely, we achieved:
- Perfect emoji and color display
- Readable timestamp formatting (`12:00 AM`)
- Beautiful JSON tree expansion
- Seamless Chrome extension integration
- Zero compromises on functionality

## 🚀 Advanced Features

### **Automatic File Detection**
The browser formatter automatically detects which file is logging by analyzing the call stack, enabling seamless file override functionality.

### **Smart Level Resolution**
The three-tier hierarchy (file → component → global) provides maximum flexibility with sensible defaults.

### **Pattern Matching**
File overrides support glob patterns with `*` and `?` wildcards for powerful bulk configuration.

### **Runtime Reconfiguration**
All settings can be changed at runtime without restarting, perfect for debugging complex issues.

## 🎯 **Migration from Basic Logger**

If you're upgrading from a basic logger:

```javascript
// Before: Simple global level
logger.level = 'debug';

// After: Granular control
logger.controls.setComponentLevel('websocket', 'warn');     // Quiet websocket
logger.controls.addFileOverride('src/popup.js', {           // Debug popup
  level: 'debug',
  timestampMode: 'relative'
});
```

## 🔧 **Browser Developer Tools**

In browser environments, runtime controls are available globally:

```javascript
// Available as window.CACP_Logger
CACP_Logger.enableDebugMode();
CACP_Logger.setDisplayOption('level', true);
CACP_Logger.addFileOverride('src/popup.js', { level: 'trace' });
CACP_Logger.getStats();
```

---

**Built for CACP** - Chrome Audio Control Platform  
**License**: ISC  

This logger system provides the foundation for sophisticated debugging and monitoring across complex multi-file applications with surgical precision and beautiful output.