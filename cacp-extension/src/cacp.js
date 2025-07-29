/**
 * CACP (Chrome Audio Control Platform) Content Script
 * Universal media source for multiple music streaming sites
 */

import logger from '@logger';

// Import site handlers
import {SiteDetector} from './managers/site-detector.js';
import {SoundCloudHandler} from './sites/soundcloud.js';
import {YouTubeHandler} from './sites/youtube.js';

class CACPMediaSource {
    constructor() {
        // Try to load config for logger
        this.loadLoggerConfig();

        // Initialize logger
        this.log = logger.cacp;

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
        try {
            // Attempt to load config via Chrome extension API
            const configUrl = chrome.runtime.getURL('logger-config.json');


            // Try synchronous loading (works in Chrome extensions)
            const xhr = new XMLHttpRequest();
            xhr.open('GET', configUrl, false); // false = synchronous
            xhr.send();

            if (xhr.status === 200 && xhr.responseText) {
                const config = JSON.parse(xhr.responseText);

                // Apply config to logger using proper method
                if (logger && logger.configManager) {
                    // Use the existing loadConfig method which properly merges
                    logger.configManager.config = logger.configManager.mergeConfigs(logger.configManager.config, config);

                    // Refresh loggers to apply new config
                    if (logger.controls && logger.controls.refresh) {
                        logger.controls.refresh();

                        // Reassign our logger instance to pick up new formatter
                        this.log = logger.cacp;

                        // Test the new config immediately
                        this.log.info('🧪 Config test - this should have readable timestamp and purple color!');
                    }
                }

                console.log('📁 Logger config loaded from Chrome extension:', config.projectName);
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
        this.log.info('✨ CACP Extension v0.3.2 - Logger Ready!');

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

                this.activeHandler = this.siteDetector.createHandlerInstance(siteName);

                if (this.activeHandler) {
                    this.log.info('Handler created successfully', {
                        siteName,
                        handlerType: this.activeHandler.constructor.name,
                        hasInitialize: typeof this.activeHandler.initialize === 'function'
                    });

                    const initialized = await this.activeHandler.initialize();

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
                        this.activeHandler = null;
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
                this.activeHandler = null;
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
            const isPlaying = this.currentHandler.isPlaying ? this.currentHandler.isPlaying() : false;
            const currentTime = this.currentHandler.getCurrentTime ? this.currentHandler.getCurrentTime() : 0;
            const duration = this.currentHandler.getDuration ? this.currentHandler.getDuration() : 0;
            const isActive = this.currentHandler.isReady ? this.currentHandler.isReady() : false;

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
            Math.abs(prev.currentTime - newState.currentTime) > 5 // 5 second threshold
        );
    }

    /**
     * Handle control commands from background script
     */
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'media-control') {
                this.handleControlCommand(message.command)
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
    async handleControlCommand(command) {
        if (!this.currentHandler) {
            return {success: false, error: 'No active handler'};
        }

        this.log.info('Handling control command', {command, site: this.activeSiteName});

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
        this.log.debug('Cleaning up media source');

        if (this.reportingInterval) {
            clearInterval(this.reportingInterval);
        }

        if (this.isRegistered) {
            chrome.runtime.sendMessage({
                type: 'remove-media-source'
            }).catch(() => {
                // Background script might be unavailable during cleanup
            });
        }
    }
}

// Initialize CACP Media Source when script loads
const cacpMediaSource = new CACPMediaSource();

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

// Log that the content script loaded
if (cacpMediaSource.log) {
    cacpMediaSource.log.info('CACP Media Source content script loaded');
} else {
    console.log('[CACP] Media Source content script loaded'); // Fallback if logger not ready
}
