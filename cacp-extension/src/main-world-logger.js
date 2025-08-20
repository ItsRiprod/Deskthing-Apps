/**
 * CACP Main World Logger Exposure Script
 * This script runs in the main page context via script injection
 * to expose logger controls to the browser console window object.
 */

console.log('🌍 CACP Main World Script Loading...');

/**
 * Initialize and expose logger controls in main world
 */
function initializeMainWorldLogger() {
    try {
        console.log('🚀 Initializing CACP logger controls in main world...');
        
        // Create logger controls interface that communicates with content script
        const loggerControls = {
            enableDebugMode: () => {
                console.log('🐛 [Main World] Enabling debug mode...');
                window.postMessage({
                    type: 'CACP_LOGGER_COMMAND',
                    command: 'enableDebugMode'
                }, '*');
            },
            
            setLevel: (component, level) => {
                console.log(`📊 [Main World] Setting ${component} level to ${level}...`);
                if (!component || !level) {
                    console.error('❌ [Main World] setLevel requires component and level parameters');
                    console.log('💡 Usage: CACP_Logger.setLevel("soundcloud", "debug")');
                    return;
                }
                window.postMessage({
                    type: 'CACP_LOGGER_COMMAND',
                    command: 'setLevel',
                    component,
                    level
                }, '*');
            },
            
            getStatus: () => {
                console.log('ℹ️ [Main World] Requesting logger status...');
                window.postMessage({
                    type: 'CACP_LOGGER_COMMAND',
                    command: 'getStatus'
                }, '*');
            },
            
            help: () => {
                console.log(`
🎛️ CACP Logger Controls Help:

Available Commands:
• CACP_Logger.enableDebugMode()           - Enable debug logging for all components
• CACP_Logger.setLevel(component, level)  - Set specific component log level
• CACP_Logger.getStatus()                 - Show current logger status
• CACP_Logger.help()                      - Show this help

Examples:
• CACP_Logger.setLevel("soundcloud", "debug")
• CACP_Logger.setLevel("cacp", "info") 
• CACP_Logger.enableDebugMode()

Available Log Levels: debug, info, warn, error
Available Components: cacp, soundcloud, youtube
                `);
            }
        };
        
        // Expose to main world window object
        window.CACP_Logger = loggerControls;
        
        // Also expose a general CACP object for debugging
        window.CACP = window.CACP || {};
        window.CACP.logger = loggerControls;
        window.CACP.version = '1.1.4';
        window.CACP.context = 'main-world';
        window.CACP.injected = new Date().toISOString();
        
        console.log('✅ CACP_Logger successfully exposed in main world!');
        console.log('🎛️ Available methods:', Object.keys(loggerControls));
        console.log('💡 Try: CACP_Logger.help() for usage examples');
        console.log('🔍 Debug: window.CACP contains additional info');
        
        return true;
        
    } catch (error) {
        console.error('❌ Failed to initialize main world logger:', error);
        return false;
    }
}

// Initialize immediately since we're injected after DOM
initializeMainWorldLogger();

console.log('🌍 CACP Main World Script Loaded Successfully');