// src/services/llmService.ts

import { getEnvironmentConfig } from '@/utils/environmentConfig';
import { SearchGutenbergBooksArgs } from '@/services/gutenbergTypes';
import {
  ApiError,
  DataError,
  handleApiError,
  handleDataError,
  logError
} from '@/utils/errorHandling';

// Internal logging function to avoid circular dependencies
function logLLMService(message: string, data?: any): void {
  const timestamp = new Date().toISOString();
  console.log(`[LLM Service ${timestamp}] ${message}`);
  if (data !== undefined) {
    try {
      console.log(JSON.stringify(data, null, 2));
    } catch (error) {
      console.log('[LLM Service Raw Data]', data);
    }
  }
}

// --- Type Definitions (subset relevant to this service) ---
export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content?: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string; // for tool role if function name
}

export interface ToolCallFunction {
  name: string;
  arguments: string; // JSON string
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: ToolCallFunction;
}

export interface ToolParameterProperty {
  type: string;
  items?: { type: string };
  description: string;
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, ToolParameterProperty>;
      required: string[];
    };
  };
}

// --- Tool Definitions & Mappings (specific to LLM service) ---
export const tools: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'getWordAnalysis',
      description: 'Provides a concise analytical description of a missing word and its role in the sentence.',
      parameters: {
        type: 'object',
        properties: {
          sentence: {
            type: 'string',
            description: 'The full sentence containing the missing word.'
          },
          word: {
            type: 'string',
            description: 'The missing word to analyze.'
          }
        },
        required: ['sentence', 'word']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getBookAuthorInfo',
      description: 'Fetches a concise, interesting factoid about the author or book.',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'The title of the book.'
          },
          author: {
            type: 'string',
            description: 'The author of the book.'
          }
        },
        required: ['title', 'author']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_cloze_passage',
      description: 'Intelligently selects and processes a passage from the Project Gutenberg dataset with difficulty-aware sampling. Level 1: Simple, modern prose with common vocabulary. Level 2: Slightly more complex sentences. Level 3: Moderate complexity with varied sentence structures. Level 4: Advanced vocabulary and longer sentences. Level 5: Complex literary passages with sophisticated language. Returns the passage with strategically placed blanks based on difficulty.',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Bookshelf/category filter (optional)'
          },
          author: {
            type: 'string',
            description: 'Author filter (optional)'
          },
          century: {
            type: 'string',
            description: 'Century filter (optional)'
          },
          blanks_count: {
            type: 'integer',
            description: 'Number of blanks to create in the passage'
          },
          difficulty: {
            type: 'integer',
            description: 'Passage difficulty level (1-5): 1=Elementary (simple words, short sentences), 2=Basic (moderate vocabulary), 3=Intermediate (varied complexity), 4=Advanced (sophisticated vocabulary), 5=Expert (complex literary language)'
          }
        },
        required: ['blanks_count']
      }
    }
  }
];


import { fetchGutenbergPassage } from '@/main';
import { PassageData } from '@/services/gutenbergService';
import { chooseRedactions } from '@/services/gameLogic';

/**
 * Difficulty-aware word selection for cloze blanks
 */
