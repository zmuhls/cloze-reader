/**
 * Leaderboard API Client
 * Communicates with FastAPI backend (Redis primary, HF Space fallback)
 * Supports near real-time polling for live updates
 */

export class HFLeaderboardAPI {
  constructor(baseUrl = '') {
    // HF Space URL (used as fallback and for GitHub Pages hosting)
    const HF_LEADERBOARD_SPACE = 'https://milwright-cloze-leaderboard.hf.space';

    // For local development, use local server
    // For production (Railway), use same origin (backend serves frontend)
    // For GitHub Pages, fall back to HF Space
    const isLocalDev = window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1';
    const isGitHubPages = window.location.hostname.includes('github.io');

    if (baseUrl) {
      this.baseUrl = baseUrl;
    } else if (isLocalDev) {
      this.baseUrl = window.location.origin;
    } else if (isGitHubPages) {
      this.baseUrl = HF_LEADERBOARD_SPACE;
    } else {
      // Railway or other hosting: use same origin (FastAPI serves both)
      this.baseUrl = window.location.origin;
    }

    // Polling state
    this.pollInterval = null;
    this.pollIntervalMs = 5000; // 5 seconds default
    this.listeners = new Set();
    this.lastLeaderboard = null;
  }

  /**
   * Start polling for leaderboard updates
   * @param {number} intervalMs - Polling interval in milliseconds (default: 5000)
   */
  startPolling(intervalMs = 5000) {
    if (this.pollInterval) {
      return;
    }

    this.pollIntervalMs = intervalMs;

    // Initial fetch
    this._pollOnce();

    // Set up interval
    this.pollInterval = setInterval(() => {
      this._pollOnce();
    }, intervalMs);
  }

  /**
   * Stop polling for updates
   */
  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  /**
   * Check if polling is currently active
   * @returns {boolean}
   */
  isPolling() {
    return this.pollInterval !== null;
  }

  /**
   * Subscribe to leaderboard updates
   * @param {Function} callback - Called with leaderboard data when updates occur
   * @returns {Function} Unsubscribe function
   */
  onUpdate(callback) {
    this.listeners.add(callback);

    // If we have cached data, call immediately
    if (this.lastLeaderboard) {
      callback(this.lastLeaderboard);
    }

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Internal: Fetch leaderboard and notify listeners if changed
   */
  async _pollOnce() {
    try {
      const leaderboard = await this.getLeaderboard();

      // Check if data changed (simple JSON comparison)
      const newData = JSON.stringify(leaderboard);
      const oldData = JSON.stringify(this.lastLeaderboard);

      if (newData !== oldData) {
        this.lastLeaderboard = leaderboard;
        this._notifyListeners(leaderboard);
      }
    } catch (error) {
      // Silent fail for polling - don't spam console
      console.debug('⏱️ Leaderboard: Poll failed (will retry)', error.message);
    }
  }

  /**
   * Internal: Notify all listeners of leaderboard update
   */
  _notifyListeners(leaderboard) {
    for (const callback of this.listeners) {
      try {
        callback(leaderboard);
      } catch (error) {
        console.error('⏱️ Leaderboard: Listener error', error);
      }
    }
  }

  /**
   * Get leaderboard from backend
   * @returns {Promise<Array>} Array of leaderboard entries
   */
  async getLeaderboard() {
    try {
      const response = await fetch(`${this.baseUrl}/api/leaderboard`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        console.debug('📥 Leaderboard API: Retrieved', {
          entries: data.leaderboard.length,
          message: data.message
        });
        return data.leaderboard;
      } else {
        throw new Error(data.message || 'Failed to retrieve leaderboard');
      }
    } catch (error) {
      console.error('❌ Leaderboard API: Error fetching:', error);
      throw error;
    }
  }

  /**
   * Add new entry to leaderboard
   * @param {Object} entry - Leaderboard entry {initials, level, round, passagesPassed, date}
   * @returns {Promise<Object>} Response object
   */
  async addEntry(entry) {
    try {
      const response = await fetch(`${this.baseUrl}/api/leaderboard/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(entry)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(`HTTP ${response.status}: ${errorData.detail || response.statusText}`);
      }

      const data = await response.json();

      console.log('✅ Leaderboard API: Entry added', {
        initials: entry.initials,
        level: entry.level,
        message: data.message
      });

      // Trigger immediate poll to refresh data
      if (this.pollInterval) {
        this._pollOnce();
      }

      return data;
    } catch (error) {
      console.error('❌ Leaderboard API: Error adding entry:', error);
      throw error;
    }
  }

  /**
   * Update entire leaderboard
   * @param {Array} entries - Array of leaderboard entries
   * @returns {Promise<Object>} Response object
   */
  async updateLeaderboard(entries) {
    try {
      const response = await fetch(`${this.baseUrl}/api/leaderboard/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(entries)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(`HTTP ${response.status}: ${errorData.detail || response.statusText}`);
      }

      const data = await response.json();

      console.log('✅ Leaderboard API: Updated', {
        entries: entries.length,
        message: data.message
      });

      // Trigger immediate poll to refresh data
      if (this.pollInterval) {
        this._pollOnce();
      }

      return data;
    } catch (error) {
      console.error('❌ Leaderboard API: Error updating:', error);
      throw error;
    }
  }

  /**
   * Clear all leaderboard data (admin function)
   * @returns {Promise<Object>} Response object
   */
  async clearLeaderboard() {
    try {
      const response = await fetch(`${this.baseUrl}/api/leaderboard/clear`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(`HTTP ${response.status}: ${errorData.detail || response.statusText}`);
      }

      const data = await response.json();

      console.log('✅ Leaderboard API: Cleared', {
        message: data.message
      });

      // Trigger immediate poll to refresh data
      if (this.pollInterval) {
        this._pollOnce();
      }

      return data;
    } catch (error) {
      console.error('❌ Leaderboard API: Error clearing:', error);
      throw error;
    }
  }

  /**
   * Check if backend is available
   * @returns {Promise<boolean>} True if backend is reachable
   */
  async isAvailable() {
    try {
      const response = await fetch(`${this.baseUrl}/api/leaderboard`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.ok;
    } catch (error) {
      console.warn('⚠️ Leaderboard API: Backend not available, will use localStorage fallback');
      return false;
    }
  }
}
