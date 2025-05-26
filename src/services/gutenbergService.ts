// src/services/gutenbergService.ts

import { debugLog } from '@/utils/debugLog';
import {
  HuggingFaceBook,
  SearchGutenbergBooksArgs,
  parseBookshelf
} from './gutenbergTypes';
import { runAgenticLoop, OpenRouterMessage, ToolDefinition } from './llmService';
import {
  handleDataError
} from '@/utils/errorHandling';

// Import local datasets
import gutenbergCleanedData from '@/assets/datasets/gutenberg_cleaned.json';
import gutenbergFictionData from '@/assets/datasets/gutenberg_fiction.json';
import gutenbergPoetryData from '@/assets/datasets/gutenberg_poetry.json';
import fallbackData from '@/assets/datasets/fallback.json';

// Cache for filtered results
const searchCache = new Map<string, { data: HuggingFaceBook[], timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Searches for books in local Gutenberg datasets
 */
export async function searchGutenbergBooks(args: SearchGutenbergBooksArgs): Promise<HuggingFaceBook[]> {
  try {
    // Generate cache key based on search criteria
    const cacheKey = JSON.stringify(args);
    const now = Date.now();
    const cached = searchCache.get(cacheKey);

    // Return cached data if valid
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      debugLog("Using cached local dataset results", { args });
      return cached.data;
    }

    debugLog("Searching local datasets", { args });
    
    // Select dataset based on bookshelf or category
    let dataset: HuggingFaceBook[] = [];
    const bookshelf = args.bookshelf?.toLowerCase();
    
    if (bookshelf?.includes('fiction') || bookshelf?.includes('novel')) {
      dataset = gutenbergFictionData as HuggingFaceBook[];
      debugLog("Using fiction dataset", { bookCount: dataset.length });
    } else if (bookshelf?.includes('poetry') || bookshelf?.includes('poem')) {
      dataset = gutenbergPoetryData as HuggingFaceBook[];
      debugLog("Using poetry dataset", { bookCount: dataset.length });
    } else {
      dataset = gutenbergCleanedData as HuggingFaceBook[];
      debugLog("Using general cleaned dataset", { bookCount: dataset.length });
    }

    // Fallback if main dataset is empty
    if (!dataset || dataset.length === 0) {
      debugLog("Primary dataset empty, using fallback");
      dataset = fallbackData as HuggingFaceBook[];
    }

    let books = [...dataset]; // Create a copy to avoid modifying original

    // Apply filters
    if (args.author) {
      const authorLower = args.author.toLowerCase();
      books = books.filter(book => book.author && book.author.toLowerCase().includes(authorLower));
    }

    if (args.bookshelf && !bookshelf) { // Only filter if not already filtered by dataset selection
      books = books.filter(book => {
        if (!book.bookshelves) return false;
        return book.bookshelves.some(shelf =>
          shelf.toLowerCase().includes(args.bookshelf!.toLowerCase())
        );
      });
    }

    if (args.subject) {
      books = books.filter(book => {
        if (!book.subjects) return false;
        return book.subjects.some(subj =>
          subj.toLowerCase().includes(args.subject!.toLowerCase())
        );
      });
    }

    if (args.century) {
      const centuryNum = parseInt(args.century);
      if (!isNaN(centuryNum)) {
        const yearPrefix = centuryNum - 1;
        const centuryPatterns = [
          `${centuryNum}th century`,
          `${yearPrefix}00s`,
          `${yearPrefix}00's`,
          `${yearPrefix}00-`
        ];
        books = books.filter(book => {
          const inSubjects = book.subjects?.some(subj =>
            centuryPatterns.some(pattern =>
              subj.toLowerCase().includes(pattern.toLowerCase())
            )
          ) || false;

          const inBookshelves = book.bookshelves?.some(shelf =>
            centuryPatterns.some(pattern =>
              shelf.toLowerCase().includes(pattern.toLowerCase())
            )
          ) || false;

          return inSubjects || inBookshelves;
        });
      }
    }

    if (args.excludeIds?.length) {
      books = books.filter(book => !args.excludeIds!.includes(book.id));
    }

    // Apply pagination
    const offset = args.offset || 0;
    const limit = args.limit || 100;
    const paginatedBooks = books.slice(offset, offset + limit);

    // Cache the results
    searchCache.set(cacheKey, { data: paginatedBooks, timestamp: now });
    debugLog("Successfully filtered local books", { total: books.length, returned: paginatedBooks.length });

    return paginatedBooks;
  } catch (error) {
    debugLog("Error searching local datasets", { error });
    return handleDataError(
      error,
      fallbackData as HuggingFaceBook[] // Fallback to static data
    );
  }
}