function chooseRedactionsWithDifficulty(words: string[], count: number, difficulty: number): number[] {
  if (words.length === 0 || count === 0) return [];

  const functionWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'if', 'of', 'at', 'by', 'for', 'with', 'about',
    'to', 'from', 'in', 'on', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have',
    'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall', 'should', 'can', 'could',
    'may', 'might', 'must', 'that', 'which', 'who', 'whom', 'whose', 'this', 'these',
    'those', 'am', 'i', 'we', 'you', 'he', 'she', 'they', 'it'
  ]);

  const commonWords = new Set([
    'said', 'get', 'make', 'go', 'know', 'take', 'see', 'come', 'think', 'look', 'want',
    'give', 'use', 'find', 'tell', 'ask', 'work', 'seem', 'feel', 'try', 'leave', 'call'
  ]);

  interface ScoredWord {
    index: number;
    score: number;
    word: string;
    difficulty: number;
  }

  const scoredWords: ScoredWord[] = words.map((word, index) => {
    if (!word || word.length === 0) {
      return { index, score: -100, word, difficulty: 0 };
    }
    
    const cleanWord = word.replace(/[.,!?;:]+$/, '').toLowerCase().replace(/[^\w]/g, '');
    
    let score = 0;
    let wordDifficulty = 1;
    
    // Base scoring
    score += cleanWord.length * 2;
    
    // Function word penalty
    if (functionWords.has(cleanWord)) {
      score -= 15;
      wordDifficulty = 1;
    } else if (commonWords.has(cleanWord)) {
      score -= 5;
      wordDifficulty = 2;
    } else {
      // Assess word difficulty
      if (cleanWord.length >= 8) wordDifficulty += 1;
      if (cleanWord.length >= 12) wordDifficulty += 1;
      if (/[aeiou]{2,}/.test(cleanWord)) wordDifficulty += 1; // Complex vowel patterns
      if (cleanWord.includes('tion') || cleanWord.includes('sion')) wordDifficulty += 1;
    }
    
    // Adjust score based on target difficulty vs word difficulty
    const difficultyMatch = Math.abs(difficulty - wordDifficulty);
    if (difficultyMatch === 0) {
      score += 20; // Perfect difficulty match
    } else if (difficultyMatch === 1) {
      score += 10; // Close match
    } else if (difficultyMatch > 2) {
      score -= 10; // Poor match
    }
    
    // Difficulty-specific adjustments
    if (difficulty <= 2) {
      // Easy levels: prefer shorter, common words
      if (cleanWord.length <= 6) score += 10;
      if (cleanWord.length > 10) score -= 15;
    } else if (difficulty >= 4) {
      // Hard levels: prefer longer, complex words
      if (cleanWord.length >= 8) score += 10;
      if (cleanWord.length < 5) score -= 10;
    }
    
    // Proper noun detection and handling
    const isCapitalized = word[0] === word[0].toUpperCase() && word[0].match(/[A-Z]/);
    const isProbablySentenceStart = index === 0 || 
        (index > 0 && words[index-1] && words[index-1].match(/[.!?]\s*$/));
    
    if (isCapitalized && !isProbablySentenceStart) {
      if (difficulty <= 2) {
        score -= 20; // Avoid proper nouns in easy levels
      } else {
        score -= 10; // Less penalty for hard levels
      }
    }
    
    score += Math.random() * 3;
    return { index, score, word, difficulty: wordDifficulty };
  })
  .filter(scoredWord => {
    const word = scoredWord.word;
    if (!word || word.length === 0) return false;
    
    const cleanWord = word.replace(/[.,!?;:]+$/, '');
    const hasNonLatinChars = /[^\u0000-\u007F\u0080-\u00FF\u0100-\u017F\u0180-\u024F]/.test(cleanWord);
    
    return !hasNonLatinChars && !/[—–]/.test(cleanWord) && cleanWord.length >= 3;
  });

  scoredWords.sort((a, b) => b.score - a.score);

  const actualCount = Math.min(count, scoredWords.length);
  const candidatePoolSize = Math.min(actualCount * 3, scoredWords.length);
  const topCandidates = scoredWords.slice(0, candidatePoolSize);

  const indices: number[] = [];
  
  while (indices.length < actualCount && topCandidates.length > 0) {
    const randomIndex = Math.floor(Math.random() * topCandidates.length);
    const selectedWord = topCandidates.splice(randomIndex, 1)[0];
    const selectedIndex = selectedWord.index;
    
    const isAdjacent = indices.some(existingIndex => 
      Math.abs(existingIndex - selectedIndex) <= 1
    );
    
    if (!isAdjacent || indices.length === 0) {
      indices.push(selectedIndex);
    } else if (topCandidates.length === 0 && indices.length < actualCount) {
      indices.push(selectedIndex);
    }
  }

  return indices.sort((a, b) => a - b);
}

