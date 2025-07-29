/**
 * Component and Level Schemes for CACP Logger
 * Defines visual styling and organization for all logger components
 */

export const COMPONENT_SCHEME = {
  'cacp': { emoji: '🎯', color: '#8E44AD', name: 'CACP-CORE' },
  'soundcloud': { emoji: '🎵', color: '#FF5500', name: 'SoundCloud' },
  'youtube': { emoji: '📹', color: '#FF0000', name: 'YouTube' },
  'site-detector': { emoji: '🔍', color: '#00C896', name: 'SiteDetector' },
  'websocket': { emoji: '🌐', color: '#9B59B6', name: 'WebSocket' },
  'popup': { emoji: '🎛️', color: '#FF6B6B', name: 'Popup' },
  'background': { emoji: '🔧', color: '#4ECDC4', name: 'Background' },
  'priority-manager': { emoji: '⚖️', color: '#45B7D1', name: 'PriorityManager' },
  'settings': { emoji: '⚙️', color: '#96CEB4', name: 'Settings' },
  'test': { emoji: '🧪', color: '#FFEAA7', name: 'Test' }
};

export const LEVEL_SCHEME = {
  10: { emoji: '🔍', color: '#6C7B7F', name: 'TRACE' },
  20: { emoji: '🐛', color: '#74B9FF', name: 'DEBUG' },
  30: { emoji: '✨', color: '#00B894', name: 'INFO' },
  40: { emoji: '⚠️', color: '#FDCB6E', name: 'WARN' },
  50: { emoji: '🚨', color: '#E17055', name: 'ERROR' },
  60: { emoji: '💀', color: '#D63031', name: 'FATAL' }
};