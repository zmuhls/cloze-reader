// Welcome overlay for first-time users
class WelcomeOverlay {
  constructor() {
    this.isVisible = false;
    this.hasBeenShown = localStorage.getItem('cloze-reader-welcomed') === 'true';
  }

  show() {
    // Always show overlay regardless of previous views
    
    this.isVisible = true;
    const overlay = this.createOverlay();
    document.body.appendChild(overlay);
    
    // Animate in
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
    });
  }

  createOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'welcome-overlay';
    overlay.style.opacity = '0';

    const modal = document.createElement('div');
    modal.className = 'welcome-modal';
    modal.style.cssText = `
      max-width: 500px;
      margin: 20px;
      text-align: center;
    `;

    modal.innerHTML = `
      <div style="display: flex; justify-content: center; margin-bottom: 16px;">
        <img src="https://media.githubusercontent.com/media/milwrite/cloze-reader/main/icon.png"
             alt=""
             style="width: 56px; height: 56px; border-radius: 8px;"
             onerror="this.style.display='none'">
      </div>
      <h1 class="welcome-title">
        Cloze Reader
      </h1>

      <div class="welcome-content">
        <p>
          Each round draws a passage from Project Gutenberg and blanks out one or more words, chosen by an AI model. Read the context and infer what belongs in the gap.
        </p>

        <p>
          A chat panel offers hints about part of speech, sentence role, and synonymy without revealing the answer. Levels add more blanks and steeper vocabulary.
        </p>

        <p style="margin-bottom: 0;">
          Word selection runs on Google's open-weight Gemma-3-27B model. No two sessions are identical.
        </p>
      </div>

      <button id="welcome-start-btn" class="typewriter-button">
        Start Reading
      </button>
    `;

    overlay.appendChild(modal);

    // Add click handler
    const startBtn = modal.querySelector('#welcome-start-btn');
    startBtn.addEventListener('click', () => this.hide());

    // Allow clicking outside to close
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.hide();
    });

    return overlay;
  }

  hide() {
    const overlay = document.querySelector('.welcome-overlay');
    if (!overlay) return;

    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.remove();
      this.isVisible = false;
      
      // Remember that user has seen welcome
      localStorage.setItem('cloze-reader-welcomed', 'true');
      this.hasBeenShown = true;
    }, 300);
  }

  // Method to reset welcome (for testing or new features)
  reset() {
    localStorage.removeItem('cloze-reader-welcomed');
    this.hasBeenShown = false;
  }

  // Force show overlay (for testing)
  forceShow() {
    this.hasBeenShown = false;
    this.show();
  }
}

export default WelcomeOverlay;
