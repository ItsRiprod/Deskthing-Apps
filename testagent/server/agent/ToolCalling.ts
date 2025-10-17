
/**
 * ToolCalling: Handles LLM tool-calling logic.
 * - Provides a prompt for tool usage.
 * - Analyzes LLM responses for tool calls.
 * - Lists available tools.
 * - Executes tools and returns results.
 */


export interface ToolCall {
  name: string;
  arguments: Record<string, string>;
}

export interface ToolResult {
  name: string;
  result: string;
}


// Ollama-compatible function tool structure
export interface OllamaFunctionTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, {
        type: string;
        description: string;
      }>;
      required?: string[];
    };
  };
}

export interface OllamaFunctionToolResponse {
  function: {
    name: string;
    arguments: Record<string, string>;
  }
}

const availableTools: OllamaFunctionTool[] = [
  {
    type: 'function',
    function: {
      name: 'getTime',
      description: 'Get the current local time.',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'rememberFact',
      description: 'Store a fact in long-term memory. This can be called any time when calling other tools to remember important information.',
      parameters: {
        type: 'object',
        properties: {
          fact: {
            type: 'string',
            description: 'The fact to remember'
          }
        },
        required: ['fact']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'flipCoin',
      description: 'Flip a coin and return heads or tails.',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  },
];

const memories: string[] = [] // simple in-memory store for the rememberFact tool

export class ToolCalling {

  /**
   * Removes any tool_calls JSON object from the response string.
   * Preserves formatting and newlines; if no tool_calls JSON is found, returns the original string.
   */
  static stripToolCallsJson(response: string): string {
    const toolCallsRegex = /\{[\s\S]*?"tool_calls"[\s\S]*?\}/m;
    const match = response.match(toolCallsRegex);
    if (!match) return response;
    return response.slice(0, match.index!) + response.slice(match.index! + match[0].length);
  }

  /**
   * Returns the list of available tools.
   */
  /**
   * Returns the Ollama-compatible tools array for the LLM prompt or API.
   */
  static getAvailableTools(): OllamaFunctionTool[] {
    return availableTools;
  }

  static extractFirstToolCallsJsonBlock(response: string): string | null {
    const startIdx = response.indexOf('{', response.indexOf('"tool_calls"'));
    if (startIdx === -1) return null;
    let open = 0, endIdx = -1;
    for (let i = startIdx; i < response.length; i++) {
      if (response[i] === '{') open++;
      if (response[i] === '}') open--;
      if (open === 0) {
        endIdx = i + 1;
        break;
      }
    }
    if (endIdx !== -1) {
      return response.slice(startIdx, endIdx);
    }
    return null;
  }

  /**
   * Analyzes a response string for tool calls.
   * Returns an array of ToolCall if found, otherwise null.
   */
  /**
   * Analyzes a response string for tool calls (Ollama function call format).
   * Returns an array of ToolCall if found, otherwise null.
   * Expects tool_calls to be in the format: { "tool_calls": [ { "name": ..., "arguments": { ... } } ] }
   */
  static analyzeForToolCalls(response: string): ToolCall[] | null {
    // Find all possible JSON blocks in the response
    const jsonBlocks: string[] = [];
    for (let i = 0; i < response.length; i++) {
      if (response[i] === '{') {
        let open = 1;
        for (let j = i + 1; j < response.length; j++) {
          if (response[j] === '{') open++;
          if (response[j] === '}') open--;
          if (open === 0) {
            jsonBlocks.push(response.slice(i, j + 1));
            i = j; // move i forward
            break;
          }
        }
      }
    }
    console.log(`[ToolCalling] Found ${jsonBlocks.length} JSON block(s) in response.`);
    let found = 0;
    for (const block of jsonBlocks) {
      try {
        const obj = JSON.parse(block);
        // Ollama function call format: { tool_calls: [ { name, arguments } ] }
        if (obj && Array.isArray(obj.tool_calls)) {
          found++;
          console.log(`[ToolCalling] tool_calls block #${found}:`, block);
          return obj.tool_calls.map((call: ToolCall) => ({
            name: call.name,
            arguments: call.arguments || {}
          }));
        }
      } catch (e) {
        // Ignore parse errors, but log for inspection
        console.log('[ToolCalling] Failed to parse JSON block:', block);
      }
    }
    if (jsonBlocks.length === 0) {
      console.log('[ToolCalling] No JSON blocks found in response.');
    } else if (found === 0) {
      console.log('[ToolCalling] No tool_calls array found in any JSON block.');
    }
    return null;
  }

  /**
   * Executes an array of tool calls and returns their results.
   */
  static async executeTools(toolCalls: ToolCall[]): Promise<ToolResult[]> {
    const results: ToolResult[] = [];
    for (const toolCall of toolCalls) {
      switch (toolCall.name) {
        case "getTime":
          console.log('Executing getTime tool');
          results.push({
            name: "getTime",
            result: new Date().toLocaleTimeString()
          });
          break;
        case "rememberFact": {
          const fact = toolCall.arguments.fact || "No fact provided";
          console.log('Executing rememberFact tool');
          memories.push(fact);
          results.push({
            name: "rememberFact",
            result: `Memories: ${memories.join(', ')}`
          });
          break;
        }
        case "flipCoin": {
          const flip = Math.random() < 0.5 ? "Heads" : "Tails";
          results.push({
            name: "flipCoin",
            result: `The coin landed on: ${flip}`
          });
          break;
        }
        default:
          console.warn('Unknown tool call:', toolCall);
          results.push({
            name: toolCall.name,
            result: `Unknown tool: ${toolCall.name}`
          });
      }
    }
    return results;
  }
}