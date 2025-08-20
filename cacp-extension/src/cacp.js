/**
 * CACP (Chrome Audio Control Platform) Content Script
 * Universal media source for multiple music streaming sites
 */

import logger from '@crimsonsunset/jsg-logger';

// Global error handler for extension context invalidation
window.addEventListener('error', (event) => {
    if (event.error && event.error.message && event.error.message.includes('Extension context invalidated')) {
        console.error('🚨 [CACP] Extension context invalidated - cleaning up intervals'); // Keep console for critical error
        // Attempt cleanup of any global intervals
        if (window.cacpCleanup) {
            window.cacpCleanup();
        }
        return true; // Prevent error from bubbling
    }
});

// Global cleanup function
window.cacpCleanup = () => {
    console.warn('🧹 [CACP] Global cleanup triggered'); // Keep console for global error handling
    if (window.cacpMediaSource) {
        window.cacpMediaSource.cleanup();
    }
};

// Inject main world script for logger exposure
(function injectMainWorldScript() {
    try {
        console.log('🚀 [CACP] Injecting main world script...');
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('src/main-world-logger.js');
        script.onload = function() {
            console.log('✅ [CACP] Main world script injected successfully');
            script.remove(); // Clean up
        };
        script.onerror = function() {
            console.error('❌ [CACP] Failed to inject main world script');
            script.remove();
        };
        (document.head || document.documentElement).appendChild(script);
    } catch (error) {
        console.error('❌ [CACP] Script injection error:', error);
    }
})();

// Import site handlers
import {SiteDetector} from './managers/site-detector.js';
import {SoundCloudHandler} from './sites/soundcloud.js';
import {YouTubeHandler} from './sites/youtube.js';

class CACPMediaSource {
    constructor() {
        console.log('🔧 [CACP] CACPMediaSource constructor started');
        console.log('🔧 [CACP] Logger state check:', { 
            logger: typeof logger, 
            loggerCacp: logger ? typeof logger.cacp : 'no logger',
            loggerControls: logger ? typeof logger.controls : 'no controls',
            loggerKeys: logger ? Object.keys(logger) : 'no logger'
        });
        
        // Try to load config for logger
        this.loadLoggerConfig();

        // Initialize logger
        this.log = logger.cacp;
        console.log('🔧 [CACP] Logger initialized:', typeof this.log);

        // Core components
        this.siteDetector = new SiteDetector();
        this.currentHandler = null;
        this.activeSiteName = null;

        // State tracking
        this.isRegistered = false;
        this.lastReportedState = null;
        this.reportingInterval = null;
        this.tabId = null;

        // Configuration
        this.reportIntervalMs = 2000; // Report every 2 seconds
        this.maxRetries = 3;

        this.log.debug('CACP Media Source created', {
            url: window.location.href,
            title: document.title
        });
    }

    /**
     * Load logger configuration for Chrome extension
     * @private
     */
    loadLoggerConfig() {
        console.log('🔧 [CACP] Starting logger config load...');
        try {
            // Attempt to load config via Chrome extension API
            const configUrl = chrome.runtime.getURL('logger-config.json');
            console.log('🔧 [CACP] Config URL:', configUrl);

            // Try synchronous loading (works in Chrome extensions)
            const xhr = new XMLHttpRequest();
            xhr.open('GET', configUrl, false); // false = synchronous
            xhr.send();
            
            console.log('🔧 [CACP] Config XHR response:', { status: xhr.status, hasText: !!xhr.responseText });

            if (xhr.status === 200 && xhr.responseText) {
                const config = JSON.parse(xhr.responseText);
                console.log('🔧 [CACP] Config parsed:', { projectName: config.projectName, globalLevel: config.globalLevel });

                // Apply config to logger using proper method
                if (logger && logger.configManager) {
                    console.log('🔧 [CACP] Logger available, merging config...');
                    // Use the existing loadConfig method which properly merges
                    logger.configManager.config = logger.configManager.mergeConfigs(logger.configManager.config, config);

                    // Refresh loggers to apply new config
                    if (logger.controls && logger.controls.refresh) {
                        console.log('🔧 [CACP] Refreshing logger controls...');
                        logger.controls.refresh();

                        // Reassign our logger instance to pick up new formatter
                        this.log = logger.cacp;

                        // Test the new config immediately
                        this.log.info('🧪 Config test - this should have readable timestamp and purple color!');
                    } else {
                        console.warn('🔧 [CACP] Logger controls not available for refresh');
                    }
                } else {
                    console.warn('🔧 [CACP] Logger or configManager not available');
                }

                console.info('📁 Logger config loaded from Chrome extension:', config.projectName);
            } else {
                console.warn('❌ Failed to load config - Status:', xhr.status, 'Response:', xhr.responseText);
            }
        } catch (error) {
            console.warn('⚠️ Could not load logger config:', error.message);
            console.warn('📍 Error details:', error);
        }
    }

