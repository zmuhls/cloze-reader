// --- Constants and Config ---
// Flag to force fallback mode even with valid API key (for debugging)
const FORCE_FALLBACK = false; // Using the provided API key

import { debugLog } from '@/utils/debugLog';
// Import the environment configuration utilities
import { getEnvironmentConfig, isUsingUserProvidedApiKey } from '@/utils/environmentConfig';
// Import HuggingFace Project Gutenberg API functions
import { 
  searchGutenbergBooks, 
  parseBookshelf, 
  getBookText, 
  fetchBookText, 
  HuggingFaceBook 
} from '@/services/gutenbergService';
import { runAgenticLoop, OpenRouterMessage } from '@/services/llmService';
// Import game logic functions and state, including startRound and handleSubmission
import { 
  chooseRedactions, extractKeyTerms, renderRound, initializeGameDOMElements, 
  paragraphsWords, redactedIndices, round as gameRound, blanksCount as gameBlanksCount, 
  hintsRemaining as gameHintsRemaining, hintedBlanks as gameHintedBlanks, 
  resetGame as gameLogicResetGame, 
  ParagraphCache, ParagraphCacheItem, 
  startRound as gameLogicStartRound, 
  handleSubmission as gameLogicHandleSubmission
} from '@/services/gameLogic';

// Import diversity utilities

// --- Game Specific API Functions ---
// fetchGutenbergPassage is now exported for use in gameLogic.ts
interface PassageData {
  paragraphs: string[];
  metadata: {
    title: string;
    author: string;
    id: number;
    century?: string;
    canonicalUrl?: string;
  } | null;
}

/**
 * Get static fallback passages when API access is not available
 */
function getStaticFallbackPassage(category: string | null): PassageData {
  console.warn("Using fallback passage due to missing API key or forced fallback.");
  let fallbackParagraphs: string;
  let fallbackMetadata = { title: "Fallback Passage", author: "Anonymous", id: 0 };

  if (category === 'adventure') {
    fallbackParagraphs = `The intrepid explorer ventured deeper into the uncharted jungle, sweat beading on his brow as he hacked through the dense undergrowth with his machete. Strange bird calls echoed through the canopy above, and the air hung thick with moisture and the sweet scent of exotic flowers. He knew the lost temple lay somewhere ahead, its ancient stones hiding secrets that had remained untouched for centuries.

As night fell, he made camp beside a small stream, the gentle gurgling of water over stones providing a soothing counterpoint to the mysterious sounds of the jungle. His maps were worn and faded, but they had served him well thus far. Tomorrow would bring new challenges and, perhaps, the discovery that would cement his place in the annals of exploration.`;
    fallbackMetadata = { title: "Adventure Story Excerpt", author: "Various Authors", id: 0 };
  } else if (category === 'science') {
    fallbackParagraphs = `The laboratory hummed with the soft whirring of centrifuges and the occasional beep of monitoring equipment. Dr. Chen carefully pipetted the clear solution into a series of test tubes, her steady hands reflecting years of practiced precision. This experiment represented months of theoretical work, and if successful, could fundamentally alter our understanding of cellular regeneration.

Scientific discovery has always balanced on the knife-edge between methodical process and creative insight. The greatest breakthroughs often come not from following established protocols, but from the moments when researchers question fundamental assumptions and pursue the unexpected anomalies that appear in their data. It is this combination of discipline and imagination that drives progress forward.`;
    fallbackMetadata = { title: "Scientific Musings", author: "Various Authors", id: 0 };
  } else {
    // Default paragraphs for any other category or no category
    fallbackParagraphs = `The ability to think clearly and rationally is essential for making good decisions and solving problems effectively. Critical thinking involves analyzing information objectively and making reasoned judgments based on evidence rather than personal bias or emotional reactions. It requires skills such as attention to detail, logical reasoning, and the willingness to question assumptions.

Throughout history, literature has served as a mirror reflecting the values, concerns, and aspirations of society. Books allow us to experience different perspectives, fostering empathy and understanding across cultural divides. Whether through fiction or non-fiction, the written word preserves human knowledge and invites readers to engage with ideas that may challenge or expand their worldview.`;
    fallbackMetadata = { title: "General Knowledge Excerpt", author: "Various Authors", id: 0 };
  }

  return {
    paragraphs: fallbackParagraphs.split(/\n+/).filter(p => p.trim().length > 0),
    metadata: fallbackMetadata
  };
}

