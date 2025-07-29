/**
 * CACP Settings Page - Site Priority Management
 * Provides drag-drop interface for configuring site priorities and auto-switch behavior
 */

let priorityManager = null;
let currentSites = [];
let isLoading = false;

// Site configuration for display
const SITE_CONFIG = {
  'SoundCloud': {
    icon: '☁️',
    className: 'soundcloud',
    description: 'Audio streaming and sharing platform'
  },
  'YouTube': {
    icon: '📺',
    className: 'youtube', 
    description: 'Video platform with music content'
  },
  'YouTube Music': {
    icon: '🎵',
    className: 'youtube',
    description: 'Dedicated music streaming service'
  },
  'Spotify': {
    icon: '🎧',
    className: 'spotify',
    description: 'Music streaming platform'
  },
  'Apple Music': {
    icon: '🍎',
    className: 'apple',
    description: 'Apple\'s music streaming service'
  }
};

/**
 * Initialize settings page
 */
async function initializeSettings() {
  console.log('[CACP Settings] Initializing...');
  
  try {
    // Load current settings
    await loadSettings();
    
    // Set up event listeners
    setupEventListeners();
    
    // Hide loading, show content
    document.getElementById('loading').style.display = 'none';
    document.getElementById('settings-content').style.display = 'block';
    
    console.log('[CACP Settings] Initialization complete');
    
  } catch (error) {
    console.error('[CACP Settings] Initialization failed:', error);
    showMessage('Failed to load settings: ' + error.message, 'error');
  }
}

/**
 * Load current settings from storage
 */
async function loadSettings() {
  try {
    // Load priority manager settings
    const result = await chrome.storage.sync.get('cacp-site-priorities');
    const data = result['cacp-site-priorities'] || {};
    
    // Create mock priority manager for settings page
    priorityManager = {
      sitePriorities: new Map(Object.entries(data.sitePriorities || {})),
      autoSwitchEnabled: data.autoSwitchEnabled !== false, // Default to true
      getAllPriorities: function() {
        return Object.fromEntries(this.sitePriorities);
      },
      setPriorities: function(priorities) {
        this.sitePriorities = new Map(Object.entries(priorities));
      }
    };
    
    // Get available sites (hardcoded for now, will be dynamic with site handlers)
    currentSites = Object.keys(SITE_CONFIG);
    
    // Update UI
    updatePriorityList();
    updateAutoSwitchToggle();
    updateStatusDisplay();
    
  } catch (error) {
    console.error('[CACP Settings] Failed to load settings:', error);
    throw error;
  }
}

/**
 * Save settings to storage
 */
async function saveSettings() {
  if (isLoading) return;
  
  try {
    isLoading = true;
    document.getElementById('save-btn').textContent = 'Saving...';
    
    const data = {
      sitePriorities: priorityManager.getAllPriorities(),
      autoSwitchEnabled: priorityManager.autoSwitchEnabled,
      version: 1
    };
    
    await chrome.storage.sync.set({ 'cacp-site-priorities': data });
    
    showMessage('Settings saved successfully!', 'success');
    console.log('[CACP Settings] Settings saved:', data);
    
  } catch (error) {
    console.error('[CACP Settings] Failed to save settings:', error);
    showMessage('Failed to save settings: ' + error.message, 'error');
  } finally {
    isLoading = false;
    document.getElementById('save-btn').textContent = 'Save Settings';
  }
}

/**
 * Reset settings to defaults
 */
async function resetSettings() {
  if (!confirm('Are you sure you want to reset all settings to defaults?')) {
    return;
  }
  
  try {
    // Clear storage
    await chrome.storage.sync.remove('cacp-site-priorities');
    
    // Reset local state
    priorityManager.sitePriorities.clear();
    priorityManager.autoSwitchEnabled = true;
    
    // Update UI
    updatePriorityList();
    updateAutoSwitchToggle();
    
    showMessage('Settings reset to defaults', 'success');
    console.log('[CACP Settings] Settings reset to defaults');
    
  } catch (error) {
    console.error('[CACP Settings] Failed to reset settings:', error);
    showMessage('Failed to reset settings: ' + error.message, 'error');
  }
}

/**
 * Update priority list display
 */
function updatePriorityList() {
  const listEl = document.getElementById('priority-list');
  
  // Sort sites by priority
  const sortedSites = currentSites
    .map(name => ({
      name,
      priority: priorityManager.sitePriorities.get(name) || (currentSites.indexOf(name) + 1) * 10
    }))
    .sort((a, b) => a.priority - b.priority);
  
  // Generate HTML
  const html = sortedSites.map((site, index) => {
    const config = SITE_CONFIG[site.name] || { icon: '🌐', className: 'generic', description: 'Unknown site' };
    
    return `
      <li class="priority-item" draggable="true" data-site="${site.name}">
        <div class="priority-rank">${index + 1}</div>
        <div class="site-info">
          <div class="site-icon ${config.className}">${config.icon}</div>
          <div class="site-details">
            <h3>${site.name}</h3>
            <p>${config.description}</p>
          </div>
        </div>
        <div class="drag-handle">⋮⋮</div>
      </li>
    `;
  }).join('');
  
  listEl.innerHTML = html;
  
  // Set up drag and drop
  setupDragAndDrop();
}