    /**
     * Initialize this media source
     */
    async initialize() {
        this.log.info('Initializing CACP Media Source...', {
            url: window.location.href
        });

        // Test JSON context display
        this.log.info('🧪 Testing JSON context display', {
            testData: {
                nested: {value: 42, array: [1, 2, 3]},
                simple: 'test string',
                boolean: true,
                number: 123
            },
            location: {
                href: window.location.href,
                hostname: window.location.hostname,
                pathname: window.location.pathname
            },
            timestamp: new Date().toISOString()
        });

        // Logger is working perfectly with direct browser formatting
        try {
            const extVersion = chrome?.runtime?.getManifest?.().version || 'unknown';
            this.log.info(`✨ CACP Extension v${extVersion} - Logger Ready!`);
        } catch {
            this.log.info('✨ CACP Extension - Logger Ready!');
        }

        try {
            // Get tab ID from background script
            this.log.debug('Step 1: Getting tab ID...');
            await this.getTabId();
            this.log.debug('Step 1 complete: Tab ID obtained');

            // Register site handlers
            this.log.debug('Step 2: Registering site handlers...');
            await this.registerSiteHandlers();
            this.log.debug('Step 2 complete: Site handlers registered');

            // Detect if this site is supported
            this.log.debug('Step 3: Detecting site...');
            await this.detectSite();
            this.log.debug('Step 3 complete: Site detection finished', {
                activeSiteName: this.activeSiteName,
                hasHandler: !!this.currentHandler
            });

            // Set up message listener for control commands
            this.log.debug('Step 4: Setting up message listener...');
            this.setupMessageListener();
            this.log.debug('Step 4 complete: Message listener setup');

            // Register with background script if we have a handler
            if (this.currentHandler) {
                this.log.debug('Step 5: Registering with background script...');
                await this.registerWithBackground();
                this.log.debug('Step 5 complete: Background registration successful');

                this.log.debug('Step 6: Starting reporting...');
                this.startReporting();
                this.log.debug('Step 6 complete: Reporting started');
            } else {
                this.log.warn('No handler detected - skipping background registration and reporting');
            }

            // Listen for URL changes (SPA navigation)
            this.log.debug('Step 7: Setting up URL change listener...');
            this.setupURLChangeListener();
            this.log.debug('Step 7 complete: URL change listener setup');

            // Clean up on page unload
            this.log.debug('Step 8: Setting up unload handler...');
            this.setupUnloadHandler();
            this.log.debug('Step 8 complete: Unload handler setup');

            this.log.info('CACP Media Source initialized successfully', {
                siteName: this.activeSiteName,
                hasHandler: !!this.currentHandler,
                tabId: this.tabId,
                totalSteps: 8
            });

        } catch (error) {
            this.log.error('CACP Media Source initialization failed', {
                error: error.message,
                errorType: error.constructor.name,
                stack: error.stack,
                context: {
                    url: window.location.href,
                    hostname: window.location.hostname,
                    pathname: window.location.pathname,
                    activeSiteName: this.activeSiteName,
                    hasHandler: !!this.currentHandler,
                    tabId: this.tabId,
                    documentReadyState: document.readyState
                }
            });

            // Additional debugging info
            this.log.debug('Initialization failure debugging info', {
                registeredHandlers: this.siteDetector ? this.siteDetector.getRegisteredSites() : null,
                siteDetectorExists: !!this.siteDetector,
                locationDetails: {
                    href: window.location.href,
                    hostname: window.location.hostname,
                    pathname: window.location.pathname,
                    protocol: window.location.protocol
                }
            });
        }
    }