/**
 * Attempts to fetch a passage using the Gutendex API directly.
 * This provides a more direct and reliable source of books than LLM web search.
 * Note: Direct fetching of book text may encounter CORS issues, which will trigger a fallback to LLM.
 */
async function fetchPassageWithGutendex(
  category: string | null = null,
  author: string | null = null,
  century: string | null = null,
  excludeIds: number[] = []
): Promise<PassageData | null> {
  try {
    debugLog("Attempting to fetch passage with Gutendex API", { category, author, century, excludeIds });
    
    // Convert category to bookshelf name if using format "bookshelf/NNN"
    const bookshelf = parseBookshelf(category);
    debugLog("Parsed bookshelf", { category, bookshelf });
    
    // Search for books matching criteria - this API call usually works without CORS issues
    const books = await searchGutenbergBooks({
      bookshelf,
      author: author || undefined,
      century: century || undefined,
      excludeIds,
      limit: 20, // Get a good sample of books
      language: 'en' // Default to English books
    });
    
    if (!books || books.length === 0) {
      debugLog("No books found with Gutendex matching criteria", { category, author, century });
      return null;
    }
    
    // Select a book from the results that hasn't been excluded
    let selectedBook: HuggingFaceBook | null = null;
    for (const book of books) {
      if (!excludeIds.includes(book.id)) {
        selectedBook = book;
        break;
      }
    }

    if (!selectedBook) {
      debugLog("No suitable (non-excluded) books found with Gutendex matching criteria", { category, author, century, excludeIds });
      return null;
    }
    
    debugLog("Selected book from Gutendex", { 
      id: selectedBook.id, 
      title: selectedBook.title, 
      author: selectedBook.author 
    });
    
    // Get text content from the book
    const bookText = getBookText(selectedBook);
    if (!bookText) {
      debugLog("No suitable text content found for book", { id: selectedBook.id });
      return null;
    }
    
    try {
      // Get the book's text content
      const fullText = await fetchBookText(selectedBook);
      if (!fullText || fullText.length < 1000) {
        debugLog("Book text too short or empty", { id: selectedBook.id, textLength: fullText?.length });
        return null;
      }
      
      // Extract paragraphs from the middle of the book
      const paragraphs = extractParagraphsFromMiddle(fullText);
      if (!paragraphs || paragraphs.length === 0) {
        debugLog("Failed to extract paragraphs from book text", { id: selectedBook.id });
        return null;
      }
      
      debugLog("Successfully fetched passage with Gutendex API", { 
        id: selectedBook.id, 
        paragraphCount: paragraphs.length 
      });
      
      // Return the passage data with metadata
      return {
        paragraphs,
        metadata: {
          title: selectedBook.title,
          author: selectedBook.author,
          id: selectedBook.id,
        }
      };
    } catch (error: any) {
      // If we encounter a CORS error when fetching the full text, we still have the book metadata
      // We can return that so the LLM fallback can use it
      debugLog("CORS error when fetching book text, returning metadata only for LLM fallback", { 
        id: selectedBook.id,
        error: error.message || "Unknown error"
      });
      
      // Return a signal that we need to use LLM but with specific book metadata
      throw new Error(`CORS error when fetching book text for ID ${selectedBook.id}: ${error.message || "Unknown error"}`);
    }
  } catch (error) {
    console.error("Error fetching passage with Gutendex:", error);
    return null;
  }
}

/**
 * Extracts 2-3 paragraphs from the middle of a book's text.
 */
