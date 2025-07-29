/**
 * CACP Priority Manager
 * 
 * Manages user-configured site priorities and resolves conflicts.
 */

import logger from '../logger.js';

export class PriorityManager {
  constructor() {
    // Initialize logger
    this.log = logger.priorityManager;
    
    this.sitePriorities = new Map(); // siteName -> priority number (lower = higher priority)
    this.defaultPriority = 100;
    this.autoSwitchEnabled = true;
    this.storageKey = 'cacp-site-priorities';
    
    // Load saved priorities
    this.loadPriorities();
    
    this.log.debug('Priority Manager created', {
      defaultPriority: this.defaultPriority,
      autoSwitchEnabled: this.autoSwitchEnabled,
      storageKey: this.storageKey
    });
  }

  /**
   * Set priority for a site
   * @param {string} siteName Site name
   * @param {number} priority Priority number (lower = higher priority)
   */
  setSitePriority(siteName, priority) {
    const oldPriority = this.sitePriorities.get(siteName);
    this.sitePriorities.set(siteName, priority);
    this.savePriorities();
    
    this.log.info('Site priority updated', {
      siteName,
      newPriority: priority,
      oldPriority: oldPriority || this.defaultPriority,
      totalSites: this.sitePriorities.size
    });
  }

  /**
   * Get priority for a site
   * @param {string} siteName Site name
   * @returns {number} Priority number
   */
  getSitePriority(siteName) {
    return this.sitePriorities.get(siteName) || this.defaultPriority;
  }

  /**
   * Set priorities for multiple sites
   * @param {Object} priorities Object mapping siteName -> priority
   */
  setSitePriorities(priorities) {
    const changes = [];
    
    for (const [siteName, priority] of Object.entries(priorities)) {
      const oldPriority = this.sitePriorities.get(siteName);
      this.sitePriorities.set(siteName, priority);
      
      changes.push({
        siteName,
        oldPriority: oldPriority || this.defaultPriority,
        newPriority: priority
      });
    }
    
    this.savePriorities();
    
    this.log.info('Bulk site priorities updated', {
      changes,
      totalSites: this.sitePriorities.size,
      updatedCount: Object.keys(priorities).length
    });
  }

  /**
   * Get all site priorities
   * @returns {Object} Object mapping siteName -> priority
   */
  getAllPriorities() {
    return Object.fromEntries(this.sitePriorities);
  }

  /**
   * Reset site to default priority
   * @param {string} siteName Site name
   */
  resetSitePriority(siteName) {
    this.sitePriorities.delete(siteName);
    this.savePriorities();
    console.log(`[CACP] Reset priority for ${siteName} to default`);
  }

  /**
   * Determine which site should be active from a list of candidates
   * @param {string[]} activeSites Array of site names with active audio
   * @param {string[]} availableSites Array of all detected site names
   * @returns {string|null} Site name that should be active, or null
   */
  selectActiveSite(activeSites, availableSites = []) {
    if (!activeSites || activeSites.length === 0) {
      return null;
    }

    // If only one active site, use it
    if (activeSites.length === 1) {
      return activeSites[0];
    }

    // Multiple active sites - use priority to resolve
    const sitesByPriority = activeSites
      .map(siteName => ({
        name: siteName,
        priority: this.getSitePriority(siteName)
      }))
      .sort((a, b) => a.priority - b.priority); // Lower number = higher priority

    const selectedSite = sitesByPriority[0];
    console.log(`[CACP] Selected ${selectedSite.name} from active sites:`, 
                sitesByPriority.map(s => `${s.name}(${s.priority})`));

    return selectedSite.name;
  }

  /**
   * Check if site should auto-switch based on priority
   * @param {string} currentSite Currently active site
   * @param {string} newSite Site that became active
   * @returns {boolean} True if should switch to new site
   */
  shouldAutoSwitch(currentSite, newSite) {
    if (!this.autoSwitchEnabled) return false;
    if (!currentSite || !newSite) return true;

    const currentPriority = this.getSitePriority(currentSite);
    const newPriority = this.getSitePriority(newSite);

    // Switch if new site has higher priority (lower number)
    return newPriority < currentPriority;
  }

