// src/services/llmService.ts

import { getEnvironmentConfig } from '@/utils/environmentConfig';
import { SearchGutenbergBooksArgs } from '@/services/gutenbergTypes';

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
      description: 'Selects a passage from the Project Gutenberg dataset and applies cloze (blanking) logic to create a fill-in-the-blank game. Returns the passage with blanks, the answers, and metadata.',
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
            description: 'Passage difficulty (1-5, optional)'
          }
        },
        required: ['blanks_count']
      }
    }
  }
];


import { fetchGutenbergPassage, PassageData } from '@/main';
import { chooseRedactions } from '@/services/gameLogic';

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
    const { category, author, century, blanks_count } = args;
    try {
      // Directly fetch data from Hugging Face Datasets API
      const dataset = "manu/project_gutenberg";
      const config = "default";
      const split = "en";
      const offset = Math.floor(Math.random() * 10000); // Random offset to get different books
      const length = 1; // Just get one book

      const params = new URLSearchParams({
        dataset,
        config,
        split,
        offset: offset.toString(),
        length: length.toString()
      });

      const url = `https://datasets-server.huggingface.co/rows?${params.toString()}`;
      
      // Set up headers
      let headers: Record<string, string> = { 'Accept': 'application/json' };
      const { HUGGINGFACE_API_KEY } = getEnvironmentConfig();
      if (HUGGINGFACE_API_KEY && HUGGINGFACE_API_KEY.startsWith('hf_')) {
        headers['Authorization'] = `Bearer ${HUGGINGFACE_API_KEY}`;
      }

      logLLMService("Fetching book data from Hugging Face Datasets API", { url });
      
      // Make the request
      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        // Fall back to static passage if API fails
        logLLMService("API request failed, using fallback", { status: response.status });
        return await this.getFallbackClozePassage(blanks_count);
      }

      const responseData = await response.json();
      logLLMService("Received data from API", { features: responseData.features, rowCount: responseData.rows?.length });

      // Check if we have valid rows
      if (!responseData.rows || !Array.isArray(responseData.rows) || responseData.rows.length === 0) {
        logLLMService("No rows in response, using fallback");
        return await this.getFallbackClozePassage(blanks_count);
      }

      // Get the book data from the first row
      const bookRow = responseData.rows[0].row;
      
      if (!bookRow || !bookRow.id || !bookRow.text) {
        logLLMService("Invalid book data in response, using fallback");
        return await this.getFallbackClozePassage(blanks_count);
      }

      // Extract book ID and text
      const bookId = bookRow.id.toString();
      const fullText = bookRow.text;

      // Parse book text to extract title, author, and content
      const titleMatch = fullText.match(/Title: ([^\n]+)/);
      const authorMatch = fullText.match(/Author: ([^\n]+)/);
      
      const title = titleMatch?.[1]?.trim() || "Unknown Title";
      const author = authorMatch?.[1]?.trim() || "Unknown Author";

      // Extract content by skipping the Gutenberg framing content
      let content = fullText;
      
      // Skip header content
      const startMarker = "***START OF THE PROJECT GUTENBERG EBOOK";
      const startIndex = content.indexOf(startMarker);
      if (startIndex !== -1) {
        // Skip to the end of the line containing the start marker
        const lineEndIndex = content.indexOf("\n", startIndex);
        if (lineEndIndex !== -1) {
          content = content.substring(lineEndIndex + 1);
        }
      }

      // Remove end marker and footer if present
      const endMarker = "***END OF THE PROJECT GUTENBERG EBOOK";
      const endIndex = content.indexOf(endMarker);
      if (endIndex !== -1) {
        content = content.substring(0, endIndex);
      }

      // Remove extra whitespace and normalize line endings
      content = content.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

      // Split into paragraphs
      let paragraphs = content.split(/\n\n+/)
        .map(p => p.trim())
        .filter(p => p.length > 100) // Only keep paragraphs with substantial content
        .slice(1, 4); // Take paragraphs 2-4 (skip the first one, which might be leftover header content)

      if (paragraphs.length === 0) {
        // If we couldn't extract good paragraphs, use fallback
        logLLMService("No suitable paragraphs found, using fallback");
        return await this.getFallbackClozePassage(blanks_count);
      }

      // 2. Split paragraphs into words
      const paragraphsWords: string[][] = paragraphs.map(p => p.split(' '));
      
      // 3. Distribute blanks
      let blanksRemaining = blanks_count;
      const redactedIndices: number[][] = paragraphsWords.map(words => {
        if (blanksRemaining > 0 && words.length >= 5) {
          const count = Math.min(blanksRemaining, Math.max(1, Math.floor(blanks_count / paragraphsWords.length)));
          blanksRemaining -= count;
          return chooseRedactions(words, count);
        }
        return [];
      });

      // If any blanks remain, add to the first paragraph with enough words
      if (blanksRemaining > 0) {
        for (let i = 0; i < paragraphsWords.length; i++) {
          if (paragraphsWords[i].length >= 5) {
            const extra = chooseRedactions(paragraphsWords[i], blanksRemaining);
            redactedIndices[i] = [...redactedIndices[i], ...extra];
            break;
          }
        }
      }

      // 4. Build the output: paragraphs with blanks, answers array
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
        title,
        author,
        id: parseInt(bookId.replace(/\D/g, '')) || 0,
        canonicalUrl: `https://www.gutenberg.org/ebooks/${bookId.replace(/\D/g, '')}`
      };

      return {
        paragraphs: outputParagraphs,
        answers,
        metadata
      };
    } catch (error) {
      logLLMService("Error in get_cloze_passage:", error);
      return await this.getFallbackClozePassage(blanks_count);
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
      const errorMessage = (typeof errorData === 'object' && errorData?.error?.message) ? errorData.error.message : (typeof errorData === 'string' ? errorData : 'Unknown API error');
      console.error("LLM Service: OpenRouter API Error:", response.status, errorMessage);
      throw new Error(`OpenRouter API Error: ${response.status} - ${errorMessage}`);
    }

    const data = await response.json();
    logLLMService("OpenRouter API Response", data);

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("LLM Service: Invalid response structure from OpenRouter:", data);
      throw new Error("Invalid response structure from OpenRouter.");
    }
    return data.choices[0].message as OpenRouterMessage;
  } catch (error) {
    console.error("LLM Service: Error calling OpenRouter API:", error);
    throw error; // Re-throw to be handled by the caller
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
