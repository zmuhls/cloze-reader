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