export const TOOL_MAPPING: Record<string, (args: any) => Promise<object>> = {
  async getWordAnalysis(args: { sentence: string; word: string }): Promise<object> {
    // Compose prompt for the tool call
    const { sentence, word } = args;
    return {
      analysis: `The word "${word}" plays a key role in the sentence: "${sentence}". It contributes to the overall meaning by emphasizing its context.`
    };
  },

  async get_cloze_passage(args: {
    category?: string;
    author?: string;
    century?: string;
    blanks_count: number;
    difficulty?: number;
  }): Promise<object> {
    const { category, author, century, blanks_count, difficulty = 1 } = args;
    try {
      logLLMService("Getting cloze passage from local datasets with difficulty-aware selection", args);
      
      // Define difficulty-specific selection criteria
      const difficultyGuidelines = {
        1: { // Elementary
          maxSentenceLength: 15,
          preferredWordLength: [3, 8],
          complexityPreference: 'simple',
          vocabularyLevel: 'common'
        },
        2: { // Basic
          maxSentenceLength: 18,
          preferredWordLength: [4, 10],
          complexityPreference: 'moderate-simple',
          vocabularyLevel: 'everyday'
        },
        3: { // Intermediate
          maxSentenceLength: 22,
          preferredWordLength: [4, 12],
          complexityPreference: 'moderate',
          vocabularyLevel: 'varied'
        },
        4: { // Advanced
          maxSentenceLength: 28,
          preferredWordLength: [5, 15],
          complexityPreference: 'complex',
          vocabularyLevel: 'sophisticated'
        },
        5: { // Expert
          maxSentenceLength: 35,
          preferredWordLength: [6, 18],
          complexityPreference: 'very-complex',
          vocabularyLevel: 'literary'
        }
      };
      
      const guidelines = difficultyGuidelines[Math.min(5, Math.max(1, difficulty)) as keyof typeof difficultyGuidelines];
      logLLMService(`Using difficulty ${difficulty} guidelines:`, guidelines);
      
      // Use local dataset search instead of external API calls
      const { searchGutenbergBooks, extractParagraphsFromMiddle, getBookText } = await import('@/services/gutenbergService');
      
      // Search for books using local datasets
      const books = await searchGutenbergBooks({
        bookshelf: category,
        author: author,
        century: century,
        limit: 50, // Get more options for random selection
        language: 'en'
      });

      if (!books || books.length === 0) {
        logLLMService("No books found in local datasets, using fallback");
        return await this.getFallbackClozePassage(blanks_count);
      }

      // Try multiple books to find one with good content
      const maxAttempts = Math.min(10, books.length);
      const shuffledBooks = books.sort(() => Math.random() - 0.5);

      for (let i = 0; i < maxAttempts; i++) {
        const selectedBook = shuffledBooks[i];
        
        logLLMService("Trying book from local dataset", {
          id: selectedBook.id,
          title: selectedBook.title,
          author: selectedBook.author
        });

        // Get text content
        const bookText = getBookText(selectedBook);
        if (!bookText || bookText.length < 1000) {
          logLLMService("Book text too short, trying next", { id: selectedBook.id });
          continue;
        }

        // Extract paragraphs using the function from gutenbergService with difficultEnsure the y
        const paragraphs = extractParagraphsFromMiddle(bookText, difficulty);
        if (!paragraphs || paragraphs.length === 0) {
          logLLMService("Failed to extract paragraphs, trying next", { id: selectedBook.id });
          continue;
        }
        
        // Apply difficulty-based paragraph filtering
        const filteredParagraphs = paragraphs.filter(para => {
          const words = para.split(' ');
          const avgSentenceLength = words.length / (para.split(/[.!?]+/).length - 1 || 1);
          
          // Filter based on difficulty guidelines
          if (avgSentenceLength > guidelines.maxSentenceLength) return false;
          
          // Check vocabulary complexity
          const complexWords = words.filter(word => {
            const cleanWord = word.replace(/[^a-zA-Z]/g, '').toLowerCase();
            return cleanWord.length >= guidelines.preferredWordLength[1] - 2;
          });
          
          const complexityRatio = complexWords.length / words.length;
          
          // Adjust complexity expectations based on difficulty
          const expectedComplexity = {
            1: [0, 0.15],     // Very few complex words
            2: [0.05, 0.25],  // Some complex words
            3: [0.15, 0.35],  // Moderate complexity
            4: [0.25, 0.45],  // Higher complexity
            5: [0.35, 0.60]   // High complexity acceptable
          };
          
          const [minComplex, maxComplex] = expectedComplexity[difficulty as keyof typeof expectedComplexity];
          return complexityRatio >= minComplex && complexityRatio <= maxComplex;
        });
        
        if (filteredParagraphs.length === 0) {
          logLLMService("No paragraphs passed difficulty filter, trying next book", { id: selectedBook.id });
          continue;
        }
        
        logLLMService(`Filtered paragraphs for difficulty ${difficulty}:`, {
          original: paragraphs.length,
          filtered: filteredParagraphs.length
        });

        logLLMService("Successfully extracted passage from local dataset", {
          id: selectedBook.id,
          paragraphCount: paragraphs.length
        });

        // Split filtered paragraphs into words
        const paragraphsWords: string[][] = filteredParagraphs.map((p: string) => p.split(' '));
        
        // Distribute blanks with difficulty-aware word selection
        let blanksRemaining = blanks_count;
        const redactedIndices: number[][] = paragraphsWords.map(words => {
          if (blanksRemaining > 0 && words.length >= 5) {
            const count = Math.min(blanksRemaining, Math.max(1, Math.floor(blanks_count / paragraphsWords.length)));
            blanksRemaining -= count;
            
            // Use difficulty-aware word selection
            return chooseRedactionsWithDifficulty(words, count, difficulty);
          }
          return [];
        });

        // If any blanks remain, add to the first paragraph with enough words
        if (blanksRemaining > 0) {
          for (let j = 0; j < paragraphsWords.length; j++) {
            if (paragraphsWords[j].length >= 5) {
              const extra = chooseRedactionsWithDifficulty(paragraphsWords[j], blanksRemaining, difficulty);
              redactedIndices[j] = [...redactedIndices[j], ...extra];
              break;
            }
          }
        }

        // Build the output: paragraphs with blanks, answers array
        const outputParagraphs: string[] = [];
        const answers: { paragraphIndex: number; wordIndex: number; answer: string }[] = [];
        paragraphsWords.forEach((words, pIdx) => {
          const indices = new Set(redactedIndices[pIdx]);
          const paraWords = words.map((word, wIdx) => {
            if (indices.has(wIdx)) {
              answers.push({ paragraphIndex: pIdx, wordIndex: wIdx, answer: word });
              // Replace with underscores matching word length
              return '_'.repeat(word.length);
            }
            return word;
          });
          outputParagraphs.push(paraWords.join(' '));
        });

        // Create metadata
        const metadata = {
          title: selectedBook.title,
          author: selectedBook.author,
          id: typeof selectedBook.id === 'string' ? parseInt(selectedBook.id.replace(/\D/g, '')) || 0 : selectedBook.id,
          canonicalUrl: `https://www.gutenberg.org/ebooks/${selectedBook.id}`
        };

        return {
          paragraphs: outputParagraphs,
          answers,
          metadata
        };
      }

      // If no suitable book found after all attempts, use fallback
      logLLMService("Could not find suitable book after all attempts, using fallback");
      return await this.getFallbackClozePassage(blanks_count);
    } catch (error) {
      logLLMService("Error in get_cloze_passage:", error);
      
      // Use fallback for any error
      try {
        return await this.getFallbackClozePassage(blanks_count);
      } catch (fallbackError) {
        logLLMService("Fallback mechanism also failed:", fallbackError);
        throw new Error(`Failed to get passage from local datasets and fallback failed.`);
      }
    }
  },

  // Helper method to get a fallback cloze passage
  async getFallbackClozePassage(blanksCount: number): Promise<object> {
    // Define fallback paragraphs based on genres
    const fallbackTexts = [
      {
        title: "Passage from Classic Literature",
        author: "Various Authors",
        paragraphs: [
          "The ability to think clearly and rationally is essential for making good decisions and solving problems effectively. Critical thinking involves analyzing information objectively and making reasoned judgments based on evidence rather than personal bias or emotional reactions.",
          "Throughout history, literature has served as a mirror reflecting the values, concerns, and aspirations of society. Books allow us to experience different perspectives, fostering empathy and understanding across cultural divides.",
          "The greatest writers have always understood that language is not merely a tool for communication, but an art form capable of revealing profound truths about the human condition. Their works continue to resonate across generations."
        ]
      },
      {
        title: "Adventures in Unknown Lands",
        author: "Exploration Society",
        paragraphs: [
          "The intrepid explorer ventured deeper into the uncharted jungle, sweat beading on his brow as he hacked through the dense undergrowth with his machete. Strange bird calls echoed through the canopy above, and the air hung thick with moisture.",
          "As night fell, he made camp beside a small stream, the gentle gurgling of water over stones providing a soothing counterpoint to the mysterious sounds of the jungle. His maps were worn and faded, but they had served him well thus far.",
          "In the morning light, the ancient temple revealed itself, stone faces peering out from beneath centuries of vegetation, watching silently as the explorer approached with a mixture of reverence and excitement. This discovery would change everything."
        ]
      },
      {
        title: "Scientific Enquiry",
        author: "Research Foundation",
        paragraphs: [
          "The laboratory hummed with the soft whirring of centrifuges and the occasional beep of monitoring equipment. Dr. Chen carefully pipetted the clear solution into a series of test tubes, her steady hands reflecting years of practiced precision.",
          "Scientific discovery has always balanced on the knife-edge between methodical process and creative insight. The greatest breakthroughs often come not from following established protocols, but from questioning fundamental assumptions.",
          "When the results appeared on the computer screen, the team fell silent. The implications were immediately clear to everyone present - they had finally found the missing piece of the puzzle that had eluded researchers for decades."
        ]
      }
    ];

    // Select a random fallback text
    const selectedText = fallbackTexts[Math.floor(Math.random() * fallbackTexts.length)];
    
    // Split paragraphs into words
    const paragraphsWords: string[][] = selectedText.paragraphs.map(p => p.split(' '));
    
    // Distribute blanks
    let blanksRemaining = blanksCount;
    const redactedIndices: number[][] = paragraphsWords.map(words => {
      if (blanksRemaining > 0 && words.length >= 5) {
        const count = Math.min(blanksRemaining, Math.max(1, Math.floor(blanksCount / paragraphsWords.length)));
        blanksRemaining -= count;
        return chooseRedactions(words, count);
      }
      return [];
    });

    // Build the output
    const outputParagraphs: string[] = [];
    const answers: { paragraphIndex: number; wordIndex: number; answer: string }[] = [];
    paragraphsWords.forEach((words, pIdx) => {
      const indices = new Set(redactedIndices[pIdx]);
      const paraWords = words.map((word, wIdx) => {
        if (indices.has(wIdx)) {
          answers.push({ paragraphIndex: pIdx, wordIndex: wIdx, answer: word });
          return '_'.repeat(word.length);
        }
        return word;
      });
      outputParagraphs.push(paraWords.join(' '));
    });

    // Create metadata
    const metadata = {
      title: selectedText.title,
      author: selectedText.author,
      id: 0
    };

    return {
      paragraphs: outputParagraphs,
      answers,
      metadata
    };
  },

  async getBookAuthorInfo(args: { title: string; author: string }): Promise<object> {
    const { title, author } = args;
    let factoid = `Interesting information about "${title}" by ${author}.`;

    try {
      // Generate a factoid using LLM
      const messages: OpenRouterMessage[] = [
        {
          role: 'system',
          content: `You are a literary game assistant. Provide a concise, interesting factoid about "${title}" by ${author}. The factoid should be 2 sentences, engaging, and relevant to the book or author. Focus on historical context, literary significance, or interesting trivia.`
        },
        {
          role: 'user',
          content: `Please provide a brief, interesting factoid about "${title}" or ${author}.`
        }
      ];

      const llmResponse = await callLLM(messages, [], 0.7);
      
      if (llmResponse && llmResponse.content) {
        factoid = llmResponse.content.trim();
        logLLMService("Generated factoid:", factoid);
      }
    } catch (error) {
      console.error("Error in getBookAuthorInfo:", error);
      factoid = `"${title}" is a work by ${author} available in the Project Gutenberg collection.`;
    }

    return { factoid };
  },
  
};