function extractParagraphsFromMiddle(text: string): string[] {
  // Clean up the text
  const cleanText = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n') // Normalize excessive newlines
    .replace(/[^\S\n]+/g, ' '); // Normalize whitespace but preserve newlines
  
  // Split into paragraphs
  const allParagraphs = cleanText
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
  
  // If we don't have enough paragraphs, return empty array
  if (allParagraphs.length < 5) {
    return [];
  }
  
  // Filter out boilerplate and metadata paragraphs
  const contentParagraphs = allParagraphs.filter(p => (
    // Skip Project Gutenberg headers/footers
    !p.includes('Project Gutenberg') &&
    !p.includes('www.gutenberg.org') &&
    !p.includes('Gutenberg') && 
    !p.match(/^\*\*\*/) && // Skip lines starting with ***
    !p.match(/^\[/) && // Skip lines starting with [
    !p.includes('Produced by') &&
    !p.includes('COPYRIGHT') &&
    !p.includes('All rights reserved') &&
    !p.includes('THE END') &&
    !p.includes('THE BEGINNING') &&
    !p.includes('CHAPTER') &&
    p.length > 100 && // Skip too short paragraphs
    p.split(/\s+/).length > 15 // At least 15 words
  ));
  
  // If we don't have enough meaningful paragraphs, return empty array
  if (contentParagraphs.length < 5) {
    return [];
  }
  
  // Take paragraphs from the middle sections of the book
  // This is to avoid prefaces, introductions, etc.
  const midPoint = Math.floor(contentParagraphs.length / 2);
  const thirdQuarter = Math.floor(contentParagraphs.length * 3 / 4);
  
  // Choose a random starting point in the middle third
  const randomStart = Math.floor(midPoint + Math.random() * (thirdQuarter - midPoint));
  const selectedParagraphs = contentParagraphs
    .slice(randomStart, randomStart + 3)
    .filter(p => p.length > 100) // Final length check
    .slice(0, 2); // Take at most 2 paragraphs
  
  return selectedParagraphs.length > 0 ? selectedParagraphs : [];
}


/**
 * Fetches a passage from Project Gutenberg using Gutendex API with LLM fallback.
 * First attempts direct API access, then falls back to LLM web search if needed.
 * This combined approach ensures greater reliability and better category coverage.
 */
export async function fetchGutenbergPassage(
  category: string | null = null,
  author: string | null = null,
  century: string | null = null,
  // attemptedBookIds is now passed directly, no diversity utility
  initialAttemptedBookIds: number[] = [] 
): Promise<PassageData | null> {
  const MAX_RETRIES = 3;
  const attemptedBookIds = Array.from(new Set([...initialAttemptedBookIds]));
  
  debugLog("Fetching Gutenberg passage", { category, author, century, initialAttemptedBookIds, finalAttemptedBookIds: attemptedBookIds });

  // CHECK 1: Use hardcoded fallback when forced
  if (FORCE_FALLBACK) {
    debugLog("Forced fallback mode enabled, using static examples");
    return getStaticFallbackPassage(category);
  }
  
  // CHECK 2: Allow real Gutenberg fetching when possible
  // Check for API key and environment (needed for LLM fallback)
  const hasValidApiKey = Boolean(getEnvironmentConfig().OPENROUTER_API_KEY);
  const isUsingCustomKey = isUsingUserProvidedApiKey();
  const isGitHubPages = window.location.hostname.includes('github.io');
  
  debugLog("Environment check", { 
    hasValidApiKey, 
    isUsingCustomKey,
    isGitHubPages, 
    hostname: window.location,
    apiKeyFormat: hasValidApiKey ? (getEnvironmentConfig().OPENROUTER_API_KEY.substring(0, 8) + "...") : "none",
    forceFallback: FORCE_FALLBACK
  });
  
  // APPROACH 1: Try using Gutendex API directly (doesn't require OpenRouter API key)
  try {
    // Even on GitHub Pages, we can try Gutendex first because it doesn't need an API key
    debugLog("Attempting Gutendex API approach first");
    const gutendexPassage = await fetchPassageWithGutendex(category, author, century, attemptedBookIds);
    if (gutendexPassage) {
      debugLog("Successfully fetched passage using Gutendex API", {
        id: gutendexPassage.metadata?.id,
        title: gutendexPassage.metadata?.title
      });
      return gutendexPassage;
    }
    debugLog("Gutendex API approach failed, will try LLM web search if possible");
  } catch (error) {
    console.error("Error in Gutendex API approach:", error);
    debugLog("Gutendex API approach failed with error, will try LLM web search if possible");
  }

  // APPROACH 2: Fall back to hardcoded passages if we can't use LLM
  // This handles cases where we're on GitHub Pages without a custom API key
  if (!hasValidApiKey) {
    debugLog("Cannot use LLM fallback without valid API key, using static examples");
    return getStaticFallbackPassage(category);
  }
  
  // APPROACH 3: Try LLM web search as a fallback
  // This is our last resort, used when Gutendex API failed but we have a valid API key
  debugLog("Falling back to LLM web search for passage");

  // Retry loop for LLM-based fetching
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    debugLog(`LLM fallback attempt ${attempt + 1} of ${MAX_RETRIES}. Attempted IDs: ${attemptedBookIds.join(', ')}`);

    const queryParts = [];
    if (author) queryParts.push(`by author "${author}"`);
    
    if (category) {
      if (category.includes('/')) {
        const categoryCode = category.split('/')[1];
        if (categoryCode) {
          queryParts.push(`in the Gutenberg bookshelf ID "${categoryCode}"`);
          debugLog(`Using bookshelf ID "${categoryCode}" from category "${category}".`);
        } else {
          debugLog(`Could not extract bookshelf ID from category "${category}". Category will be ignored.`);
        }
      } else {
        queryParts.push(`in the category "${category}"`);
      }
    }

    if (century) {
      const centuryNumber = parseInt(century);
      if (!isNaN(centuryNumber)) {
          // Correctly format the century string (19 = 19th century, not 20th)
          queryParts.push(`from the ${centuryNumber}th century`);
      }
    }

    let queryString = queryParts.join(' ');
    let baseQueryInstruction: string;

    if (queryParts.length > 0) {
      baseQueryInstruction = `from Project Gutenberg ${queryString}`;
      debugLog("Specific criteria provided: using standard query string.");
    } else {
      // For the initial fetch when no user settings are provided,
      // use a more specific instruction to encourage randomness and variety.
      baseQueryInstruction = "from a random book in the catalogue, increasing variety and diverse selections, and avoiding the most popular books on Gutenberg. Never repeat the same book or passage in the same session";
      debugLog("No specific criteria: using new enhanced random query string for initial fetch.");
    }
    
    let retryInstructions = "";
    if (attempt > 0) {
      retryInstructions = ` This is attempt ${attempt + 1}. Please ensure you select a *different* book than previous cached attempts.`;
    }
    
    // Diversity seed logic removed; Gutendex handles randomization.

    if (attemptedBookIds.length > 0) {
      retryInstructions += ` Avoid Project Gutenberg IDs: ${attemptedBookIds.join(', ')}.`;
    }
    
    const userQuery = `Please provide a short passage (2-3 paragraphs) from Project Gutenberg.
${baseQueryInstruction ? `Ideally, the passage should be ${baseQueryInstruction}.` : 'The passage can be from any work for the Gutenberg project catalogue.'}
${retryInstructions}

IMPORTANT GUIDELINES:
1. Select a passage from the *middle* of the book's content, avoiding the beginning (which often contains copyright and metadata) and the end (which may contain boilerplate).
2. Ensure the passage contains complete sentences and paragraphs with coherent meaning.
3. The passage must be VERBATIM from the actual Gutenberg text - do not modify, summarize, or generate text.
4. Verify the Project Gutenberg ID is correct and still available on the Gutenberg website.
6. Copy and paste text rather than paraphrasing to ensure exact matching with the source.

Format to follow EXACTLY:
Title: [Full Book Title]
Author: [Author Name]
ID: [Book ID Number - just the number]
Passage:
[The exact passage text, copied verbatim from the source]

If no passage can be found, please indicate that clearly. Focus on returning a passage that can be precisely verified against the original source.`;

    const messages: OpenRouterMessage[] = [
      { role: 'system', content: 'You are an assistant that helps find and display either random or queried passages from Project Gutenberg. Please provide the passage text along with its title, author, and Project Gutenberg ID if available. Prioritize finding a passage, even if specific search criteria (like category, author, or century) cannot all be met. Avoid adding commentary or analysis not present in the original text. Never fetch the same passage or Gutenberg ID twice, striving for selection variety. When selecting a passage, prioritize content from the middle of the book to avoid boilerplate and copyright information. CRITICALLY IMPORTANT: The passage MUST be quoted EXACTLY as it appears in the source text to ensure validation can succeed. Do not modify, paraphrase or generate passages - they must be identical to what appears in the actual Gutenberg book. Provide accurate IDs that correspond to existing books on gutenberg.org.' },
      { role: 'user', content: userQuery }
    ];

    try {
      // Determine temperature: higher for purely random, default otherwise
      const temperature = (queryParts.length === 0) ? 0.7 : undefined;
      debugLog(`LLM call (attempt ${attempt + 1}) with temperature: ${temperature === undefined ? 'default' : temperature}`);
      const llmResponseContent = await runAgenticLoop(messages, [], temperature); 

      if (!llmResponseContent) {
        console.error(`LLM call (attempt ${attempt + 1}) returned no content.`);
        if (attempt === MAX_RETRIES - 1) return null; // Last attempt failed
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retrying
        continue; // Next attempt
      }

      debugLog(`LLM Web Search Response for Passage (attempt ${attempt + 1}):`, llmResponseContent);

      let bookTitle = "Unknown Title";
      let bookAuthor = "Unknown Author";
      let bookId: number | null = null;
      let passageText = "";

      const titleMatch = llmResponseContent.match(/Title:\s*(.*)/i);
      if (titleMatch && titleMatch[1]) bookTitle = titleMatch[1].trim();

      const authorMatch = llmResponseContent.match(/Author:\s*(.*)/i);
      if (authorMatch && authorMatch[1]) bookAuthor = authorMatch[1].trim();

      const idMatch = llmResponseContent.match(/ID:\s*(\d+)/i);
      if (idMatch && idMatch[1]) bookId = parseInt(idMatch[1], 10);
      
      // Extract URL if provided to get canonical link format
      const urlMatch = llmResponseContent.match(/URL:\s*(https:\/\/www\.gutenberg\.org\/ebooks\/\d+)/i);
      let canonicalUrl: string | null = null;
      
      if (urlMatch && urlMatch[1]) {
        canonicalUrl = urlMatch[1].trim();
        // If we have a canonical URL but no ID, try to extract ID from URL
        if (!bookId && canonicalUrl) {
          const urlIdMatch = canonicalUrl.match(/\/ebooks\/(\d+)/);
          if (urlIdMatch && urlIdMatch[1]) {
            bookId = parseInt(urlIdMatch[1], 10);
            debugLog("Extracted book ID from canonical URL", { canonicalUrl, bookId });
          }
        }
      } else if (bookId) {
        // If we have an ID but no URL, construct the canonical URL
        canonicalUrl = `https://www.gutenberg.org/ebooks/${bookId}`;
        debugLog("Constructed canonical URL from book ID", { bookId, canonicalUrl });
      }

      // Add bookId to attemptedBookIds if valid and not already present
      // This is important for the retry logic so the LLM knows what it already tried.
      if (bookId !== null && !attemptedBookIds.includes(bookId)) {
        attemptedBookIds.push(bookId);
      }

      // Check if the LLM returned a book ID that should have been avoided
      if (bookId !== null && initialAttemptedBookIds.includes(bookId)) {
        console.warn(`LLM returned a previously selected book ID (${bookId}) despite instructions. Retrying if attempts remain.`);
        debugLog(`LLM returned an excluded book ID: ${bookId}. Initial excluded: ${initialAttemptedBookIds.join(', ')}`);
        if (attempt === MAX_RETRIES - 1) return null; // Last attempt failed
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Wait before retrying
        continue; // Next attempt
      }
      
      const passageMarker = "Passage:";
      const passageStartIndex = llmResponseContent.indexOf(passageMarker);

      if (passageStartIndex !== -1) {
        passageText = llmResponseContent.substring(passageStartIndex + passageMarker.length).trim();
      } else {
        let lastMetadataIndex = 0;
        if (titleMatch) lastMetadataIndex = Math.max(lastMetadataIndex, (titleMatch.index || 0) + titleMatch[0].length);
        if (authorMatch) lastMetadataIndex = Math.max(lastMetadataIndex, (authorMatch.index || 0) + authorMatch[0].length);
        if (idMatch) lastMetadataIndex = Math.max(lastMetadataIndex, (idMatch.index || 0) + idMatch[0].length);
        if (lastMetadataIndex > 0 && lastMetadataIndex < llmResponseContent.length) {
          passageText = llmResponseContent.substring(lastMetadataIndex).trim();
        } else if (!titleMatch && !authorMatch && !idMatch) {
          passageText = llmResponseContent.trim();
          debugLog("No metadata markers found, assuming entire response is passage text.");
        }
      }
      
      if (!passageText || llmResponseContent.toLowerCase().includes("no suitable passage found")) {
          console.warn(`Attempt ${attempt + 1}: Could not extract passage text or LLM indicated no passage found.`);
          if (attempt === MAX_RETRIES - 1) return null; // Last attempt failed
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retrying
          continue; // Next attempt
      }

      // Attempt to preserve original formatting, especially for poetry
      let paragraphs = passageText
        .replace(/\r\n/g, '\n') // Standardize line endings
        .split(/\n{2,}/) // Split by two or more newlines (handles most paragraphs and stanzas)
        .map((p: string) => p.trim())
        .filter((p: string) => {
          // Filter out short lines, metadata, and project Gutenberg specific text
          const isMetadata = p.startsWith('Project Gutenberg') || 
                          p.startsWith('***') || 
                          p.includes('*** END OF ') || 
                          p.startsWith('THE END') || 
                          p.includes('www.gutenberg.org') || 
                          /^\*+$/.test(p) || 
                          p.includes('Produced by') || 
                          p.includes('Ebook') || 
                          p.includes('Illustrations by') || 
                          p.includes('Transcriber') ||
                          // Additional patterns to filter out legal disclaimers and notices
                          p.includes('not located in the United States') ||
                          p.includes('laws of the country where you are located') ||
                          p.includes('check the laws') ||
                          p.includes('using this ebook') ||
                          p.includes('copyright laws') ||
                          (p.includes('United States') && p.includes('copyright')) ||
                          p.includes('Project Gutenberg Literary Archive Foundation') ||
                          p.includes('FULL PROJECT GUTENBERG') ||
                          p.includes('BEFORE YOU USE') ||
                          p.includes('permission and restrictions') ||
                          p.includes('public domain') ||
                          p.includes('LICENSE') ||
                          p.includes('WARRANTY');
          
          const isTooShort = p.split(/\s+/).length < 10; // Filter paragraphs with less than 10 words

          // Heuristic to detect potential poetry or formatted text:
          // Check if lines within the "paragraph" are relatively short and consistent in length
          const lines = p.split('\n').filter(line => line.trim().length > 0);
          const avgLineLength = lines.reduce((sum, line) => sum + line.trim().length, 0) / lines.length;
          const isPotentiallyPoetry = lines.length > 3 && avgLineLength < 60; // More than 3 lines and average line length less than 60

          return !isMetadata && (!isTooShort || isPotentiallyPoetry); // Keep if not metadata and either long enough or potentially poetry
        })
        .slice(0, 10); // Take up to 10 potential paragraphs

      // If we don't have enough paragraphs, try a more aggressive split (less likely to preserve poetry)
      if (paragraphs.length < 2) {
        debugLog(`Attempt ${attempt + 1}: First parsing didn't yield enough paragraphs, trying alternative.`);
        paragraphs = passageText
          .replace(/\r\n/g, '\n')
          .split(/\n/) // Split by single newlines
          .map((p: string) => p.trim())
          .filter((p: string) => p.length > 100 && !p.includes('Project Gutenberg') && !p.includes('Produced by') && !p.includes('Ebook') && !p.includes('Illustrations by') && !p.includes('Transcriber')) // Filter for longer lines/paragraphs and exclude more metadata
          .slice(0, 10);
      }

      // Sort by length to prioritize longer paragraphs, but keep original order for poetry
      // Simple heuristic: if a paragraph has many short lines, assume it's poetry and don't sort it by length
      const isLikelyPoetry = (p: string) => {
          const lines = p.split('\n').filter(line => line.trim().length > 0);
          const avgLineLength = lines.reduce((sum, line) => sum + line.trim().length, 0) / lines.length;
          return lines.length > 3 && avgLineLength < 60;
      };

      const proseParagraphs = paragraphs.filter(p => !isLikelyPoetry(p));
      const poetryParagraphs = paragraphs.filter(isLikelyPoetry);

      proseParagraphs.sort((a, b) => b.length - a.length); // Sort prose by length

      // Combine, prioritizing poetry if present, then longer prose
      paragraphs = [...poetryParagraphs, ...proseParagraphs].slice(0, 2);

      if (paragraphs.length === 0) {
        debugLog(`Attempt ${attempt + 1}: Failed to extract suitable paragraphs after all parsing attempts.`);
      }

      // If we have at least one good paragraph, proceed. Otherwise, retry.
      if (paragraphs.length > 0) {
        console.log(`Attempt ${attempt + 1}: Successfully extracted ${paragraphs.length} paragraphs.`);
        // Record the successful selection
        // No need to record book selection; Gutendex handles randomization.
        return {
          paragraphs: paragraphs,
          metadata: {
            title: bookTitle,
            author: bookAuthor,
            id: bookId !== null ? bookId : 0,
            canonicalUrl: canonicalUrl || undefined
          }
        };
      } else {
        console.warn(`Attempt ${attempt + 1}: Could only extract ${paragraphs.length} suitable paragraphs. Retrying if attempts remain.`);
        // No suitable paragraphs found in this attempt, loop will continue if attempts < MAX_RETRIES
      }

    } catch (error) {
      console.error(`Error in fetchGutenbergPassage (LLM web search, attempt ${attempt + 1}):`, error);
      // Loop will continue if attempts < MAX_RETRIES
    }
    if (attempt < MAX_RETRIES - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff might be better
    }
  } // End of retry loop

  console.error("Failed to fetch a suitable passage after all retries.");
  return null; // Indicate failure after all retries
}