  /**
   * Enable or disable auto-switching
   * @param {boolean} enabled Whether auto-switching should be enabled
   */
  setAutoSwitch(enabled) {
    this.autoSwitchEnabled = enabled;
    this.savePriorities();
    console.log(`[CACP] Auto-switch ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if auto-switching is enabled
   * @returns {boolean} True if auto-switching is enabled
   */
  isAutoSwitchEnabled() {
    return this.autoSwitchEnabled;
  }

  /**
   * Sort sites by priority
   * @param {string[]} siteNames Array of site names
   * @returns {Object[]} Array of {name, priority} sorted by priority
   */
  sortSitesByPriority(siteNames) {
    return siteNames
      .map(name => ({
        name,
        priority: this.getSitePriority(name)
      }))
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get priority ranking for settings UI
   * @param {string[]} siteNames Array of all available site names
   * @returns {Object[]} Array of site info for drag-drop interface
   */
  getPriorityRanking(siteNames) {
    return this.sortSitesByPriority(siteNames).map((site, index) => ({
      name: site.name,
      priority: site.priority,
      rank: index + 1,
      isDefault: !this.sitePriorities.has(site.name)
    }));
  }

  /**
   * Update priorities from drag-drop reordering
   * @param {string[]} orderedSiteNames Array of site names in new order
   */
  updateFromRanking(orderedSiteNames) {
    const newPriorities = {};
    
    orderedSiteNames.forEach((siteName, index) => {
      // Use index * 10 to leave room for manual adjustments
      const priority = (index + 1) * 10;
      newPriorities[siteName] = priority;
    });

    this.setSitePriorities(newPriorities);
    console.log('[CACP] Updated priorities from ranking:', newPriorities);
  }

  /**
   * Get conflict resolution info
   * @param {string[]} activeSites Sites with active audio
   * @returns {Object} Conflict resolution details
   */
  getConflictResolution(activeSites) {
    if (activeSites.length <= 1) {
      return {
        hasConflict: false,
        selectedSite: activeSites[0] || null,
        conflictingSites: [],
        resolution: 'no-conflict'
      };
    }

    const selectedSite = this.selectActiveSite(activeSites);
    const conflictingSites = activeSites.filter(site => site !== selectedSite);

    return {
      hasConflict: true,
      selectedSite,
      conflictingSites,
      resolution: this.autoSwitchEnabled ? 'auto-priority' : 'manual-required',
      priorities: this.sortSitesByPriority(activeSites)
    };
  }

  /**
   * Save priorities to storage
   */
  async savePriorities() {
    try {
      const data = {
        sitePriorities: Object.fromEntries(this.sitePriorities),
        autoSwitchEnabled: this.autoSwitchEnabled,
        version: 1
      };

      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.sync.set({ [this.storageKey]: data });
      } else {
        // Fallback to localStorage
        localStorage.setItem(this.storageKey, JSON.stringify(data));
      }
    } catch (error) {
      console.error('[CACP] Failed to save priorities:', error);
    }
  }

  /**
   * Load priorities from storage
   */
  async loadPriorities() {
    try {
      let data = null;

      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.sync.get(this.storageKey);
        data = result[this.storageKey];
      } else {
        // Fallback to localStorage
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
          data = JSON.parse(stored);
        }
      }

      if (data) {
        // Restore site priorities
        if (data.sitePriorities) {
          this.sitePriorities = new Map(Object.entries(data.sitePriorities));
        }

        // Restore auto-switch setting
        if (typeof data.autoSwitchEnabled === 'boolean') {
          this.autoSwitchEnabled = data.autoSwitchEnabled;
        }

        console.log('[CACP] Loaded priorities:', this.getAllPriorities());
      }
    } catch (error) {
      console.error('[CACP] Failed to load priorities:', error);
    }
  }

  /**
   * Reset all priorities to defaults
   */
  resetAllPriorities() {
    this.sitePriorities.clear();
    this.autoSwitchEnabled = true;
    this.savePriorities();
    console.log('[CACP] Reset all priorities to defaults');
  }

  /**
   * Get current status for debugging
   * @returns {Object} Current priority manager status
   */
  getStatus() {
    return {
      sitePriorities: this.getAllPriorities(),
      autoSwitchEnabled: this.autoSwitchEnabled,
      defaultPriority: this.defaultPriority
    };
  }
}

export default PriorityManager;
