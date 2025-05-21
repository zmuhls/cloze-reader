// src/services/gameLogic.ts

import { debugLog } from '@/utils/debugLog';

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

// --- Game Logic Functions ---

/**
 * Chooses words to redact from a list of words based on a scoring mechanism.
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
    'those', 'am', 'i', 'we', 'you', 'he', 'she', 'they', 'we', 'it' // Corrected: removed duplicate 'we'
  ]);

  const scoredWords: ScoredWord[] = words.map((word, index) => {
    const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
    let score = 0;
    score += cleanWord.length * 2;
    if (functionWords.has(cleanWord)) {
      score -= 10;
    }
    if (index > 0 && word[0] === word[0].toUpperCase() && word[0].match(/[A-Z]/)) {
      score += 5;
    }
    score += Math.random() * 2;
    return { index, score };
  });

  scoredWords.sort((a, b) => b.score - a.score);

  const actualCount = Math.min(count, words.length);
  const candidatePoolSize = Math.min(actualCount * 2, words.length);
  const topCandidates = scoredWords.slice(0, candidatePoolSize);

  while (indices.length < actualCount && topCandidates.length > 0) {
    const randomIndex = Math.floor(Math.random() * topCandidates.length);
    const selectedWord = topCandidates.splice(randomIndex, 1)[0];
    indices.push(selectedWord.index);
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
export let paragraphsWords: string[][] = [[], []];
export let redactedIndices: number[][] = [[], []];
export let round = 1;
export let blanksCount = 1;
export let hintsRemaining = 5;
export let hintedBlanks: Set<string> = new Set();
export let previousBooks: { title: string; author: string; id: number }[] = [];

// --- DOM Element References ---
// These will be initialized by a function called from main.ts or passed as arguments.
// For now, assuming they will be passed to functions that need them or queried internally.
// Let's define placeholders that functions can expect to be populated.
interface GameDOMElements {
  gameArea: HTMLElement;
  roundInfo: HTMLElement;
  submitBtn: HTMLButtonElement;
  hintBtn: HTMLButtonElement;
  resultArea: HTMLElement;
  bibliographicArea: HTMLElement; // Added bibliographicArea
}

let domElements: GameDOMElements | null = null;

export function initializeGameDOMElements(elements: GameDOMElements) {
  domElements = elements;
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

  const totalBlanks = redactedIndices[0].length + redactedIndices[1].length;
  roundInfo.textContent = `Round ${round} — ${totalBlanks} blanks`;
  gameArea.innerHTML = '';

  if (paragraphsWords[0].length === 0 && paragraphsWords[1].length === 0) {
    gameArea.innerHTML = '<p class="text-red-500">Error: No paragraphs loaded.</p>';
    submitBtn.disabled = true;
    hintBtn.disabled = true;
    // stopTimer(); // stopTimer is not directly called here but good to note dependency
    return;
  }

  for (let pIdx = 0; pIdx < 2; pIdx++) {
    if (paragraphsWords[pIdx].length === 0) continue;

    const paragraphElement = document.createElement('p');
    paragraphElement.className = 'typewriter-text leading-relaxed break-words mb-6';
    paragraphElement.style.maxWidth = '100%';
    paragraphElement.style.overflowWrap = 'break-word';
    gameArea.appendChild(paragraphElement);

    paragraphsWords[pIdx].forEach((word, idx) => {
      if (redactedIndices[pIdx].includes(idx)) {
        const input = document.createElement('input');
        input.type = 'text';
        input.dataset.index = String(idx);
        input.dataset.paragraph = String(pIdx);
        input.placeholder = '_____';
        // Enhanced styling for input boxes
        input.className = 'border-b-2 border-typewriter-ink w-24 mx-1 text-center bg-transparent focus:outline-none focus:border-typewriter-ribbon focus:ring-1 focus:ring-typewriter-ribbon rounded-sm px-1 py-0.5 text-typewriter-ink placeholder-typewriter-ink placeholder-opacity-50';


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
        paragraphElement.appendChild(document.createTextNode(' '));

        input.addEventListener('focus', () => {
          if (!domElements) return; // Guard against null domElements
          const paragraphIdx = Number(input.dataset.paragraph);
          const wordIdx = Number(input.dataset.index);
          const blankKey = `${paragraphIdx}-${wordIdx}`;

          domElements.hintBtn.disabled = hintsRemaining <= 0 || hintedBlanks.has(blankKey);

          domElements.hintBtn.onclick = () => {
            if (hintsRemaining > 0 && !hintedBlanks.has(blankKey)) {
              const originalWord = paragraphsWords[paragraphIdx][wordIdx];

              if (originalWord) {
                const hintText = `Starts with "${originalWord[0]}", length ${originalWord.length}.`;
                const hintDiv = document.createElement('div');
                hintDiv.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50';
                hintDiv.innerHTML = `
                  <div class="bg-aged-paper p-6 rounded shadow-typewriter max-w-md text-center typewriter-text">
                    <h3 class="text-xl font-bold mb-4 text-shadow-typewriter">Hint</h3>
                    <p>${hintText}</p>
                    <button class="mt-4 px-4 py-2 typewriter-key hover:bg-aged-paper">Got it</button>
                  </div>
                `;
                document.body.appendChild(hintDiv);

                const closeHint = () => document.body.removeChild(hintDiv);
                hintDiv.querySelector('button')?.addEventListener('click', closeHint);
                hintDiv.addEventListener('click', (e) => {
                  if (e.target === hintDiv) closeHint();
                });

                hintsRemaining--;
                if (domElements) domElements.hintBtn.textContent = `Hint (${hintsRemaining})`;
                hintedBlanks.add(blankKey);
                input.classList.add('hinted-blank');
                if (domElements) domElements.hintBtn.disabled = hintsRemaining <= 0 || hintedBlanks.has(blankKey);
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

  const totalRedactedCount = redactedIndices[0].length + redactedIndices[1].length;
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
  const { gameArea, resultArea, roundInfo, bibliographicArea } = domElements;

  round = 1;
  blanksCount = 1;
  hintsRemaining = 5;
  hintedBlanks.clear();
  paragraphsWords[0] = [];
  paragraphsWords[1] = [];
  redactedIndices[0] = [];
  redactedIndices[1] = [];
  previousBooks = []; // Reset previous books on a full game reset

  if (gameArea) gameArea.innerHTML = '';
  if (resultArea) resultArea.textContent = '';
  if (roundInfo) roundInfo.textContent = '';
  if (bibliographicArea) bibliographicArea.innerHTML = '';

  if (typeof stopTimer === 'function') {
    stopTimer();
  }
  debugLog("Game reset in gameLogic.ts");
}


import { fetchGutenbergPassage } from '@/main'; 

/**
 * Starts a new round of the game by fetching a new passage and rendering it.
 */