// Function to reset game state for a new game (not just a new round)
function resetGame() {
  // We'll use the imported resetGame function from gameLogic
  gameLogicResetGame();

  // Additional UI updates if needed
  if (gameArea) gameArea.innerHTML = '';
  if (resultArea) resultArea.textContent = '';
  if (roundInfo) roundInfo.textContent = '';
  if (bibliographicArea) bibliographicArea.innerHTML = '';
  // Timer functionality removed
}

// Cache DOM elements
let bibliographicArea: HTMLElement | null = null, 
    gameArea: HTMLElement | null = null, 
    resultArea: HTMLElement | null = null, 
    hintBtn: HTMLButtonElement | null = null,
    submitBtn: HTMLButtonElement | null = null, 
    roundInfo: HTMLElement | null = null, 
    newTextBtn: HTMLButtonElement | null = null, 
    welcomeOverlay: HTMLElement | null = null, 
    startGameBtn: HTMLButtonElement | null = null, 
    settingsBtn: HTMLButtonElement | null = null;

function querySelectorSafe<T extends Element>(selector: string, container: Document | Element = document): T | null {
    const element = container.querySelector(selector);
    if (!element) {
        console.warn(`Element with selector "${selector}" not found.`);
        return null;
    }
    return element as T;
}

export function cacheDOMElements() {
    try {
        bibliographicArea = querySelectorSafe<HTMLElement>('#bibliographic-area');
        gameArea = querySelectorSafe<HTMLElement>('#game-area');
        resultArea = querySelectorSafe<HTMLElement>('#result');
        
        // Look specifically for the hint and submit buttons in the game-controls container
        hintBtn = querySelectorSafe<HTMLButtonElement>('#game-controls #hint-btn');
        submitBtn = querySelectorSafe<HTMLButtonElement>('#game-controls #submit-btn');
        
        roundInfo = querySelectorSafe<HTMLElement>('#round-info');
        
        // Settings elements are now handled by Preact components
        newTextBtn = querySelectorSafe<HTMLButtonElement>('#new-text-btn');
        settingsBtn = querySelectorSafe<HTMLButtonElement>('#settings-btn'); // Cache the settings button
        
        // Check for welcome overlay elements (may not exist in inference.html)
        welcomeOverlay = querySelectorSafe<HTMLElement>('#welcome-overlay');
        startGameBtn = querySelectorSafe<HTMLButtonElement>('#start-game-btn');
        
        console.log("DOM Elements cached successfully:", {
            gameAreaFound: !!document.querySelector('#game-area'),
            gameControlsFound: !!document.querySelector('#game-controls'),
            hintBtnFound: !!document.querySelector('#game-controls #hint-btn'),
            submitBtnFound: !!document.querySelector('#game-controls #submit-btn'),
            roundInfoFound: !!document.querySelector('#round-info'),
            welcomeOverlayFound: !!document.querySelector('#welcome-overlay'),
            startGameBtnFound: !!document.querySelector('#start-game-btn')
        });

        // Initialize DOM elements for gameLogic service
        initializeGameDOMElements({
            gameArea,
            roundInfo,
            submitBtn,
            hintBtn,
            resultArea,
            bibliographicArea
        });
    } catch (error) {
        console.error("Error caching DOM elements:", error);
    }
}

