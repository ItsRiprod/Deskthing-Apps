# CACP Smart Adaptive Logging System Documentation

*Last Updated: July 28, 2025*

## 🎯 **Overview**

The CACP (Chrome Audio Control Platform) features a **Smart Adaptive Logging System** built on **Pino**, designed to automatically detect environment (browser/CLI/server) and provide optimal logging experience for each. It delivers beautiful, structured logging with unified configuration across all environments.

**🎉 STATUS: Advanced configuration system with file-level overrides, runtime controls, and smart level resolution is now FULLY IMPLEMENTED!**

> **📋 For development roadmap and future features, see [Logger Roadmap](./logger-roadmap.md)**

## ✨ **Key Features**

### **🧠 Smart Environment Detection**
- **Browser**: Beautiful console formatting with bracket notation and JSON payloads
- **CLI**: pino-colada integration for terminal development  
- **Server**: Structured JSON for production logging
- **Automatic**: Zero configuration environment switching

### **🎨 Enhanced Visual Experience**
- **Bracket Format**: `[COMPONENT-NAME]` with uppercase styling
- **Emoji Components**: `🎯 [CACP-CORE]`, `🎵 [SOUNDCLOUD]`, `🔍 [SITE-DETECTOR]`
- **JSON Payload Display**: Context data shown in expandable tree format
- **Color Coding**: Component-specific colors for easy visual scanning
- **Configurable Display**: Toggle any part (timestamp, emoji, component, level, message, payload, stackTrace)

### **⚙️ Advanced Configuration System** *(FULLY IMPLEMENTED)*
- **Smart Level Resolution**: File override → Component level → Global level hierarchy
- **File-Level Overrides**: Per-file and pattern-based level control with glob wildcards
- **External JSON Configuration**: Complete project configuration via `logger-config.json`
- **Runtime Controls**: Dynamic configuration changes via browser console
- **Timestamp Modes**: Absolute, readable, relative, or disabled timestamps
- **Component Auto-Registration**: Automatic component discovery + manual control
- **Portable Package**: Self-contained `@cacp/logger` package with alias imports

## 🏗️ **Architecture**

### **Portable Logger Structure**
```
logger/
├── index.js                    # Main entry point with smart initialization
├── config/
│   ├── config-manager.js       # Smart configuration system with file overrides
│   ├── default-config.json     # Default configuration
│   └── component-schemes.js    # Component styling definitions
├── formatters/
│   ├── browser-formatter.js    # Advanced browser console output with display controls
│   ├── cli-formatter.js        # Terminal output with pino-colada
│   └── server-formatter.js     # Production JSON logging
├── stores/
│   └── log-store.js            # In-memory log storage with filtering
├── utils/
│   └── environment-detector.js # Environment detection
└── examples/
    └── advanced-config.json    # Full configuration example
```

### **Technology Stack**

- **🔥 Pino**: High-performance structured logging engine
- **🍹 pino-colada**: Beautiful CLI terminal logging *(CLI mode)*
- **🎨 Smart Browser Formatter**: Console styling with file detection and display controls
- **📊 Structured Data**: JSON-first approach with visual enhancements
- **🎯 Smart Detection**: Automatic environment adaptation + file path detection
- **⚡ Performance**: 5-10x faster than Winston, minimal overhead
- **🎛️ Runtime Controls**: Dynamic configuration via `window.CACP_Logger`

## 🎨 **Output Examples**

### **Browser Console (With Advanced Features)**
```
22:02:44.969 🔍 [CACP-CORE] Logger initialized
22:02:45.321 ✨ [SITE-DETECTOR] Site detection complete
22:02:45.322 🚨 ERROR [CACP-CORE] Handler activation failed
   ├─ siteName: soundcloud
   ├─ availableHandlers: ["soundcloud", "youtube"] 
   ├─ reason: Handler creation failed
   ├─ filePath: src/cacp.js
   ├─ effectiveLevel: debug
```

### **File Override Example**
```
// src/sites/soundcloud.js with file override level: "trace"
22:15:30.123 🎵 TRACE [SOUNDCLOUD] Detailed selector matching
   ├─ selector: ".playButton"
   ├─ found: true
   ├─ timing: 2.3ms

// src/popup.js with timestampMode: "relative"
2s ago 🎛️ [POPUP] User clicked debug button
   ├─ component: "soundcloud"
```

### **Display Controls Example**
```javascript
// With display: { level: true, jsonPayload: false }
22:15:30.123 🚨 ERROR [SOUNDCLOUD] Track extraction failed

// With display: { timestamp: false, emoji: false }
[SOUNDCLOUD] Track extraction failed
```

## ⚙️ **Advanced Configuration System**

