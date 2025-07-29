/**
 * Environment Detection Utilities
 * Smart detection of browser, CLI, and server environments
 */

/**
 * Check if running in browser environment
 * @returns {boolean}
 */
export const isBrowser = () => {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
};

/**
 * Check if running in CLI/terminal environment
 * @returns {boolean}
 */
export const isCLI = () => {
  return typeof process !== 'undefined' && process.stdout && process.stdout.isTTY;
};

/**
 * Check if running in server/production environment
 * @returns {boolean}
 */
export const isServer = () => {
  return !isBrowser() && !isCLI();
};

/**
 * Get current environment type
 * @returns {'browser'|'cli'|'server'}
 */
export const getEnvironment = () => {
  if (isBrowser()) return 'browser';
  if (isCLI()) return 'cli';
  return 'server';
};