    /**
     * Get tab ID from background script
     */
    async getTabId() {
        try {
            const response = await chrome.runtime.sendMessage({type: 'get-status'});
            // Tab ID will be set by background script context
            this.tabId = 'current'; // Placeholder - background script knows which tab sent the message
        } catch (error) {
            this.log.warn('Could not get tab ID', {error: error.message});
        }
    }

    /**
     * Register all available site handlers
     */
    async registerSiteHandlers() {
        this.log.debug('Registering site handlers...');

        // Register SoundCloud handler with high priority (10 = highest)
        this.siteDetector.registerHandler(SoundCloudHandler, 10);

        // Register YouTube handler with medium priority (20)
        this.siteDetector.registerHandler(YouTubeHandler, 20);

        const registeredCount = this.siteDetector.getRegisteredSites().length;
        this.log.info(`Registered ${registeredCount} site handlers`);
    }

    /**
     * Detect current site and activate appropriate handler
     */
    async detectSite() {
        this.log.debug('Starting site detection', {
            url: window.location.href,
            hostname: window.location.hostname
        });

        try {
            const detectedSites = this.siteDetector.detectSites(window.location.href);

            this.log.debug('Site detection completed', {
                detectedSites,
                totalMatches: detectedSites?.length || 0,
                url: window.location.href,
                hostname: window.location.hostname
            });

            // Take the highest priority site (first in sorted array)
            const detectedSite = detectedSites && detectedSites.length > 0 ? detectedSites[0] : null;

            if (detectedSite) {
                this.activeSiteName = detectedSite.name;

                this.log.info('Site detected successfully', {
                    siteName: this.activeSiteName,
                    priority: detectedSite.priority,
                    isActive: detectedSite.isActive
                });

                // Activate the handler
                const activationResult = await this.activateHandler(detectedSite.name);

                this.log.debug('Handler activation completed', {
                    siteName: this.activeSiteName,
                    success: activationResult
                });

            } else {
                this.log.debug('No supported site detected', {
                    url: window.location.href,
                    hostname: window.location.hostname,
                    availableHandlers: this.siteDetector.getRegisteredSites()
                });
            }
        } catch (error) {
            this.log.error('Site detection failed', {
                error: error.message,
                stack: error.stack,
                url: window.location.href,
                hostname: window.location.hostname
            });
            throw error;
        }
    }

    /**
     * Activate site handler
     */
    async activateHandler(siteName) {
        try {
            this.log.debug('Starting handler activation', {
                siteName,
                hasSiteDetector: !!this.siteDetector,
                siteHandlers: this.siteDetector ? Object.keys(this.siteDetector.siteHandlers || {}) : 'no site detector'
            });

            if (!this.siteDetector) {
                this.log.error('Handler activation failed', {
                    siteName,
                    reason: 'No site detector available'
                });
                return false;
            }

            if (!siteName) {
                this.log.error('Handler activation failed', {
                    reason: 'No site name provided'
                });
                return false;
            }

            try {
                this.log.info('Attempting to activate handler', {
                    siteName,
                    availableHandlers: Object.keys(this.siteDetector.siteHandlers || {})
                });

                this.currentHandler = this.siteDetector.createHandlerInstance(siteName);

                if (this.currentHandler) {
                    this.log.info('Handler created successfully', {
                        siteName,
                        handlerType: this.currentHandler.constructor.name,
                        hasInitialize: typeof this.currentHandler.initialize === 'function'
                    });

                    const initialized = await this.currentHandler.initialize();

                    if (initialized) {
                        this.log.info('Handler activated successfully', {
                            siteName,
                            handlerReady: true
                        });
                        return true;
                    } else {
                        this.log.error('Handler initialization failed', {
                            siteName,
                            initialized,
                            initializeResult: initialized
                        });
                        this.currentHandler = null;
                        return false;
                    }
                } else {
                    this.log.error('Handler creation failed', {
                        siteName,
                        availableHandlers: Object.keys(this.siteDetector.siteHandlers || {}),
                        reason: 'createHandlerInstance returned null/undefined'
                    });
                    return false;
                }
            } catch (error) {
                this.log.error('Handler activation error', {
                    siteName,
                    error: error.message,
                    stack: error.stack,
                    errorType: error.constructor.name
                });
                this.currentHandler = null;
                return false;
            }
        } catch (error) {
            this.log.error('Handler activation failed', {
                siteName,
                error: error.message,
                stack: error.stack
            });
            return false;
        }
    }