/**
 * Extracts 2-3 high-quality, well-formatted paragraphs from a book's text.
 * Enhanced with better content detection, text formatting, and quality scoring.
 */
export function extractParagraphsFromMiddle(text: string, difficulty: number = 1): string[] {
  debugLog("Starting paragraph extraction", { textLength: text.length });
  
  // Comprehensive text cleaning and normalization
  const cleanText = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/^\s+|\s+$/gm, '')
    .replace(/\s+([.!?])/g, '$1')
    .replace(/([.!?])([A-Z])/g, '$1 $2')
    .replace(/\s{2,}/g, ' ');
  debugLog("Text cleaned", { 
    originalLength: text.length, 
    cleanLength: cleanText.length,
    newlineCount: (cleanText.match(/\n/g) || []).length 
  });

  // Multi-strategy paragraph splitting
  let allParagraphs = cleanText
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  debugLog("Initial paragraph split (double newline)", { count: allParagraphs.length });

  const MIN_PARAGRAPHS_FROM_DBL_NEWLINE = 4; // Threshold for considering \n\n split successful

  // If double newline split yields too few paragraphs, attempt sentence-based grouping.
  if (allParagraphs.length < MIN_PARAGRAPHS_FROM_DBL_NEWLINE) {
    debugLog(`Double newline split yielded only ${allParagraphs.length} paragraphs. Attempting sentence-based grouping.`);
    
    // Convert single newlines to spaces for continuous text, then split into sentences.
    // This uses the existing sentence splitting and grouping logic.
    const sentencesRaw = cleanText.replace(/(?<!\n)\n(?!\n)/g, ' ').replace(/\n\n+/g, ' ').split(/([.!?])\s+/).filter(s => s.trim().length > 0);
    
    const reassembledSentences: string[] = [];
    for (let i = 0; i < sentencesRaw.length; i += 2) {
      let sentence = sentencesRaw[i];
      if (sentencesRaw[i+1]) {
        sentence += sentencesRaw[i+1];
      }
      reassembledSentences.push(sentence.trim());
    }
    debugLog("Sentences extracted for grouping", { count: reassembledSentences.length });

    if (reassembledSentences.length > 0) {
      const groupedParagraphs: string[] = [];
      let currentGroup: string[] = [];
      let currentLength = 0;
      const targetCharLength = 150; // Target character length for a paragraph
      const minSentencesPerGroup = 2; // Prefer at least 2 sentences
      const maxSentencesPerGroup = 5; // Avoid overly long paragraphs (e.g., more than 5 sentences)

      for (const sentence of reassembledSentences) {
        currentGroup.push(sentence);
        currentLength += sentence.length;
        // Group if target length met AND min sentences met, OR max sentences met
        if ((currentLength >= targetCharLength && currentGroup.length >= minSentencesPerGroup) || 
            currentGroup.length >= maxSentencesPerGroup) {
          groupedParagraphs.push(currentGroup.join(' ').trim());
          currentGroup = [];
          currentLength = 0;
        }
      }
      if (currentGroup.length > 0) { // Add any remaining sentences as a paragraph
        if (groupedParagraphs.length === 0 || currentGroup.length >= minSentencesPerGroup || currentLength > targetCharLength / 2) {
             groupedParagraphs.push(currentGroup.join(' ').trim());
        } else if (groupedParagraphs.length > 0) { // Append to last paragraph if too short
            groupedParagraphs[groupedParagraphs.length-1] += ' ' + currentGroup.join(' ').trim();
        }
      }
      
      if (groupedParagraphs.length > 0) {
        allParagraphs = groupedParagraphs;
        debugLog("Paragraphs formed from sentence grouping", { count: allParagraphs.length });
      } else {
        debugLog("Sentence grouping yielded no paragraphs. Original paragraphs from double-newline split (if any) will be used or fallback will apply.");
        // allParagraphs remains as it was from the \n\n split (which was < MIN_PARAGRAPHS_FROM_DBL_NEWLINE)
      }
    } else {
      debugLog("No sentences found for grouping. Original paragraphs from double-newline split (if any) will be used or fallback will apply.");
    }
  }
  // REMOVED: The direct fallback to cleanText.split('\\n') is no longer here.

  // Fallback if still not enough paragraphs (e.g., very short text, or all methods failed)
  if (allParagraphs.length < 2 && cleanText.trim().length > 0) {
    debugLog("Still less than 2 paragraphs. Using entire cleaned text as a single paragraph if no paragraphs were formed, or keeping the single one found.", { currentCount: allParagraphs.length, textLength: cleanText.trim().length });
    if (allParagraphs.length === 0 && cleanText.trim().length > 0) { // If absolutely no paragraphs formed yet
        allParagraphs = [cleanText.trim()]; 
        debugLog("Used entire cleaned text as a single paragraph.", { count: allParagraphs.length });
    }
    // If allParagraphs has 1, it will be kept.
  }

  // Enhanced content filtering
  const filteredParagraphs = allParagraphs.filter(p => {
    const hasGutenbergContent = /Project Gutenberg|www\.gutenberg|Produced by|COPYRIGHT|All rights reserved/i.test(p);
    const hasStructuralMarkers = /^(\*\*\*|\[|CHAPTER\s+[IVXLCDM\d]+|[IVXLCDM]+\.|\d+\.)\s/i.test(p) || 
                                  /(THE END|THE BEGINNING|FINIS)/i.test(p);
    const isMinimalContent = p.length < 80 || p.split(/\s+/).length < 15;
    const quoteCount = (p.match(/"/g) || []).length;
    const isDialogueHeavy = quoteCount > 6;
    const hasAbnormalFormatting = /_{3,}|\*{3,}|={3,}/.test(p);

    return !hasGutenbergContent && !hasStructuralMarkers && !isMinimalContent && 
           !isDialogueHeavy && !hasAbnormalFormatting;
  });

  debugLog("After content filtering", { count: filteredParagraphs.length });

  // Quality scoring and selection with difficulty awareness
  const scoredParagraphs = filteredParagraphs.map(p => ({
    text: formatParagraphText(p),
    score: scoreParagraphQuality(p, difficulty)
  }));

  const scores = scoredParagraphs.map(p => p.score);
  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const threshold = Math.max(0.3, Math.min(0.5, avgScore - 0.05));

  const qualityParagraphs = scoredParagraphs
    .filter(p => p.score > threshold)
    .sort((a, b) => b.score - a.score);

  debugLog("Quality filtering complete", { 
    threshold: threshold.toFixed(2),
    qualityCount: qualityParagraphs.length,
    avgScore: avgScore.toFixed(2)
  });

  if (qualityParagraphs.length < 2) {
    debugLog("Insufficient quality paragraphs", { count: qualityParagraphs.length });
    return [];
  }

  // Select diverse, high-quality paragraphs
  const selectedParagraphs = selectDiverseParagraphs(qualityParagraphs, 2);
  
  debugLog("Paragraph extraction complete", { 
    selectedCount: selectedParagraphs.length,
    avgLength: selectedParagraphs.reduce((sum, p) => sum + p.length, 0) / selectedParagraphs.length
  });

  return selectedParagraphs;
}

/**
 * Formats paragraph text for better readability
 */
function formatParagraphText(text: string): string {
  return text
    .replace(/\s+([.!?:;,])/g, '$1') // Fix spacing before punctuation
    .replace(/([.!?])([A-Z])/g, '$1 $2') // Ensure space after sentence endings
    .replace(/\s{2,}/g, ' ') // Remove excessive spaces
    .replace(/^["']/g, '') // Remove leading quotes that might be orphaned
    .replace(/["']$/g, '') // Remove trailing quotes that might be orphaned
    .trim();
}

/**
 * Selects diverse paragraphs from different sections of the text
 */
function selectDiverseParagraphs(paragraphs: Array<{text: string, score: number}>, count: number): string[] {
  if (paragraphs.length <= count) {
    return paragraphs.map(p => p.text);
  }

  const sectionSize = Math.floor(paragraphs.length / count);
  const selected: string[] = [];

  for (let i = 0; i < count; i++) {
    const sectionStart = i * sectionSize;
    const sectionEnd = (i === count - 1) ? paragraphs.length : (i + 1) * sectionSize;
    const section = paragraphs.slice(sectionStart, sectionEnd);
    
    if (section.length > 0) {
      // Pick the best from first 3 in the section for variety
      const randomIndex = Math.floor(Math.random() * Math.min(3, section.length));
      selected.push(section[randomIndex].text);
    }
  }

  return selected;
}

/**
 * Enhanced paragraph quality scoring for cloze test suitability with difficulty awareness
 */
export function scoreParagraphQuality(paragraph: string, targetDifficulty: number = 1): number {
  let score = 0.4; // Base score

  const words = paragraph.split(/\s+/).filter(w => w.length > 0);
  const sentences = paragraph.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const cleanText = paragraph.replace(/[^\w\s]/g, ' ').toLowerCase();

  // Optimal length scoring adjusted for difficulty
  const wordCount = words.length;
  const difficultyRanges = {
    1: { min: 20, ideal: [30, 50], max: 70 },   // Easy: shorter, simpler
    2: { min: 25, ideal: [35, 60], max: 80 },   // Easy-Medium
    3: { min: 30, ideal: [40, 70], max: 90 },   // Medium
    4: { min: 35, ideal: [50, 80], max: 100 },  // Medium-Hard
    5: { min: 40, ideal: [60, 90], max: 120 }   // Hard: longer, more complex
  };
  
  const range = difficultyRanges[Math.min(5, Math.max(1, targetDifficulty)) as keyof typeof difficultyRanges];
  
  if (wordCount >= range.ideal[0] && wordCount <= range.ideal[1]) {
    score += 0.25; // Ideal range for difficulty
  } else if (wordCount >= range.min && wordCount <= range.max) {
    score += 0.15; // Acceptable range
  } else if (wordCount < range.min || wordCount > range.max) {
    score -= 0.2; // Outside acceptable range
  }

  // Sentence structure quality
  const sentenceCount = sentences.length;
  if (sentenceCount >= 2 && sentenceCount <= 5) {
    score += 0.2;
    
    // Bonus for varied sentence lengths
    const lengths = sentences.map(s => s.split(/\s+/).length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / lengths.length;
    if (variance > 10) score += 0.1; // Good sentence variety
  }

  // Vocabulary richness adjusted for difficulty
  const uniqueWords = new Set(cleanText.split(/\s+/).filter(w => w.length > 2));
  const diversityRatio = uniqueWords.size / Math.max(1, words.length);
  
  // Adjust vocabulary complexity expectations based on difficulty
  const vocabularyThresholds = {
    1: { high: 0.70, med: 0.60, low: 0.45 },  // Easy: simpler vocabulary
    2: { high: 0.72, med: 0.62, low: 0.47 },
    3: { high: 0.75, med: 0.65, low: 0.50 },  // Medium
    4: { high: 0.78, med: 0.68, low: 0.52 },
    5: { high: 0.80, med: 0.70, low: 0.55 }   // Hard: richer vocabulary
  };
  
  const vocabThresh = vocabularyThresholds[Math.min(5, Math.max(1, targetDifficulty)) as keyof typeof vocabularyThresholds];
  
  if (diversityRatio > vocabThresh.high) {
    score += 0.2;
  } else if (diversityRatio > vocabThresh.med) {
    score += 0.15;
  } else if (diversityRatio < vocabThresh.low) {
    score -= 0.1;
  }

  // Reading complexity adjusted for difficulty level
  const commonWords = ['the', 'and', 'of', 'to', 'a', 'in', 'that', 'it', 'is', 'was', 'were', 'for', 'on', 'with', 'as', 'by'];
  const commonWordCount = words.filter(w => commonWords.includes(w.toLowerCase())).length;
  const commonRatio = commonWordCount / words.length;
  
  // Adjust common word ratio expectations based on difficulty
  const complexityRanges = {
    1: [0.25, 0.45],  // Easy: more common words
    2: [0.23, 0.43],
    3: [0.20, 0.40],  // Medium
    4: [0.18, 0.38],
    5: [0.15, 0.35]   // Hard: fewer common words, more sophisticated
  };
  
  const [minRatio, maxRatio] = complexityRanges[Math.min(5, Math.max(1, targetDifficulty)) as keyof typeof complexityRanges];
  
  if (commonRatio >= minRatio && commonRatio <= maxRatio) {
    score += 0.1; // Good complexity balance for difficulty level
  }

  // Formatting and readability
  const punctuationCount = (paragraph.match(/[.,!?;:]/g) || []).length;
  const punctuationRatio = punctuationCount / paragraph.length;
  if (punctuationRatio > 0.05 && punctuationRatio < 0.15) {
    score += 0.1; // Appropriate punctuation
  } else if (punctuationRatio > 0.2) {
    score -= 0.15; // Over-punctuated
  }

  // Enhanced narrative flow and normalization checks
  const hasGoodFlow = !paragraph.match(/^\s*[-\*\d•]+/m) &&
    !paragraph.includes('\n') &&
    sentences.length > 1 &&
    !paragraph.match(/^[A-Z\s]+$/) && // Not all caps
    paragraph.length > 80;
  
  // Check for proper sentence case (starts with capital, ends with punctuation)
  const hasProperCase = /^[A-Z]/.test(paragraph.trim()) && /[.!?]\s*$/.test(paragraph.trim());
  
  // Check for balanced punctuation and normal text flow
  const hasBalancedPunctuation = !/[.!?]{2,}/.test(paragraph) && !/[,;:]{2,}/.test(paragraph);
  
  // Penalty for unusual capitalization patterns
  const unusualCaps = (paragraph.match(/[A-Z]/g) || []).length;
  const capsRatio = unusualCaps / paragraph.length;
  const hasTooManyCaps = capsRatio > 0.1; // More than 10% capitals is suspicious
  
  if (hasGoodFlow) score += 0.15;
  if (hasProperCase) score += 0.1;
  if (hasBalancedPunctuation) score += 0.05;
  if (hasTooManyCaps) score -= 0.15;

  // Penalize problematic content
  if (paragraph.includes('...') || paragraph.includes('--')) score -= 0.05;
  if (paragraph.match(/[{}\[\]<>]/)) score -= 0.1; // Markup characters
  if (paragraph.match(/\b(Mr\.|Mrs\.|Dr\.|Prof\.)/)) score -= 0.05; // Formal titles (less engaging)

  return Math.max(0, Math.min(1, score));
}

/**
 * Gets a stochastic (random) selection of books and returns a random passage
 */
export async function getStochasticPassage(args: SearchGutenbergBooksArgs): Promise<{
  passage: string;
  book: HuggingFaceBook
} | null> {
  try {
    // Use a random offset to get different books each time
    const randomOffset = Math.floor(Math.random() * 1000);
    const searchArgs = {
      ...args,
      offset: randomOffset,
      limit: Math.max(args.limit || 50, 20) // Ensure we get enough books to choose from
    };

    const books = await searchGutenbergBooks(searchArgs);
    if (books.length === 0) return null;

    // Try multiple random books to find one with good content
    const maxAttempts = Math.min(10, books.length);
    const shuffledBooks = books.sort(() => Math.random() - 0.5);

    for (let i = 0; i < maxAttempts; i++) {
      const book = shuffledBooks[i];
      const paragraphs = extractParagraphsFromMiddle(getBookText(book) || '', 1);
      const passage = paragraphs.join('\n\n');

      if (passage && passage.length >= 300) {
        return { passage, book };
      }
    }

    return null;
  } catch (error) {
    debugLog("Error in getStochasticPassage", { error });
    return null;
  }
}

/**
 * Gets the text content of a book
 */
export function getBookText(book: HuggingFaceBook): string | null {
  return book.text || null;
}

/**
 * Uses LLM to enhance search results when needed
 */
export async function enhanceSearchWithLLM(books: HuggingFaceBook[], query: string): Promise<HuggingFaceBook[]> {
  if (!books || books.length === 0) return [];

  const messages: OpenRouterMessage[] = [
    {
      role: 'system',
      content: `You are a literary expert. Rank the relevance of books to this search: "${query}".
                Return only book IDs in a JSON array, most relevant first. Example: [1234, 5678]`
    },
    {
      role: 'user',
      content: JSON.stringify(books.map(b => ({
        id: b.id,
        title: b.title,
        author: b.author,
        subjects: b.subjects,
        bookshelves: b.bookshelves
      })))
    }
  ];

  try {
    // Corrected argument: pass an empty array for tools
    const response = await runAgenticLoop(messages as OpenRouterMessage[], [] as ToolDefinition[], 0.2);
    if (!response) return books;

    const matches = response.match(/\[([\d,\s]+)\]/);
    if (!matches) return books;

    const rankedIds = matches[1].split(',')
      .map(id => parseInt(id.trim()))
      .filter(id => !isNaN(id));

    // Reorder books based on LLM ranking
    const rankedBooks = [];
    for (const id of rankedIds) {
      const book = books.find(b => b.id === id);
      if (book) rankedBooks.push(book);
    }

    return rankedBooks.length > 0 ? rankedBooks : books;
  } catch (error) {
    debugLog("Error in LLM enhancement", { error });
    return books;
  }
}

export interface PassageData {
  paragraphs: string[];
  metadata: {
    title: string;
    author: string;
    id: number;
    century?: string;
    canonicalUrl?: string;
    factoid?: string; // Add optional factoid
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
 * Fetches a passage from local Gutenberg datasets.
 * This function orchestrates calls to local data instead of APIs.
 */
export async function fetchGutenbergPassage(
  category: string | null = null,
  author: string | null = null,
  century: string | null = null,
  initialAttemptedBookIds: number[] = []
): Promise<PassageData | null> {
  debugLog("Fetching Gutenberg passage from local datasets", {
    category,
    author,
    century,
    initialAttemptedBookIds
  });

  try {
    // Use local dataset search instead of API calls
    const books = await searchGutenbergBooks({
      bookshelf: category ? parseBookshelf(category) : undefined,
      author: author || undefined,
      century: century || undefined,
      excludeIds: initialAttemptedBookIds,
      limit: 50, // Get more options for random selection
      language: 'en' // Default to English books
    });

    if (!books || books.length === 0) {
       debugLog("No books returned from local dataset search, using fallback");
       return getStaticFallbackPassage(category);
    }

    // Try multiple books to find one with good content
    const maxAttempts = Math.min(10, books.length);
    const shuffledBooks = books.sort(() => Math.random() - 0.5);

    for (let i = 0; i < maxAttempts; i++) {
      const selectedBook = shuffledBooks[i];
      
      debugLog("Trying book from local dataset", {
        id: selectedBook.id,
        title: selectedBook.title,
        author: selectedBook.author
      });

      // Get text content
      const bookText = getBookText(selectedBook);
      if (!bookText || bookText.length < 1000) {
        debugLog("Book text too short, trying next", { id: selectedBook.id });
        continue;
      }

      // Extract paragraphs using the function from gutenbergService
      const paragraphs = extractParagraphsFromMiddle(bookText, 1);
      if (!paragraphs || paragraphs.length === 0) {
        debugLog("Failed to extract paragraphs, trying next", { id: selectedBook.id });
        continue;
      }

      debugLog("Successfully extracted passage from local dataset", {
        id: selectedBook.id,
        paragraphCount: paragraphs.length
      });

      // Return the passage data with metadata
      return {
        paragraphs,
        metadata: {
          title: selectedBook.title,
          author: selectedBook.author,
          id: typeof selectedBook.id === 'string' ? parseInt(selectedBook.id.replace(/\D/g, '')) || 0 : selectedBook.id,
          canonicalUrl: `https://www.gutenberg.org/ebooks/${selectedBook.id}`
        }
      };
    }

    // If no suitable book found in attempts, use fallback
    debugLog("Could not find suitable book after attempts, using fallback");
    return getStaticFallbackPassage(category);
  } catch (error) {
    debugLog("Error fetching passage from local datasets, using fallback", { error });
    return getStaticFallbackPassage(category);
  }
}