// For debugging tool calls
function logToolCall(message: string, data: any): void {
  // Using debugLog for consistency, assuming it's globally available or passed/imported
  logLLMService(`Tool Call: ${message}`, data);
}

/**
 * Calls the OpenRouter LLM API with the given messages and tools.
 * @param messages Array of messages for the LLM.
 * @param currentTools Optional array of tool definitions for the LLM.
 * @param temperature Optional temperature setting for the LLM.
 * @returns A promise that resolves to the assistant's response message.
 */
export async function callLLM(messages: OpenRouterMessage[], currentTools?: ToolDefinition[], temperature?: number): Promise<OpenRouterMessage> {
  const body: {
    model: string;
    messages: OpenRouterMessage[];
    tools?: ToolDefinition[];
    tool_choice?: 'auto' | 'none' | { type: string; function: { name: string } };
    temperature?: number;
  } = {
    model: 'google/gemini-2.0-flash-001', // Using the :online model suffix
    messages: messages,
  };

  if (temperature !== undefined) {
    body.temperature = temperature;
    logLLMService("Using custom temperature", temperature);
  }

  // If tools are provided, add them. Otherwise, the model will rely on web search.
  if (currentTools && currentTools.length > 0) {
    body.tools = currentTools;
    body.tool_choice = 'auto'; // Let the model decide when to use tools
    logLLMService("Using tools", currentTools);
  } else {
    logLLMService("No specific tools provided, relying on web search via :online model suffix.");
  }

  logLLMService("OpenRouter API Request", body);

  try {
    const apiKey = getEnvironmentConfig().OPENROUTER_API_KEY;
    // logLLMService("Using API Key:", apiKey); // Removed for security: do not log sensitive credentials
    logLLMService("Using API Key format:", apiKey ? apiKey.substring(0, 8) + "..." : "undefined");
    
    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': typeof window !== 'undefined' ? window.location.href : '', // Handle server-side if needed
          'X-Title': 'Cloze', // App-specific title
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = await response.text();
      }
      
      const errorMessage = (typeof errorData === 'object' && errorData?.error?.message)
        ? errorData.error.message
        : (typeof errorData === 'string' ? errorData : 'Unknown API error');
      
      throw new ApiError(
        errorMessage,
        response.status,
        'https://openrouter.ai/api/v1/chat/completions'
      );
    }

    const data = await response.json();
    logLLMService("OpenRouter API Response", data);

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new DataError(
        "Invalid response structure from OpenRouter",
        data
      );
    }
    return data.choices[0].message as OpenRouterMessage;
  } catch (error) {
    // If it's already one of our custom errors, just re-throw it
    if (error instanceof ApiError || error instanceof DataError) {
      logError(error, { model: body.model });
      throw error;
    }
    
    // Otherwise, convert to ApiError and throw
    throw handleApiError(
      error,
      'https://openrouter.ai/api/v1/chat/completions'
    );
  }
}