    /**
     * Register this media source with background script
     */
    async registerWithBackground() {
        try {
            this.log.debug('Getting current media state for registration...');
            const mediaState = this.getCurrentMediaState();

            this.log.debug('Media state for registration', {
                site: this.activeSiteName,
                isActive: mediaState.isActive,
                trackTitle: mediaState.trackInfo?.title,
                isPlaying: mediaState.isPlaying,
                canControl: this.currentHandler?.canControl || true
            });

            this.log.debug('Sending registration message to background script...');

            const registrationData = {
                type: 'register-media-source',
                data: {
                    site: this.activeSiteName,
                    isActive: this.currentHandler?.isReady ? this.currentHandler.isReady() : false,
                    trackInfo: mediaState.trackInfo,
                    isPlaying: mediaState.isPlaying,
                    canControl: this.currentHandler?.canControl || true,
                    priority: this.siteDetector.getSitePriority(this.activeSiteName) || 1
                }
            };

            this.log.debug('Registration data prepared', registrationData);

            const response = await chrome.runtime.sendMessage(registrationData);

            this.log.debug('Background script response', {
                response,
                responseType: typeof response,
                success: response?.success
            });

            this.isRegistered = true;
            this.log.debug('Registered with background script successfully', {
                site: this.activeSiteName,
                isActive: mediaState.isActive,
                registrationResponse: response
            });

        } catch (error) {
            this.log.error('Failed to register with background script', {
                error: error.message,
                stack: error.stack,
                site: this.activeSiteName,
                chromeRuntimeError: chrome.runtime.lastError
            });
            throw error;
        }
    }

    /**
     * Get current media state from handler
     */
    getCurrentMediaState() {
        if (!this.currentHandler) {
            return {
                isActive: false,
                trackInfo: null,
                isPlaying: false,
                currentTime: 0,
                duration: 0
            };
        }

        try {
            const trackInfo = this.currentHandler.getTrackInfo ? this.currentHandler.getTrackInfo() : null;
            const isPlaying = this.currentHandler.isPlaying ? this.currentHandler.isPlaying() : (this.currentHandler.getPlayingState ? this.currentHandler.getPlayingState() : false);
            const currentTime = this.currentHandler.getCurrentTime ? this.currentHandler.getCurrentTime() : 0;
            const duration = this.currentHandler.getDuration ? this.currentHandler.getDuration() : 0;
            // Consider active when either handler reports ready OR media is currently playing
            const isActive = this.currentHandler.isReady ? (this.currentHandler.isReady() || isPlaying) : isPlaying;

            return {
                isActive,
                trackInfo,
                isPlaying,
                currentTime,
                duration,
                site: this.activeSiteName
            };
        } catch (error) {
            this.log.warn('Error getting media state', {error: error.message});
            return {
                isActive: false,
                trackInfo: null,
                isPlaying: false,
                currentTime: 0,
                duration: 0
            };
        }
    }

    /**
     * Start periodic reporting to background script
     */
    startReporting() {
        if (this.reportingInterval) {
            clearInterval(this.reportingInterval);
        }

        this.reportingInterval = setInterval(() => {
            this.reportMediaState();
        }, this.reportIntervalMs);

        this.log.debug('Started media state reporting', {
            intervalMs: this.reportIntervalMs
        });
    }

