// src/services/llmService.ts

import { debugLog } from '@/utils/debugLog';
import { getEnvironmentConfig } from '@/utils/environmentConfig';
// Removed import of searchGutenbergBooks and SearchGutenbergBooksArgs as they are no longer used.

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
// Tools for Gutenberg search and text fetching are removed as the :online model handles this.
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
      description: 'Fetches a concise, interesting factoid about the author or book, and a validated Project Gutenberg URL for the book title.',
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
          },
          gutenbergId: {
            type: 'string',
            description: 'The Project Gutenberg ID of the book (optional, if known).'
          }
        },
        required: ['title', 'author']
      }
    }
  }
];

// TOOL_MAPPING is no longer needed if no tools are defined, or will only contain non-Gutenberg tools.
export const TOOL_MAPPING: Record<string, (args: any) => Promise<object>> = {
  async getWordAnalysis(args: { sentence: string; word: string }): Promise<object> {
    // Compose prompt for the tool call
    const { sentence, word } = args;
    // For demonstration, just return a dummy analysis. In real use, this would call an API or LLM.
    // Here, we simulate a call to OpenRouter with function calling.
    return {
      analysis: `The word "${word}" plays a key role in the sentence: "${sentence}". It contributes to the overall meaning by emphasizing its context.`
    };
  },
  async getBookAuthorInfo(args: { title: string; author: string; gutenbergId?: string }): Promise<object> {
    const { title, author } = args;
    let factoid = `Interesting information about "${title}" by ${author}.`;
    let validatedUrl = '';

    try {
      // STEP 1: First try to find the book in the HuggingFace dataset (more reliable source)
      const { searchGutenbergBooks } = await import('@/services/gutenbergService');
      const searchResults = await searchGutenbergBooks({
        author,
        limit: 5
      });
      
      // Look for an exact or close match by title
      const exactMatches = searchResults.filter(book => 
        book.title.toLowerCase() === title.toLowerCase());
      const closeMatches = searchResults.filter(book => 
        book.title.toLowerCase().includes(title.toLowerCase()) ||
        title.toLowerCase().includes(book.title.toLowerCase()));
      
      // Get the best match (exact match first, then close match)
      const bestMatch = exactMatches[0] || closeMatches[0];
      
      if (bestMatch && bestMatch.id) {
        // We found a reliable ID from the dataset
        validatedUrl = `https://www.gutenberg.org/ebooks/${bestMatch.id}`;
        
        // Validate URL with a HEAD request
        try {
          const response = await fetch(validatedUrl, { method: 'HEAD' });
          if (!response.ok) {
            validatedUrl = ''; // URL is not valid, clear it
            debugLog("HuggingFace dataset book URL validation failed:", response.status);
          } else {
            debugLog("HuggingFace dataset book URL validated successfully:", validatedUrl);
          }
        } catch (error) {
          validatedUrl = ''; // Error with validation, clear URL
          debugLog("Error validating HuggingFace dataset book URL:", error);
        }
      } else {
        debugLog("No match found in HuggingFace dataset for:", { title, author });
      }
      
      // STEP 2: Always use LLM for the factoid, regardless of URL success
      const messages: OpenRouterMessage[] = [
        {
          role: 'system',
          content: `You are a literary expert. Provide a concise, interesting factoid about "${title}" by ${author}. The factoid should be 1-2 sentences, engaging, and relevant to the book or author. DO NOT provide a URL or Gutenberg ID.`
        },
        {
          role: 'user',
          content: `Please provide a brief, interesting factoid about "${title}" by ${author}.`
        }
      ];

      const llmResponse = await callLLM(messages, [], 0.7);
      
      if (llmResponse && llmResponse.content) {
        factoid = llmResponse.content.trim();
        debugLog("Generated factoid:", factoid);
      }
      
      // STEP 3: If we still don't have a validated URL, try getting one from the LLM
      if (!validatedUrl) {
        const urlMessages: OpenRouterMessage[] = [
          {
            role: 'system',
            content: `You are an expert at finding validated Project Gutenberg URLs. Find a direct, working URL to "${title}" by ${author} on Project Gutenberg. Respond ONLY with the full, directly accessible URL. If you cannot find an exact and validated URL, respond with "No validated URL found".`
          },
          {
            role: 'user',
            content: `Find the exact Project Gutenberg URL for "${title}" by ${author}. Provide only the full URL.`
          }
        ];

        const urlResponse = await callLLM(urlMessages, [], 0.3);
        
        if (urlResponse && urlResponse.content) {
          const content = urlResponse.content.trim();
          // Extract URL with regex
          const urlMatch = content.match(/(https?:\/\/www\.gutenberg\.org\/ebooks\/[0-9]+)/);
          if (urlMatch && urlMatch[1]) {
            const candidateUrl = urlMatch[1];
            
            // Validate URL with a HEAD request
            try {
              const response = await fetch(candidateUrl, { method: 'HEAD' });
              if (response.ok) {
                validatedUrl = candidateUrl;
                debugLog("LLM-provided URL validated successfully:", validatedUrl);
              } else {
                debugLog("LLM-provided URL validation failed:", response.status);
              }
            } catch (error) {
              debugLog("Error validating LLM-provided URL:", error);
            }
          }
        }
      }
      
      // STEP 4: If still no URL, try a fallback to Wikipedia
      if (!validatedUrl) {
        const wikiMessages: OpenRouterMessage[] = [
          {
            role: 'system',
            content: `You are a search expert. Find the Wikipedia page URL for the book "${title}" by ${author}. If a book-specific page doesn't exist, find the Wikipedia page for the author. Respond ONLY with the full, directly accessible Wikipedia URL. If you cannot find any Wikipedia page, respond with "No Wikipedia URL found".`
          },
          {
            role: 'user',
            content: `Find the Wikipedia URL for "${title}" by ${author}. Provide only the full URL.`
          }
        ];

        const wikiResponse = await callLLM(wikiMessages, [], 0.3);
        
        if (wikiResponse && wikiResponse.content) {
          const content = wikiResponse.content.trim();
          // Extract URL with regex
          const urlMatch = content.match(/(https?:\/\/en\.wikipedia\.org\/wiki\/[^"\s]+)/);
          if (urlMatch && urlMatch[1]) {
            validatedUrl = urlMatch[1];
            debugLog("Using Wikipedia URL as fallback:", validatedUrl);
          }
        }
      }
    } catch (error) {
      console.error("Error in getBookAuthorInfo:", error);
    }

    return {
      factoid,
      validatedUrl
    };
  }
};

// For debugging tool calls
function logToolCall(message: string, data: any): void {
  // Using debugLog for consistency, assuming it's globally available or passed/imported
  debugLog(`[LLM Service Tool Call] ${message}`, data);
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
    debugLog("LLM Service: Using custom temperature", temperature);
  }

  // If tools are provided, add them. Otherwise, the model will rely on web search.
  if (currentTools && currentTools.length > 0) {
    body.tools = currentTools;
    body.tool_choice = 'auto'; // Let the model decide when to use tools
    debugLog("LLM Service: Using tools", currentTools);
  } else {
    debugLog("LLM Service: No specific tools provided, relying on web search via :online model suffix.");
  }

  debugLog("LLM Service: OpenRouter API Request", JSON.stringify(body, null, 2));

  try {
    const apiKey = getEnvironmentConfig().OPENROUTER_API_KEY;
    debugLog("Using API Key:", apiKey);
    
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
    debugLog("LLM Service: OpenRouter API Response", data);

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
    debugLog(`LLM Service: Agentic Loop Iteration ${i + 1}`);
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