// Make functions globally available for legacy code and avoiding circular imports
if (typeof window !== 'undefined') {
    (window as any).startRound = gameLogicStartRound;
    // findRelatedBooks is removed
    console.log("Added global functions to window object");
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Cache DOM elements - wait a short time to ensure all elements are rendered
    setTimeout(() => {
        // cacheDOMElements(); // Moved to app.tsx after game controls are rendered
        
        // Attach event listeners after caching elements
        attachEventListeners();
    }, 100); // Small delay to ensure DOM is fully ready
    
    // Log API access info for clarity - helpful for GitHub Pages deployment
    console.log("Application initialized. Using Gutendex API directly.");
});

// Separate function to attach event listeners
function attachEventListeners() {
    // Set up event listeners
    if (newTextBtn) {
      newTextBtn.addEventListener('click', async () => {
        // Fetch a new passage without resetting game state, forcing a new passage
        await gameLogicStartRound(true);
      });
    }
    
    // Use a more robust approach to find and attach event listeners to game control buttons
    // This uses a mutation observer to detect when the buttons are added to the DOM
    const gameControlsObserver = new MutationObserver((mutations) => {
      // Check if game controls have been added
      const gameControls = document.getElementById('game-controls');
      if (gameControls) {
        const newSubmitBtn = gameControls.querySelector('#submit-btn') as HTMLButtonElement;
        const newHintBtn = gameControls.querySelector('#hint-btn') as HTMLButtonElement;
        
        if (newSubmitBtn && (!submitBtn || submitBtn !== newSubmitBtn)) {
          console.log("Found submit button, attaching click handler");
          submitBtn = newSubmitBtn;
          submitBtn.addEventListener('click', () => {
            console.log("Submit button clicked");
            gameLogicHandleSubmission();
          });
        }
        
        if (newHintBtn && (!hintBtn || hintBtn !== newHintBtn)) {
          console.log("Found hint button");
          hintBtn = newHintBtn;
        }
        
        // If we found both buttons, update the game logic DOM elements
        if (submitBtn && hintBtn) {
          console.log("Initializing game DOM elements with found buttons");
          initializeGameDOMElements({
            gameArea,
            roundInfo,
            submitBtn,
            hintBtn,
            resultArea,
            bibliographicArea
          });
          
          // We can disconnect the observer once we've found the buttons
          gameControlsObserver.disconnect();
        }
      }
    });
    
    // Start observing the document body for changes
    gameControlsObserver.observe(document.body, { 
      childList: true, 
      subtree: true 
    });
    
    // Use a mutation observer to detect when the roundInfo element is updated
    const roundInfoObserver = new MutationObserver((mutations) => {
      // Check if roundInfo has been added or updated
      const newRoundInfo = document.getElementById('round-info');
      if (newRoundInfo && (!roundInfo || roundInfo !== newRoundInfo)) {
        console.log("Found updated round-info element, updating reference");
        roundInfo = newRoundInfo;
        
        // Update the game logic DOM elements with the new roundInfo
        initializeGameDOMElements({
          gameArea,
          roundInfo,
          submitBtn,
          hintBtn,
          resultArea,
          bibliographicArea
        });
      }
    });
    
    // Start observing the document body for changes to the roundInfo element
    roundInfoObserver.observe(document.body, { 
      childList: true, 
      subtree: true 
    });
    
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        const settingsFooterContainer = document.getElementById('settings-footer-container');
        const settingsHeader = settingsFooterContainer?.querySelector('.settings-header');
        if (settingsHeader instanceof HTMLElement) {
          settingsHeader.click(); // Programmatically click the header inside the Preact component
        }
      });
    }
    
    // Show welcome overlay
    // The welcome overlay visibility is now primarily managed by the App component's state
    // and the WelcomeOverlay component itself.
    // However, ensuring it's initially visible if not handled by Preact's initial render might still be useful.
    // For now, let's assume Preact handles initial visibility correctly.
    // If issues arise, we might need to revisit this.
    // welcomeOverlay.classList.remove('hidden'); // This line can likely be removed or conditionalized
}