    /**
     * Report current media state to background script
     */
    async reportMediaState() {
        if (!this.isRegistered || !this.currentHandler) {
            return;
        }

        try {
            const currentState = this.getCurrentMediaState();

            // Only send update if state has changed significantly
            if (this.hasStateChanged(currentState)) {
                await chrome.runtime.sendMessage({
                    type: 'update-media-source',
                    data: currentState
                });

                this.lastReportedState = {...currentState};

                this.log.trace('Media state reported', {
                    site: this.activeSiteName,
                    isPlaying: currentState.isPlaying,
                    trackTitle: currentState.trackInfo?.title
                });
            }
        } catch (error) {
            this.log.warn('Failed to report media state', {
                error: error.message
            });
        }
    }

    /**
     * Check if media state has changed significantly
     */
    hasStateChanged(newState) {
        if (!this.lastReportedState) return true;

        const prev = this.lastReportedState;

        // Check significant changes
        return (
            prev.isActive !== newState.isActive ||
            prev.isPlaying !== newState.isPlaying ||
            prev.trackInfo?.title !== newState.trackInfo?.title ||
            prev.trackInfo?.artist !== newState.trackInfo?.artist ||
            Math.abs(prev.currentTime - newState.currentTime) > 1 // tighter threshold for timeline UI
        );
    }

    /**
     * Handle control commands from background script
     */
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'media-control') {
                this.handleControlCommand(message.command, message.time)
                    .then(result => sendResponse(result))
                    .catch(error => sendResponse({
                        success: false,
                        error: error.message
                    }));
                return true; // Async response
            }
        });
    }

    /**
     * Handle media control commands
     */
    async handleControlCommand(command, time) {
        if (!this.currentHandler) {
            return {success: false, error: 'No active handler'};
        }

        this.log.info('Handling control command', {command, time, site: this.activeSiteName});

        try {
            let result = false;

            switch (command) {
                case 'play':
                    result = await this.currentHandler.play();
                    break;
                case 'pause':
                    result = await this.currentHandler.pause();
                    break;
                case 'next':
                    result = await this.currentHandler.next();
                    break;
                case 'previous':
                    result = await this.currentHandler.previous();
                    break;
                case 'seek':
                    if (typeof time === 'number' && this.currentHandler.seek) {
                        result = await this.currentHandler.seek(time);
                    } else {
                        return { success: false, error: 'Seek time missing or unsupported' };
                    }
                    break;
                case 'toggle':
                    const isPlaying = this.currentHandler.isPlaying ? this.currentHandler.isPlaying() : false;
                    result = isPlaying ? await this.currentHandler.pause() : await this.currentHandler.play();
                    break;
                default:
                    return {success: false, error: `Unknown command: ${command}`};
            }

            // Force immediate state report after control
            setTimeout(() => this.reportMediaState(), 100);

            return {
                success: !!result,
                action: command,
                site: this.activeSiteName
            };

        } catch (error) {
            this.log.error('Control command failed', {
                command,
                error: error.message
            });
            return {success: false, error: error.message};
        }
    }

    /**
     * Handle URL changes for SPA navigation
     */
    setupURLChangeListener() {
        let lastUrl = window.location.href;

        // Monitor for URL changes
        const urlCheckInterval = setInterval(() => {
            if (window.location.href !== lastUrl) {
                lastUrl = window.location.href;
                this.log.debug('URL changed, re-detecting site', {newUrl: lastUrl});

                // Re-detect site after URL change
                setTimeout(() => {
                    this.detectSite();
                }, 1000);
            }
        }, 1000);

        // Clean up on unload
        window.addEventListener('beforeunload', () => {
            clearInterval(urlCheckInterval);
        });
    }

    /**
     * Clean up when page unloads
     */
    setupUnloadHandler() {
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
    }

    /**
     * Clean up resources and unregister
     */
    cleanup() {
        this.log.debug('🧹 [CACP] Cleaning up media source');

        if (this.reportingInterval) {
            clearInterval(this.reportingInterval);
            this.reportingInterval = null;
        }

        // Clean up current handler
        if (this.currentHandler && typeof this.currentHandler.cleanup === 'function') {
            this.currentHandler.cleanup();
        }

        if (this.isRegistered) {
            try {
                chrome.runtime.sendMessage({
                    type: 'remove-media-source'
                }).catch(() => {
                    // Background script might be unavailable during cleanup
                });
            } catch (error) {
                // Extension context might be invalidated
                this.log.debug('Chrome runtime unavailable during cleanup');
            }
        }
    }

    /**
     * Get current CACP status for debugging/testing
     */
    getStatus() {
        return {
            isInitialized: this.currentHandler !== null,
            activeSiteName: this.activeSiteName,
            hasActiveHandler: this.currentHandler !== null,
            lastMediaData: this.lastReportedState?.trackInfo || null,
            siteDetector: this.siteDetector?.getStatus() || null,
            websocketManager: {
                isConnected: this.isRegistered
            },
            version: chrome?.runtime?.getManifest?.()?.version || 'unknown'
        };
    }
}

