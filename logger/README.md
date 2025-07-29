# CACP Portable Logger System

**Smart Adaptive Logger with Multi-Environment Support**

A sophisticated logging system that automatically detects its environment (browser, CLI, server) and provides optimal logging experience for each.

## ✨ Features

- 🧠 **Smart Environment Detection** - Auto-adapts to browser, CLI, or server
- 🎨 **Beautiful Visual Output** - Emoji, colors, and structured context display
- 📱 **Multi-Environment** - Browser console, terminal, and production JSON
- 🏪 **Log Store** - In-memory storage for debugging and popup interfaces
- ⚙️ **Runtime Controls** - Dynamic log level adjustment
- 📊 **Component Organization** - Separate loggers for different system components
- 🔧 **External Configuration** - JSON-based configuration system

## 🚀 Quick Start

```javascript
import logger from '@cacp/logger';

// Use component-specific loggers
const log = logger.soundcloud;
log.info('SoundCloud handler initialized', {
  url: window.location.href,
  isReady: true
});

// Runtime controls
logger.controls.enableDebugMode(); // Enable debug for all components
logger.controls.setLevel('websocket', 'trace'); // Set specific component level
```

## 🏗️ Architecture

```
logger/
├── index.js                 # Main entry point
├── config/
│   ├── config-manager.js    # Configuration loading/management
│   ├── default-config.json  # Default configuration
│   └── component-schemes.js # Component styling definitions
├── formatters/
│   ├── browser-formatter.js # Beautiful browser console output
│   ├── cli-formatter.js     # Terminal output with pino-colada
│   └── server-formatter.js  # Production JSON logging
├── stores/
│   └── log-store.js         # In-memory log storage
└── utils/
    └── environment-detector.js # Environment detection
```

## 🎯 Usage Examples

### Component Logging
```javascript
// Available component loggers
logger.cacp           // 🎯 [CACP-CORE]
logger.soundcloud     // 🎵 [SOUNDCLOUD]
logger.youtube        // 📹 [YOUTUBE]
logger.websocket      // 🌐 [WEBSOCKET]
logger.popup          // 🎛️ [POPUP]
// ... and more
```

### Context Data
```javascript
logger.soundcloud.error('Track extraction failed', {
  url: window.location.href,
  selectors: {
    title: '.track-title',
    artist: '.track-artist'
  },
  retryCount: 3,
  lastError: error.message
});

// Browser output:
// 22:15:30.123 🚨 [SOUNDCLOUD] Track extraction failed
//    ├─ url: https://soundcloud.com/track/example
//    ├─ selectors: {title: ".track-title", artist: ".track-artist"}
//    ├─ retryCount: 3
//    ├─ lastError: "Element not found"
```

### Runtime Controls
```javascript
// Available in browser as window.CACP_Logger
logger.controls.setLevel('websocket', 'debug');
logger.controls.enableTraceMode(); // All components to trace
logger.controls.getStats(); // Log statistics
logger.controls.listComponents(); // Available loggers
```

### Log Store Access
```javascript
// Get recent logs (useful for extension popup)
const recentLogs = logger.logStore.getRecent(20);
const websocketLogs = logger.logStore.getByComponent('websocket', 10);
const errorLogs = logger.logStore.getByLevel(50, 5); // Errors only

// Subscribe to new logs
const unsubscribe = logger.logStore.subscribe((newLog, allLogs) => {
  console.log('New log:', newLog);
});
```

## ⚙️ Configuration

### External Configuration File
Create a `logger-config.json` file:

```json
{
  "projectName": "My Project",
  "globalLevel": "debug",
  "format": {
    "style": "brackets",
    "componentCase": "upper",
    "timestamp": "HH:mm:ss.SSS"
  },
  "components": {
    "api": { 
      "emoji": "🌐", 
      "color": "#4A90E2", 
      "name": "API" 
    },
    "database": { 
      "emoji": "💾", 
      "color": "#00C896", 
      "name": "Database" 
    }
  }
}
```

### Load Configuration
```javascript
import Logger from '@cacp/logger';

// Auto-loads ./logger-config.json if present
const logger = await Logger.init({
  configPath: './my-logger-config.json'
});
```

## 🎨 Output Examples

### Browser Console
```
22:15:30.123 ✨ [WEBSOCKET] Connection established
   ├─ url: ws://localhost:8081
   ├─ protocols: ["cacp-v1"]
   ├─ readyState: 1

22:15:31.456 🚨 [SOUNDCLOUD] Track extraction failed
   ├─ error: "Selector not found"
   ├─ selector: ".track-title"
   ├─ retryAttempt: 3
```

### CLI Terminal
```
15:31:42 ✨ [WEBSOCKET] Connection established
15:31:43 🐛 [SITE-DETECTOR] Pattern matching started
15:31:44 🚨 [SOUNDCLOUD] Track extraction failed
```

### Production Server
```json
{"level":50,"time":"2025-07-28T22:15:31.456Z","name":"soundcloud","msg":"Track extraction failed","error":"Selector not found","selector":".track-title","retryAttempt":3}
```

## 🔧 API Reference

### Logger Methods
- `logger.{component}.trace(msg, context?)` - Detailed execution flow
- `logger.{component}.debug(msg, context?)` - Development information  
- `logger.{component}.info(msg, context?)` - General information
- `logger.{component}.warn(msg, context?)` - Potential issues
- `logger.{component}.error(msg, context?)` - Actual problems
- `logger.{component}.fatal(msg, context?)` - Critical failures

### Control Methods
- `logger.controls.setLevel(component, level)` - Set component log level
- `logger.controls.getLevel(component)` - Get component log level
- `logger.controls.enableDebugMode()` - Enable debug for all components
- `logger.controls.enableTraceMode()` - Enable trace for all components
- `logger.controls.listComponents()` - List available components
- `logger.controls.getStats()` - Get logging statistics

### Log Store Methods
- `logger.logStore.getRecent(count)` - Get recent log entries
- `logger.logStore.getByComponent(component, count)` - Filter by component
- `logger.logStore.getByLevel(level, count)` - Filter by level
- `logger.logStore.clear()` - Clear stored logs
- `logger.logStore.subscribe(callback)` - Subscribe to new logs

## 📦 Installation

```bash
npm install @cacp/logger
```

## 🎯 Environment Detection

The logger automatically detects its environment:

- **Browser**: Uses styled console output with emoji and colors
- **CLI**: Uses pino-colada for beautiful terminal output  
- **Server**: Uses structured JSON for production logging

## 🚀 Advanced Features

### Custom Components
```javascript
// Add custom component at runtime
logger.createLogger('my-component');
logger['my-component'].info('Custom component ready');
```

### Performance Monitoring
```javascript
// Built-in timing (coming soon)
logger.soundcloud.time('track-extraction');
// ... extraction logic
logger.soundcloud.timeEnd('track-extraction');
```

### Error Tracking
```javascript
try {
  // risky operation
} catch (error) {
  logger.cacp.error('Operation failed', {
    error: error.message,
    stack: error.stack,
    context: { userId, action }
  });
}
```

---

**Built for CACP** - Chrome Audio Control Platform  
**License**: ISC