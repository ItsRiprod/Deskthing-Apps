/**
 * CLI/Terminal Formatter for CACP Logger
 * Uses pino-colada for beautiful terminal output with fallbacks
 */

import { COMPONENT_SCHEME, LEVEL_SCHEME } from '../config/component-schemes.js';

/**
 * Create CLI formatter using pino-colada or pino-pretty
 * @returns {Object} Stream-like object for Pino
 */
export const createCLIFormatter = () => {
  try {
    // Try to use pino-colada if available
    const pinoColada = require('pino-colada');
    return pinoColada();
  } catch (error) {
    // Fallback to pino-pretty if pino-colada not available
    try {
      const pinoPretty = require('pino-pretty');
      return pinoPretty({
        colorize: true,
        translateTime: 'HH:MM:ss.l',
        messageFormat: (log, messageKey, levelLabel) => {
          const component = COMPONENT_SCHEME[log.name] || COMPONENT_SCHEME['cacp'];
          const componentName = component.name.toUpperCase().replace(/([a-z])([A-Z])/g, '$1-$2');
          const level = LEVEL_SCHEME[log.level] || LEVEL_SCHEME[30];
          return `${level.emoji} [${componentName}] ${log[messageKey]}`;
        },
        customPrettifiers: {
          level: () => '', // Hide level since we show it in messageFormat
          time: (timestamp) => timestamp,
          name: () => '' // Hide name since we show it in messageFormat
        }
      });
    } catch (error) {
      // Ultimate fallback - basic JSON
      return {
        write: (data) => console.log(data)
      };
    }
  }
};