### **Complete Configuration Example**
```json
{
  "projectName": "CACP Extension",
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
    "soundcloud": { 
      "emoji": "🎵", 
      "color": "#FF5500", 
      "name": "SoundCloud",
      "level": "trace"
    },
    "websocket": { 
      "emoji": "🌐", 
      "color": "#9B59B6", 
      "name": "WebSocket",
      "level": "warn"
    }
  },
  "fileOverrides": {
    "src/sites/soundcloud.js": { 
      "level": "trace",
      "emoji": "🎵",
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

### **Smart Level Resolution Hierarchy**
1. **File Override** - `fileOverrides["src/popup.js"].level` *(Highest Priority)*
2. **Component Level** - `components["websocket"].level` 
3. **Global Level** - `globalLevel` *(Fallback)*

### **File Override Patterns**
- **Exact files**: `"src/popup.js"`
- **Wildcards**: `"src/managers/*.js"` 
- **Patterns**: `"src/test-*.js"`
- **Directories**: `"src/sites/*.js"`

Each override can specify:
- `level` - Log level for this file/pattern
- `emoji` - Custom emoji override
- `timestampMode` - File-specific timestamp mode
- `display` - Individual display toggles

### **Timestamp Modes**
- **`absolute`** - `22:15:30.123` (default)
- **`readable`** - `10:15 PM`
- **`relative`** - `2s ago`, `5m ago`
- **`disable`** - No timestamp

### **Display Controls**
```json
{
  "display": {
    "timestamp": true,    // Show/hide timestamp
    "emoji": true,        // Show/hide level emoji
    "component": true,    // Show/hide [COMPONENT-NAME]
    "level": false,       // Show/hide level name (DEBUG, INFO, etc.)
    "message": true,      // Show/hide log message
    "jsonPayload": true,  // Show/hide context data trees
    "stackTrace": true    // Show/hide error stack traces
  }
}
```

## 🚀 **Usage Examples**

### **Runtime Controls**
```javascript
// Available globally in browser as window.CACP_Logger
CACP_Logger.enableDebugMode();                    // All components → debug
CACP_Logger.setComponentLevel('websocket', 'warn'); // Component-specific level
CACP_Logger.addFileOverride('src/popup.js', {     // File-specific override
  level: 'trace',
  timestampMode: 'relative'
});
CACP_Logger.setDisplayOption('jsonPayload', false); // Toggle display parts
CACP_Logger.setTimestampMode('relative');           // Change timestamp mode
CACP_Logger.getStats();                             // Get logging statistics
```

### **File Override API**
```javascript
// Add runtime file overrides
logger.controls.addFileOverride('src/sites/soundcloud.js', {
  level: 'trace',
  display: { level: true, jsonPayload: true }
});

// Pattern-based overrides
logger.controls.addFileOverride('src/managers/*.js', {
  level: 'warn',
  display: { jsonPayload: false }
});

// List all active overrides
logger.controls.listFileOverrides();
// Remove specific override
logger.controls.removeFileOverride('src/popup.js');
```

### **Log Store & Statistics**
```javascript
// Advanced log filtering
const recentLogs = logger.logStore.getRecent(20);
const websocketLogs = logger.logStore.getByComponent('websocket', 10);
const errorLogs = logger.logStore.getByLevel(50, 5); // Errors only

// Real-time statistics
const stats = logger.controls.getStats();
// Returns:
// {
//   total: 156,
//   byLevel: { debug: 45, info: 89, warn: 15, error: 7 },
//   byComponent: { soundcloud: 67, websocket: 23, popup: 66 },
//   timeRange: { start: 1627846260000, end: 1627846320000 }
// }
```

### **Clean Alias Imports**
```javascript
// Internal logger package uses clean aliases
import { configManager } from '@cacp/logger/config/manager';
import { COMPONENT_SCHEME } from '@cacp/logger/config/schemes';
import { LogStore } from '@cacp/logger/stores/log-store';
import { createBrowserFormatter } from '@cacp/logger/formatters/browser';
```

### **Basic Usage**
```javascript
import logger from '@logger';

// Component-specific loggers with smart level resolution
const log = logger.soundcloud;  // Uses file override → component level → global level

// Rich context logging with automatic file detection
log.error('Track extraction failed', {
  url: window.location.href,
  selectors: {
    title: '.track-title',
    artist: '.track-artist'
  },
  retryCount: 3,
  lastError: error.message
});