// Initialize CACP Media Source when script loads
const cacpMediaSource = new CACPMediaSource();

// Register globally for cleanup
window.cacpMediaSource = cacpMediaSource;

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    cacpMediaSource.cleanup();
});

// Clean up when content script is about to be unloaded
window.addEventListener('pagehide', () => {
    cacpMediaSource.cleanup();
});

// Wait for DOM to be ready, then initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        cacpMediaSource.initialize();
    });
} else {
    // DOM already loaded
    cacpMediaSource.initialize();
}

// Export for potential external access
window.cacpMediaSource = cacpMediaSource;

// Expose CACP object for testing
window.CACP = {
    getStatus: () => cacpMediaSource.getStatus(),
    currentHandler: cacpMediaSource.currentHandler,
    siteDetector: cacpMediaSource.siteDetector,
    isInitialized: () => cacpMediaSource.currentHandler !== null
};

// Expose logger controls globally for debugging  
console.log('🔧 CACP Logger exposure check:', {
    loggerExists: typeof logger !== 'undefined',
    loggerControls: logger ? typeof logger.controls : 'logger undefined',
    loggerObject: logger ? Object.keys(logger) : 'no logger'
});

// Try to expose the logger controls
const exposeLogger = () => {
    console.log('🔍 Attempting to expose logger controls...');
    console.log('🔍 Logger state:', {
        logger: !!logger,
        controls: logger ? !!logger.controls : false,
        controlsType: logger && logger.controls ? typeof logger.controls : 'none',
        loggerKeys: logger ? Object.keys(logger) : [],
        currentWindowCACP: typeof window.CACP_Logger,
        windowLoggerKeys: Object.keys(window).filter(k => k.toLowerCase().includes('logger'))
    });
    
    if (logger && logger.controls && typeof logger.controls === 'object') {
        try {
            window.CACP_Logger = logger.controls;
            console.log('✅ CACP_Logger exposed via logger.controls');
            console.log('🎛️ Available methods:', Object.keys(logger.controls));
            
            // Verify the exposure actually worked
            if (window.CACP_Logger && typeof window.CACP_Logger.enableDebugMode === 'function') {
                console.log('🧪 Logger exposure verification: SUCCESS');
                return true;
            } else {
                console.error('❌ Logger exposure verification: FAILED', {
                    windowCACPLogger: typeof window.CACP_Logger,
                    hasEnableDebugMode: window.CACP_Logger ? typeof window.CACP_Logger.enableDebugMode : 'no CACP_Logger'
                });
                return false;
            }
        } catch (e) {
            console.error('❌ Logger exposure error:', e);
            return false;
        }
    }
    
    console.warn('❌ Logger controls not available yet', {
        loggerExists: !!logger,
        controlsExists: logger ? !!logger.controls : false,
        controlsType: logger && logger.controls ? typeof logger.controls : 'none'
    });
    return false;
};

