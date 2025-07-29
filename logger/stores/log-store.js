/**
 * Log Store for In-Memory Log Management
 * Particularly useful for Chrome extension popup debugging
 */

export class LogStore {
  constructor(maxLogs = 100) {
    this.logs = [];
    this.maxLogs = maxLogs;
    this.subscribers = [];
  }

  /**
   * Add a log entry to the store
   * @param {Object} logData - Structured log data
   */
  add(logData) {
    const logEntry = {
      ...logData,
      id: Date.now() + Math.random(),
      timestamp: logData.time || Date.now()
    };

    this.logs.unshift(logEntry);
    
    // Maintain max size
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    // Notify subscribers
    this.subscribers.forEach(callback => {
      try {
        callback(logEntry, this.logs);
      } catch (error) {
        console.error('LogStore subscriber error:', error);
      }
    });
  }

  /**
   * Get recent log entries
   * @param {number} count - Number of logs to return
   * @returns {Array} Recent log entries
   */
  getRecent(count = 20) {
    return this.logs.slice(0, count);
  }

  /**
   * Get logs filtered by component
   * @param {string} component - Component name to filter by
   * @param {number} count - Max number of logs to return
   * @returns {Array} Filtered log entries
   */
  getByComponent(component, count = 20) {
    return this.logs
      .filter(log => log.name === component)
      .slice(0, count);
  }

  /**
   * Get logs filtered by level
   * @param {number} level - Minimum log level (10=trace, 60=fatal)
   * @param {number} count - Max number of logs to return
   * @returns {Array} Filtered log entries
   */
  getByLevel(level, count = 20) {
    return this.logs
      .filter(log => log.level >= level)
      .slice(0, count);
  }

  /**
   * Clear all stored logs
   */
  clear() {
    this.logs = [];
    this.subscribers.forEach(callback => {
      try {
        callback(null, []);
      } catch (error) {
        console.error('LogStore subscriber error:', error);
      }
    });
  }

  /**
   * Subscribe to log updates
   * @param {Function} callback - Called when new logs are added
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  /**
   * Get summary statistics
   * @returns {Object} Log statistics
   */
  getStats() {
    const stats = {
      total: this.logs.length,
      byLevel: {},
      byComponent: {},
      timeRange: null
    };

    if (this.logs.length > 0) {
      stats.timeRange = {
        start: this.logs[this.logs.length - 1].timestamp,
        end: this.logs[0].timestamp
      };

      this.logs.forEach(log => {
        // Level stats
        const levelName = this.getLevelName(log.level);
        stats.byLevel[levelName] = (stats.byLevel[levelName] || 0) + 1;

        // Component stats  
        const component = log.name || 'unknown';
        stats.byComponent[component] = (stats.byComponent[component] || 0) + 1;
      });
    }

    return stats;
  }

  /**
   * Helper to get level name from level number
   * @private
   */
  getLevelName(level) {
    const levelMap = {
      10: 'trace', 20: 'debug', 30: 'info',
      40: 'warn', 50: 'error', 60: 'fatal'
    };
    return levelMap[level] || 'unknown';
  }
}