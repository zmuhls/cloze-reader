// src/services/gameLogic.ts

import { debugLog } from '@/utils/debugLog';
import { TOOL_MAPPING } from '@/services/llmService';

// --- Type Definitions (specific to game logic) ---
// If ScoredWord is only used here, keep it here. Otherwise, consider a shared types file.
interface ScoredWord {
  index: number;
  score: number;
}

export interface ParagraphCacheItem {
  value: string;
  timestamp: number;
}

export interface ParagraphCache {
  cache: Record<string, ParagraphCacheItem>;
  maxSize: number;
  set: (key: string, value: string) => void;
  get: (key: string) => string | null;
  init: () => void;
}

// --- Caching ---
const paragraphCache: ParagraphCache = {
  cache: {},
  maxSize: 10,
  set: function(key, value) {
    if (Object.keys(this.cache).length >= this.maxSize) {
      const oldestKey = Object.keys(this.cache)[0];
      delete this.cache[oldestKey];
    }
    this.cache[key] = { value, timestamp: Date.now() };
    try { localStorage.setItem('paragraphCache', JSON.stringify(this.cache)); }
    catch (e) { console.warn('Could not save cache to localStorage', e); }
  },
  get: function(key) {
    const item = this.cache[key];
    if (!item) return null;
    if (Date.now() - item.timestamp > 24 * 60 * 60 * 1000) { // 24hr expiry
      delete this.cache[key];
      try { localStorage.setItem('paragraphCache', JSON.stringify(this.cache)); }
      catch (e) { console.warn('Could not update cache in localStorage', e); }
      return null;
    }
    return item.value;
  },
  init: function() {
    try {
      const saved = localStorage.getItem('paragraphCache');
      if (saved) this.cache = JSON.parse(saved);
    } catch (e) { console.warn('Could not load cache from localStorage', e); this.cache = {}; }
  }
};

// Initialize the cache when the module is loaded
paragraphCache.init();

/**
 * Chooses words to redact from a list of words based on a scoring mechanism.
 * Enhanced with improved selection algorithm for better word choice.
 * @param words The array of words in the paragraph.
 * @param count The desired number of redactions.
 * @returns An array of indices to be redacted.
 */
export function chooseRedactions(words: string[], count: number): number[] {
  const indices: number[] = [];
  if (words.length === 0 || count === 0) return indices;

  const functionWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'if', 'of', 'at', 'by', 'for', 'with', 'about',
    'to', 'from', 'in', 'on', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have',
    'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall', 'should', 'can', 'could',
    'may', 'might', 'must', 'that', 'which', 'who', 'whom', 'whose', 'this', 'these',
    'those', 'am', 'i', 'we', 'you', 'he', 'she', 'they', 'it',
    // Additional function words for better coverage
    'as', 'so', 'such', 'than', 'then', 'their', 'them', 'there', 'these', 'they', 'this', 'those'
  ]);

  const scoredWords: ScoredWord[] = words.map((word, index) => {
    // Safety check for undefined or empty words
    if (!word || word.length === 0) {
      return { index, score: -100 }; // Very low score to filter out
    }
    
    // Separate word from trailing punctuation
    const punctuationMatch = word.match(/([.,!?;:]+)$/);
    const trailingPunctuation = punctuationMatch ? punctuationMatch[1] : '';
    const cleanWord = word.replace(/[.,!?;:]+$/, '').toLowerCase().replace(/[^\w]/g, '');

    let score = 0;
    score += cleanWord.length * 2;
    if (functionWords.has(cleanWord)) {
      score -= 10;
    }
    
    // Detect and deprioritize proper nouns
    const isCapitalized = word[0] === word[0].toUpperCase() && word[0].match(/[A-Z]/);
    const isProbablySentenceStart = index === 0 || 
        (index > 0 && words[index-1] && words[index-1].match(/[.!?]\s*$/));
    
    if (isCapitalized && !isProbablySentenceStart) {
      score -= 15; // Penalty to avoid proper nouns
    }
    
    if (/^(Mr|Mrs|Ms|Dr|Prof|Sir|Lady|Lord|Saint|St)\.\s*[A-Z]/.test(word)) {
      score -= 20; // Higher penalty for definite names
    }
    
    score += Math.random() * 2;
    return { index, score };
  })
  .filter(scoredWord => {
    // Only filter out words with certain problematic characters
    // Be much more permissive to ensure we have words to redact
    const word = words[scoredWord.index];
    
    // Safety check for undefined word
    if (!word || word.length === 0) {
      return false;
    }
    
    // Remove trailing punctuation for evaluation
    const cleanWord = word.replace(/[.,!?;:]+$/, '');
    
    // Filter out words with non-Latin scripts (Bengali, Arabic, etc.)
    const hasNonLatinChars = /[^\u0000-\u007F\u0080-\u00FF\u0100-\u017F\u0180-\u024F]/.test(cleanWord);
    
    // Only filter out words with em-dashes, en-dashes, other special characters,
    // non-Latin scripts, or that are too short
    return !hasNonLatinChars && !/[—–]/.test(cleanWord) && cleanWord.length >= 3;
  });

  scoredWords.sort((a, b) => b.score - a.score);

  const actualCount = Math.min(count, scoredWords.length); // Use filtered scoredWords length
  const candidatePoolSize = Math.min(actualCount * 3, scoredWords.length); // Increased pool size for better diversity
  const topCandidates = scoredWords.slice(0, candidatePoolSize);

  // Ensure we don't select adjacent words to maintain readability
  while (indices.length < actualCount && topCandidates.length > 0) {
    const randomIndex = Math.floor(Math.random() * topCandidates.length);
    const selectedWord = topCandidates.splice(randomIndex, 1)[0];
    const selectedIndex = selectedWord.index;
    
    // Check if this index is adjacent to any already selected indices
    const isAdjacent = indices.some(existingIndex => 
      Math.abs(existingIndex - selectedIndex) <= 1
    );
    
    if (!isAdjacent || indices.length === 0) {
      indices.push(selectedIndex);
    }
    // If we've exhausted candidates and still need more words, allow adjacent selection
    else if (topCandidates.length === 0 && indices.length < actualCount) {
      indices.push(selectedIndex);
    }
  }

  return indices.sort((a, b) => a - b);
}

/**
 * Extracts key terms from an array of words based on frequency, excluding common words.
 * @param words The array of words to process.
 * @param count The number of key terms to extract.
 * @returns An array of key terms.
 */
