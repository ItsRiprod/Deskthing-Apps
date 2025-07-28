/**
 * Site Handler Template for CACP
 * 
 * Copy this file and rename it to your site (e.g., spotify.js, youtube.js)
 * Fill in the config section and override methods as needed.
 * 
 * See docs/cacp/contributing.md for detailed instructions.
 */

import { SiteHandler } from './base-handler.js';

export class YourSiteHandler extends SiteHandler {
  /**
   * REQUIRED: Site configuration
   * Update this with your site's specific selectors
   */
  static config = {
    // REQUIRED: Site name (display name)
    name: 'Your Site Name',
    
    // REQUIRED: URL patterns that identify this site
    urlPatterns: [
      'yoursite.com',
      'music.yoursite.com'
    ],
    
    // REQUIRED: CSS selectors for essential elements
    selectors: {
      // Play/pause button (can be same element or different)
      playButton: '.play-button',     // Button that starts playback
      pauseButton: '.pause-button',   // Button that pauses playback
      
      // Navigation buttons
      nextButton: '.next-button',     // Skip to next track
      prevButton: '.prev-button',     // Skip to previous track
      
      // Track metadata
      title: '.track-title',          // Song title element
      artist: '.artist-name',         // Artist name element
      album: '.album-name',           // Album name (optional)
      artwork: '.album-art img',      // Album artwork element
      
      // Progress tracking (optional but recommended)
      currentTime: '.current-time',   // Current position display
      duration: '.total-time',        // Total duration display
      progressBar: '.progress-bar'    // Clickable progress bar for seeking
    }
  };

  // === OPTIONAL: Override methods for complex behavior ===

  /**
   * OPTIONAL: Override for custom initialization
   * Called when the site is first detected
   */
  // async initialize() {
  //   const success = await super.initialize();
  //   if (success) {
  //     // Your custom initialization here
  //     console.log('Your site handler initialized');
  //   }
  //   return success;
  // }

  /**
   * OPTIONAL: Override for custom login detection
   * Return false if user needs to log in to use audio features
   */
  // isLoggedIn() {
  //   // Example: check for login indicator
  //   const loginButton = document.querySelector('.login-button');
  //   return !loginButton; // Not logged in if login button exists
  // }

  /**
   * OPTIONAL: Override for custom track info extraction
   * Use this if the site has complex metadata or dynamic content
   */
  // getTrackInfo() {
  //   // Example: custom logic for special cases
  //   if (this.isPodcastMode()) {
  //     return this.extractPodcastInfo();
  //   }
  //   
  //   // Use default config-based extraction
  //   return super.getTrackInfo();
  // }

  /**
   * OPTIONAL: Override for custom play/pause logic
   * Use this if the site has unusual play/pause behavior
   */
  // async play() {
  //   // Example: check for special conditions
  //   if (this.needsUserInteraction()) {
  //     // Handle sites that require user interaction
  //     this.showPlayPrompt();
  //     return { success: false, error: 'User interaction required' };
  //   }
  //   
  //   // Use default behavior
  //   return super.play();
  // }

  // === OPTIONAL: Helper methods for complex sites ===

  /**
   * Example helper method for detecting special modes
   */
  // isPodcastMode() {
  //   return document.querySelector('.podcast-indicator') !== null;
  // }

  /**
   * Example helper method for extracting podcast info
   */
  // extractPodcastInfo() {
  //   return {
  //     title: this.getElementText('title') || 'Unknown Episode',
  //     artist: this.getElementText('artist') || 'Unknown Podcast',
  //     album: 'Podcast',
  //     artwork: this.getArtwork(),
  //     isPlaying: this.getPlayingState(),
  //     site: this.config.name.toLowerCase()
  //   };
  // }
}

export default YourSiteHandler;

/**
 * IMPLEMENTATION CHECKLIST:
 * 
 * □ Update config.name with your site's display name
 * □ Update config.urlPatterns with URL patterns that identify your site
 * □ Update config.selectors with CSS selectors for your site's elements
 * □ Test basic functionality (play, pause, next, previous)
 * □ Test metadata extraction (title, artist, album, artwork)
 * □ Test edge cases (not logged in, no audio, ads, etc.)
 * □ Add host permissions to manifest.json
 * □ Document any limitations or special requirements
 * 
 * TESTING TIPS:
 * - Open your site in a new tab
 * - Load the CACP extension
 * - Check browser console for [CACP] log messages
 * - Use extension popup to verify real-time data
 * - Test with different songs, playlists, and site states
 * 
 * See docs/cacp/contributing.md for detailed guidance!
 */