/**
 * Processes tool calls from an assistant's response.
 * @param assistantResponse The assistant's message containing tool calls.
 * @returns A promise that resolves to a message with the tool's response.
 */
export async function getToolResponse(assistantResponse: OpenRouterMessage): Promise<OpenRouterMessage> {
  if (!assistantResponse.tool_calls || assistantResponse.tool_calls.length === 0) {
    throw new Error("Assistant response does not contain tool calls.");
  }

  const toolCall = assistantResponse.tool_calls[0]; // Assuming one tool call for now
  const toolName = toolCall.function.name;
  logToolCall("Received tool call", { toolName, toolCallId: toolCall.id });

  let toolArgs;
  try {
    toolArgs = JSON.parse(toolCall.function.arguments);
    logToolCall("Parsed tool arguments", toolArgs);
  } catch (error) {
    const errorObj = error as Error;
    console.error("LLM Service: Failed to parse tool arguments:", errorObj);
    return {
      role: 'tool',
      tool_call_id: toolCall.id,
      name: toolName,
      content: JSON.stringify({ error: `Invalid JSON in tool arguments: ${errorObj.message}` }),
    };
  }

  const toolFunction = TOOL_MAPPING[toolName];
  if (!toolFunction) {
    console.error(`LLM Service: Tool ${toolName} not found in TOOL_MAPPING.`);
    return {
      role: 'tool',
      tool_call_id: toolCall.id,
      name: toolName,
      content: JSON.stringify({ error: `Tool ${toolName} not found.` }),
    };
  }

  try {
    logToolCall("Executing tool function", { name: toolName });
    const toolResult = await toolFunction(toolArgs);
    logToolCall("Tool execution result", toolResult);
    return {
      role: 'tool',
      tool_call_id: toolCall.id,
      name: toolName,
      content: JSON.stringify(toolResult),
    };
  } catch (error: any) {
    console.error(`LLM Service: Error executing tool ${toolName}:`, error);
    return {
      role: 'tool',
      tool_call_id: toolCall.id,
      name: toolName,
      content: JSON.stringify({ error: `Error executing tool ${toolName}: ${error.message}` }),
    };
  }
}

