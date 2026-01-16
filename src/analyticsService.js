/**
 * Analytics Service
 * Frontend client for tracking passage attempts, word difficulty, and hint usage.
 * Sends summary data to backend Redis analytics service.
 */

export class AnalyticsService {
  constructor() {
    // Generate unique session ID for this browser session
    this.sessionId = this._generateUUID();

    // Current passage tracking state
    this.currentPassage = null;

    // Base URL - uses same origin as the app
    this.baseUrl = window.location.origin;

  }

  /**
   * Generate a UUID v4
   */
  _generateUUID() {
    // Use crypto.randomUUID if available, otherwise fallback
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback for older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Start tracking a new passage attempt.
   * Call this when a new passage is loaded.
   *
   * @param {Object} book - Book info {title, author}
   * @param {Array} blanks - Array of blank objects with originalWord
   * @param {number} level - Current game level
   * @param {number} round - Current round number
   */
  startPassage(book, blanks, level, round) {
    this.currentPassage = {
      passageId: this._generateUUID(),
      sessionId: this.sessionId,
      bookTitle: book?.title || 'Unknown',
      bookAuthor: book?.author || 'Unknown',
      level: level || 1,
      round: round || 1,
      words: blanks.map(blank => ({
        word: blank.originalWord || '',
        length: (blank.originalWord || '').length,
        attemptsToCorrect: 0,
        hintsUsed: [],
        finalCorrect: false
      })),
      startTime: Date.now()
    };

    console.debug('📊 Analytics: Started passage', {
      passageId: this.currentPassage.passageId,
      book: this.currentPassage.bookTitle,
      blanks: this.currentPassage.words.length,
      level,
      round
    });
  }

  /**
   * Record an attempt on a specific word.
   * Call this each time the user submits an answer for a blank.
   *
   * @param {number} blankIndex - Index of the blank in the passage
   * @param {boolean} correct - Whether the attempt was correct
   */
  recordAttempt(blankIndex, correct) {
    if (!this.currentPassage) {
      console.warn('📊 Analytics: No active passage to record attempt');
      return;
    }

    if (blankIndex < 0 || blankIndex >= this.currentPassage.words.length) {
      console.warn('📊 Analytics: Invalid blank index', blankIndex);
      return;
    }

    const wordData = this.currentPassage.words[blankIndex];
    wordData.attemptsToCorrect++;

    if (correct) {
      wordData.finalCorrect = true;
    }

    console.debug('📊 Analytics: Recorded attempt', {
      word: wordData.word,
      attempt: wordData.attemptsToCorrect,
      correct
    });
  }

  /**
   * Record all attempts at once (batch mode).
   * Use when results come in as an array.
   *
   * @param {Array} results - Array of {blankIndex, isCorrect} objects
   */
  recordAttemptsBatch(results) {
    if (!this.currentPassage) {
      console.warn('📊 Analytics: No active passage to record attempts');
      return;
    }

    results.forEach(result => {
      if (result.blankIndex !== undefined) {
        this.recordAttempt(result.blankIndex, result.isCorrect);
      }
    });
  }

  /**
   * Record a hint request for a specific word.
   *
   * @param {number} blankIndex - Index of the blank
   * @param {string} hintType - Type of hint requested (e.g., 'part_of_speech', 'synonym', 'first_letter')
   */
  recordHint(blankIndex, hintType) {
    if (!this.currentPassage) {
      console.warn('📊 Analytics: No active passage to record hint');
      return;
    }

    if (blankIndex < 0 || blankIndex >= this.currentPassage.words.length) {
      console.warn('📊 Analytics: Invalid blank index for hint', blankIndex);
      return;
    }

    const wordData = this.currentPassage.words[blankIndex];
    wordData.hintsUsed.push(hintType || 'unknown');

    console.debug('📊 Analytics: Recorded hint', {
      word: wordData.word,
      hintType,
      totalHints: wordData.hintsUsed.length
    });
  }

  /**
   * Complete the current passage and send analytics to backend.
   *
   * @param {boolean} passed - Whether the user passed the passage
   * @returns {Promise<Object>} - Response from analytics API
   */
  async completePassage(passed) {
    if (!this.currentPassage) {
      console.warn('📊 Analytics: No active passage to complete');
      return { success: false, message: 'No active passage' };
    }

    // Calculate summary statistics
    const totalBlanks = this.currentPassage.words.length;
    const correctOnFirstTry = this.currentPassage.words.filter(
      w => w.attemptsToCorrect === 1 && w.finalCorrect
    ).length;
    const totalHintsUsed = this.currentPassage.words.reduce(
      (sum, w) => sum + w.hintsUsed.length, 0
    );

    const data = {
      passageId: this.currentPassage.passageId,
      sessionId: this.currentPassage.sessionId,
      bookTitle: this.currentPassage.bookTitle,
      bookAuthor: this.currentPassage.bookAuthor,
      level: this.currentPassage.level,
      round: this.currentPassage.round,
      words: this.currentPassage.words,
      totalBlanks,
      correctOnFirstTry,
      totalHintsUsed,
      passed,
      timestamp: new Date().toISOString()
    };

    console.debug('📊 Analytics: Completing passage', {
      passageId: data.passageId,
      passed,
      correctOnFirstTry,
      totalBlanks,
      totalHintsUsed
    });

    // Clear current passage state
    this.currentPassage = null;

    // Send to backend
    try {
      const response = await fetch(`${this.baseUrl}/api/analytics/passage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result;

    } catch (error) {
      // Don't throw - analytics failure shouldn't break the game
      console.warn('📊 Analytics: Failed to send (non-critical)', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Cancel tracking for current passage without sending.
   * Use if the user abandons a passage mid-attempt.
   */
  cancelPassage() {
    if (this.currentPassage) {
      console.debug('📊 Analytics: Cancelled passage', {
        passageId: this.currentPassage.passageId
      });
      this.currentPassage = null;
    }
  }

  /**
   * Check if there's an active passage being tracked.
   * @returns {boolean}
   */
  isTrackingPassage() {
    return this.currentPassage !== null;
  }

  /**
   * Get current passage statistics (for UI display).
   * @returns {Object|null}
   */
  getCurrentStats() {
    if (!this.currentPassage) return null;

    const totalBlanks = this.currentPassage.words.length;
    const correctOnFirstTry = this.currentPassage.words.filter(
      w => w.attemptsToCorrect === 1 && w.finalCorrect
    ).length;
    const totalCorrect = this.currentPassage.words.filter(w => w.finalCorrect).length;
    const totalHintsUsed = this.currentPassage.words.reduce(
      (sum, w) => sum + w.hintsUsed.length, 0
    );

    return {
      passageId: this.currentPassage.passageId,
      bookTitle: this.currentPassage.bookTitle,
      level: this.currentPassage.level,
      round: this.currentPassage.round,
      totalBlanks,
      correctOnFirstTry,
      totalCorrect,
      totalHintsUsed,
      words: this.currentPassage.words.map(w => ({
        word: w.word,
        attempts: w.attemptsToCorrect,
        hintsUsed: w.hintsUsed.length,
        correct: w.finalCorrect
      }))
    };
  }

  // ===== ADMIN API METHODS =====

  /**
   * Get analytics summary (admin dashboard data).
   * @returns {Promise<Object>}
   */
  async getSummary() {
    try {
      const response = await fetch(`${this.baseUrl}/api/analytics/summary`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('📊 Analytics: Failed to get summary', error);
      throw error;
    }
  }

  /**
   * Get recent passage attempts.
   * @param {number} count - Number of entries (max 200)
   * @returns {Promise<Object>}
   */
  async getRecentPassages(count = 50) {
    try {
      const response = await fetch(`${this.baseUrl}/api/analytics/recent?count=${count}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('📊 Analytics: Failed to get recent passages', error);
      throw error;
    }
  }

  /**
   * Export all analytics data.
   * @returns {Promise<Object>}
   */
  async exportAll() {
    try {
      const response = await fetch(`${this.baseUrl}/api/analytics/export`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('📊 Analytics: Failed to export', error);
      throw error;
    }
  }

  /**
   * Get statistics for a specific word.
   * @param {string} word
   * @returns {Promise<Object>}
   */
  async getWordStats(word) {
    try {
      const response = await fetch(`${this.baseUrl}/api/analytics/word/${encodeURIComponent(word)}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('📊 Analytics: Failed to get word stats', error);
      throw error;
    }
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
