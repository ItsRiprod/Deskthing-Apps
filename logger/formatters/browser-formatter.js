/**
 * Browser Console Formatter for CACP Logger
 * Beautiful console output with emoji, colors, and context trees
 * Supports file overrides, display toggles, and smart configuration
 */

import {configManager} from '@cacp/logger/config/manager';

/**
 * Create browser console formatter for a specific component
 * @param {string} componentName - Component identifier
 * @param {Object} logStore - Optional log store for capturing logs
 * @returns {Object} Stream-like object for Pino
 */
export const createBrowserFormatter = (componentName, logStore = null) => {
    return {
        write: (data) => {
            try {
                const logData = typeof data === 'string' ? JSON.parse(data) : data;

                // Get file context from stack trace if available
                const filePath = getFilePathFromStack();
                if (filePath) {
                    configManager.setCurrentFile(filePath);
                }

                // Get component config with file override support
                const component = configManager.getComponentConfig(componentName, filePath);
                const level = configManager.getLevelConfig(logData.level);
                const displayConfig = configManager.getDisplayConfig(filePath);

                // Check if this log should be displayed based on effective level
                const effectiveLevel = configManager.getEffectiveLevel(componentName, filePath);
                if (!shouldDisplay(logData.level, effectiveLevel)) {
                    return;
                }

                // Build the log parts
                const logParts = [];
                const logStyles = [];

                // 1. Timestamp
                if (displayConfig.timestamp) {
                    const timestamp = configManager.formatTimestamp(logData.time);
                    if (timestamp) {
                        logParts.push(`%c${timestamp}`);
                        logStyles.push('color: #888; font-family: monospace;');
                    }
                }

                // 2. Level emoji
                if (displayConfig.emoji) {
                    const emoji = component.emoji || level.emoji;
                    logParts.push(`%c${emoji}`);
                    logStyles.push(`color: ${level.color}; font-size: 14px;`);
                }

                // 3. Component name
                if (displayConfig.component) {
                    const componentName = component.name.toUpperCase().replace(/([a-z])([A-Z])/g, '$1-$2');
                    logParts.push(`%c[${componentName}]`);
                    logStyles.push(`color: ${component.color}; font-weight: bold;`);
                }

                // 4. Level name (optional)
                if (displayConfig.level) {
                    logParts.push(`%c${level.name}`);
                    logStyles.push(`color: ${level.color}; font-weight: normal;`);
                }

                // 5. Message
                if (displayConfig.message) {
                    const message = logData.msg || '';
                    logParts.push(`%c${message}`);
                    logStyles.push('color: inherit;');
                }

                // Combine and log the main message
                if (logParts.length > 0) {
                    console.log(logParts.join(' '), ...logStyles);
                }

                // 6. JSON payload context (if enabled)
                if (displayConfig.jsonPayload) {
                    const contextData = extractContextData(logData);
                    if (Object.keys(contextData).length > 0) {
                        displayContextData(contextData);
                    }
                }

                // 7. Stack trace (if enabled and present)
                if (displayConfig.stackTrace && logData.err && logData.err.stack) {
                    console.error('   ╰─ Error Stack:');
                    console.error(logData.err.stack);
                }

                // Store log if logStore provided
                if (logStore) {
                    logStore.add({
                        ...logData,
                        filePath,
                        effectiveLevel,
                        component: componentName,
                        displayConfig
                    });
                }

            } catch (error) {
                // Fallback for malformed data
                console.log(data);
                if (logStore) {
                    logStore.add({
                        level: 50,
                        time: Date.now(),
                        msg: 'Logger formatting error',
                        error: error.message,
                        data
                    });
                }
            }
        }
    };
};

/**
 * Check if a log should be displayed based on level hierarchy
 * @param {number} logLevel - Log level number
 * @param {string} effectiveLevel - Effective level string
 * @returns {boolean} Whether log should be displayed
 * @private
 */
function shouldDisplay(logLevel, effectiveLevel) {
    const levelMap = {
        'trace': 10, 'debug': 20, 'info': 30,
        'warn': 40, 'error': 50, 'fatal': 60
    };

    const minLevel = levelMap[effectiveLevel] || 30;
    return logLevel >= minLevel;
}

/**
 * Extract context data from log data (excluding standard fields)
 * @param {Object} logData - Log data object
 * @returns {Object} Context data
 * @private
 */
function extractContextData(logData) {
    const excludeKeys = new Set(['level', 'time', 'msg', 'name', 'pid', 'hostname', 'v']);
    const contextData = {};

    Object.keys(logData).forEach(key => {
        if (!excludeKeys.has(key)) {
            contextData[key] = logData[key];
        }
    });

    return contextData;
}

/**
 * Display context data with tree-like structure
 * @param {Object} contextData - Context data to display
 * @private
 */
function displayContextData(contextData) {
    Object.entries(contextData).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
            console.log(`   ├─ %c${key}:`, 'color: #00C896; font-weight: bold;', value);
        } else {
            console.log(`   ├─ %c${key}: %c${value}`, 'color: #00C896; font-weight: bold;', 'color: inherit;');
        }
    });
}

/**
 * Extract file path from error stack trace
 * @returns {string|null} File path or null
 * @private
 */
function getFilePathFromStack() {
    try {
        const stack = new Error().stack;
        if (!stack) return null;

        const lines = stack.split('\n');

        // Look for the first line that doesn't contain logger internals
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];

            // Skip logger internal files
            if (line.includes('logger') || line.includes('pino') || line.includes('browser-formatter')) {
                continue;
            }

            // Extract file path from stack trace
            const match = line.match(/at .+?\((.+?):\d+:\d+\)/);
            if (match) {
                let filePath = match[1];

                // Clean up the file path
                if (filePath.startsWith('file://')) {
                    filePath = filePath.replace('file://', '');
                }

                // Extract relative path from absolute path
                const srcIndex = filePath.lastIndexOf('/src/');
                if (srcIndex !== -1) {
                    return 'src/' + filePath.substring(srcIndex + 5);
                }

                // Return the last part of the path
                const parts = filePath.split('/');
                if (parts.length >= 2) {
                    return parts.slice(-2).join('/');
                }

                return parts[parts.length - 1];
            }
        }

        return null;
    } catch (error) {
        return null;
    }
}