export function extractKeyTerms(words: string[], count = 3): string[] {
  const commonWords = new Set(['the', 'and', 'of', 'to', 'a', 'in', 'that', 'it', 'is', 'was', 'were', 'for', 'on', 'with', 'as', 'by', 'an', 'be', 'at', 'or', 'i', 'he', 'she', 'they', 'we', 'you', 'my', 'his', 'her', 'its', 'our', 'your', 'them', 'us', 'me', 'had', 'has', 'have', 'do', 'does', 'did', 'will', 'would', 'should', 'can', 'could', 'may', 'might', 'must', 'not', 'no', 'so', 'if', 'but', 'very', 'just', 'from', 'into', 'out', 'up', 'down', 'over', 'under', 'again', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'than', 'too', 'very', 's', 't', 'd', 'll', 'm', 'o', 're', 've']);
  const frequency: Record<string, number> = {};
  words.forEach(word => {
    const cleanWord = word.toLowerCase().replace(/[^a-z0-9']/g, '');
    if (cleanWord.length > 3 && !commonWords.has(cleanWord) && !/^\d+$/.test(cleanWord)) {
      frequency[cleanWord] = (frequency[cleanWord] || 0) + 1;
    }
  });
  return Object.entries(frequency)
    .sort(([,a],[,b]) => b-a)
    .slice(0, count)
    .map(([term]) => term);
}

// --- Game State Variables ---
// These will be managed within this module.
export let paragraphsWords: string[][] = []; // Array of paragraphs, each containing an array of words
export let redactedIndices: number[][] = []; // Corresponding indices for redactions in each paragraph
export let round = 1;
export let blanksCount = 1; // Start with 1 blank for round 1
export let passageDifficulty = 1; // Difficulty level of passages (1-5), increases with rounds
export let hintsRemaining = parseInt(localStorage.getItem('hintsRemaining') || '5', 10);
export let hintedBlanks: Set<string> = new Set(JSON.parse(localStorage.getItem('hintedBlanks') || '[]'));
export let hintContents: Record<string, string> = {}; // Stores hint text for each blank
export let previousBooks: { title: string; author: string; id: number }[] = JSON.parse(localStorage.getItem('previousBooks') || '[]');

// --- DOM Element References ---
// These will be initialized by a function called from main.ts or passed as arguments.
// For now, assuming they will be passed to functions that need them or queried internally.
// Let's define placeholders that functions can expect to be populated.
interface GameDOMElements {
  gameArea: HTMLElement | null;
  roundInfo: HTMLElement | null;
  submitBtn: HTMLButtonElement | null;
  hintBtn: HTMLButtonElement | null;
  resultArea: HTMLElement | null;
  bibliographicArea: HTMLElement | null; // Added bibliographicArea
}

let domElements: GameDOMElements | null = null;
export let isDOMElementsInitialized: boolean = false;

// Show the hint dialog for a blank, using stored or generated hint text
export function showHintDialog(blankKey: string, originalWord: string, hintText?: string) {
  // Use stored hint if available, otherwise use provided or generate
  const cleanOriginalWord = originalWord.replace(/[.,!?;:]+$/, '');
  const firstLetter = cleanOriginalWord && cleanOriginalWord.length > 0 ? cleanOriginalWord[0] : '?';
  let text = hintContents[blankKey] || hintText || `Starts with "${firstLetter}", length ${cleanOriginalWord.length}.`;
  hintContents[blankKey] = text;

  const hintDiv = document.createElement('div');
  hintDiv.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50';
  hintDiv.innerHTML = `
    <div class="bg-aged-paper p-6 rounded shadow-typewriter max-w-md text-center typewriter-text">
      <h3 class="text-xl font-bold mb-4 text-shadow-typewriter">Hint</h3>
      <p>${text}</p>
      <button class="mt-4 px-4 py-2 typewriter-key hover:bg-aged-paper">Got it</button>
    </div>
  `;
  document.body.appendChild(hintDiv);

  const closeHint = () => document.body.removeChild(hintDiv);
  hintDiv.querySelector('button')?.addEventListener('click', closeHint);
  hintDiv.addEventListener('click', (e) => {
    if (e.target === hintDiv) closeHint();
  });
}

export function initializeGameDOMElements(elements: GameDOMElements) {
  domElements = elements;
  // Check if all required elements are present before marking as initialized
  if (domElements.gameArea && domElements.roundInfo && domElements.submitBtn && domElements.hintBtn && domElements.resultArea) {
    isDOMElementsInitialized = true;
    
    // Attach event listener to submit button
    domElements.submitBtn.addEventListener('click', handleSubmission);
    
    // Attach event listener to NEW TEXT button (if it exists)
    const newTextBtn = document.getElementById('new-text-btn') as HTMLButtonElement;
    if (newTextBtn) {
      newTextBtn.addEventListener('click', () => {
        startRound(true); // Force new passage
      });
    }
    
    debugLog("Game DOM elements initialized successfully.");
  } else {
    isDOMElementsInitialized = false;
    console.error("Failed to initialize all required Game DOM elements.");
  }
}


// --- Timer and UI Effect Stubs/References ---
// These functions are currently in main.ts. For now, we'll assume they are globally available
// or will be passed/imported eventually.
declare function startTimer(): void;
declare function stopTimer(): void; // Added for completeness, though renderRound doesn't call it directly
declare global {
  interface Window {
    applyTypewriterEffect: (element?: HTMLElement) => void;
  }
}

/**
 * Renders the current round of the game, displaying paragraphs with redactions.
 */
export function renderRound() {
  if (!domElements) {
    console.error("DOM elements not initialized for gameLogic.renderRound");
    return;
  }

  const { gameArea, roundInfo, submitBtn, hintBtn, resultArea } = domElements;
  
  // Safety check for required DOM elements
  if (!gameArea || !roundInfo || !submitBtn || !hintBtn || !resultArea) {
    console.error("Missing required DOM elements in renderRound");
    return;
  }

  // Calculate total blanks across all paragraphs
  let totalBlanks = 0;
  for (let i = 0; i < redactedIndices.length; i++) {
    totalBlanks += redactedIndices[i].length;
  }
  
  console.log("renderRound: Updating roundInfo with", `Round ${round} — ${totalBlanks} blanks`);
  roundInfo.textContent = `Round ${round} — ${totalBlanks} blanks`;
  gameArea.innerHTML = '';

  // Check if we have any paragraphs
  if (paragraphsWords.length === 0 || paragraphsWords.every(p => p.length === 0)) {
    gameArea.innerHTML = '<p class="text-red-500">Error: No paragraphs loaded.</p>';
    submitBtn.disabled = true;
    hintBtn.disabled = true;
    // stopTimer(); // stopTimer is not directly called here but good to note dependency
    return;
  }

  // Iterate through all paragraphs instead of just the first two
  for (let pIdx = 0; pIdx < paragraphsWords.length; pIdx++) {
    if (!paragraphsWords[pIdx] || paragraphsWords[pIdx].length === 0) continue;

    const paragraphElement = document.createElement('p');
    
    // Determine if this is a dialogue paragraph (starts with a quote)
    const paragraphText = paragraphsWords[pIdx].join(' ');
    const isDialogue = paragraphText.trim().startsWith('"');
    
    // Apply appropriate styling based on paragraph type
    paragraphElement.className = 'typewriter-text leading-relaxed break-words';
    
    // If this is dialogue, add data-dialogue attribute for CSS targeting
    if (isDialogue) {
      paragraphElement.setAttribute('data-dialogue', 'true');
    }
    
    paragraphElement.style.maxWidth = '100%';
    paragraphElement.style.overflowWrap = 'break-word';
    gameArea.appendChild(paragraphElement);

    paragraphsWords[pIdx].forEach((word, idx) => {
      if (redactedIndices[pIdx].includes(idx)) {
        const input = document.createElement('input');
        input.type = 'text';
        input.dataset.index = String(idx);
        input.dataset.paragraph = String(pIdx);
        
        const originalWordWithPunctuation = paragraphsWords[pIdx][idx];
        // Generate placeholder underscores matching the word length (excluding punctuation)
        const cleanWord = originalWordWithPunctuation.replace(/[.,!?;:]+$/, '');
        input.placeholder = '_'.repeat(cleanWord.length);
        
        // Set width based on character length using 'ch' unit, ensure min width
        // Add a small buffer to prevent truncation, e.g., +2ch
        const inputWidthCh = Math.max(5, originalWordWithPunctuation.length + 2); 

        input.className = `border-b-2 border-typewriter-ink mx-1 text-center bg-transparent focus:outline-none focus:border-typewriter-ribbon focus:ring-1 focus:ring-typewriter-ribbon rounded-sm px-1 py-0.5 text-typewriter-ink placeholder-typewriter-ink placeholder-opacity-50`;
        // Using ch unit for better responsiveness based on character width
        input.style.width = `${inputWidthCh}ch`; 
        input.style.minWidth = '60px'; // Ensure a minimum clickable area

        // Add [i] icon if this blank has a hint
        const paragraphIdx = pIdx;
        const wordIdx = idx;
        const blankKey = `${paragraphIdx}-${wordIdx}`;
        let infoIcon: HTMLElement | null = null;
        if (hintedBlanks.has(blankKey)) {
          infoIcon = document.createElement('span');
          infoIcon.className = 'hint-info-icon cursor-pointer align-middle ml-1 text-typewriter-ink';
          infoIcon.title = 'Show hint again';
          infoIcon.innerHTML = '<span style="font-size:1em;vertical-align:middle;">&#9432;</span>'; // Unicode info symbol
          infoIcon.onclick = () => {
            showHintDialog(blankKey, paragraphsWords[paragraphIdx][wordIdx]);
          };
        }

        input.addEventListener('keydown', (e) => {
          if (e.key.length === 1) {
            input.classList.add('shadow-typewriter-pressed');
            setTimeout(() => input.classList.remove('shadow-typewriter-pressed'), 100);
          }
        });

        input.addEventListener('input', () => {
          const allFilled = Array.from(gameArea.querySelectorAll<HTMLInputElement>('input[type="text"]')).every(i => i.value.trim() !== '');
          submitBtn.disabled = !allFilled;
        });
        paragraphElement.appendChild(input);
        if (infoIcon) paragraphElement.appendChild(infoIcon);
        paragraphElement.appendChild(document.createTextNode(' '));

        input.addEventListener('focus', () => {
          if (!domElements || !domElements.hintBtn) return; // Guard against null domElements or hintBtn
          const paragraphIdx = Number(input.dataset.paragraph);
          const wordIdx = Number(input.dataset.index);
          const blankKey = `${paragraphIdx}-${wordIdx}`;

          domElements.hintBtn.disabled = hintsRemaining <= 0 || hintedBlanks.has(blankKey);

          domElements.hintBtn.onclick = () => {
            if (!domElements || !domElements.hintBtn) return; // Recheck in case element was removed
            if (hintsRemaining > 0 && !hintedBlanks.has(blankKey)) {
              const originalWord = paragraphsWords[paragraphIdx][wordIdx];

              if (originalWord) {
                // Include punctuation in hint length
                const cleanOriginalWord = originalWord.replace(/[.,!?;:]+$/, '');
                const firstLetter = cleanOriginalWord && cleanOriginalWord.length > 0 ? cleanOriginalWord[0] : '?';
                const hintText = `Starts with "${firstLetter}", length ${cleanOriginalWord.length}.`;
                showHintDialog(blankKey, originalWord, hintText, input, paragraphElement);
                // After showing the hint, add the [i] icon if not already present
                if (!paragraphElement.querySelector(`.hint-info-icon[data-blank-key="${blankKey}"]`)) {
                  const infoIcon = document.createElement('span');
                  infoIcon.className = 'hint-info-icon cursor-pointer align-middle ml-1 text-typewriter-ink';
                  infoIcon.title = 'Show hint again';
                  infoIcon.setAttribute('data-blank-key', blankKey);
                  infoIcon.innerHTML = '<span style="font-size:1em;vertical-align:middle;">&#9432;</span>';
                  infoIcon.onclick = () => {
                    showHintDialog(blankKey, originalWord);
                  };
                  input.insertAdjacentElement('afterend', infoIcon);
                }
                hintsRemaining--;
                if (domElements.hintBtn) domElements.hintBtn.textContent = `Hint (${hintsRemaining})`;
                hintedBlanks.add(blankKey);
                input.classList.add('hinted-blank');
                if (domElements.hintBtn) domElements.hintBtn.disabled = hintsRemaining <= 0 || hintedBlanks.has(blankKey);
              }
            }
          };
        });
      } else {
        const wordSpan = document.createElement('span');
        wordSpan.textContent = word + ' ';
        wordSpan.className = 'typewriter-text';
        paragraphElement.appendChild(wordSpan);
      }
    });
  }

  // Calculate total redactions across all paragraphs
  const totalRedactedCount = redactedIndices.reduce((sum, indices) => sum + indices.length, 0);
  submitBtn.disabled = totalRedactedCount === 0;
  hintBtn.disabled = hintsRemaining <= 0 || totalRedactedCount === 0;
  resultArea.textContent = '';

  // Assuming startTimer is globally available or will be handled
  if (typeof startTimer === 'function') {
    startTimer();
  }


  setTimeout(() => {
    if (typeof window !== 'undefined' && window.applyTypewriterEffect) {
      window.applyTypewriterEffect();
    }
  }, 100);
}

/**
 * Resets the game state for a new game.
 */
export function resetGame() {
  if (!domElements) {
    console.error("DOM elements not initialized for gameLogic.resetGame");
    return;
  }
  const { gameArea, resultArea, roundInfo, bibliographicArea, hintBtn } = domElements;

  round = 1;
  blanksCount = 1;
  passageDifficulty = 1;
  hintsRemaining = 5;
  hintedBlanks.clear();
  // Reset to empty arrays to properly support variable number of paragraphs
  paragraphsWords = [];
  redactedIndices = [];
  previousBooks = []; // Reset previous books on a full game reset

  localStorage.setItem('hintsRemaining', hintsRemaining.toString());
  localStorage.setItem('hintedBlanks', JSON.stringify(Array.from(hintedBlanks)));
  localStorage.setItem('previousBooks', JSON.stringify(previousBooks));

  if (gameArea) gameArea.innerHTML = '';
  if (resultArea) resultArea.textContent = '';
  if (roundInfo) roundInfo.textContent = '';
  if (bibliographicArea) bibliographicArea.innerHTML = '';
  if (hintBtn) hintBtn.textContent = `Hint (${hintsRemaining})`;

  if (typeof stopTimer === 'function') {
    stopTimer();
  }
  debugLog("Game reset in gameLogic.ts");
}

// Import LLM related services
import { TOOL_MAPPING } from '@/services/llmService';

/**
 * Continues to the next round based on the user's performance.
 * @param passed Whether the user passed the current round.
 */
export function continueToNextRound(passed: boolean) {
  if (!domElements) {
    console.error("DOM elements not initialized for gameLogic.continueToNextRound");
    return;
  }
  
  const { resultArea } = domElements;
  
  // Remove any existing analyses containers
  const existingAnalysis = document.querySelector('.word-analysis-container');
  if (existingAnalysis) {
    existingAnalysis.remove();
  }
  
  // Clear the result area or add a loading message
  if (resultArea) {
    resultArea.innerHTML = '<p class="typewriter-text">Loading next round...</p>';
  }
  
  // Adjust difficulty based on round progression if user passed
  if (passed) {
    // Increment round number
    round++;
    
    // NEW: Structured difficulty gradient
    switch(round) {
      case 1:
        // Level 1: Easy passage, 1 "easy" blank
        blanksCount = 1;
        passageDifficulty = 1;
        break;
      case 2:
        // Level 2: Easy passage, 1 "moderate" blank
        blanksCount = 1;
        passageDifficulty = 1;
        break;
      case 3:
        // Level 3: Moderate passage, 2 "moderate" blanks
        blanksCount = 2;
        passageDifficulty = 2;
        break;
      case 4:
        // Level 4: Moderate passage, 2-3 "moderate" blanks
        blanksCount = Math.floor(Math.random() * 2) + 2; // 2-3 blanks
        passageDifficulty = 2;
        break;
      case 5:
        // Level 5: Moderate-Hard passage, 3 blanks (mix of moderate and difficult)
        blanksCount = 3;
        passageDifficulty = 3;
        break;
      default:
        // Higher rounds: Gradually increase difficulty
        blanksCount = Math.min(5, 3 + Math.floor((round - 5) / 2)); // Cap at 5 blanks
        passageDifficulty = Math.min(5, 3 + Math.floor((round - 5) / 3)); // Cap at difficulty 5
    }
    
    debugLog(`Round ${round}: blanks=${blanksCount}, difficulty=${passageDifficulty}`);
  }
  
  // Start a new round with appropriate parameter
  // If passed = true, use cached passage (false)
  // If passed = false, force a new passage (true)
  startRound(!passed);
}

/**
 * Starts a new round of the game by fetching a new passage and rendering it.
 */
// PassageData is now imported from main.ts

export async function startRound(forceNewPassage: boolean = false): Promise<object | null> { // Added return type
  if (!domElements) {
    console.error("DOM elements not initialized for gameLogic.startRound");
    return null;
  }
  const { gameArea, submitBtn, hintBtn, resultArea, bibliographicArea } = domElements;

  hintsRemaining = 3; 
  if (hintBtn) hintBtn.textContent = `Hint (${hintsRemaining})`;
  if (submitBtn) submitBtn.disabled = true;
  if (hintBtn) hintBtn.disabled = true;
  if (gameArea) gameArea.innerHTML = '<div class="text-center p-4"><p class="text-lg typewriter-text">Fetching new paragraphs from Gutenberg...</p><p class="text-sm mt-2 text-opacity-70">*click* *clack* *ding*</p></div>';
  if (resultArea) resultArea.textContent = '';
  hintedBlanks.clear();
  if (typeof stopTimer === 'function') { 
    stopTimer(); 
  }

  if (bibliographicArea) {
      bibliographicArea.innerHTML = '';
  }

  const category = localStorage.getItem('game_category') || '';
  const author = localStorage.getItem('game_author') || '';
  const century = localStorage.getItem('game_century') || ''; // Fetch century as well

  // Generate a base cache key based on search criteria
  let baseCacheKey = `passage_${category || 'any'}_${author || 'any'}_${century || 'any'}`;

  // Add a random component to the cache key to encourage diversity,
  // If forcing a new passage, always add random component to ensure cache miss
  let cacheKey = baseCacheKey;
  if (forceNewPassage) {
      cacheKey = `${baseCacheKey}_forced_${Math.random().toString(36).substring(7)}`;
      debugLog("Generated forced cache key for new passage:", { cacheKey, forceNewPassage });
  } else if (!category && !author && !century) {
      cacheKey = `${baseCacheKey}_random_${Math.random().toString(36).substring(7)}`;
      debugLog("Generated random cache key for diverse selection:", { cacheKey });
  } else {
      debugLog("Using base cache key:", { cacheKey, forceNewPassage });
  }


  const cachedPassage = forceNewPassage ? null : paragraphCache.get(cacheKey);
  // Check if cached passage is recent enough or if we are forcing a new passage
  const isCacheStale = cachedPassage ? (Date.now() - JSON.parse(cachedPassage).timestamp > 60 * 60 * 1000) : true; // Consider stale after 1 hour

  // Log API information for transparency
  debugLog("API Connection", { 
    usingCache: (!forceNewPassage && cachedPassage && !isCacheStale),
    forceNewPassage,
    cacheExists: !!cachedPassage,
    cacheStale: isCacheStale,
    endpoint: "https://datasets-server.huggingface.co/rows?dataset=manu%2Fproject_gutenberg" // Using HuggingFace dataset API
  });

  if (!forceNewPassage && cachedPassage && !isCacheStale) {
    debugLog("Serving passage from cache", { cacheKey });
    const parsedCache = JSON.parse(cachedPassage);
    if (parsedCache && parsedCache.paragraphs && Array.isArray(parsedCache.paragraphs)) {
      const passageData = {
        paragraphs: parsedCache.paragraphs,
        metadata: parsedCache.metadata || null
      };

      // --- INTEGRITY CHECK: Validate cached metadata and passage text against HuggingFace Project Gutenberg dataset ---
      // If the metadata.id is present, fetch metadata and compare title/author.
      // Also, fetch the first 200 chars of the actual book and compare to the cached passage.
      let integrityCheckPassed = true;
      if (passageData.metadata && passageData.metadata.id && passageData.metadata.id > 0) {
        const checkMetadataAndText = async () => {
          try {
            const gutendexResp = await fetch(`https://gutendex.com/books?ids=${passageData.metadata.id}`);
            if (gutendexResp.ok) {
              const gutendexData = await gutendexResp.json();
              if (gutendexData.results && gutendexData.results.length > 0) {
                const gutendexBook = gutendexData.results[0];
                // Compare title and author (case-insensitive, trimmed)
                const cachedTitle = (passageData.metadata.title || '').trim().toLowerCase();
                const cachedAuthor = (passageData.metadata.author || '').trim().toLowerCase();
                const gutendexTitle = (gutendexBook.title || '').trim().toLowerCase();
                const gutendexAuthor = (gutendexBook.authors && gutendexBook.authors.length > 0)
                  ? gutendexBook.authors.map((a: any) => a.name).join(', ').trim().toLowerCase()
                  : '';
                if (cachedTitle !== gutendexTitle || cachedAuthor !== gutendexAuthor) {
                  console.warn(
                    `[Cache Integrity] Metadata mismatch for ID ${passageData.metadata.id}:`,
                    `Cached: "${cachedTitle}" by "${cachedAuthor}"`,
                    `Gutendex: "${gutendexTitle}" by "${gutendexAuthor}"`
                  );
                  // Invalidate cache for this key
                  paragraphCache.set(cacheKey, ''); // Remove the corrupted cache entry
                  integrityCheckPassed = false;
                  return;
                }
                // --- NEW: Compare passage text to actual book text ---
                // Try to get a plain text format
                let textUrl = null;
                if (gutendexBook.formats) {
                  textUrl =
                    gutendexBook.formats["text/plain; charset=utf-8"] ||
                    gutendexBook.formats["text/plain"] ||
                    gutendexBook.formats["text/html; charset=utf-8"] ||
                    gutendexBook.formats["text/html"];
                  // Fallback: try any plain text
                  if (!textUrl) {
                    for (const [key, url] of Object.entries(gutendexBook.formats)) {
                      if (key.startsWith("text/plain")) {
                        textUrl = url;
                        break;
                      }
                    }
                  }
                }
                if (textUrl) {
                  // Fetch the first 2000 chars (to allow for header skipping)
                  const resp = await fetch(textUrl);
                  if (resp.ok) {
                    let bookText = await resp.text();
                    // Remove Gutenberg header/footer
                    const headerMatch = bookText.match(/\*\*\* START OF (THE|THIS) PROJECT GUTENBERG EBOOK.*\*\*\*/i);
                    if (headerMatch && headerMatch.index !== undefined) {
                      bookText = bookText.substring(headerMatch.index + headerMatch[0].length);
                    }
                    // Remove leading whitespace/newlines
                    bookText = bookText.replace(/^\s+/, "");
                    // Get the first 200-400 chars of the actual book text (skip more if needed)
                    const actualSnippet = bookText.substring(0, 400).replace(/\s+/g, " ").trim();
                    // Get the first 400 chars of the cached passage
                    const passageSnippet = passageData.paragraphs && passageData.paragraphs.length > 0
                      ? passageData.paragraphs.join(" ").substring(0, 400).replace(/\s+/g, " ").trim()
                      : "";
                    // Compare with a loose threshold (allowing for minor differences)
                    function looseMatch(a: string, b: string) {
                      // Remove punctuation, lowercase, compare first 100 chars
                      const clean = (s: string) => s.replace(/[^\w\s]/g, "").toLowerCase().substring(0, 100);
                      return clean(a) === clean(b);
                    }
                    if (!looseMatch(actualSnippet, passageSnippet)) {
                      console.warn(
                        `[Cache Integrity] Passage text mismatch for ID ${passageData.metadata.id}:`,
                        `First 100 chars of actual: "${actualSnippet.substring(0, 100)}"`,
                        `First 100 chars of cached: "${passageSnippet.substring(0, 100)}"`
                      );
                      paragraphCache.set(cacheKey, ''); // Remove the corrupted cache entry
                      integrityCheckPassed = false;
                      return;
                    }
                  }
                }
              }
            }
          } catch (e) {
            console.warn('[Cache Integrity] Error checking Gutendex metadata/text:', e);
          }
        };
        // Await the integrity check before proceeding
        // eslint-disable-next-line no-await-in-loop
        await checkMetadataAndText();
      }

      if (!integrityCheckPassed) {
        debugLog("Cache integrity check failed, fetching new passage.", { cacheKey });
        // Recursively call startRound with forceNewPassage=true to fetch a new passage
        await startRound(true);
        return null;
      }

      if (bibliographicArea && passageData.metadata) {
        let authorDisplayHTML = passageData.metadata.author; // Default to plain author name
        let factoidDisplayHTML = ''; // Default to no factoid

        try {
          // Call getBookAuthorInfo tool
          const factoidResult = await TOOL_MAPPING.getBookAuthorInfo({
            title: passageData.metadata.title,
            author: passageData.metadata.author
          }) as { factoid: string };

          debugLog("Tool results:", { factoidResult });

          // Handle factoid result
          if (factoidResult && factoidResult.factoid) {
            passageData.metadata.factoid = factoidResult.factoid; // Store for consistency
            factoidDisplayHTML = `<p class="typewriter-text text-sm mt-1 italic">${factoidResult.factoid}</p>`;
          }
        } catch (error) {
          console.error("Error fetching book/author info:", error);
          // authorDisplayHTML will remain plain text, factoidDisplayHTML will be empty
        }

        // Construct the final HTML for the bibliographic area
        const biblioHTML = `
          <h2 class="text-xl font-semibold mb-2 typewriter-text">${passageData.metadata.title}</h2>
          <p class="typewriter-text">By ${authorDisplayHTML}</p>
          ${factoidDisplayHTML}
        `;
        bibliographicArea.innerHTML = biblioHTML;

        // Add to previous books history if not already
        previousBooks.push({
          title: passageData.metadata.title,
          author: passageData.metadata.author,
          id: passageData.metadata.id
        });
        localStorage.setItem('previousBooks', JSON.stringify(previousBooks));
      }

      // Process paragraphs - handle double newlines for intentional paragraph breaks
      paragraphsWords = [];
      redactedIndices = [];
      
      // Process the array of paragraphs from the passage
      for (const paragraph of passageData.paragraphs) {
        if (!paragraph || paragraph.trim() === '') continue;
        
        // Split by any sequence of newlines to handle intentional paragraph breaks
        // This handles both \n\n and single \n that might be used for dialogue
        const splitParagraphs = paragraph.split(/\n+/);
        
        for (const splitParagraph of splitParagraphs) {
          if (splitParagraph.trim() === '') continue;
          
          // Split into words and add to our array
          const words = splitParagraph.split(' ');
          if (words.length > 0) {
            paragraphsWords.push(words);
          }
        }
      }
      
      console.log(`Attempt ${round}: Successfully extracted ${paragraphsWords.length} paragraphs.`);
      
      // Distribute blanks among paragraphs
      const blankDistribution = distributeRedactions(paragraphsWords, blanksCount);
      
      // Create redaction indices for each paragraph
      for (let i = 0; i < paragraphsWords.length; i++) {
        const blanksForThisParagraph = blankDistribution[i] || 0;
        redactedIndices[i] = chooseRedactions(paragraphsWords[i], blanksForThisParagraph);
      }
      renderRound();
      return passageData;
    }
  }

  // If we reach this point, call fetchGutenbergPassage directly and do not rely only on cache
  try {
    // Use the new OpenRouter tool for passage selection and cloze generation
    debugLog("No passage in cache, fetching new one directly via get_cloze_passage tool...");

    const categoryVal = localStorage.getItem('game_category') || '';
    const authorVal = localStorage.getItem('game_author') || '';
    const centuryVal = localStorage.getItem('game_century') || '';

    // Call the tool directly
    const clozeResult = await TOOL_MAPPING.get_cloze_passage({
      category: categoryVal || undefined,
      author: authorVal || undefined,
      century: centuryVal || undefined,
      blanks_count: blanksCount,
      difficulty: passageDifficulty
    }) as any;

    if (
      clozeResult &&
      Array.isArray(clozeResult.paragraphs) &&
      clozeResult.paragraphs.length > 0 &&
      Array.isArray(clozeResult.answers)
    ) {
      // Store in cache for future use (optional, can be omitted if not needed)
      paragraphCache.set(cacheKey, JSON.stringify({
        paragraphs: clozeResult.paragraphs,
        metadata: clozeResult.metadata,
        timestamp: Date.now()
      }));

      // Display the metadata
      if (bibliographicArea && clozeResult.metadata) {
        let authorDisplayHTML = clozeResult.metadata.author; // Default to plain author name
        let factoidDisplayHTML = ''; // Default to no factoid

        try {
          // Call getBookAuthorInfo tool
          const factoidResult = await TOOL_MAPPING.getBookAuthorInfo({
            title: clozeResult.metadata.title,
            author: clozeResult.metadata.author
          }) as { factoid: string };

          debugLog("Tool results for newly fetched passage:", { factoidResult });

          // Handle factoid result
          if (factoidResult && factoidResult.factoid) {
            clozeResult.metadata.factoid = factoidResult.factoid; // Store for consistency
            factoidDisplayHTML = `<p class="typewriter-text text-sm mt-1 italic">${factoidResult.factoid}</p>`;
          }
        } catch (error) {
          console.error("Error fetching book/author info for newly fetched passage:", error);
          // authorDisplayHTML will remain plain text, factoidDisplayHTML will be empty
        }

        // Construct the final HTML for the bibliographic area
        const biblioHTML = `
          <h2 class="text-xl font-semibold mb-2 typewriter-text">${clozeResult.metadata.title}</h2>
          <p class="typewriter-text">By ${authorDisplayHTML}</p>
          ${factoidDisplayHTML}
        `;
        bibliographicArea.innerHTML = biblioHTML;

        // Add to previous books history
        previousBooks.push({
          title: clozeResult.metadata.title,
          author: clozeResult.metadata.author,
          id: clozeResult.metadata.id
        });
        localStorage.setItem('previousBooks', JSON.stringify(previousBooks));
      }

      // Set up the game state with the successfully fetched paragraphs and answers
      paragraphsWords = [];
      redactedIndices = [];

      // Use the returned paragraphs and answers
      for (const paragraph of clozeResult.paragraphs) {
        if (!paragraph || paragraph.trim() === '') continue;
        const words = paragraph.split(' ');
        paragraphsWords.push(words);
      }

      // Build redactedIndices from answers
      redactedIndices = paragraphsWords.map(() => []);
      for (const ans of clozeResult.answers) {
        if (
          typeof ans.paragraphIndex === 'number' &&
          typeof ans.wordIndex === 'number' &&
          paragraphsWords[ans.paragraphIndex] &&
          paragraphsWords[ans.paragraphIndex][ans.wordIndex]
        ) {
          redactedIndices[ans.paragraphIndex].push(ans.wordIndex);
        }
      }

      renderRound();
      return clozeResult;
    } else {
      console.warn("Cloze tool result missing or invalid: ", clozeResult);
    }
  } catch (error) {
    console.error("Error when directly fetching passage via cloze tool:", error);
  }

  // If we still don't have a passage, show a fallback
  if (gameArea) {
    gameArea.innerHTML = `
      <div class="text-center p-4">
        <p class="text-lg text-red-500">Failed to fetch a passage. Please try again later.</p>
        <button id="retry-fetch-btn" class="mt-4 px-4 py-2 bg-aged-paper-dark text-typewriter-ink rounded hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-typewriter-ribbon">
          Retry
        </button>
      </div>
    `;
    
    // Add retry button functionality
    const retryBtn = document.getElementById('retry-fetch-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => startRound(true)); // Call startRound directly
    }
  }
  
  console.error("Failed to fetch a suitable passage after all retries.");
  return null; // Indicate failure after all retries
}

// Handle submission of user answers
export function handleSubmission() {
  if (!domElements) {
    console.error("DOM elements not initialized for gameLogic.handleSubmission");
    return;
  }
  
  const { gameArea, resultArea, submitBtn, hintBtn } = domElements;
  
  // Check for null DOM elements
  if (!gameArea || !resultArea || !submitBtn || !hintBtn) {
    console.error("Missing required DOM elements in handleSubmission");
    return;
  }
  
  // Collect all input fields
  const inputs = Array.from(gameArea.querySelectorAll<HTMLInputElement>('input[type="text"]'));
  
  // Check if all inputs are filled
  const allFilled = inputs.every(input => input.value.trim() !== '');
  if (!allFilled) {
    resultArea.textContent = "Please fill in all blanks before submitting.";
    return;
  }
  
  // Compare answers
  let correctCount = 0;
  const totalBlanks = inputs.length;
  
  // Track which inputs were correct/incorrect for highlighting
  const correctInputs: HTMLInputElement[] = [];
  const incorrectInputs: HTMLInputElement[] = [];
  
  inputs.forEach(input => {
    const paragraphIdx = parseInt(input.dataset.paragraph || '0', 10);
    const wordIdx = parseInt(input.dataset.index || '0', 10);
    
    // Get the original word and strip trailing punctuation for comparison
    let originalWordWithPunctuation = paragraphsWords[paragraphIdx][wordIdx];
    const originalWord = originalWordWithPunctuation.replace(/[.,!?;:]+$/, ''); // Remove trailing punctuation
    
    // Compare user input to original word (case-insensitive)
    const userInput = input.value.trim();
    
    // Simple comparison for now (could be enhanced with more sophisticated matching)
    if (userInput.toLowerCase() === originalWord.toLowerCase()) {
      correctCount++;
      correctInputs.push(input);
    } else {
      incorrectInputs.push(input);
    }
  });
  
  // Calculate score
  const scorePercentage = (correctCount / totalBlanks) * 100;
  
  // Update UI
  resultArea.innerHTML = `<p class="mb-2">Score: ${correctCount}/${totalBlanks} (${scorePercentage.toFixed(0)}%)</p>`;
  
  // Highlight correct/incorrect answers with improved styling
  correctInputs.forEach(input => {
    // Focus on text color instead of background for better visibility
    input.classList.add('text-green-700'); // Darker green for better contrast
    input.style.fontWeight = 'bold'; // Make it stand out
    input.disabled = true;
  });
  
  incorrectInputs.forEach(input => {
    // Focus on text color instead of background for better visibility
    input.classList.add('text-red-700'); // Soft dark red for better contrast
    input.style.fontWeight = 'bold'; // Make it stand out
    input.disabled = true;
    
    // Add the correct answer after this input (show the version without punctuation)
    const paragraphIdx = parseInt(input.dataset.paragraph || '0', 10);
    const wordIdx = parseInt(input.dataset.index || '0', 10);
    const originalWordWithPunctuation = paragraphsWords[paragraphIdx][wordIdx];
    const originalWord = originalWordWithPunctuation.replace(/[.,!?;:]+$/, ''); // Get the clean word for display
    
    const correction = document.createElement('span');
    correction.className = 'text-xs block text-red-700 mt-1 font-semibold'; // Enhanced visibility
    correction.textContent = `Correct: ${originalWord}`;
    input.parentNode?.insertBefore(correction, input.nextSibling);
  });
  
  // Determine if passed (>= 70%)
  const passed = scorePercentage >= 70;
  
  // Show the existing Continue button and Analysis button in game controls and set up their functionality
  const continueButton = document.getElementById('continue-btn');
  const analysisButton = document.getElementById('analysis-btn');
  
  if (continueButton) {
    continueButton.style.display = 'flex'; // Show the button
    continueButton.onclick = () => {
      // Hide both buttons again after clicking continue
      continueButton.style.display = 'none';
      if (analysisButton) analysisButton.style.display = 'none';
      // Clear any analysis content
      const existingAnalysis = document.querySelector('.analysis-content');
      if (existingAnalysis) existingAnalysis.remove();
      // Increment round if passed, otherwise stay on same round
      if (passed) {
        round++;
        blanksCount = Math.min(blanksCount + 1, 10); // Increase blanks, max 10
      }
      continueToNextRound(passed);
    };
  }
  
  if (analysisButton) {
    analysisButton.style.display = 'flex'; // Show the analysis button
    analysisButton.onclick = async () => {
      await showAnalysis();
    };
  }
  
  // Disable hint and submit buttons
  submitBtn.disabled = true;
  hintBtn.disabled = true;
}

/**
 * Shows passage analysis including context and word analysis for the cloze test
 */
async function showAnalysis() {
  if (!domElements) {
    console.error("DOM elements not initialized for showAnalysis");
    return;
  }

  const { gameArea, resultArea } = domElements;
  if (!gameArea || !resultArea) return;

  // Remove any existing analysis
  const existingAnalysis = document.querySelector('.analysis-content');
  if (existingAnalysis) {
    existingAnalysis.remove();
  }

  // Create analysis container
  const analysisContainer = document.createElement('div');
  analysisContainer.className = 'analysis-content mt-4 p-4 bg-aged-paper-light rounded border border-typewriter-ink';
  
  // Show loading state
  analysisContainer.innerHTML = `
    <h3 class="text-lg font-semibold mb-3 typewriter-text">Analysis</h3>
    <p class="typewriter-text text-sm">Generating analysis... <span class="animate-pulse">⚡</span></p>
  `;
  
  // Insert analysis container after the result area
  resultArea.insertAdjacentElement('afterend', analysisContainer);

  try {
    // Get the current passage metadata
    const bibliographicArea = document.getElementById('bibliographic-area');
    let title = 'Unknown Title';
    let author = 'Unknown Author';
    let factoid = '';

    if (bibliographicArea) {
      const titleElement = bibliographicArea.querySelector('h2');
      const authorElement = bibliographicArea.querySelector('p');
      const factoidElement = bibliographicArea.querySelector('p.italic');
      
      if (titleElement) title = titleElement.textContent || title;
      if (authorElement) {
        const authorText = authorElement.textContent || '';
        author = authorText.replace('By ', '').trim() || author;
      }
      if (factoidElement) factoid = factoidElement.textContent || '';
    }

    // Get the redacted words
    const redactedWords: Array<{word: string, sentence: string}> = [];

    // Extract redacted words and their sentences
    for (let pIdx = 0; pIdx < paragraphsWords.length; pIdx++) {
      for (const wordIdx of redactedIndices[pIdx]) {
        const word = paragraphsWords[pIdx][wordIdx];
        if (word) {
          // Find the sentence containing this word
          const paragraph = paragraphsWords[pIdx].join(' ');
          // For simplicity, use the whole paragraph as context
          redactedWords.push({
            word: word.replace(/[.,!?;:]+$/, ''),
            sentence: paragraph
          });
        }
      }
    }

    // Generate analysis using OpenRouter
    let analysisHTML = `
      <h3 class="text-lg font-semibold mb-3 typewriter-text">Analysis</h3>
      <div class="space-y-3">
    `;

    // Add book context if available
    if (factoid) {
      analysisHTML += `
        <div class="border-l-4 border-typewriter-ribbon pl-3">
          <h4 class="font-medium typewriter-text mb-1">Context</h4>
          <p class="typewriter-text text-sm">${factoid}</p>
        </div>
      `;
    }

    // Add word analysis for each redacted word
    if (redactedWords.length > 0) {
      analysisHTML += `
        <div class="border-l-4 border-typewriter-ink pl-3">
          <h4 class="font-medium typewriter-text mb-2">Word Analysis</h4>
      `;

      for (const {word, sentence} of redactedWords) {
        try {
          const wordAnalysis = await TOOL_MAPPING.getWordAnalysis({
            sentence: sentence,
            word: word
          });

          if (wordAnalysis && typeof wordAnalysis === 'object' && 'analysis' in wordAnalysis) {
            analysisHTML += `
              <div class="mb-2">
                <span class="font-medium typewriter-text">"${word}":</span>
                <span class="typewriter-text text-sm ml-2">${(wordAnalysis as any).analysis}</span>
              </div>
            `;
          }
        } catch (error) {
          console.error(`Error analyzing word "${word}":`, error);
          analysisHTML += `
            <div class="mb-2">
              <span class="font-medium typewriter-text">"${word}":</span>
              <span class="typewriter-text text-sm ml-2 text-gray-600">Analysis unavailable</span>
            </div>
          `;
        }
      }

      analysisHTML += `</div>`;
    }

    analysisHTML += `</div>`;
    
    // Update the analysis container with the generated content
    analysisContainer.innerHTML = analysisHTML;

  } catch (error) {
    console.error('Error generating analysis:', error);
    analysisContainer.innerHTML = `
      <h3 class="text-lg font-semibold mb-3 typewriter-text">Analysis</h3>
      <p class="typewriter-text text-sm text-red-600">Unable to generate analysis at this time.</p>
    `;
  }
}

/**
 * Distributes redactions (blanks) across paragraphs based on their length
 * @param paragraphs Array of paragraphs, each containing an array of words
 * @param totalBlanks Total number of blanks to distribute
 * @returns Array of numbers indicating how many blanks each paragraph should have
 */
function distributeRedactions(paragraphs: string[][], totalBlanks: number): number[] {
  if (paragraphs.length === 0 || totalBlanks === 0) return [];
  
  // For round 1, just put a single blank in the first paragraph
  if (round === 1 && totalBlanks === 1) {
    const result = Array(paragraphs.length).fill(0);
    // Find the first non-empty paragraph
    for (let i = 0; i < paragraphs.length; i++) {
      if (paragraphs[i].length > 0) {
        result[i] = 1;
        return result;
      }
    }
    return result;
  }
  
  // For other rounds, distribute proportionally by paragraph length
  const totalWords = paragraphs.reduce((sum, para) => sum + para.length, 0);
  const distribution: number[] = [];
  
  // Initial distribution based on proportional length
  let remainingBlanks = totalBlanks;
  
  // First pass - distribute based on word count proportion
  for (let i = 0; i < paragraphs.length; i++) {
    if (paragraphs[i].length === 0) {
      distribution[i] = 0;
      continue;
    }
    
    // Calculate proportion of words in this paragraph relative to total
    const proportion = paragraphs[i].length / totalWords;
    // Allocate blanks proportionally, with at least 1 blank per paragraph
    // if there are enough blanks remaining
    const blanksForParagraph = Math.max(
      remainingBlanks > 0 ? 1 : 0,
      Math.min(
        Math.floor(proportion * totalBlanks),
        paragraphs[i].length, // Never use more blanks than words in paragraph
        remainingBlanks // Never allocate more than what's remaining
      )
    );
    
    distribution[i] = blanksForParagraph;
    remainingBlanks -= blanksForParagraph;
  }
  
  // Second pass - distribute any remaining blanks to paragraphs 
  // that can accommodate more
  let i = 0;
  while (remainingBlanks > 0 && i < paragraphs.length) {
    if (paragraphs[i].length > distribution[i]) {
      distribution[i]++;
      remainingBlanks--;
    }
    i = (i + 1) % paragraphs.length; // Cycle through paragraphs
    
    // Break if we've gone through all paragraphs and still have remaining blanks
    // This prevents infinite loops if no paragraph can take more blanks
    if (i === 0 && remainingBlanks === totalBlanks) break;
  }
  
  return distribution;
}

// Add any additional functions or exports as needed