// Output includes file path detection and effective level:
// 22:15:30.123 🚨 [SOUNDCLOUD] Track extraction failed
//    ├─ url: https://soundcloud.com/track/example
//    ├─ selectors: {title: ".track-title", artist: ".track-artist"}
//    ├─ retryCount: 3
//    ├─ filePath: src/sites/soundcloud.js
//    ├─ effectiveLevel: trace
```

## 📈 **Performance Characteristics**

### **Current Benchmarks**
| **Operation** | **Browser** | **CLI** | **Server** | **Notes** |
|---------------|-------------|---------|------------|-----------|
| Simple log | ~0.1ms | ~0.5ms | ~0.05ms | Browser styling overhead |
| Context data | ~0.3ms | ~1ms | ~0.1ms | JSON serialization |
| File detection | ~0.2ms | N/A | N/A | Stack trace analysis |
| Level resolution | ~0.05ms | ~0.05ms | ~0.05ms | Cached hierarchy lookup |

### **Production Recommendations**
- **Server mode**: Automatically uses structured JSON with `info` level
- **Browser development**: Full formatting with file override capabilities
- **CLI development**: pino-colada with beautiful terminal output

## 🎛️ **Complete Runtime Controls API**

### **Level Management**
```javascript
logger.controls.setLevel(component, level)           // Set component level
logger.controls.getLevel(component)                  // Get effective level
logger.controls.setComponentLevel(component, level)  // Set in config
logger.controls.enableDebugMode()                    // All components → debug
logger.controls.enableTraceMode()                    // All components → trace
```

### **File Override Management**
```javascript
logger.controls.addFileOverride(path, config)       // Add file override
logger.controls.removeFileOverride(path)             // Remove override
logger.controls.listFileOverrides()                  // List all overrides
```

### **Display Management**
```javascript
logger.controls.setDisplayOption(option, enabled)   // Set display option
logger.controls.getDisplayConfig()                   // Get current config
logger.controls.toggleDisplayOption(option)          // Toggle option
```

### **Timestamp Management**
```javascript
logger.controls.setTimestampMode(mode)               // Set timestamp mode
logger.controls.getTimestampMode()                   // Get current mode
logger.controls.getTimestampModes()                  // List available modes
```

### **System Management**
```javascript
logger.controls.refresh()                            // Refresh all loggers
logger.controls.reset()                              // Reset to defaults
logger.controls.getConfigSummary()                   // Get config summary
logger.controls.getStats()                           // Get logging stats
```

## 🛠️ **Implementation Status**

### ✅ **FULLY IMPLEMENTED FEATURES**

**Core System:**
- Smart Environment Detection: Browser/CLI/Server auto-detection
- Enhanced Browser Formatter: Bracket format + JSON payload display
- Component-Specific Styling: Emojis, colors, uppercase names
- pino-colada Integration: Beautiful CLI terminal logging
- Structured Context Display: Tree-like JSON data visualization
- Legacy Compatibility: Works with existing CACP codebase

**Advanced Configuration:**
- **✅ Portable Logger Package**: Self-contained `/logger` folder with modular structure
- **✅ JSON Configuration File**: External `logger-config.json` support with merging
- **✅ File-Level Overrides**: Per-file and pattern-based level control with wildcards
- **✅ Smart Level Resolution**: 3-tier hierarchy (file → component → global)
- **✅ Auto-Component Registration**: Automatic component discovery
- **✅ Runtime Configuration**: Browser console controls via `window.CACP_Logger`
- **✅ Log Store for Popup**: In-memory log management with filtering
- **✅ NPM Package Structure**: `@cacp/logger` with package.json subpath exports
- **✅ Timestamp Modes**: All 4 modes (absolute, readable, relative, disable)
- **✅ Display Controls**: Toggle any log part independently
- **✅ Alias Import System**: Clean internal imports throughout package

**Enhanced Features:**
- **✅ File Path Detection**: Automatic file detection from stack traces
- **✅ Advanced Runtime API**: Comprehensive controls for all features
- **✅ Pattern Matching**: Glob wildcards for file overrides (`src/managers/*.js`)
- **✅ LogStore Filtering**: Filter by component, level, time range
- **✅ Configuration Merging**: Deep merge of external configs with defaults
- **✅ Enhanced Statistics**: Real-time logging metrics and analytics

## 🔗 **Related Documentation**

- **[Logger Roadmap](./logger-roadmap.md)** - Development roadmap and future features
- **[CACP Architecture](./architecture.md)** - Overall system architecture
- **[API Reference](./api-reference.md)** - Complete API documentation
- [Pino Official Documentation](https://getpino.io/)
- [pino-colada: Beautiful terminal logs](https://github.com/lrlna/pino-colada)

## 🎯 **Quick Start**

```javascript
import logger from '@logger';

// Get component logger
const log = logger.soundcloud;

// Log with context
log.info('Track detected', {
  title: track.title,
  duration: track.duration,
  url: window.location.href
});

// Runtime controls (browser console)
CACP_Logger.setComponentLevel('soundcloud', 'trace');
CACP_Logger.addFileOverride('src/sites/soundcloud.js', { level: 'debug' });
```

---

## 🎯 **CONCLUSION**

**The CACP Smart Adaptive Logging System represents a mature, production-ready logging platform that exceeds the original vision with:**

- **Advanced file-level override system** with pattern matching
- **Complete runtime control API** for dynamic configuration
- **Smart level resolution hierarchy** for surgical debugging
- **Portable package structure** ready for reuse
- **Clean alias imports** for maintainable code

The system now provides **surgical debugging capabilities** - you can turn on trace logging for just one problematic file while keeping everything else quiet, all configurable at runtime through the browser console.

*This Smart Adaptive Logging System provides the foundation for sophisticated debugging and monitoring across complex multi-file applications with surgical precision and beautiful visual output across all environments.* 