export async function startRound(forceNewPassage: boolean = false) {
  if (!domElements) {
    console.error("DOM elements not initialized for gameLogic.startRound");
    return;
  }
  const { gameArea, roundInfo, submitBtn, hintBtn, resultArea, bibliographicArea } = domElements;

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

  let cacheKey = `passage_${category || 'any'}_${author || 'any'}_${century || 'any'}`; // Include century in cache key

  // If all search parameters are empty, it's a "random" request.
  // Add a random component to the cache key to ensure a fresh fetch for "truly random" initial passages,
  // unless forceNewPassage is explicitly false (which might be used for specific reloads of the *same* random passage).
  // However, startRound is usually called with forceNewPassage=true for the very first load via app.tsx.
  if (!category && !author && !century && forceNewPassage) {
    cacheKey = `passage_random_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    debugLog("Generated unique cache key for initial random passage:", { cacheKey });
  }

  const cachedPassage = paragraphCache.get(cacheKey);
  // For truly random initial fetches, we want to bypass cache even if forceNewPassage wasn't explicitly true,
  // but the logic above already makes the cacheKey unique, effectively bypassing it.
  if (!forceNewPassage && cachedPassage && !cacheKey.startsWith('passage_random_')) {
    debugLog("Serving passage from cache", { cacheKey });
    const parsedCache = JSON.parse(cachedPassage);
     if (parsedCache && parsedCache.paragraphs && Array.isArray(parsedCache.paragraphs)) {
        const passageData = {
            paragraphs: parsedCache.paragraphs,
            metadata: parsedCache.metadata || null
        };
        if (bibliographicArea && passageData.metadata) {
            // Add to previous books history if not already there
            const isAlreadyFetched = previousBooks.some(book => book.id === passageData.metadata!.id);
            if (!isAlreadyFetched) {
              previousBooks.unshift(passageData.metadata);
              if (previousBooks.length > 5) {
                previousBooks.pop();
              }
            }

            let historyHtml = '';
            if (previousBooks.length > 1) {
                historyHtml = '<p class="text-xs text-typewriter-ink opacity-60 mt-1">Previously fetched:</p><ul class="text-xs list-disc list-inside opacity-60">';
                previousBooks.slice(1, 5).forEach(book => {
                    historyHtml += `<li><a href="https://www.gutenberg.org/ebooks/${book.id}" target="_blank" class="underline hover:text-typewriter-ribbon">${book.title} by ${book.author}</a></li>`;
                });
                historyHtml += '</ul>';
            }
            bibliographicArea.innerHTML = `
                <p class="text-sm text-typewriter-ink opacity-80 mb-1">
                    (Cached) Currently from: <em><a href="https://www.gutenberg.org/ebooks/${passageData.metadata.id}" target="_blank" class="underline hover:text-typewriter-ribbon">${passageData.metadata.title}</a></em> by ${passageData.metadata.author} (ID: ${passageData.metadata.id})
                </p>
                ${historyHtml}
            `;
            setTimeout(() => {
                if (typeof window !== 'undefined' && (window as any).applyTypewriterEffect) {
                    const metaElements = bibliographicArea.querySelectorAll('p, em, a, li');
                    metaElements.forEach(el => (window as any).applyTypewriterEffect(el));
                }
            }, 100);
        }
        paragraphsWords[0] = passageData.paragraphs[0].split(/\s+/).filter((w: string) => w.length > 0);
        paragraphsWords[1] = passageData.paragraphs.length > 1 ?
          passageData.paragraphs[1].split(/\s+/).filter((w: string) => w.length > 0) : [];

        redactedIndices[0].length = 0;
        redactedIndices[1].length = 0;
        const totalWords = paragraphsWords[0].length + paragraphsWords[1].length;
        const maxPossibleBlanks = Math.floor(totalWords * 0.3);
        const actualBlanksCount = Math.min(blanksCount, maxPossibleBlanks);

        if (paragraphsWords[0].length > 0) {
          const firstParaBlanks = paragraphsWords[1].length > 0 ?
            Math.floor(actualBlanksCount * (paragraphsWords[0].length / totalWords)) :
            actualBlanksCount;
          const newRedactionsPara0 = chooseRedactions(paragraphsWords[0], firstParaBlanks);
          newRedactionsPara0.forEach(r => redactedIndices[0].push(r));
        }
        if (paragraphsWords[1].length > 0) {
          const secondParaBlanks = actualBlanksCount - redactedIndices[0].length;
          const newRedactionsPara1 = chooseRedactions(paragraphsWords[1], secondParaBlanks);
          newRedactionsPara1.forEach(r => redactedIndices[1].push(r));
        }

        if ((redactedIndices[0].length + redactedIndices[1].length) === 0) {
          if (gameArea) gameArea.innerHTML = '<div class="text-center p-4"><p class="text-lg text-red-500 typewriter-text">Could not generate enough blanks from cached passage. Try different criteria or refresh.</p></div>';
          if (submitBtn) submitBtn.disabled = true;
          if (hintBtn) hintBtn.disabled = true;
          if (typeof stopTimer === 'function') { 
            stopTimer();
          }
          return null;
        }

        renderRound();
        return passageData;
     } else {
        console.warn("Cached data for key", cacheKey, "is invalid. Fetching new.");
     }
  } else {
    if (forceNewPassage) {
      debugLog("Forcing new passage fetch, bypassing cache.", { cacheKey });
    } else {
      debugLog("Cache miss or invalid cache data. Fetching new passage.", { cacheKey });
    }
    
  let fetchedPassageData: Awaited<ReturnType<typeof fetchGutenbergPassage>> = null;
  
  try {
    // Pass century to fetchGutenbergPassage and initialize attemptedBookIds
    fetchedPassageData = await fetchGutenbergPassage(category, author, century, []); 
    
    if (!fetchedPassageData || fetchedPassageData.paragraphs.length === 0) {
      if (gameArea) gameArea.innerHTML = '<div class="text-center p-4"><p class="text-lg text-red-500 typewriter-text">Could not load a suitable passage after multiple attempts. Please check your API key, network, or try different search criteria.</p></div>';
      if (submitBtn) submitBtn.disabled = true;
      if (hintBtn) hintBtn.disabled = true;
      if (typeof stopTimer === 'function') { 
        stopTimer();
      }
      return;
    }
  
    try {
      paragraphCache.set(cacheKey, JSON.stringify(fetchedPassageData));
      debugLog("Passage stored in cache", { cacheKey });
    } catch (e) {
      console.warn("Failed to store passage in cache:", e);
    }
  
    paragraphsWords[0] = fetchedPassageData.paragraphs[0].split(/\s+/).filter((w: string) => w.length > 0);
    paragraphsWords[1] = fetchedPassageData.paragraphs.length > 1 ?
      fetchedPassageData.paragraphs[1].split(/\s+/).filter((w: string) => w.length > 0) : [];
  
    // Check if fetchedPassageData and its metadata are not null
    if (bibliographicArea && fetchedPassageData && fetchedPassageData.metadata) {
        // Add to previous books history
        const isAlreadyFetched = previousBooks.some(book => book.id === fetchedPassageData!.metadata!.id); // Added non-null assertion as we've checked fetchedPassageData
        if (!isAlreadyFetched) {
          previousBooks.unshift(fetchedPassageData.metadata); 
          if (previousBooks.length > 5) { 
            previousBooks.pop();
          }
        }

        let historyHtml = '';
        if (previousBooks.length > 1) { 
            historyHtml = '<p class="text-xs text-typewriter-ink opacity-60 mt-1">Previously fetched:</p><ul class="text-xs list-disc list-inside opacity-60">';
            previousBooks.slice(1, 5).forEach(book => { 
                historyHtml += `<li><a href="https://www.gutenberg.org/ebooks/${book.id}" target="_blank" class="underline hover:text-typewriter-ribbon">${book.title} by ${book.author}</a></li>`;
            });
            historyHtml += '</ul>';
        }

        bibliographicArea.innerHTML = `
            <p class="text-sm text-typewriter-ink opacity-80 mb-1">
                Currently from: <em><a href="https://www.gutenberg.org/ebooks/${fetchedPassageData.metadata.id}" target="_blank" class="underline hover:text-typewriter-ribbon">${fetchedPassageData.metadata.title}</a></em> by ${fetchedPassageData.metadata.author} (ID: ${fetchedPassageData.metadata.id})
            </p>
            ${historyHtml}
        `;
        setTimeout(() => {
            if (typeof window !== 'undefined' && (window as any).applyTypewriterEffect) {
                const metaElements = bibliographicArea.querySelectorAll('p, em, a, li');
                metaElements.forEach(el => (window as any).applyTypewriterEffect(el));
            }
        }, 100);
    }
  } catch (error) {
    console.error("Error fetching passage:", error);
    if (gameArea) gameArea.innerHTML = '<div class="text-center p-4"><p class="text-lg text-red-500 typewriter-text">An error occurred while fetching content. Please check your API key and network connection.</p></div>';
    if (submitBtn) submitBtn.disabled = true;
    if (hintBtn) hintBtn.disabled = true;
    if (typeof stopTimer === 'function') {
      stopTimer();
    }
    return;
  }
  
  if (!fetchedPassageData) return;

  redactedIndices[0].length = 0;
  redactedIndices[1].length = 0;
  const totalWords = paragraphsWords[0].length + paragraphsWords[1].length;
  const maxPossibleBlanks = Math.floor(totalWords * 0.3);
  const actualBlanksCount = Math.min(blanksCount, maxPossibleBlanks);

  if (paragraphsWords[0].length > 0) {
    const firstParaBlanks = paragraphsWords[1].length > 0 ?
      Math.floor(actualBlanksCount * (paragraphsWords[0].length / totalWords)) :
      actualBlanksCount;
    const newRedactionsPara0 = chooseRedactions(paragraphsWords[0], firstParaBlanks);
    newRedactionsPara0.forEach(r => redactedIndices[0].push(r));
  }
  if (paragraphsWords[1].length > 0) {
    const secondParaBlanks = actualBlanksCount - redactedIndices[0].length;
    const newRedactionsPara1 = chooseRedactions(paragraphsWords[1], secondParaBlanks);
    newRedactionsPara1.forEach(r => redactedIndices[1].push(r));
  }

  if ((redactedIndices[0].length + redactedIndices[1].length) === 0) {
    if (gameArea) gameArea.innerHTML = '<div class="text-center p-4"><p class="text-lg text-red-500 typewriter-text">Could not generate enough blanks. Try different criteria or refresh.</p></div>';
    if (submitBtn) submitBtn.disabled = true;
    if (hintBtn) hintBtn.disabled = true;
    if (typeof stopTimer === 'function') { 
      stopTimer();
    }
    return;
  }

  renderRound();
}
}

/**
 * Handles the submission of the user's guesses, checks answers, and updates the UI.
 * @param timedOut Whether the submission was triggered by a timer timeout.
 */
export async function handleSubmission(timedOut = false) {
  if (!domElements) {
    console.error("DOM elements not initialized for gameLogic.handleSubmission");
    return;
  }
  const { gameArea, submitBtn, hintBtn, resultArea } = domElements;

  if (typeof stopTimer === 'function') { 
    stopTimer(); 
  }

  const submitSound = () => {
    // Optional: Add typewriter 'ding' sound effect here
  };
  submitSound();

  const inputs = Array.from(gameArea.querySelectorAll<HTMLInputElement>('input[type="text"]'));
  let correctCount = 0;
  let totalCount = 0;

  inputs.forEach(input => {
    totalCount++;
    const paragraphIdx = Number(input.dataset.paragraph || '0');
    const wordIdx = Number(input.dataset.index);

    const originalWord = paragraphsWords[paragraphIdx][wordIdx];
    const guessedWord = input.value.trim(); 

    const originalWordClean = originalWord.replace(/[^\w\s'-]/g, '').toLowerCase();
    const guessedWordClean = guessedWord.toLowerCase();

    const wordSpan = document.createElement('span');
    wordSpan.className = 'typewriter-text font-bold'; 

    if (guessedWordClean === originalWordClean) {
      correctCount++;
      wordSpan.textContent = originalWord + ' '; 
      wordSpan.classList.add('text-green-700'); 
    } else {
      wordSpan.textContent = `${guessedWord} [${originalWord}] `; 
      wordSpan.classList.add('text-red-700'); 
    }

    input.parentElement?.insertBefore(wordSpan, input);
    input.remove();
  });

  const neededToPass = Math.ceil(totalCount * 0.6);
  resultArea.classList.remove('text-green-700', 'text-red-700');

  if (timedOut) {
    resultArea.textContent = `Time's up! You got ${correctCount}/${totalCount} correct.`;
    resultArea.classList.add(correctCount >= neededToPass ? 'text-green-700' : 'text-red-700', 'text-shadow-typewriter');
  } else {
    resultArea.textContent = `${correctCount}/${totalCount} correct.`;
    resultArea.classList.add(correctCount >= neededToPass ? 'text-green-700' : 'text-red-700', 'text-shadow-typewriter');
  }

  if (correctCount >= neededToPass) {
      round++;
      blanksCount++;
      if (resultArea) resultArea.textContent += ` Starting Round ${round} with ${blanksCount} blanks in 8 seconds...`;
  } else {
      if (resultArea) resultArea.textContent += ` Getting a new passage in 8 seconds...`;
  }

  if (submitBtn) submitBtn.disabled = true;
  if (hintBtn) hintBtn.disabled = true;

  if (correctCount >= neededToPass) {
    setTimeout(() => startRound(false), 8000);
  } else {
    setTimeout(() => startRound(true), 8000);
  }
}
