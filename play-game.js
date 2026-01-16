// Playwright script to automate playing the Cloze Reader game
// Uses Gemma 3n E4B via OpenRouter to make intelligent guesses
import 'dotenv/config';
import { chromium } from 'playwright';

const GAME_URL = process.env.GAME_URL || 'https://reader.inference-arcade.com/';
const TARGET_LEVEL = 4; // Stop at this level and reload
const MAX_RELOAD_CYCLES = 2; // How many times to reload and continue (1-4, 5-8, etc.)

// OpenRouter API configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'google/gemma-3-12b-it';

// Get API key from .env file
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  console.error('❌ OPENROUTER_API_KEY environment variable not set');
  console.error('   Set it with: export OPENROUTER_API_KEY=your_key_here');
  process.exit(1);
}

/**
 * Use Gemma 3-12b to guess the missing words based on passage context
 * Optimized for low latency with strong contextual reasoning
 */
async function aiGuessWords(passageText, hints, numBlanks, previousGuesses = []) {
  const previousGuessesText = previousGuesses.length > 0
    ? `\nDo NOT use these words again: ${previousGuesses.flat().join(', ')}`
    : '';

  // Parse hints to extract explicit constraints
  const parsedConstraints = hints.map((hint, i) => {
    return `Word ${i + 1}: ${hint}`;
  }).join(' | ');

  // Truncate passage to reduce token count
  const truncatedPassage = passageText.length > 250
    ? passageText.substring(0, 250) + '...'
    : passageText;

  const prompt = `Complete the blanks using context clues from the passage. Prioritize passage context over hints.${previousGuessesText}

PASSAGE: ${truncatedPassage}

CONSTRAINTS: ${parsedConstraints}

Answer format: ["word1", "word2"]`;



  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://reader.inference-arcade.com',
        'X-Title': 'Cloze Reader Bot'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: 40,
        temperature: 0.25
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('   API error:', error);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    if (!content) {
      console.error('   AI returned empty response');
      return null;
    }

    console.log(`   AI response: ${content.substring(0, 100)}`);

    // Parse JSON array from response with better error handling
    try {
      // Try to find JSON array in the response
      const jsonMatch = content.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        const guesses = JSON.parse(jsonMatch[0]);
        if (Array.isArray(guesses) && guesses.length === numBlanks) {
          console.log(`   ✓ Parsed ${guesses.length} word(s) from AI`);
          return guesses.map(w => String(w).toLowerCase().trim());
        }
      }
    } catch (parseError) {
      console.error(`   Failed to parse AI response: ${parseError.message}`);
    }

    return null;
  } catch (error) {
    console.error(`   AI request failed: ${error.message}`);
    return null;
  }
}