/**
 * Update auto-switch toggle
 */
function updateAutoSwitchToggle() {
  const toggle = document.getElementById('auto-switch-toggle');
  toggle.className = `toggle-switch ${priorityManager.autoSwitchEnabled ? 'active' : ''}`;
}

/**
 * Update status display
 */
function updateStatusDisplay() {
  document.getElementById('registered-count').textContent = currentSites.length;
  document.getElementById('active-count').textContent = '0'; // Will be dynamic with real implementation
  document.getElementById('connection-status').textContent = 'Unknown'; // Will be dynamic with real implementation
}

/**
 * Set up drag and drop functionality
 */
function setupDragAndDrop() {
  const items = document.querySelectorAll('.priority-item');
  
  items.forEach(item => {
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragover', handleDragOver);
    item.addEventListener('drop', handleDrop);
    item.addEventListener('dragend', handleDragEnd);
  });
}

let draggedElement = null;

function handleDragStart(e) {
  draggedElement = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', this.outerHTML);
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  
  this.classList.add('drag-over');
  e.dataTransfer.dropEffect = 'move';
  return false;
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }
  
  if (draggedElement !== this) {
    // Get all items
    const list = document.getElementById('priority-list');
    const items = Array.from(list.children);
    
    // Find positions
    const draggedIndex = items.indexOf(draggedElement);
    const targetIndex = items.indexOf(this);
    
    // Reorder
    if (draggedIndex < targetIndex) {
      this.parentNode.insertBefore(draggedElement, this.nextSibling);
    } else {
      this.parentNode.insertBefore(draggedElement, this);
    }
    
    // Update priorities based on new order
    updatePrioritiesFromOrder();
  }
  
  return false;
}

function handleDragEnd(e) {
  const items = document.querySelectorAll('.priority-item');
  items.forEach(item => {
    item.classList.remove('dragging', 'drag-over');
  });
  draggedElement = null;
}

/**
 * Update priorities based on current order
 */
function updatePrioritiesFromOrder() {
  const items = document.querySelectorAll('.priority-item');
  const newPriorities = {};
  
  items.forEach((item, index) => {
    const siteName = item.dataset.site;
    newPriorities[siteName] = (index + 1) * 10; // 10, 20, 30, etc.
    
    // Update rank display
    const rankEl = item.querySelector('.priority-rank');
    rankEl.textContent = index + 1;
  });
  
  priorityManager.setPriorities(newPriorities);
  console.log('[CACP Settings] Updated priorities:', newPriorities);
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Save button
  document.getElementById('save-btn').addEventListener('click', saveSettings);
  
  // Reset button
  document.getElementById('reset-btn').addEventListener('click', resetSettings);
  
  // Test connection button
  document.getElementById('test-btn').addEventListener('click', testConnection);
  
  // Auto-switch toggle
  document.getElementById('auto-switch-toggle').addEventListener('click', toggleAutoSwitch);
}

/**
 * Toggle auto-switch setting
 */
function toggleAutoSwitch() {
  priorityManager.autoSwitchEnabled = !priorityManager.autoSwitchEnabled;
  updateAutoSwitchToggle();
  console.log('[CACP Settings] Auto-switch toggled:', priorityManager.autoSwitchEnabled);
}

/**
 * Test DeskThing connection
 */
async function testConnection() {
  const btn = document.getElementById('test-btn');
  btn.textContent = 'Testing...';
  btn.disabled = true;
  
  try {
    // Try to connect to WebSocket
    const ws = new WebSocket('ws://localhost:8081');
    
    ws.onopen = function() {
      showMessage('Connection to DeskThing successful!', 'success');
      ws.close();
    };
    
    ws.onerror = function() {
      showMessage('Failed to connect to DeskThing. Make sure the app is running.', 'error');
    };
    
    // Timeout after 5 seconds
    setTimeout(() => {
      if (ws.readyState === WebSocket.CONNECTING) {
        ws.close();
        showMessage('Connection timeout. Make sure DeskThing is running on localhost:8081.', 'error');
      }
    }, 5000);
    
  } catch (error) {
    showMessage('Connection test failed: ' + error.message, 'error');
  } finally {
    setTimeout(() => {
      btn.textContent = 'Test Connection';
      btn.disabled = false;
    }, 2000);
  }
}

/**
 * Show message to user
 */
function showMessage(text, type = 'success') {
  const messageEl = document.getElementById('message');
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
  messageEl.style.display = 'block';
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    messageEl.style.display = 'none';
  }, 5000);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeSettings);