// Try immediately
if (!exposeLogger()) {
    // Try after short delay
    setTimeout(() => {
        if (!exposeLogger()) {
            // Try after longer delay
            setTimeout(() => {
                if (!exposeLogger()) {
                    console.error('🚨 Failed to expose CACP_Logger after multiple attempts');
                    console.log('Debug info:', {
                        logger: typeof logger,
                        Re: typeof Re,
                        window: typeof window
                    });
                }
            }, 1000);
        }
    }, 100);
}

// Add a manual exposure function for debugging
window.exposeCACPLogger = () => {
    console.log('🔧 Manual logger exposure attempt...');
    
    // First try the normal exposure
    const normalExposure = exposeLogger();
    if (normalExposure) {
        console.log('✅ Normal exposure worked!');
        return;
    }
    
    // Manual fallback - try to find logger in global scope
    console.log('🔍 Searching for logger objects globally...');
    const globalObjects = Object.keys(window);
    const loggerObjects = globalObjects.filter(key => 
        key.toLowerCase().includes('logger') || 
        (window[key] && typeof window[key] === 'object' && window[key].controls)
    );
    
    console.log('Found potential logger objects:', loggerObjects);
    
    for (const objName of loggerObjects) {
        const obj = window[objName];
        if (obj && obj.controls && typeof obj.controls.enableDebugMode === 'function') {
            window.CACP_Logger = obj.controls;
            console.log(`✅ CACP_Logger manually exposed via ${objName}!`);
            console.log('🎛️ Available methods:', Object.keys(window.CACP_Logger));
            console.log('Try: CACP_Logger.enableDebugMode() or CACP_Logger.setLevel("soundcloud", "debug")');
            return;
        }
    }
    
    console.error('❌ Manual logger exposure failed - no suitable objects found');
    console.log('Debug info:', {
        globalLoggerObjects: loggerObjects,
        windowKeys: globalObjects.slice(0, 20) // Show first 20 for debugging
    });
};

// Listen for messages from main world script
window.addEventListener('message', (event) => {
    // Only handle our CACP logger commands
    if (event.data?.type !== 'CACP_LOGGER_COMMAND') return;
    
    console.log('🔗 [CACP] Received command from main world:', event.data);
    
    const { command, component, level } = event.data;
    
    try {
        switch (command) {
            case 'enableDebugMode':
                if (logger?.controls?.enableDebugMode) {
                    logger.controls.enableDebugMode();
                    console.log('✅ [CACP] Debug mode enabled via main world command');
                } else {
                    console.warn('❌ [CACP] Debug mode not available - logger.controls missing');
                }
                break;
                
            case 'setLevel':
                if (logger?.controls?.setLevel && component && level) {
                    logger.controls.setLevel(component, level);
                    console.log(`✅ [CACP] Set ${component} level to ${level} via main world command`);
                } else {
                    console.warn('❌ [CACP] setLevel not available or missing parameters:', { component, level });
                }
                break;
                
            case 'getStatus':
                if (cacpMediaSource?.getStatus) {
                    const status = cacpMediaSource.getStatus();
                    console.log('ℹ️ [CACP] Current status:', status);
                } else {
                    console.warn('❌ [CACP] getStatus not available');
                }
                break;
                
            default:
                console.warn('❓ [CACP] Unknown command from main world:', command);
        }
    } catch (error) {
        console.error('❌ [CACP] Error handling main world command:', error);
    }
});

console.log('🔗 [CACP] Main world message listener installed');

// Log that the content script loaded with version info
if (cacpMediaSource.log) {
    try {
        const extVersion = chrome?.runtime?.getManifest?.().version || 'unknown';
        cacpMediaSource.log.info(`CACP Extension v${extVersion} content script loaded`);
    } catch {
        cacpMediaSource.log.info('CACP Extension content script loaded');
    }
} else {
    console.info('[CACP] Media Source content script loaded'); // Fallback if logger not ready
}