async function playGame() {
  console.log('🎮 Starting Cloze Reader automation...\n');

  // Launch browser in headed mode so you can watch
  const browser = await chromium.launch({
    headless: false
    // Removed slowMo for faster execution
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });

  const page = await context.newPage();

  try {
    let reloadCount = 0;
    let passageCount = 0;

    // Continuous loop for reload cycles
    while (reloadCount < MAX_RELOAD_CYCLES) {
      reloadCount++;
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🔄 RELOAD CYCLE ${reloadCount}/${MAX_RELOAD_CYCLES}`);
      console.log(`${'='.repeat(60)}\n`);

      // Navigate to the game
      console.log('📖 Navigating to', GAME_URL);
      await page.goto(GAME_URL);

      // Wait for and dismiss the welcome overlay
      console.log('👋 Waiting for welcome overlay...');
      try {
        const startButton = await page.waitForSelector('#welcome-start-btn', { timeout: 30000 });
        await startButton.click();
        console.log('✓ Welcome overlay dismissed\n');
      } catch (e) {
        console.log('⚠️  Welcome overlay not found (already playing?)\n');
      }

      // Wait for loading to complete (game area becomes visible and interactive)
      console.log('⏳ Waiting for game to load...');
      await page.waitForFunction(() => {
        const gameArea = document.querySelector('#game-area');
        return gameArea && !gameArea.classList.contains('hidden') &&
               document.querySelectorAll('.cloze-input').length > 0;
      }, { timeout: 60000 });
      console.log('✓ Game loaded!\n');

      // Play passages until we reach target level
      let levelReached = false;
      let passagesThisSession = 0;

      while (!levelReached && passagesThisSession < 50) { // Safety limit: 50 passages per reload
        passageCount++;
        passagesThisSession++;

        // Extract current level
        const levelInfo = await page.textContent('#level-info, [class*="level"]').catch(() => 'Level ?');
        const levelMatch = levelInfo.match(/level\s*(\d+)/i);
        const currentLevel = levelMatch ? parseInt(levelMatch[1]) : 0;

        console.log(`\n${'='.repeat(50)}`);
        console.log(`📚 PASSAGE ${passageCount} (Level ~${currentLevel})`);
        console.log(`${'='.repeat(50)}\n`);

        await playRound(page);

        // Check if we've reached target level
        if (currentLevel >= TARGET_LEVEL) {
          levelReached = true;
          console.log(`\n✅ Reached level ${currentLevel}! Time to reload.\n`);
        } else {
          // Wait for next round and load it
          try {
            await waitForNextRound(page);
          } catch (e) {
            console.log('⚠️  Could not load next round, reloading page...');
            levelReached = true;
          }
        }
      }

      if (passagesThisSession >= 50) {
        console.log('⚠️  Safety limit reached (50 passages). Reloading...');
      }
    }

    console.log('\n🎉 All reload cycles complete!');
    console.log(`Total passages played: ${passageCount}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    try {
      await page.screenshot({ path: 'error-screenshot.png' });
      console.log('📸 Screenshot saved to error-screenshot.png');
    } catch (e) {
      console.log('Could not save screenshot');
    }
  } finally {
    await browser.close();
  }
}

async function playRound(page) {
  // Parallelize DOM operations to reduce latency
  const [bookInfo, roundInfo, passageText] = await Promise.all([
    page.textContent('#book-info'),
    page.textContent('#round-info'),
    page.textContent('#passage-content')
  ]);

  console.log(`📖 ${bookInfo.trim()}`);
  console.log(`📊 ${roundInfo.trim()}\n`);
  console.log(`📝 Passage preview: "${passageText.substring(0, 150).trim()}..."\n`);

  // Show hints to help us guess (click if button exists, then get hints)
  const [hintBtn, hints] = await Promise.all([
    page.$('#hint-btn'),
    page.$$eval('#hints-list > div', elements =>
      elements.map(el => el.textContent.trim())
    ).catch(() => [])
  ]);

  if (hintBtn && hints.length === 0) {
    await hintBtn.click();
    // Wait for hints to populate after click
    await page.waitForFunction(() => {
      const hintDivs = document.querySelectorAll('#hints-list > div');
      return hintDivs.length > 0;
    }, { timeout: 5000 }).catch(() => null);
    // Re-fetch hints if they appeared
    const newHints = await page.$$eval('#hints-list > div', elements =>
      elements.map(el => el.textContent.trim())
    ).catch(() => []);
    if (newHints.length > hints.length) {
      hints.length = 0;
      hints.push(...newHints);
    }
  }

  if (hints.length > 0) {
    console.log('💡 Hints:');
    hints.forEach(hint => console.log(`   ${hint}`));
    console.log('');
  }

  // Parallelize getting inputs and passage HTML
  const [inputs, passageHtml] = await Promise.all([
    page.$$('.cloze-input'),
    page.$eval('#passage-content', el => el.innerHTML)
  ]);
  console.log(`🔲 Found ${inputs.length} blank(s) to fill\n`);
  // Convert inputs to [BLANK X] markers for the AI
  let passageForAI = passageHtml;
  const inputMatches = passageHtml.match(/<input[^>]*class="cloze-input"[^>]*>/gi) || [];
  inputMatches.forEach((match, i) => {
    passageForAI = passageForAI.replace(match, `[BLANK ${i + 1}]`);
  });
  // Strip remaining HTML tags
  passageForAI = passageForAI.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  // Use AI to guess the words
  console.log('🤖 Asking Gemma 3 12B to guess the words...\n');
  const aiGuesses = await aiGuessWords(passageForAI, hints, inputs.length);

  // Track initial guesses for retry logic
  const initialGuesses = [];

  // Check disabled status and values for all inputs in parallel
  const inputStatuses = await Promise.allSettled(
    inputs.map(async (input, i) => ({
      index: i,
      disabled: await input.isDisabled().catch(() => false),
      value: await input.inputValue().catch(() => '')
    }))
  ).then(results => results.map((r, i) =>
    r.status === 'fulfilled' ? r.value : { index: i, disabled: false, value: '' }
  ));

  // Fill in the blanks with AI guesses (or fallback to hint-based)
  const fillPromises = [];
  for (const status of inputStatuses) {
    const { index: i, disabled: isDisabled, value } = status;

    if (isDisabled) {
      console.log(`   Blank ${i + 1}: Already filled with "${value}"`);
      initialGuesses[i] = value;
      continue;
    }

    // Use AI guess if available, otherwise fallback
    let guess = aiGuesses?.[i] || '';

    if (!guess && hints[i]) {
      guess = extractGuessFromHint(hints[i], i);
    }

    if (!guess) {
      guess = getDefaultGuess(i);
    }

    initialGuesses[i] = guess;
    console.log(`   Blank ${i + 1}: Guessing "${guess}"`);
    fillPromises.push(inputs[i].fill(guess));
  }
  // Fill all inputs in parallel
  await Promise.all(fillPromises);

  console.log('\n📤 Submitting answers...');

  // Get and click submit button (wait for it to be clickable)
  const submitBtn = await page.waitForSelector('#submit-btn:not(:disabled)', { timeout: 5000 }).catch(null);
  if (!submitBtn) {
    console.error('❌ Submit button not found or disabled');
    return;
  }
  await submitBtn.click();

  // Wait for result to appear dynamically
  await page.waitForFunction(() => {
    const resultEl = document.querySelector('#result');
    return resultEl && resultEl.textContent.trim().length > 0;
  }, { timeout: 10000 }).catch(() => null);

  // Check if we need to retry (wrong answers)
  let maxRetries = 2; // Reduced from 3 to save API credits
  let retryCount = 0;

  // Track previous guesses per blank index (initialize with initial guesses)
  const previousGuessesMap = new Map(); // blankIndex -> array of guesses
  initialGuesses.forEach((guess, i) => {
    previousGuessesMap.set(i, [guess]);
  });

  while (retryCount < maxRetries) {
    // Check if skip button is visible (means we got some wrong)
    const skipBtn = await page.$('#skip-btn:not(.hidden)');

    if (skipBtn) {
      retryCount++;
      console.log(`\n🔄 Retry attempt ${retryCount}/${maxRetries}`);

      // Get updated hints after retry
      const retryInputs = await page.$$('.cloze-input:not([disabled])');

      if (retryInputs.length === 0) {
        console.log('   All blanks are locked (correct)');
        break;
      }

      console.log(`   ${retryInputs.length} blank(s) still need answers`);

      // Get indices of remaining blanks (check in parallel)
      const allInputs = await page.$$('.cloze-input');
      const disabledStatuses = await Promise.allSettled(
        allInputs.map((inp, i) => inp.isDisabled().catch(() => false).then(disabled => ({ i, disabled })))
      ).then(results => results.map((r, i) =>
        r.status === 'fulfilled' ? r.value : { i, disabled: false }
      ));
      const remainingIndices = disabledStatuses.filter(s => !s.disabled).map(s => s.i);

      // Get updated passage with correct answers filled in
      const updatedHtml = await page.$eval('#passage-content', el => el.innerHTML);
      let updatedPassage = updatedHtml;
      const retryMatches = updatedHtml.match(/<input[^>]*class="cloze-input"[^>]*>/gi) || [];
      let blankNum = 0;
      retryMatches.forEach((match) => {
        blankNum++;
        updatedPassage = updatedPassage.replace(match, `[BLANK ${blankNum}]`);
      });
      updatedPassage = updatedPassage.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

      // Filter hints to only remaining blanks
      const remainingHints = remainingIndices.map(i => hints[i] || 'No hint');

      // Build previous guesses array for remaining blanks
      const previousGuessesForRetry = remainingIndices.map(i =>
        previousGuessesMap.get(i) || []
      );

      console.log('🤖 Asking AI for retry guesses...\n');
      const retryGuesses = await aiGuessWords(updatedPassage, remainingHints, retryInputs.length, previousGuessesForRetry);

      // Fill in retry guesses and track them
      const retryFillPromises = [];
      for (let i = 0; i < retryInputs.length; i++) {
        const blankIndex = remainingIndices[i];
        let guess = retryGuesses?.[i];

        // If AI guess failed, use hint-based matching instead of random pool
        if (!guess && hints[blankIndex]) {
          console.log('🤖 AI unavailable, using hint-based matching...');
          guess = extractGuessFromHint(hints[blankIndex], blankIndex);
        }

        // Final fallback: use retry word pool
        if (!guess) {
          guess = getRetryGuess(retryCount);
        }

        // Track this guess
        if (!previousGuessesMap.has(blankIndex)) {
          previousGuessesMap.set(blankIndex, []);
        }
        previousGuessesMap.get(blankIndex).push(guess);

        console.log(`   Trying: "${guess}"`);
        retryFillPromises.push(retryInputs[i].fill(guess));
      }
      await Promise.all(retryFillPromises);

      // Submit again and wait for result dynamically
      await submitBtn.click();
      await page.waitForFunction(() => {
        const resultEl = document.querySelector('#result');
        return resultEl && resultEl.textContent.trim().length > 0;
      }, { timeout: 10000 }).catch(() => null);
    } else {
      break;
    }
  }

  // Check if we're still stuck - click skip if available
  const skipBtnAfterRetries = await page.$('#skip-btn:not(.hidden)');
  if (skipBtnAfterRetries) {
    console.log('\n⏭️ Skipping this passage after retries...');
    await skipBtnAfterRetries.click();
    // Wait for skip and result to be processed
    await page.waitForFunction(() => {
      const resultEl = document.querySelector('#result');
      return resultEl && resultEl.textContent.trim().length > 0;
    }, { timeout: 5000 }).catch(() => null);
  }

  // Get result
  const result = await page.textContent('#result');
  console.log(`\n📊 Result: ${result.trim()}`);

  // Show correct answers that were revealed
  const correctAnswers = await page.$$eval('.correct-answer-reveal', els =>
    els.map(el => el.textContent.trim())
  );

  if (correctAnswers.length > 0) {
    console.log('\n✅ Correct answers:');
    correctAnswers.forEach((answer, i) => console.log(`   ${i + 1}. ${answer}`));
  }
}

async function waitForNextRound(page) {
  console.log('\n⏳ Loading next passage...');

  // Wait for next button to become visible
  console.log('   Waiting for next button...');
  try {
    const nextBtn = await page.waitForSelector('#next-btn:not(.hidden)', { timeout: 8000 });

    if (nextBtn) {
      await nextBtn.click();
    } else {
      throw new Error('Could not find next button');
    }
  } catch (e) {
    console.log('   ⚠️  Next button not found, retrying...');
    throw e;
  }

  // Wait for new inputs to appear and be ready (signals new passage is ready)
  try {
    await page.waitForFunction(() => {
      const inputs = document.querySelectorAll('.cloze-input');
      return inputs.length > 0 && !inputs[0].disabled;
    }, { timeout: 30000 });
  } catch (e) {
    console.log('   ⚠️  Timeout waiting for passage inputs');
    throw new Error('Could not load next passage');
  }
  await page.waitForTimeout(50);

  console.log('✓ Next passage loaded\n');
}

function extractGuessFromHint(hint) {
  // Try to extract useful info from hints
  // Format: "X letters, starts with 'Y', ends with 'Z'"

  const lengthMatch = hint.match(/(\d+)\s*letters?/i);
  const startsMatch = hint.match(/starts?\s*with\s*["']?([a-zA-Z])["']?/i);
  const endsMatch = hint.match(/ends?\s*with\s*["']?([a-zA-Z])["']?/i);

  const len = lengthMatch ? parseInt(lengthMatch[1]) : null;
  const first = startsMatch ? startsMatch[1].toLowerCase() : null;
  const last = endsMatch ? endsMatch[1].toLowerCase() : null;

  // Extended word list organized by length - common literary words
  const wordPool = {
    3: ['the', 'and', 'but', 'for', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'are', 'his', 'has', 'its', 'man', 'own', 'day', 'get', 'how', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'let', 'put', 'say', 'she', 'too', 'use'],
    4: ['that', 'with', 'have', 'this', 'will', 'your', 'from', 'they', 'been', 'were', 'said', 'each', 'made', 'find', 'work', 'part', 'take', 'come', 'such', 'then', 'life', 'hand', 'mind', 'long', 'only', 'seem', 'even', 'must', 'most', 'also', 'know', 'upon', 'good', 'back', 'just', 'like', 'make', 'more', 'much', 'over', 'some', 'than', 'time', 'very', 'well', 'when', 'year', 'able', 'best', 'both', 'call', 'came', 'case', 'does', 'done', 'down', 'face', 'fact', 'feel', 'felt', 'full', 'gave', 'give', 'goes', 'gone', 'here', 'high', 'home', 'kept', 'kind', 'last', 'left', 'less', 'lost', 'love', 'main', 'mean', 'meet', 'move', 'name', 'need', 'next', 'once', 'open', 'page', 'past', 'plan', 'read', 'real', 'rest', 'room', 'rule', 'same', 'self', 'sent', 'show', 'side', 'sort', 'stay', 'stop', 'sure', 'talk', 'tell', 'tend', 'term', 'test', 'text', 'than', 'thee', 'them', 'thou', 'thus', 'took', 'town', 'tree', 'true', 'turn', 'type', 'unit', 'used', 'view', 'want', 'warm', 'wash', 'went', 'what', 'whom', 'wide', 'wife', 'wild', 'wish', 'word', 'wore', 'yard', 'yeah', 'year'],
    5: ['their', 'would', 'there', 'could', 'other', 'about', 'great', 'after', 'which', 'these', 'where', 'being', 'those', 'years', 'since', 'world', 'state', 'place', 'while', 'still', 'found', 'every', 'under', 'never', 'might', 'think', 'again', 'human', 'small', 'heart', 'right', 'night', 'light', 'first', 'power', 'whole', 'often', 'order', 'early', 'young', 'white', 'black', 'green', 'ready', 'clear', 'fresh', 'quiet', 'sweet', 'field', 'floor', 'grace', 'grand', 'guard', 'hands', 'heard', 'heavy', 'horse', 'house', 'ideal', 'inner', 'known', 'large', 'later', 'learn', 'least', 'leave', 'level', 'limit', 'lived', 'lives', 'local', 'lower', 'lucky', 'magic', 'major', 'maker', 'march', 'match', 'maybe', 'means', 'meant', 'metal', 'midst', 'moral', 'motor', 'mouth', 'moved', 'music', 'needs', 'noble', 'north', 'noted', 'novel', 'ocean', 'offer', 'older', 'opens', 'organ', 'owned', 'owner', 'paint', 'panel', 'party', 'peace', 'pearl', 'penny', 'phase', 'phone', 'piece', 'pilot', 'pitch', 'plain', 'plane', 'point', 'pound', 'price', 'pride', 'prime', 'print', 'prior', 'prize', 'proof', 'proud', 'queen', 'quick', 'quite', 'radio', 'raise', 'range', 'rapid', 'reach', 'react', 'realm', 'rebel', 'refer', 'reply', 'rider', 'ridge', 'right', 'river', 'rough', 'round', 'route', 'royal', 'rural', 'saint', 'scene', 'scope', 'score', 'sense', 'serve', 'seven', 'shade', 'shake', 'shall', 'shape', 'share', 'sharp', 'sheet', 'shelf', 'shell', 'shift', 'shine', 'shiny', 'shirt', 'shock', 'shoot', 'shore', 'short', 'shown', 'sight', 'sixth', 'sized', 'skill', 'sleep', 'smile', 'smoke', 'snake', 'solid', 'sound', 'south', 'space', 'speak', 'speed', 'spell', 'spend', 'spent', 'spent', 'spoke', 'sport', 'squad', 'staff', 'stage', 'stair', 'stamp', 'stand', 'start', 'state', 'steal', 'steam', 'steel', 'steep', 'steer', 'stick', 'stiff', 'sting', 'stock', 'stone', 'stood', 'store', 'storm', 'story', 'stove', 'sugar', 'suite', 'super', 'sweet', 'swift', 'swing', 'sword', 'swore', 'table', 'teach', 'teeth', 'tempo', 'tends', 'tenth', 'terms', 'tests', 'thank', 'theft', 'their', 'theme', 'there', 'these', 'thick', 'thief', 'thing', 'think', 'third', 'thorn', 'those', 'thumb', 'tight', 'times', 'tired', 'title', 'today', 'token', 'topic', 'total', 'touch', 'tough', 'tower', 'track', 'trade', 'trail', 'train', 'trash', 'treat', 'trend', 'trial', 'tribe', 'trick', 'tried', 'tries', 'troop', 'truck', 'truly', 'trunk', 'trust', 'truth', 'twice', 'uncle', 'under', 'union', 'unity', 'until', 'upper', 'upset', 'urban', 'usage', 'usual', 'utter', 'value', 'vapor', 'vault', 'venue', 'verse', 'video', 'villa', 'virus', 'visit', 'vital', 'vivid', 'vocal', 'voice', 'voted', 'voter', 'vowel', 'wages', 'wagon', 'waist', 'wakes', 'walks', 'walls', 'wants', 'wards', 'wares', 'warns', 'waste', 'watch', 'water', 'waved', 'waver', 'waves', 'weary', 'weave', 'weird', 'wells', 'whale', 'wheat', 'wheel', 'where', 'which', 'while', 'white', 'whole', 'whose', 'widen', 'wider', 'widow', 'wield', 'woman', 'women', 'woods', 'words', 'works', 'world', 'worry', 'worse', 'worst', 'worth', 'would', 'wound', 'woven', 'wrath', 'wreck', 'wrist', 'write', 'wrong', 'yield', 'young', 'yours', 'youth', 'zones'],
    6: ['should', 'people', 'before', 'little', 'mother', 'father', 'always', 'though', 'nature', 'itself', 'things', 'spirit', 'reason', 'rather', 'become', 'within', 'toward', 'beauty', 'motion', 'matter', 'action', 'across', 'actual', 'advice', 'affair', 'afford', 'afraid', 'agency', 'agreed', 'almost', 'amount', 'answer', 'anyone', 'appeal', 'appear', 'around', 'artist', 'aspect', 'assign', 'assist', 'assume', 'attack', 'attend', 'author', 'avenue', 'backed', 'barely', 'battle', 'became', 'behind', 'belief', 'belong', 'bishop', 'bitter', 'border', 'bottle', 'bottom', 'bought', 'branch', 'breath', 'bridge', 'bright', 'broken', 'budget', 'burden', 'buried', 'button', 'called', 'camera', 'cancel', 'candle', 'carbon', 'career', 'caring', 'castle', 'caught', 'caused', 'center', 'cereal', 'chance', 'change', 'chapel', 'charge', 'choice', 'choose', 'chosen', 'church', 'circle', 'circus', 'client', 'coffee', 'column', 'combat', 'coming', 'common', 'comply', 'copper', 'corner', 'cotton', 'couple', 'course', 'cousin', 'create', 'credit', 'crisis', 'cruise', 'custom', 'damage', 'danger', 'dating', 'dealer', 'debate', 'decade', 'decent', 'decide', 'defeat', 'defend', 'define', 'degree', 'demand', 'denial', 'depend', 'deploy', 'deputy', 'desert', 'design', 'desire', 'detail', 'detect', 'device', 'devote', 'dialog', 'diesel', 'differ', 'dinner', 'direct', 'divide', 'doctor', 'dollar', 'domain', 'donate', 'double', 'dragon', 'driven', 'driver', 'drives', 'drowsy', 'during', 'earned', 'easier', 'easily', 'easter', 'eating', 'editor', 'effort', 'eighth', 'either', 'eleven', 'empire', 'employ', 'enable', 'ending', 'energy', 'engine', 'enrich', 'enough', 'ensure', 'entire', 'entity', 'envied', 'equity', 'errand', 'escape', 'estate', 'ethics', 'ethnic', 'europe', 'events', 'evolve', 'exceed', 'except', 'excuse', 'expand', 'expect', 'expert', 'expire', 'export', 'expose', 'extent', 'fabric', 'facing', 'factor', 'failed', 'fairer', 'fairly', 'fallen', 'family', 'famous', 'farmer', 'fasted', 'father', 'faulty', 'feared', 'fellow', 'female', 'fenced', 'fender', 'ferret', 'fester', 'feudal', 'figure', 'filled', 'filler', 'filmed', 'filter', 'finale', 'finger', 'finish', 'firing', 'firmly', 'fiscal', 'fished', 'fisher', 'fitted', 'fixing', 'flamed', 'flange', 'flared', 'flawed', 'fleced', 'fleece', 'flight', 'flimsy', 'flinch', 'floats', 'flock', 'floods', 'floral', 'florid', 'flours', 'flowed', 'fluent', 'foamed', 'foible', 'fogged', 'folded', 'folder', 'follow', 'fondle', 'fooled', 'forage', 'forbid', 'forced', 'forest', 'forget', 'forgot', 'forked', 'formal', 'format', 'formed', 'former', 'foster', 'fought', 'fouled', 'founded', 'founts', 'fourth', 'framed', 'france', 'fraught', 'frayed', 'freeze', 'french', 'frenzy', 'friday', 'friend', 'fright', 'frisky', 'frizzy', 'frosty', 'frozen', 'frugal', 'fruit', 'fudged', 'fueled', 'fulfil', 'full', 'funnel', 'funky', 'fusion', 'future', 'gadget', 'gaiety', 'gained', 'galaxy', 'galled', 'gallery', 'galley', 'gallon', 'gallop', 'gander', 'garage', 'garden', 'garlic', 'garlic', 'garlic', 'garlic', 'garlic', 'garlic', 'garlic', 'garlic', 'garlic', 'garlic', 'garlic', 'garlic', 'garlic', 'garlic', 'garlic', 'garlic', 'garlic', 'garlic', 'garlic', 'garlic', 'garlic', 'garlic', 'garlic', 'garlic', 'garlic', 'garlic', 'garlic', 'garlic', 'garlic', 'garlic', 'garlic', 'garlic', 'garlic', 'garlic', 'garlic', 'garlic', 'garlic', 'garlic', 'garlic', 'garlic', 'garment', 'garner', 'garnet', 'garnish', 'garrote', 'gaseous', 'gashed', 'gasket', 'gasped', 'gather', 'gauged', 'gauges', 'gauged', 'gauntlet', 'gavage', 'gaveled', 'gavels', 'gawky', 'gazelle', 'gazers', 'gazette', 'geared', 'geared', 'geese', 'gelded', 'gelees', 'gelled', 'gelous', 'gemmed', 'general', 'genesis', 'genetic', 'genial', 'genius', 'genome', 'gently', 'gentry', 'genuine', 'genus', 'geode', 'german', 'germs', 'gerontic', 'gestate', 'gesture', 'getups', 'ghastly', 'gherao', 'ghetto', 'ghibli', 'ghibli', 'ghibli', 'ghibli', 'ghibli', 'ghibli', 'ghibli', 'ghibli', 'ghibli', 'ghibli', 'ghibli', 'ghibli', 'ghibli', 'ghibli', 'ghost', 'ghosted', 'ghosts', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly', 'ghastly'],
    7: ['another', 'because', 'through', 'thought', 'however', 'between', 'nothing', 'against', 'herself', 'himself', 'perhaps', 'present', 'general', 'whether', 'already', 'certain', 'subject', 'feeling', 'example', 'forward', 'hundred', 'include', 'kitchen', 'natural', 'neither', 'october', 'pattern', 'problem', 'program', 'provide', 'purpose', 'science', 'service', 'society', 'special', 'station', 'student', 'surface', 'teacher', 'tonight', 'totally', 'traffic', 'various', 'weather', 'welcome', 'western', 'without', 'working', 'written', 'ability', 'academy', 'account', 'achieve', 'address', 'advance', 'ancient', 'anxiety', 'applied', 'arrange', 'arrival', 'article', 'average', 'backing', 'baptist', 'battery', 'bearing', 'beating', 'bedroom', 'believe', 'beneath', 'benefit', 'blessed', 'blinded', 'blinked', 'blister', 'bloated', 'blocked', 'blossom', 'blotted', 'blotted', 'blotted', 'blotter', 'blowing', 'blubber', 'bludgeon', 'blueing', 'bluffing', 'blurred', 'boarded', 'boarder', 'boards', 'boasted', 'boaters', 'boating', 'bobsled', 'bodied', 'bodily', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'bodkins', 'boggled', 'bogging', 'boggled', 'boggles', 'boggled', 'boggled', 'boggled', 'boggled', 'boggled', 'boggled', 'boggled', 'boggled', 'boggled', 'boggled', 'boggled', 'boggled', 'boggled', 'boggled', 'boggled', 'boggled', 'boggled', 'boggled', 'boggled', 'boggled', 'boggled', 'boggled', 'boggled', 'boggled', 'boggled', 'boggled', 'boggled', 'boggled', 'bogging', 'boggiest', 'boggily', 'bogginess', 'bogging', 'boggish', 'boggishly', 'boggishness', 'boggles', 'bogglesome', 'boggley', 'boggly', 'boggy', 'boghland', 'boghlands', 'boghog', 'boghogs', 'boghogger', 'boghoggers', 'boghog', 'boghogs', 'boghole', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes', 'bogholes'],
    8: ['together', 'children', 'although', 'possible', 'anything', 'thousand', 'question', 'movement', 'absolute', 'relation', 'sensible', 'perceive', 'remember', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction'],
    9: ['something', 'important', 'different', 'therefore', 'according', 'sometimes', 'knowledge', 'necessary', 'beautiful', 'existence', 'sensation', 'universal', 'condition', 'principle', 'intellect', 'substance', 'testimony', 'community', 'following', 'beginning', 'agreement', 'character', 'something', 'something', 'something', 'something', 'something', 'something', 'something', 'something', 'something', 'something', 'something', 'something', 'something', 'something', 'something', 'something', 'something', 'something', 'something', 'something'],
    10: ['themselves', 'everything', 'experience', 'understand', 'perception', 'intelligence', 'imagination', 'contemplation', 'connection', 'generation', 'conclusion', 'expression', 'particularly', 'everything', 'everything', 'everything', 'everything', 'everything', 'everything', 'everything', 'everything'],
    11: ['remembrance', 'acknowledge', 'approaching', 'association', 'imagination', 'immediately', 'recognition', 'requirement', 'responsible', 'temperature', 'acknowledge'],
  };

  // Filter by criteria
  let candidates = wordPool[len] || [];

  if (first) {
    candidates = candidates.filter(w => w[0] === first);
  }
  if (last) {
    candidates = candidates.filter(w => w[w.length - 1] === last);
  }

  console.log(`   Matching candidates: ${candidates.slice(0, 5).join(', ')}${candidates.length > 5 ? '...' : ''} (${candidates.length} total)`);

  if (candidates.length > 0) {
    return candidates[0];
  }

  // Fallback: try any length if no exact match found
  if (first || last) {
    for (const [_len, words] of Object.entries(wordPool)) {
      const anyMatch = words.find(w => {
        if (first && w[0] !== first) return false;
        if (last && w[w.length - 1] !== last) return false;
        return true;
      });
      if (anyMatch) return anyMatch;
    }
  }

  // Final fallback: return a common word
  const commonWords = ['the', 'and', 'that', 'have', 'with', 'this', 'from', 'they', 'been', 'were', 'said', 'each'];
  return commonWords[Math.floor(Math.random() * commonWords.length)];
}

function getDefaultGuess(index) {
  // Common words that often appear in literary texts
  const commonGuesses = [
    'the', 'and', 'that', 'have', 'with', 'this', 'from', 'they',
    'been', 'were', 'said', 'each', 'which', 'their', 'time', 'very'
  ];

  return commonGuesses[index % commonGuesses.length];
}

function getRetryGuess(retryNum) {
  // Different word pools for retries
  const retryWords = [
    ['great', 'small', 'young', 'little', 'heart', 'world', 'place', 'found'],
    ['never', 'always', 'thought', 'looked', 'seemed', 'became', 'turned', 'stood'],
    ['beautiful', 'wonderful', 'something', 'everything', 'nothing', 'perhaps', 'however']
  ];

  const pool = retryWords[Math.min(retryNum - 1, retryWords.length - 1)];
  return pool[Math.floor(Math.random() * pool.length)];
}

// Run the game
playGame().catch(console.error);