/**
 * Runs an agentic loop with the LLM, handling tool calls.
 * @param initialMessages The initial set of messages to start the loop.
 * @param loopTools The tools available for the LLM to use in this loop.
 * @param temperature Optional temperature setting for the LLM calls within the loop.
 * @returns A promise that resolves to the final assistant content or an error message.
 */
export async function runAgenticLoop(initialMessages: OpenRouterMessage[], loopTools: ToolDefinition[], temperature?: number): Promise<string | null> {
  let messages: OpenRouterMessage[] = [...initialMessages];
  const MAX_ITERATIONS = 5; // Prevent infinite loops

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    logLLMService(`Agentic Loop Iteration ${i + 1}`);
    const assistantResponse = await callLLM(messages, loopTools, temperature); // Pass temperature
    messages.push(assistantResponse);

    if (assistantResponse.tool_calls && assistantResponse.tool_calls.length > 0) {
      // Potentially handle multiple tool calls in the future if needed
      const toolResponseMessage = await getToolResponse(assistantResponse);
      messages.push(toolResponseMessage);
    } else {
      // No tool calls, loop finishes, return assistant's content
      return assistantResponse.content ?? null;
    }
  }

  console.warn("LLM Service: Agentic loop reached max iterations.");
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  if (lastMessage && lastMessage.role === 'assistant' && lastMessage.content) {
    return lastMessage.content;
  }
  return "Agentic loop completed without a final assistant message or an error occurred.";
}
